---

description: "Задачі 007-firestore-data"
---

# Tasks: Зберігання даних користувача в хмарі (Firestore)

**Input**: `specs/007-firestore-data/` — [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: автотестів спека не вимагає; перевірка — ручна за [quickstart.md](quickstart.md) (вхід через Apple/Google проходить лише користувач), lint і tsc.

**Organization**: задачі згруповано за історіями спеки. Порядок фаз — за пріоритетом: US1, US2, US5 (P1), потім US3, US4 (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна паралельно (інші файли, без залежностей від незавершених задач)
- **[Story]**: історія зі spec.md (US1…US5)

---

## Phase 1: Setup (залежність, правила, нативна збірка)

- [X] T001 Встановити `npx expo install @react-native-firebase/firestore` (оновлює `package.json`, `package-lock.json`); перевірити, що версія точно `27.1.1`, як `@react-native-firebase/app` і `@react-native-firebase/auth` (peer-пін). Config plugin у `app.json` не додавати — у пакета його немає (research R2)
- [X] T002 [P] Створити `firestore.rules` у корені з правилом із [contracts/firestore-rules.md](contracts/firestore-rules.md) (`rules_version = '2'`, `match /users/{uid}/{document=**}`, `allow read, write: if request.auth != null && request.auth.uid == uid;`) і `firebase.json` з `{ "firestore": { "rules": "firestore.rules" } }`
- [X] T003 Попросити користувача в консолі Firebase (проєкт `utility-ledger-4b1aa`) створити Firestore Database: Standard, location `europe-central2`, production mode, і опублікувати вміст `firestore.rules` у вкладці Rules (quickstart «Передумови» 1–2); далі не чекати — це потрібно лише для ручної перевірки
- [X] T004 Запустити `npx expo prebuild --clean` (оновлює закомічені `ios/`, `android/` — Constitution III, руками не редагувати) і зібрати iOS для симулятора `npx expo run:ios` у фоні лише для перевірки лінкування. Якщо падає з `Undefined symbol` для продукту SPM (research R2) — додати продукт у `plugins/with-google-signin-spm-link.js` і повторити prebuild; потім `cd android && ./gradlew assembleDebug` у фоні для перевірки Android

---

## Phase 2: Foundational (спільні модулі, новий життєвий цикл репозиторіїв)

**⚠️ CRITICAL**: до завершення фази історії не починати

- [X] T005 Створити `src/services/firestore/index.ts`: `export const db = getFirestore()` (модульний API `@react-native-firebase/firestore`, налаштування кешу не змінювати — постійний кеш за замовчуванням, research R3); `userDoc(uid)` → `doc(db, 'users', uid)`; `userCollection(uid, name: UserCollection)` → `collection(db, 'users', uid, name)`, де `UserCollection = 'objects' | 'services' | 'months' | 'readings' | 'dayCounts' | 'amounts'`; `outageSettingsDoc(uid)` → `doc(db, 'users', uid, 'settings', 'outages')`; `entryId(key: string, month: MonthKey)` → `` `${key}_${month}` `` (data-model)
- [X] T006 [P] Створити `src/services/firestore/batch.ts`: `type WriteOp = { kind: 'set'; ref; data } | { kind: 'delete'; ref }`; `commitInChunks(ops: WriteOp[]): Promise<void>` — `writeBatch(db)` по ≤ 500 операцій, повертає проміс усіх `commit()` (викликач сам вирішує, чекати чи ні); `applyWrites(ops)` — викликає `commitInChunks` без очікування і `.catch(logWriteError)` (research R4); `withoutUndefined<T>(data: T)` — копія без ключів зі значенням `undefined` (Firestore їх не приймає, data-model), рекурсивно для вкладених обʼєктів (`city`, `night`, `water`); `logWriteError(error)` — у `__DEV__` `console.warn('[firestore]', code ?? error)`
- [X] T007 Змінити контракти репозиторіїв за [contracts/repositories.md](contracts/repositories.md): у `src/services/ledger/types.ts` замінити `load()` і `clear()` в `LedgerRepository` на `setUser(uid: string | null): Promise<void>` з коментарем контракту; у `src/services/profile/types.ts` — те саме в `ProfileRepository` (оновити коментар «Зараз — локальне сховище…»); у `src/services/outages/settings-repository.ts` — у типі `OutageSettingsRepository` замінити `load()`/`clear()` на `setUser`
- [X] T008 Привести локальні реалізації до нових контрактів (лишаються для web): `src/services/ledger/local-ledger-repository.ts` — `setUser(uid)`: `null` → порожній знімок і сповіщення; рядок → поточна логіка `load()` (читання `ledgerState`, `legacyMonths`); `clear` прибрати; так само `src/services/profile/local-profile-repository.ts` (`setUser(null)` → `profile = null`); `createOutageSettingsRepository` у `src/services/outages/settings-repository.ts` перейменувати на `createLocalOutageSettingsRepository` з `setUser` замість `load`/`clear`
- [X] T009 Створити `src/providers/account-data-provider.tsx`: усередині `AuthProvider` бере `user` з `useAuth()` і на кожну зміну `user?.id` викликає `setUser(user?.id ?? null)` у `ledgerRepository`, `outageSettingsRepository`, `profileRepository` (через `Promise.all`), рендерить `null`, доки проміси для поточного `uid` не завершились (як зараз `loaded` у провайдерах; застарілі проміси попереднього `uid` ігнорувати); контекст поки віддає `status: 'ready'` і `retry: () => {}` (US1 наповнить). Прибрати `repository.load()` і стан `loaded` з `src/providers/ledger-provider.tsx`, `src/providers/outage-provider.tsx`, `src/providers/profile-provider.tsx` (проп `repository` лишити); у `src/views/app-providers.tsx` вставити `AccountDataProvider` між `OnboardingProvider` і `LedgerProvider`

**Checkpoint**: застосунок працює як раніше на локальних репозиторіях з новим життєвим циклом

---

## Phase 3: User Story 1 — Дані акаунта в хмарі й повертаються після перевстановлення (Priority: P1) 🎯 MVP

**Goal**: усі дані акаунта читаються й пишуться у Firestore; перше завантаження на пристрої показує скелетони.

**Independent Test**: quickstart сценарії 1, 2, 6 — дані в консолі під `users/{uid}`; після перевстановлення й входу — скелетони, потім ті самі дані й суми; зміна з другого пристрою ≤ 5 с.

### Репозиторії

- [X] T010 [US1] Створити `src/services/ledger/firestore-ledger-repository.ts` — `createFirestoreLedgerRepository(): LedgerRepository`, частина 1 (читання): `setUser(uid)` відписує попередні слухачі, скидає знімок до порожнього `LedgerState`; для `uid` підписує `onSnapshot` на шість колекцій T005, кожна оновлює свій масив; знімок збирається в новий незмінний обʼєкт: `objects` і `services` сортуються за `createdAt`, сироти відкидаються (послуги без обʼєкта, місяці без обʼєкта, показники/дні/суми без послуги — data-model «Похідний знімок»); проміс `setUser` завершується, коли кожна з шести колекцій дала перший знімок (з кешу — миттєво, і без мережі); `subscribe`/`getSnapshot` як у локальній реалізації; форма `LedgerState` не змінюється, тож розрахунки сум, статуси місяців і аналітика дають ті самі результати (FR-007)
- [X] T011 [US1] У `src/services/ledger/firestore-ledger-repository.ts` частина 2 (прості мутації): `addObject`/`addService` — `id = doc(userCollection(uid, …)).id`, `createdAt = Date.now()`, запис `set` через `applyWrites` (без очікування сервера, research R4), повертає сутність одразу; `updateObject`/`updateService` — `set` повного документа (наявна сутність + `input`); `addMonths` — `set` документів `months/{objectId}_{month}` лише для ще не доданих; `setReading`/`setDayCount`/`setAmount` — `set` у `readings|dayCounts|amounts/{serviceId}_{month}` (`entryId`), поля через `withoutUndefined`. Кожна мутація також одразу застосовується оптимістично (та сама логіка, що в `local-ledger-repository.ts`) **до масиву своєї колекції**, з якого збирається знімок, — не лише до зібраного знімка, інакше знімок іншої колекції перезбере стан зі старого масиву й зміна мигне (research R4); після цього знімок перезбирається і слухачі сповіщаються, щоб екрани після `await` бачили зміну; наступний `onSnapshot` цієї колекції замінює масив станом із кешу. Без `uid` — `throw new Error('Користувач не ввійшов')`
- [X] T012 [US1] У `src/services/ledger/firestore-ledger-repository.ts` частина 3 (каскади, data-model «Каскади», research R9): `deleteObject`, `deleteService`, `deleteMonth`, `resetEntry` — список `delete`-операцій з поточного знімка (ті самі множини, що в `local-ledger-repository.ts`) → `applyWrites`; `moveMonth(objectId, from, to)` — ті самі перевірки (`from === to`, `from` не доданий, `to` вже доданий → нічого), для місяця й кожного показника/дня/суми послуг обʼєкта: `delete` `…_{from}` + `set` `…_{to}` з `month: to`; оптимістичне оновлення масивів колекцій як у T011
- [X] T013 [P] [US1] Створити `src/services/profile/firestore-profile-repository.ts` — `createFirestoreProfileRepository(): ProfileRepository`: `setUser(uid)` підписує `onSnapshot(userDoc(uid))`, знімок `UserProfile` = `{ userId: uid, ...дані }` або `null`, якщо документа немає; проміс — після першого знімка; `syncFromAuth(user)` — ті самі правила, що в `local-profile-repository.ts` (новий профіль з даних провайдера; для наявного `name` лише якщо `nameSource === 'provider'` і провайдер повернув імʼя — FR-012), запис `setDoc(userDoc(uid), withoutUndefined({ name, nameSource, email, method }))` через `applyWrites`; перенесення імені з імітації — у T027; у `src/providers/profile-provider.tsx` викликати `syncFromAuth` лише коли `useAccountDataStatus().status === 'ready'` (до серверного читання порожній кеш нового пристрою виглядає як «профілю немає», і новий профіль затер би хмарний зі зміненим імʼям — contracts/repositories.md), ця частина — після T017; `setName` — та сама валідація (`trim`, 1–`NAME_MAX_LENGTH` символів за кодовими точками, інакше `throw`), запис `nameSource: 'user'`; оптимістичне оновлення знімка
- [X] T014 [P] [US1] Створити Firestore-реалізацію `OutageSettingsRepository` у `src/services/outages/firestore-settings-repository.ts` — `createFirestoreOutageSettingsRepository(storage: KeyValueStorage)`: `setUser(uid)` підписує `onSnapshot(outageSettingsDoc(uid))` (`city?`, `queues`, без документа — `{ queues: [] }`) і читає з `storage` ключ `outageSettings` лише поле `notifications`; `getSnapshot()` — `{ city, queues, notifications }`; `save(next)` — `set` `{ city, queues }` (через `withoutUndefined`) у Firestore через `applyWrites` і `notifications` у `storage` під `outageSettings` (`{ notifications }`), оптимістичне оновлення; `loadCachedSchedule`/`cacheSchedule` — як у локальній реалізації (кеш графіків лишається на пристрої, FR-013); `setUser(null)` → `{ queues: [] }` + `notifications` пристрою
- [X] T015 [US1] Підмінити реалізації: `src/services/ledger/index.ts` → `createFirestoreLedgerRepository()`, новий `src/services/ledger/index.web.ts` з тими самими експортами і `createLocalLedgerRepository(storage)`; `src/services/profile/index.ts` → `createFirestoreProfileRepository()`, `src/services/profile/index.web.ts` — локальна; `src/services/outages/index.ts` → `createFirestoreOutageSettingsRepository(storage)`, `src/services/outages/index.web.ts` — локальна (research R11); оновити коментарі «Єдине місце підміни…»

### Стан першого завантаження

- [X] T016 [US1] Створити `src/services/account-data/index.ts`: `type AccountDataStatus = 'loading' | 'offline' | 'ready'`; `syncedKey(uid)` = `` `accountDataSynced:${uid}` ``; `isSynced(uid)` / `markSynced(uid)` / `unmarkSynced(uid)` через `storage`; `fetchFromServer(uid)` — `getDocFromServer(userDoc(uid))`, `getDocFromServer(outageSettingsDoc(uid))` і `getDocsFromServer` шести колекцій паралельно, повертає `{ isEmpty: boolean }` (немає обʼєктів і немає документа налаштувань «Світла» — research R7); `isUnavailable(error)` — код `firestore/unavailable` (research R5). Також `src/services/account-data/index.web.ts` з тими самими експортами без імпорту Firestore: `isSynced` → `true`, `fetchFromServer` → `{ isEmpty: false }`, `deleteAccountData` нічого не робить, щоб web-бандл не тягнув нативний модуль (research R11)
- [X] T017 [US1] Розширити `src/providers/account-data-provider.tsx` за контрактом (кроки 1–4): після `setUser(uid)` — якщо `isSynced(uid)` → `status = 'ready'`; інакше `status = 'loading'` → `fetchFromServer(uid)` → (у US5 тут перенесення) → `markSynced(uid)` → `'ready'`; `isUnavailable` → `'offline'`, інші помилки (напр. `permission-denied`, коли правила не опубліковані) теж `'offline'` з `console.warn('[firestore]', code)` у `__DEV__` (quickstart 3a); `retry()` повторює серверне читання; зміна `uid` під час читання скасовує застосування результату. Експортувати `useAccountDataStatus(): { status; retry }`

### Скелетони й офлайн-стан

- [X] T018 [P] [US1] Винести блок скелетона з `src/views/outages/outage-skeleton.tsx` у `src/components/skeleton.tsx`: `SkeletonBone` (колір `track`, радіус 10 за замовчуванням, відблиск `expo-linear-gradient` з тими самими кольорами для світлої/темної теми) і `useSkeletonShine()` — спільний `SharedValue` прогресу (`withRepeat(withTiming(1, 1300 мс))`, лише `get()`/`set()` — `docs/patterns/reanimated.md`); експорт з `src/components/index.ts`; `OutageSkeleton` перевести на них без зміни вигляду
- [X] T019 [P] [US1] Оновити канвас (`docs/design.md`, Artifact `https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj`): прочитати `project/canvas.json`, `project/ui.css`, артборди 05 `Properties.dc.html`, 14 `Analytics.dc.html`, 16 `More.dc.html`, 20l `OutageLoading.dc.html`; додати артборди (стиль `.skel` з 20l) — «05s · Обʼєкти — завантаження» (навбар «Обʼєкти», 3 картки-скелетони обʼєкта), «20d · Світло — завантаження даних акаунта» (як 20l без назви черги), ~~«14s · Аналітика — завантаження»~~ (не зроблено: вкладка «Аналітика» поки заглушка без даних, скелетону нема що повторювати), «16s · Профіль — завантаження» (аватар і імʼя скелетоном, решта рядків звичайні), «05o · Немає інтернету — дані не завантажено» (на місці вмісту вкладки: 📡, «Немає інтернету», «Дані акаунта ще не завантажено. Підключіться до інтернету й спробуйте ще раз.», кнопка «Спробувати ще»); розмістити поруч з відповідними флоу в `canvas.json`, опублікувати за правилами канвасу
- [X] T020 [US1] Створити скелетони вкладок у `src/views/account-data/` за артбордами T019: `objects-skeleton.tsx` (05s), `profile-header-skeleton.tsx` (16s; скелетон лише замість картки імені, щоб «Вийти» й «Видалити акаунт» лишалися доступними), без `analytics-skeleton.tsx` (аналітика — заглушка без даних) на `SkeletonBone`; для «Світла» — наявний `OutageSkeleton`; testID за `docs/patterns/test-ids.md`: `objects.skeleton`, `analytics.skeleton`, `profile.skeleton`, `outages.skeleton` (якщо ще немає)
- [X] T021 [US1] Створити `src/views/account-data/account-data-offline.tsx` за артбордом 05o: emoji через `AppImage`/`EmojiGlyph` (`docs/patterns/icons.md`), тексти «Немає інтернету» і «Дані акаунта ще не завантажено. Підключіться до інтернету й спробуйте ще раз.», кнопка «Спробувати ще» через `Pressable` з `@/components` (`docs/patterns/buttons.md`) викликає `retry()`; testID `accountData.offline`, `accountData.offline.retry`
- [X] T022 [US1] Створити `src/views/account-data/account-data-gate.tsx` (`AccountDataGate({ skeleton, children })`: `loading` → `skeleton`, `offline` → `AccountDataOffline`, `ready` → `children`) і `src/views/account-data/index.ts`; обгорнути вміст під навбаром кореневих екранів табів: `src/app/(tabs)/(objects)/index.tsx` (`ObjectsSkeleton`), `src/app/(tabs)/(outages)/index.tsx` (`OutageSkeleton`; навбар без назви черги, поки не `ready`), `src/app/(tabs)/profile/index.tsx` (скелетон/офлайн-картка замість картки імені; аналітику не обгорнуто — заглушка без даних); навбар і таб-бар лишаються видимими; поки `ready` не настав, порожні стани й пропозиція налаштувати «Світло» не показуються (FR-011)

**Checkpoint**: US1 працює на Firestore; коміт після lint і tsc

---

## Phase 4: User Story 2 — Робота без інтернету (Priority: P1)

**Goal**: дані видно й змінюються офлайн, зміни йдуть у хмару, коли зʼявиться мережа.

**Independent Test**: quickstart сценарії 4, 5 — режим польоту, перезапуск, зміни видно одразу, після мережі вони в консолі.

- [X] T023 [US2] Перевірити всі мутації на екранах, що `await`-ять репозиторій (`src/app/(tabs)/(objects)/object-form.tsx`, `src/app/(tabs)/(objects)/[objectId]/service-form.tsx`, `src/app/(tabs)/(objects)/[objectId]/index.tsx`, `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx`, `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx`, `src/app/(tabs)/(objects)/[objectId]/[month]/amount.tsx`, `src/app/(tabs)/(outages)/outage-settings.tsx`, `src/app/(tabs)/profile/edit-name.tsx`, `src/providers/outage-provider.tsx`): жоден виклик не має чекати сервера (у Firestore-репозиторіях проміс завершується одразу після оптимістичного оновлення); прибрати чи переписати обробку помилок, що розраховувала на збій запису в сховище (крім валідації `setName`); переконатися, що навігація після `addObject` бачить новий обʼєкт у знімку
- [X] T024 [US2] У `src/services/firestore/index.ts` і репозиторіях переконатися, що ніде не викликаються `disableNetwork`, `clearPersistence`, `terminate` чи налаштування `persistence: false`; у коментарі `src/services/firestore/index.ts` зафіксувати: постійний кеш і черга записів SDK — це локальна копія даних акаунта (FR-005, research R3)

**Checkpoint**: офлайн-сценарії проходять; коміт

---

## Phase 5: User Story 5 — Перенесення даних, що вже є на пристрої (Priority: P1)

**Goal**: дані попередньої версії один раз переходять у порожній акаунт; якщо акаунт не порожній — лишаються лише хмарні.

**Independent Test**: quickstart сценарії 11, 12.

- [X] T025 [US5] Створити `src/services/account-data/migrate-legacy.ts`: `migrateLegacyData(uid, { isEmpty })` — читає з `storage` `ledgerState` (той самий розбір і `legacyMonths`, що в `local-ledger-repository.ts` — винести спільну функцію `parseLedgerState(raw)` у `src/services/ledger/local-ledger-repository.ts` і експортувати) і `outageSettings` (`city`, `queues`); якщо `isEmpty` і є що переносити — `set`-операції для всіх обʼєктів, послуг (зі старими `id`), місяців, показників, днів, сум (`entryId`) і `settings/outages` через `applyWrites` (без очікування, працює й офлайн, research R7); у будь-якому разі після цього `removeItem('ledgerState')` і перезапис `outageSettings` лише з `notifications` (FR-010: не вдруге й не в інший акаунт)
- [X] T026 [US5] У `src/providers/account-data-provider.tsx` після успішного `fetchFromServer(uid)` і до `markSynced(uid)` викликати `migrateLegacyData(uid, result)` (лише в гілці першого завантаження; при вже синхронізованому пристрої не викликати)
- [X] T027 [US5] Перенесення імені з часів імітації й старого профілю (FR-010, FR-012): у `src/services/profile/firestore-profile-repository.ts` у `syncFromAuth`, коли документа `users/{uid}` ще немає, прочитати старий ключ `PROFILE_KEY` (`userProfile`) зі `storage`: якщо там `nameSource === 'user'` (у т.ч. `userId` з `preview-id-`) — новий профіль бере це імʼя з `nameSource: 'user'`; після створення документа `removeItem(PROFILE_KEY)`; якщо документ уже є — ключ просто видалити, хмарний профіль не змінювати

**Checkpoint**: перенесення працює; коміт

---

## Phase 6: User Story 3 — Розділення даних між акаунтами (Priority: P2)

**Goal**: після виходу даних акаунта не видно, інший акаунт бачить лише свої; незбережені зміни не губляться і не переходять іншому.

**Independent Test**: quickstart сценарії 7, 8.

- [X] T028 [US3] Перевірити й за потреби доробити в трьох Firestore-репозиторіях: `setUser(null)` і `setUser(іншийUid)` відписують старі слухачі до підписки нових, скидають оптимістичний стан і знімок, і жоден запізнілий `onSnapshot` попереднього `uid` не потрапляє в знімок (перевіряти `uid` у колбеку); кеш і черга записів не чистяться (FR-008, FR-017, research R3)
- [X] T029 [US3] Сповіщення «Світла» при зміні акаунта чи налаштувань з іншого пристрою: у `src/providers/outage-provider.tsx` підписатися на знімок налаштувань і, коли змінюються `city` або `queues` не через `save` на цьому пристрої (вхід іншим акаунтом, зміна з другого пристрою, вихід), перепланувати попередження `syncOutageNotifications(settings, cached)` за кешованим графіком постачальника нового міста, а без міста/черг — `cancelOutageNotifications()`; не реагувати, поки `useAccountDataStatus().status !== 'ready'` (під час першого завантаження знімок порожній); перед переплануванням відфільтрувати `notifications.queues` пристрою за чергами акаунта (черги іншого акаунта не лишаються у фільтрі)
- [X] T030 [US3] Оновити коментар над `leave` у `src/app/(tabs)/profile/index.tsx`: вихід не стирає дані акаунта з пристрою й не блокується незбереженими змінами — вони відправляться при наступному вході цим акаунтом (FR-017)

**Checkpoint**: розділення акаунтів працює; коміт

---

## Phase 7: User Story 4 — Видалення акаунта видаляє дані (Priority: P2)

**Goal**: «Видалити акаунт» назавжди видаляє дані в хмарі й на пристрої, без мережі не видаляє нічого.

**Independent Test**: quickstart сценарії 9, 10.

- [X] T031 [US4] Додати в `src/services/account-data/index.ts` `deleteAccountData(uid)` (research R6): `getDocFromServer(userDoc(uid))` (без мережі відхиляється — нічого не видалено); `getDocsFromServer` шести колекцій → `delete` кожного документа + `outageSettingsDoc(uid)` + `userDoc(uid)` → `commitInChunks` з очікуванням і таймаутом 20 с (`Promise.race`, таймаут → `Error`); після успіху `unmarkSynced(uid)`
- [X] T032 [US4] Змінити `deleteAccount` у `src/services/auth/types.ts` на `deleteAccount(deleteData: () => Promise<void>): Promise<void>` з коментарем контракту; у `src/services/auth/firebase-auth-service.ts`: Apple — `reauthenticateApple` → `await deleteData()` → (iOS) `revokeToken` → `deleteUser` (відкликання лише після успішного видалення даних, щоб невдача не лишала акаунт з відкликаним доступом до Apple ID — research R6); Google — `await deleteData()` → `deleteUser` (на `auth/requires-recent-login` → `reauthenticateGoogle` → `deleteUser`) → `revokeGoogle`; невдача `deleteData` → `toAuthError` (`failed`, акаунт лишається, FR-009); `src/services/auth/firebase-auth-service.web.ts` — нова сигнатура
- [X] T033 [US4] У `src/providers/auth-provider.tsx` `deleteAccount: () => service.deleteAccount(() => deleteAccountData(user!.id))` (сигнатура `useAuth().deleteAccount()` для екрана не змінюється); у `src/app/(tabs)/profile/index.tsx` наявний `Alert` «Не вдалося видалити акаунт» лишається для невдалого видалення даних; оновити коментар над `removeAccount`

**Checkpoint**: видалення працює; коміт

---

## Phase 8: Polish & Cross-Cutting

- [X] T034 [P] Створити `docs/patterns/user-data.md`: де лежать дані (таблиця з data-model), що лишається на пристрої, `setUser` замість `load`, мутації без очікування сервера й оптимістичний знімок, каскади батчами ≤ 500, відкидання сиріт, перше завантаження (`accountDataSynced:{uid}`, `AccountDataGate`, скелетони й «Немає інтернету»), перенесення даних попередньої версії, як додати нову колекцію (шлях у `src/services/firestore`, правила, `deleteAccountData`); що прихована копія акаунта, видаленого на іншому пристрої, лишається в кеші цього пристрою (недоступна, бо акаунта вже немає); додати рядок в `docs/patterns/README.md`
- [X] T035 [P] Оновити `docs/patterns/account-actions.md`: розділ «Дані профілю» — `users/{uid}` через `firestore-profile-repository.ts`; «Вихід і видалення акаунта» — вихід не стирає даних і не блокується незбереженими змінами (черга SDK окрема для акаунта), видалення спершу видаляє всі дані в хмарі й кеші (`deleteAccountData`), без мережі не видаляє нічого; прибрати «Модуля стирання немає…» і «розділення даних… зʼявиться з хмарним зберіганням»; оновити опис у `docs/patterns/README.md`
- [X] T036 [P] Оновити `docs/patterns/outage-providers.md`: скелетон — на спільному `SkeletonBone` з `src/components/skeleton.tsx`; місто й черги — в акаунті (Firestore), сповіщення й кеш графіка — на пристрої
- [X] T037 [P] Оновити `.claude/skills/ui-check/SKILL.md`: нові testID скелетонів і офлайн-стану (T020–T021); перший запуск після перевстановлення показує скелетони
- [ ] T038 Передати користувачу ручну перевірку за [quickstart.md](quickstart.md) (передумови й сценарії 1–14); при розбіжностях у сценаріях 7–8 (черга записів окремо для акаунта) повернутися до користувача з запасним планом із plan.md «Ризики»; після підтвердження поставити в `spec.md` **Status**: Implemented і короткий підсумок українською
- [ ] T039 Запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки (Constitution VI: остання задача; повторити після правок за ручною перевіркою)

---

## Dependencies & Execution Order

- **Setup (T001–T004)** → **Foundational (T005–T009)** → історії. T003 (консоль) блокує лише ручну перевірку.
- **US1 (T010–T022)**: T010 → T011 → T012 (один файл); T013, T014 паралельно з T010; T015 після T010–T014; T016 → T017; T018, T019 паралельно з будь-чим; T020 після T018–T019; T021 після T019; T022 після T017, T020, T021.
- **US2 (T023–T024)**: після US1 (потрібні Firestore-репозиторії).
- **US5 (T025–T027)**: після T017 (точка виклику) і T013 (профіль).
- Частина T013 про `profile-provider.tsx` (виклик `syncFromAuth` лише при `ready`) — після T017.
- **US3 (T028–T030)**: після US1.
- **US4 (T031–T033)**: після T016; T032 → T033.
- **Polish**: T034–T037 паралельно після реалізації; T038 після всього коду; T039 останньою.

### Parallel Opportunities

- Setup: T002 паралельно з T001.
- Foundational: T006 паралельно з T005.
- US1: T013, T014, T018, T019 — різні файли, паралельно між собою й з T010.
- Polish: T034, T035, T036, T037.

### Parallel Example: User Story 1

```text
T010 → T011 → T012 (ledger) ─┐
T013 profile ────────────────┼─► T015 підміна ─┐
T014 outages ────────────────┘                  │
T016 → T017 стан завантаження ──────────────────┼─► T022 gate на 4 екранах
T018 SkeletonBone ─┐                            │
T019 канвас ───────┴─► T020 скелетони, T021 офлайн ┘
```

## Implementation Strategy

- **MVP**: Setup + Foundational + US1 (T001–T022) — дані в хмарі, перше завантаження зі скелетонами. Коміт після T022 (з lint і tsc).
- **Далі**: US2 → коміт; US5 → коміт (до релізу обовʼязково, інакше наявні користувачі втратять дані); US3 → коміт; US4 → коміт; Polish — патерни комітяться разом з останньою зміною поведінки, яку вони описують (Constitution IV).
- Ручну перевірку з входом виконує користувач; агент збирає (T004), запускає lint і tsc, а скелетони перевіряє через `ui-check`, якщо користувач уже увійшов на симуляторі.
