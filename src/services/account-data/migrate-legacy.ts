import { doc } from '@react-native-firebase/firestore';
import {
  entryId,
  outageSettingsDoc,
  userCollection,
} from '@/services/firestore';
import {
  applyWrites,
  withoutUndefined,
  type WriteOp,
} from '@/services/firestore/batch';
import {
  LEDGER_KEY,
  parseLedgerState,
} from '@/services/ledger/local-ledger-repository';
import {
  OUTAGE_SETTINGS_KEY,
  readStoredOutageSettings,
} from '@/services/outages/settings-repository';
import { storage } from '@/storage';

// Дані попередньої версії (лише на пристрої) один раз переносяться в акаунт,
// якщо він порожній; якщо в акаунті вже є дані — лишаються лише хмарні.
// Після цього старі ключі видаляються, тож вдруге й в інший акаунт дані не
// потрапляють. Запис іде в чергу SDK і працює без очікування сервера
export async function migrateLegacyData(
  uid: string,
  { isEmpty }: { isEmpty: boolean },
) {
  const [rawLedger, outage] = await Promise.all([
    storage.getItem(LEDGER_KEY),
    readStoredOutageSettings(storage),
  ]);

  if (isEmpty) {
    const ledger = parseLedgerState(rawLedger);
    const set = (ref: WriteOp['ref'], data: object): WriteOp => ({
      kind: 'set',
      ref,
      data: withoutUndefined(data),
    });
    const at = (name: Parameters<typeof userCollection>[1], id: string) =>
      doc(userCollection(uid, name), id);
    const ops: WriteOp[] = [
      ...ledger.objects.map((item) => set(at('objects', item.id), item)),
      ...ledger.services.map((item) => set(at('services', item.id), item)),
      ...ledger.months.map((item) =>
        set(at('months', entryId(item.objectId, item.month)), item),
      ),
      ...ledger.readings.map((item) =>
        set(at('readings', entryId(item.serviceId, item.month)), item),
      ),
      ...ledger.dayCounts.map((item) =>
        set(at('dayCounts', entryId(item.serviceId, item.month)), item),
      ),
      ...ledger.amounts.map((item) =>
        set(at('amounts', entryId(item.serviceId, item.month)), item),
      ),
    ];
    if (outage.city || outage.queues.length > 0) {
      ops.push(
        set(outageSettingsDoc(uid), {
          city: outage.city,
          queues: outage.queues,
        }),
      );
    }
    applyWrites(ops);
  }

  // На пристрої лишаються тільки сповіщення «Світла»
  await Promise.all([
    storage.removeItem(LEDGER_KEY),
    outage.notifications
      ? storage.setItem(
          OUTAGE_SETTINGS_KEY,
          JSON.stringify({ notifications: outage.notifications }),
        )
      : storage.removeItem(OUTAGE_SETTINGS_KEY),
  ]);
}
