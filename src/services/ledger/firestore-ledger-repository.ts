import { doc, onSnapshot } from '@react-native-firebase/firestore';
import {
  entryId,
  USER_COLLECTIONS,
  userCollection,
  type UserCollection,
} from '@/services/firestore';
import {
  applyWrites,
  logWriteError,
  withoutUndefined,
  type WriteOp,
} from '@/services/firestore/batch';
import { applyArchivePatch } from './billing';
import type {
  DayCount,
  LedgerObject,
  LedgerRepository,
  LedgerService,
  LedgerState,
  MeterReading,
  MonthAmount,
  MonthKey,
  ObjectMonth,
} from './types';

const emptyState: LedgerState = {
  objects: [],
  services: [],
  months: [],
  readings: [],
  dayCounts: [],
  amounts: [],
};

type Entry = { serviceId: string; month: MonthKey };
type EntryCollection = 'readings' | 'dayCounts' | 'amounts';
const ENTRY_COLLECTIONS: EntryCollection[] = [
  'readings',
  'dayCounts',
  'amounts',
];

const isSameEntry = (a: Entry, b: Entry) =>
  a.serviceId === b.serviceId && a.month === b.month;

const byCreatedAt = (a: { createdAt: number }, b: { createdAt: number }) =>
  a.createdAt - b.createdAt;

// Знімок для екранів: той самий LedgerState, що й у локальній реалізації
// (тож суми, статуси місяців і аналітика рахуються так само). Сироти, що
// могли лишитися після одночасних змін на двох пристроях, не показуються
function assemble(source: LedgerState): LedgerState {
  const objectIds = new Set(source.objects.map((object) => object.id));
  const services = source.services
    .filter((service) => objectIds.has(service.objectId))
    .sort(byCreatedAt);
  const serviceIds = new Set(services.map((service) => service.id));
  const hasService = (entry: Entry) => serviceIds.has(entry.serviceId);
  return {
    objects: [...source.objects].sort(byCreatedAt),
    services,
    months: source.months.filter((month) => objectIds.has(month.objectId)),
    readings: source.readings.filter(hasService),
    dayCounts: source.dayCounts.filter(hasService),
    amounts: source.amounts.filter(hasService),
  };
}

export function createFirestoreLedgerRepository(): LedgerRepository {
  let uid: string | null = null;
  // Масиви колекцій, з яких збирається знімок; оптимістичні зміни пишуться
  // саме сюди, щоб знімок іншої колекції не перезбирав стан зі старих даних
  let source = emptyState;
  let state = emptyState;
  let unsubscribes: (() => void)[] = [];
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const rebuild = () => {
    state = assemble(source);
    emit();
  };

  const requireUser = () => {
    if (!uid) throw new Error('Користувач не ввійшов');
    return uid;
  };

  const ref = (name: UserCollection, id: string) =>
    doc(userCollection(requireUser(), name), id);

  const set = (name: UserCollection, id: string, data: object): WriteOp => ({
    kind: 'set',
    ref: ref(name, id),
    data: withoutUndefined(data),
  });

  const remove = (name: UserCollection, id: string): WriteOp => ({
    kind: 'delete',
    ref: ref(name, id),
  });

  const removeEntry = (name: EntryCollection, entry: Entry) =>
    remove(name, entryId(entry.serviceId, entry.month));

  // Зміна одразу видна в знімку, а в хмару йде без очікування сервера
  const commit = (next: Partial<LedgerState>, ops: WriteOp[]) => {
    source = { ...source, ...next };
    rebuild();
    applyWrites(ops);
  };

  return {
    setUser(next) {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribes = [];
      uid = next;
      source = emptyState;
      rebuild();
      if (!next) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const pending = new Set<UserCollection>(USER_COLLECTIONS);
        const settle = (name: UserCollection) => {
          if (pending.delete(name) && pending.size === 0) resolve();
        };
        unsubscribes = USER_COLLECTIONS.map((name) =>
          onSnapshot(
            userCollection(next, name),
            (snapshot) => {
              // Запізнілий знімок попереднього акаунта не потрапляє в стан
              if (uid !== next) return;
              source = {
                ...source,
                [name]: snapshot.docs.map((item) => item.data()),
              };
              rebuild();
              settle(name);
            },
            (error) => {
              logWriteError(error);
              settle(name);
            },
          ),
        );
      });
    },
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async addObject(input) {
      const id = doc(userCollection(requireUser(), 'objects')).id;
      const object: LedgerObject = { ...input, id, createdAt: Date.now() };
      commit({ objects: [...source.objects, object] }, [
        set('objects', id, object),
      ]);
      return object;
    },
    async updateObject(id, input) {
      const existing = source.objects.find((object) => object.id === id);
      if (!existing) return;
      const object: LedgerObject = { ...existing, ...input };
      commit(
        {
          objects: source.objects.map((item) =>
            item.id === id ? object : item,
          ),
        },
        [set('objects', id, object)],
      );
    },
    async setObjectArchive(id, patch) {
      const existing = source.objects.find((object) => object.id === id);
      if (!existing) return;
      const object = applyArchivePatch(existing, patch);
      commit(
        {
          objects: source.objects.map((item) =>
            item.id === id ? object : item,
          ),
        },
        [set('objects', id, object)],
      );
    },
    async deleteObject(id) {
      const serviceIds = new Set(
        source.services.filter((s) => s.objectId === id).map((s) => s.id),
      );
      const belongs = (entry: Entry) => serviceIds.has(entry.serviceId);
      const ops: WriteOp[] = [
        remove('objects', id),
        ...[...serviceIds].map((serviceId) => remove('services', serviceId)),
        ...source.months
          .filter((m) => m.objectId === id)
          .map((m) => remove('months', entryId(m.objectId, m.month))),
        ...ENTRY_COLLECTIONS.flatMap((name) =>
          (source[name] as Entry[])
            .filter(belongs)
            .map((entry) => removeEntry(name, entry)),
        ),
      ];
      commit(
        {
          objects: source.objects.filter((object) => object.id !== id),
          services: source.services.filter((s) => !serviceIds.has(s.id)),
          months: source.months.filter((m) => m.objectId !== id),
          readings: source.readings.filter((r) => !belongs(r)),
          dayCounts: source.dayCounts.filter((d) => !belongs(d)),
          amounts: source.amounts.filter((a) => !belongs(a)),
        },
        ops,
      );
    },

    async addService(input) {
      const id = doc(userCollection(requireUser(), 'services')).id;
      const service: LedgerService = { ...input, id, createdAt: Date.now() };
      commit({ services: [...source.services, service] }, [
        set('services', id, service),
      ]);
      return service;
    },
    async updateService(id, input) {
      const existing = source.services.find((service) => service.id === id);
      if (!existing) return;
      const service: LedgerService = { ...existing, ...input };
      commit(
        {
          services: source.services.map((item) =>
            item.id === id ? service : item,
          ),
        },
        [set('services', id, service)],
      );
    },
    async deleteService(id) {
      const belongs = (entry: Entry) => entry.serviceId === id;
      const ops: WriteOp[] = [
        remove('services', id),
        ...ENTRY_COLLECTIONS.flatMap((name) =>
          (source[name] as Entry[])
            .filter(belongs)
            .map((entry) => removeEntry(name, entry)),
        ),
      ];
      commit(
        {
          services: source.services.filter((s) => s.id !== id),
          readings: source.readings.filter((r) => !belongs(r)),
          dayCounts: source.dayCounts.filter((d) => !belongs(d)),
          amounts: source.amounts.filter((a) => !belongs(a)),
        },
        ops,
      );
    },

    async addMonths(objectId, months) {
      const existing = new Set(
        source.months
          .filter((m) => m.objectId === objectId)
          .map((m) => m.month),
      );
      const added: ObjectMonth[] = [...new Set(months)]
        .filter((month) => !existing.has(month))
        .map((month) => ({ objectId, month }));
      if (added.length === 0) return;
      commit(
        { months: [...source.months, ...added] },
        added.map((m) => set('months', entryId(objectId, m.month), m)),
      );
    },
    async deleteMonth(objectId, month) {
      const serviceIds = new Set(
        source.services.filter((s) => s.objectId === objectId).map((s) => s.id),
      );
      const belongs = (entry: Entry) =>
        entry.month === month && serviceIds.has(entry.serviceId);
      const ops: WriteOp[] = [
        remove('months', entryId(objectId, month)),
        ...ENTRY_COLLECTIONS.flatMap((name) =>
          (source[name] as Entry[])
            .filter(belongs)
            .map((entry) => removeEntry(name, entry)),
        ),
      ];
      commit(
        {
          months: source.months.filter(
            (m) => !(m.objectId === objectId && m.month === month),
          ),
          readings: source.readings.filter((r) => !belongs(r)),
          dayCounts: source.dayCounts.filter((d) => !belongs(d)),
          amounts: source.amounts.filter((a) => !belongs(a)),
        },
        ops,
      );
    },
    async moveMonth(objectId, from, to) {
      const isAdded = (month: MonthKey) =>
        source.months.some((m) => m.objectId === objectId && m.month === month);
      // Цільовий місяць уже має свої дані — не перезаписуємо їх
      if (from === to || !isAdded(from) || isAdded(to)) return;
      const serviceIds = new Set(
        source.services.filter((s) => s.objectId === objectId).map((s) => s.id),
      );
      const moves = (entry: Entry) =>
        entry.month === from && serviceIds.has(entry.serviceId);
      const move = <T extends Entry>(entry: T): T =>
        moves(entry) ? { ...entry, month: to } : entry;
      // Ідентифікатор природний («…_місяць»), тож перенесення — це видалення
      // старого документа й запис нового
      const ops: WriteOp[] = [
        remove('months', entryId(objectId, from)),
        set('months', entryId(objectId, to), { objectId, month: to }),
        ...ENTRY_COLLECTIONS.flatMap((name) =>
          (source[name] as Entry[])
            .filter(moves)
            .flatMap((entry) => [
              removeEntry(name, entry),
              set(name, entryId(entry.serviceId, to), { ...entry, month: to }),
            ]),
        ),
      ];
      commit(
        {
          months: source.months.map((m) =>
            m.objectId === objectId && m.month === from
              ? { ...m, month: to }
              : m,
          ),
          readings: source.readings.map(move),
          dayCounts: source.dayCounts.map(move),
          amounts: source.amounts.map(move),
        },
        ops,
      );
    },

    async setReading(reading: MeterReading) {
      commit(
        {
          readings: [
            ...source.readings.filter((r) => !isSameEntry(r, reading)),
            reading,
          ],
        },
        [set('readings', entryId(reading.serviceId, reading.month), reading)],
      );
    },
    async setDayCount(dayCount: DayCount) {
      commit(
        {
          dayCounts: [
            ...source.dayCounts.filter((d) => !isSameEntry(d, dayCount)),
            dayCount,
          ],
        },
        [
          set(
            'dayCounts',
            entryId(dayCount.serviceId, dayCount.month),
            dayCount,
          ),
        ],
      );
    },
    async setAmount(amount: MonthAmount) {
      commit(
        {
          amounts: [
            ...source.amounts.filter((a) => !isSameEntry(a, amount)),
            amount,
          ],
        },
        [set('amounts', entryId(amount.serviceId, amount.month), amount)],
      );
    },
    async resetEntry(serviceId, month) {
      const entry = { serviceId, month };
      commit(
        {
          readings: source.readings.filter((r) => !isSameEntry(r, entry)),
          dayCounts: source.dayCounts.filter((d) => !isSameEntry(d, entry)),
          amounts: source.amounts.filter((a) => !isSameEntry(a, entry)),
        },
        ENTRY_COLLECTIONS.map((name) => removeEntry(name, entry)),
      );
    },
  };
}
