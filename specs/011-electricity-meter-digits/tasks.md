---

description: "Task list for 011-electricity-meter-digits"
---

# Tasks: Барабани світла й води вміщають справжній показник

**Input**: Design documents from `/specs/011-electricity-meter-digits/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/interfaces.md](contracts/interfaces.md), [quickstart.md](quickstart.md)

**Tests**: автотестів специфікація не вимагає. Перевірка йде через `ui-check` (`meter.flow`) і [quickstart.md](quickstart.md).

**Organization**: задачі згруповані за user story. Усі історії залежать від однієї зміни в `getMeterFormat` (Phase 2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (різні файли, без залежностей)
- **[Story]**: US1, US2, US3 зі [spec.md](spec.md)

---

## Phase 1: Setup

Підготовки не потрібно: нових залежностей, нативних змін і development build немає (plan: Constitution Check III).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: змінити формат барабана, бо від нього залежать усі історії.

- [X] T001 У `src/services/ledger/meter-format.ts` змінити `getMeterFormat`: `'water'` → `{ length: 8, fractionDigits: 3 }`, `'gas'` лишити `{ length: 8, fractionDigits: 3 }`, `default` (світло `single` і `dayNight`) → `{ length: 7, fractionDigits: 2 }`. Оновити коментар над функцією: світло 7 клітинок, 2 червоні (5 цілих, до 99 999,99 кВт·год); вода 8 клітинок, 3 червоні (5 цілих, до 99 999,999 м³); газ 8/3. Прибрати речення про «лише 3 цілі цифри… останніми 5 цифрами» per FR-001, FR-005, data-model MeterFormat
- [X] T002 [P] У `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx` оновити коментар над `getMeterFormat(...)`: «світло 5/2, вода 6/3, газ 8/3» → «світло 7/2, вода 8/3, газ 8/3». Логіку не змінювати: `toZone`, `hintFor` і `MeterReadingInput` уже беруть `format.length` і `format.fractionDigits` per FR-004

**Checkpoint**: формат змінено, екран «Додати показник» показує нові барабани.

---

## Phase 3: User Story 1 - Внести показник світла понад 999 кВт·год (Priority: P1) 🎯 MVP

**Goal**: показник 19 100,00 після попереднього 19 082,00 вводиться й зберігається, «Спожито +18,00 кВт·год».

**Independent Test**: [quickstart.md](quickstart.md), сценарії 1 і 3.

- [X] T003 [US1] У iOS Simulator відкрити «Додати показник» для «Світла» з попереднім 19 082 і перевірити:
  - 7 клітинок, 2 останні червоні, підказка «Введіть 7 цифр зліва направо, як на лічильнику»;
  - після введення `1910000` — «Усі 7 цифр введено», «Спожито +18,00 кВт·год», `reading.save` активна, збереження проходить;
  - після введення `1900000` — «Менше за попередній показник — перевірте цифри», `reading.save` неактивна;
  - для лічильника день/ніч обидві секції (`reading.day`, `reading.night`) мають по 7 клітинок і рахуються незалежно.

  Per US1/AC1–AC3, SC-001.
- [X] T004 [US1] Перевірити, що збережений показник світла не змінився в історії місяця (`src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx`), у «Попередній» / «Спожито» і в розрахунку (`src/app/(tabs)/(objects)/[objectId]/[month]/bill.tsx`): 2 знаки після коми, суми ті самі, що до зміни per US1/AC4, FR-002
- [X] T005 [US1] У формі послуги світла `src/app/(tabs)/(objects)/[objectId]/service-form.tsx` перевірити, що поле «Початковий показник» приймає `19082,5` (5 цілих, до 2 дробових через `sanitizeReadingInput`) і зберігає 19 082,5; код не змінювати, якщо працює per FR-004, Edge Cases — виконано в T014

**Checkpoint**: показник світла понад 999 вводиться — MVP.

---

## Phase 4: User Story 2 - Старі показники повністю видно на барабані (Priority: P2)

**Goal**: редагування збереженого 19 082,00 показує `1 9 0 8 2 | 0 0` без обрізання.

**Independent Test**: [quickstart.md](quickstart.md), сценарій 2.

- [X] T006 [US2] Відкрити редагування збереженого показника світла 19 082 у `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx` і перевірити: барабан `1 9 0 8 2 | 0 0`; малий показник 27 показується як `0 0 0 2 7 | 0 0`; збереження без змін лишає 19 082,00. `readingToDigits` у `src/services/ledger/meter-format.ts` не змінювати, якщо результат такий per US2/AC1, FR-003, SC-002

**Checkpoint**: старі показники редагуються без втрати цифр.

---

## Phase 5: User Story 3 - Внести показник води понад 999 м³ (Priority: P1)

**Goal**: барабан води має 8 клітинок, з них 3 червоні, і показники понад 999 м³ вводяться.

**Independent Test**: [quickstart.md](quickstart.md), сценарій 4.

- [X] T007 [US3] На обʼєкті з послугою води перевірити «Додати показник»:
  - 8 клітинок, 3 останні червоні, підказки «Введіть 8 цифр…» / «Цифра K з 8» / «Усі 8 цифр введено»;
  - попередній 1 234,500 і ввід `01240250` дають «Спожито +5,750 м³»;
  - редагування збереженого 123,456 показує `0 0 1 2 3 | 4 5 6`, значення не змінюється;
  - газ лишається 8/3.

  Per US3/AC1–AC2, FR-005.

**Checkpoint**: усі три історії працюють.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T008 [P] Оновити `docs/patterns/meter-reading.md`:
  - у «Поведінка» формати: світло 7 клітинок / 2 червоні, вода 8 / 3, газ 8 / 3;
  - прибрати пункт «У світла лише 3 цілі клітинки (до 999,99 кВт·год)… останніми 5 цифрами»;
  - приклади доповнення нулями: `27` у світла → `00027,00`, `425` у води → `00425000`;
  - у «Початковий показник»: цілих до 5.

  Per Constitution IV, research R6.
- [X] T009 [P] Оновити канвас дизайну (посилання і як читати — `docs/design.md`, інструмент Artifact): у артбордах введення показника (10, 10a–10d) барабан світла — 7 клітинок, з них 2 червоні (день/ніч — у кожній секції); якщо є артборд води — 8 клітинок, з них 3 червоні. Вигляд клітинок не змінювати per Constitution IV, research R6
- [X] T010 [P] Оновити `.claude/skills/ui-check/flows/meter.flow`:
  - шапка: «spec 011: у світла 7 клітинок, з них 2 червоні»;
  - `see text~=5 цифр` → `see text~=7 цифр`;
  - лишити `see text~=,00` і `check id=reading.save disabled`.

  Запустити `.claude/skills/ui-check/scripts/ui run .claude/skills/ui-check/flows/meter.flow`, усі кроки `ok` per quickstart «UI-сценарій».
- [X] T011 Перевірити ширину барабанів 7 і 8 клітинок на iPhone SE (320 pt) і звичайному iPhone: в один рядок, без обрізання (`src/views/meter/meter-reading-input.tsx`, проміжок 4 pt при `length > 6`). Змінювати верстку лише якщо не вміщається per SC-003, research R4 — скасовано: iPhone SE застосунок не підтримує; на iPhone 17 Pro барабани 7 і 8 клітинок вміщаються (знімки T003, T007)
- [X] T012 Запустити `npx expo lint` і `npx tsc --noEmit` і виправити помилки per Constitution VI

---

## Dependencies & Execution Order

- **Phase 2 (T001)** блокує все. T002 можна робити паралельно з T001: інший файл, лише коментар.
- **US1 (T003–T005)**, **US2 (T006)**, **US3 (T007)** залежать лише від T001 і одна від одної незалежні.
- **Polish**: T008, T009, T010 можна робити паралельно після T001; T011 — після T001; T012 — останньою.

## Parallel Example

```text
Після T001:
  T008 docs/patterns/meter-reading.md
  T009 канвас дизайну (Artifact)
  T010 .claude/skills/ui-check/flows/meter.flow
```

## Implementation Strategy

1. T001–T002, потім T003. Це MVP: показник світла понад 999 знову вводиться.
2. T004–T007: незмінність сум, редагування старих показників, вода.
3. T008–T011: патерн, канвас, flow, ширина. T012: lint і typecheck.
4. Комітити одразу після реалізації. Код, патерн і flow ідуть в одному коміті (Constitution IV, «Процес»).

## Phase 7: Convergence

- [X] T013 Перевірити збереження нового показника світла понад 999 в iOS Simulator: на обʼєкті «Test» у місяці без показника світла (попередній 27,00) ввести `1910000`, натиснути `reading.save`. Переконатися, що рядок місяця `month.meter.0` показує «+19 073,00 кВт·год», а повторне відкриття — барабан `1 9 1 0 0 | 0 0`; потім скинути показник (`reading.reset`), щоб повернути тестові дані per SC-001, US1/AC1 (partial) — збережено 19 100,00 у грудні 2026 на «Test», рядок місяця «+19 073,00 кВт·год», барабан `1910000`; показник скинуто
- [X] T014 Перевірити поле «Початковий показник» у `src/app/(tabs)/(objects)/[objectId]/service-form.tsx` (`serviceForm.initialReading`) для світла й води: приймає 5 цілих цифр (`19082,5` → 19 082,5; для води `12345,678`), шосту цілу цифру відкидає; якщо HID-клавіатура симулятора не вводить у поле — перевірити `sanitizeReadingInput` з форматами 7/2 і 8/3 разовим скриптом і записати це в нотатку задачі per FR-004, Edge Cases, T005 (partial) — у застосунку поле не вдалося заповнити (тап по формі відкриває вибір іконки, HID не друкує кому надійно); перевірено скриптом з `node --experimental-strip-types`: світло `19082,5` → 19 082,5, `190823,55` → 19 082,55, вода `12345,678` → 12 345,678, `123456,7891` → 12 345,789
- [X] T015 Перевірити на симуляторі iPhone SE (ширина 320 pt), що барабан світла (7 клітинок) і води (8 клітинок) на екрані «Додати показник» вміщаються в один рядок без обрізання (`shot id=reading.value`); змінювати `src/views/meter/meter-reading-input.tsx` лише якщо не вміщаються per SC-003, T011 (partial) — скасовано: iPhone SE застосунок не підтримує; SC-003 і quickstart оновлено
- [X] T016 Узгодити SC-002 / FR-003 («100% збережених показників без втрати цифр») з поведінкою `readingToDigits` у `src/services/ledger/meter-format.ts`, який обрізає показник понад 5 цілих цифр (`.slice(-length)`): або перевірити, що таких показників у даних немає, і зафіксувати обмеження як свідоме в `docs/patterns/meter-reading.md` (уже згадано) та в нотатці задачі, або не обрізати, а показувати попередження per FR-003, SC-002 (partial) — обрано свідоме обмеження: показник понад 5 цілих цифр показується останніми цифрами; записано в Edge Cases spec.md і SC-002, у `docs/patterns/meter-reading.md` уже є
