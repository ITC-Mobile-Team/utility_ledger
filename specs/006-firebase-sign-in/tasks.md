---
description: "Tasks: справжній вхід, вихід і видалення акаунта через Apple і Google (Firebase)"
---

# Tasks: Справжній вхід, вихід і видалення акаунта через Apple і Google (Firebase)

**Input**: Design documents from `/specs/006-firebase-sign-in/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/auth-service.md](contracts/auth-service.md), [quickstart.md](quickstart.md)

**Tests**: автотестів у проєкті немає й spec їх не вимагає. Вхід, вихід і видалення через провайдерів перевіряє **користувач вручну** за [quickstart.md](quickstart.md); агент не проходить вхід у симуляторі, лише збирає застосунок, запускає lint і typecheck.

**Organization**: задачі згруповано за user stories зі spec.md (US1–US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (інші файли, немає залежності від незавершених задач)
- **[Story]**: до якої історії належить задача (US1…US5)

---

## Phase 1: Setup (конфіги Firebase, залежності, нативна збірка)

**Purpose**: підключити Firebase-проєкт `utility-ledger-4b1aa` і нативні модулі (plan → «Додавання конфігів Firebase», research R1–R2)

- [X] T001 Скопіювати `/Users/bogdanpoh/Downloads/GoogleService-Info.plist` → `GoogleService-Info.plist` і `/Users/bogdanpoh/Downloads/google-services (1).json` → `google-services.json` у корінь проєкту (саме оновлений файл, не перший `google-services.json` без Android-клієнта). Перевірити: у `google-services.json` є `oauth_client` з `"client_type": 1`, `package_name` `com.bogdanpoh.utilityledger` і `certificate_hash` `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`; `package_name` = `android.package` в `app.json`; `BUNDLE_ID` у plist = `ios.bundleIdentifier` (`com.bogdanpoh.utility-ledger`)
- [X] T002 Встановити залежності однією командою `npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin expo-apple-authentication expo-crypto expo-build-properties` (оновлює `package.json`, `package-lock.json`); перевірити, що `@react-native-firebase/app` і `@react-native-firebase/auth` однієї версії (27.x, точний peer-пін)
- [X] T003 Налаштувати `app.json`: `ios.googleServicesFile: "./GoogleService-Info.plist"`, `ios.usesAppleSignIn: true`, `android.googleServicesFile: "./google-services.json"`; у `plugins` додати `"@react-native-firebase/app"`, `"@react-native-firebase/auth"`, `["@react-native-google-signin/google-signin", { "iosDependencyManager": "spm" }]` (лише цей ключ — інакше плагін вимкне Firebase-режим і вимагатиме `iosUrlScheme`), `"expo-apple-authentication"`, `["expo-build-properties", { "ios": { "useFrameworks": "dynamic" } }]` (RNFirebase 27 лише SPM; `ios.disableSPM` не задавати — плагін кидає помилку)
- [X] T004 Спитати користувача, що робити з відстежуваними git `ios/` (24 файли) і `android/` (49 файлів) після prebuild: закомітити перегенеровані файли разом зі зміною чи прибрати їх з git і додати в `.gitignore` (Constitution III); виконати обраний варіант у `.gitignore`
- [X] T005 Запустити `npx expo prebuild --clean`; після нього перевірити `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android` — SHA-1 має лишитися `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`; якщо інший — сказати користувачу додати новий SHA-1 у Firebase і завантажити `google-services.json` знову
- [X] T006 Зібрати iOS-застосунок для симулятора (`npx expo run:ios`, у фоні) лише щоб переконатися, що збірка з динамічними фреймворками проходить (research R2: ризик для Reanimated/Worklets, keyboard-controller, screens); вхід не перевіряти. При збої — виправляти конфігурацію конкретного модуля через `app.json`/плагін, не через `ios/`

**Checkpoint**: застосунок збирається з Firebase і нативними модулями входу.

**Як зроблено Phase 1:** користувач обрав комітити `ios/` і `android/` (T004); роботу перенесено в гілку `auth-firebase`. Після prebuild SHA-1 debug-ключа не змінився (T005). Збірка на пристрої спершу впала на підписі: wildcard-профіль не мав Sign In with Apple і Push Notifications — користувач увімкнув автоматичний підпис у Xcode, App ID зареєстровано з цими можливостями. Далі — `Undefined symbol _OBJC_CLASS_$_GTMSessionFetcher` / `GULUserDefaults`: precompiled modules Expo SDK 58 роблять `RNGoogleSignin` статичним, а спільні з Firebase SPM-продукти Xcode збирає динамічними package-фреймворками й не лінкує в застосунок. Вимкнути precompiled modules не можна — Swift 6.4.2 (Xcode 27.2) падає на компіляції `ExpoModulesCore` з вихідного коду. Виправлено локальним config plugin `plugins/with-google-signin-spm-link.js`: у `post_install` Podfile він додає `GTMSessionFetcherCore` і `GULUserDefaults` до таргета застосунку. Збірка для симулятора (arm64) — BUILD SUCCEEDED (T006).

---

## Phase 2: Foundational (контракт, сервіс, профіль, екрани входу)

**Purpose**: новий `AuthService` за [contracts/auth-service.md](contracts/auth-service.md) — усі історії залежать від нього

**⚠️ CRITICAL**: жодна історія не починається до завершення фази

- [X] T007 Оновити `src/services/auth/types.ts`: `AuthErrorKind = 'cancelled' | 'failed'`, клас `AuthError extends Error` з полем `kind`; в `AuthService` додати `deleteAccount(): Promise<void>`; коментарі: `signIn` і `deleteAccount` відхиляються лише `AuthError`, при відхиленні `deleteAccount` акаунт і сесія без змін. `AuthUser.method` лишається `method?: SignInMethod` (старі збережені сесії більше не читаються, але тип профілю не міняємо)
- [X] T008 [P] Створити `src/services/auth/errors.ts`: `toAuthError(error: unknown): AuthError` — `cancelled` для `ERR_REQUEST_CANCELED` (expo-apple-authentication), `auth/web-context-canceled` (Custom Tab Firebase на Android), відповіді Google Sign-In зі скасуванням (`isCancelledResponse` обробляється в провайдері, а помилка з кодом `statusCodes.SIGN_IN_CANCELLED` — тут); усе інше, зокрема `auth/user-mismatch`, `auth/account-exists-with-different-credential` і мережеві помилки, — `failed`; `AuthError` пропускати як є. Код скасування Custom Tab на Android (`auth/web-context-canceled`) не підтверджено документацією (research R4): у `__DEV__` логувати `console.warn('[auth]', code)` для кожної помилки, що стала `failed`, щоб користувач міг надіслати справжній код
- [X] T009 Створити `src/services/auth/firebase-auth-service.ts` з `createFirebaseAuthService(storage: KeyValueStorage): AuthService` (модульне API `@react-native-firebase/auth`: `getAuth`, `onAuthStateChanged`, `signOut`): при створенні видалити зі сховища старий ключ імітації `authUser` (FR-013, помилку ігнорувати); `onAuthStateChanged` мапить користувача Firebase в `AuthUser` за [data-model.md](data-model.md): `id` = `uid`, `name` = `displayName ?? null`, `email` = `email ?? null`, `method` з `providerData[0].providerId` (`apple.com` → `apple`, `google.com` → `google`); перший виклик слухача — після відновлення сесії; відкликану на сервері сесію чи видалений деінде акаунт Firebase сам повідомляє через `onAuthStateChanged(null)`, окремого коду не потрібно (spec Edge Cases). `signIn` і `deleteAccount` поки делегують у провайдери з T014–T018 (на цьому кроці — кидають `AuthError('failed')`), `signOut` — `signOut(getAuth())`
- [X] T010 Перемкнути `src/services/auth/index.ts` на `createFirebaseAuthService(storage)` і видалити `src/services/auth/local-auth-service.ts`
- [X] T011 [P] Додати `deleteAccount` у контекст `src/providers/auth-provider.tsx` (`deleteAccount: () => service.deleteAccount()`); поведінку «поки стан `undefined` — нічого не рендерити» не міняти (FR-009)
- [X] T012 [P] У `src/services/profile/local-profile-repository.ts` змінити `syncFromAuth` для того самого `userId`: якщо `nameSource === 'provider'` і `user.name === null`, імʼя не змінюється (FR-012) — `const name = profile.nameSource === 'provider' ? (user.name ?? profile.name) : profile.name`; і для нового `userId`: якщо попередній профіль має `userId`, що починається з `preview-id-` (імітація), і `nameSource === 'user'`, перенести його `name` і `nameSource: 'user'` у новий профіль (FR-013: імʼя, змінене до оновлення, не губиться); оновити коментар у `src/services/profile/types.ts`
- [X] T013 У `src/app/(auth)/sign-in.tsx` у `signInWith` при `error instanceof AuthError && error.kind === 'cancelled'` лишатися на екрані без `router.push('/auth-error')` (FR-005); інші помилки — як зараз. Стан `pendingMethod` (індикатор на натиснутій кнопці, друга недоступна, без повторного запуску — FR-007) не змінювати. Вигляд і тексти екрана не міняти (FR-014)

**Checkpoint**: застосунок стартує з Firebase-сесією (без збереженої — екран входу), lint і tsc проходять.

---

## Phase 3: User Story 1 — Вхід через Apple (Priority: P1) 🎯 MVP

**Goal**: «Продовжити з Apple» на iOS і Android створює/відкриває акаунт Firebase (FR-001, FR-003)

**Independent Test**: quickstart сценарії 1–3 (виконує користувач)

- [X] T014 [P] [US1] Створити `src/services/auth/providers/apple.ios.ts`: `signInWithApple()` — сирий nonce з `expo-crypto` (`Crypto.randomUUID()`), Apple отримує SHA-256 hex (`Crypto.digestStringAsync(SHA256, rawNonce)`), `AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL], nonce: hashedNonce })`; без `identityToken` — `AuthError('failed')`; credential `new OAuthProvider('apple.com').credential({ idToken, rawNonce, fullName })` → `signInWithCredential(getAuth(), credential)`; якщо `fullName` є, а `user.displayName` порожній — `updateProfile(user, { displayName })` (імʼя Apple дає лише раз, research R3); повертає `{ user, authorizationCode }`. Також експорт `reauthenticateApple()` для T023: той самий вхід Apple → `reauthenticateWithCredential(currentUser, credential)` → повертає `authorizationCode`
- [X] T015 [P] [US1] Створити `src/services/auth/providers/apple.android.ts`: `signInWithApple()` — `const provider = new OAuthProvider('apple.com'); provider.addScope('email'); provider.addScope('name'); signInWithPopup(getAuth(), provider)` (нативна сторінка Apple у Custom Tab, research R4); `reauthenticateApple()` — `reauthenticateWithPopup(currentUser, provider)`, повертає `authorizationCode: null`
- [X] T016 [P] [US1] Створити `src/services/auth/providers/apple.ts` (типи й інші платформи): ті самі експорти, що кидають `AuthError('failed')`, щоб `tsc` не падав; і `src/services/auth/firebase-auth-service.web.ts` з тим самим `createFirebaseAuthService(storage)`, що одразу повідомляє `null` і кидає `AuthError('failed')` на `signIn`/`deleteAccount`, — щоб веб-бандл не тягнув нативні модулі (web поза обсягом, plan)
- [X] T017 [US1] У `src/services/auth/firebase-auth-service.ts` реалізувати `signIn('apple')` через `signInWithApple()` з `./providers/apple`; помилки — через `toAuthError`; повертати `AuthUser` з оновленого `currentUser` (після `updateProfile` імʼя вже є)

**Checkpoint**: вхід через Apple працює на iOS і Android, скасування не відкриває екран помилки.

---

## Phase 4: User Story 2 — Вхід через Google (Priority: P1)

**Goal**: «Продовжити з Google» на iOS і Android (FR-002, FR-004)

**Independent Test**: quickstart сценарій 4 (виконує користувач)

- [X] T018 [P] [US2] Створити `src/services/auth/providers/google.ts`: одноразовий `GoogleSignin.configure({ webClientId: '776268107209-1h1v9f12hj34j4ha1p4v6crsvvsva1ne.apps.googleusercontent.com' })` (клієнт типу 3 з `google-services.json`, research R6); `signInWithGoogle()` — на Android `GoogleSignin.hasPlayServices()`, далі `GoogleSignin.signIn()`; `isCancelledResponse` → `AuthError('cancelled')`; без `data.idToken` — `AuthError('failed')`; `GoogleAuthProvider.credential(idToken)` → `signInWithCredential`; `signOutGoogle()` — `GoogleSignin.signOut()` з ігноруванням помилки; `revokeGoogle()` — `GoogleSignin.revokeAccess()` з ігноруванням помилки; `reauthenticateGoogle()` для T023 — `GoogleSignin.signIn()` (скасування → `cancelled`) → `reauthenticateWithCredential(currentUser, credential)`
- [X] T019 [US2] У `src/services/auth/firebase-auth-service.ts` реалізувати `signIn('google')` через `signInWithGoogle()`; помилки — через `toAuthError`

**Checkpoint**: обидва провайдери входу працюють.

---

## Phase 5: User Story 3 — Сесія переживає перезапуск, вихід завершує її (Priority: P1)

**Goal**: збережена сесія без миготіння екрана входу, повний вихід (FR-008, FR-009, FR-010, FR-013)

**Independent Test**: quickstart сценарії 5, 6, 13 (виконує користувач)

- [X] T020 [US3] У `src/services/auth/firebase-auth-service.ts` `signOut()`: `signOutGoogle()` (щоб наступний вхід показав вибір акаунта), потім `signOut(getAuth())`; помилку Google не прокидати (контракт)
- [X] T021 [US3] Оновити коментар над `leave` у `src/app/(tabs)/profile/index.tsx`: вихід завершує сесію Firebase і Google, дані й налаштування лишаються на пристрої
- [X] T022 [P] [US3] Переписати `.claude/skills/ui-check/flows/sign-out.flow`: прибрати повторний вхід через `signIn.apple` (імітації більше немає); лишити перевірку тексту «Вийти з акаунта?», відсутності «стерто» і переходу на `welcome.signIn`; у шапці вказати, що flow потребує попереднього ручного входу і після нього треба увійти знову вручну; у `.claude/skills/ui-check/SKILL.md` додати правило: імітованого входу більше немає, flow, що потребують увійденого користувача (`profile`, `theme`, `start-tab`, `navbar`, `smoke`), запускаються після ручного входу користувача — сесія зберігається між запусками

**Checkpoint**: сесія переживає перезапуск, «Вийти» повертає на екран входу.

---

## Phase 6: User Story 4 — Видалення акаунта (Priority: P1)

**Goal**: справжнє видалення з повторним підтвердженням (FR-016–FR-023)

**Independent Test**: quickstart сценарії 7–12 (виконує користувач)

- [X] T023 [US4] Реалізувати `deleteAccount()` у `src/services/auth/firebase-auth-service.ts` за таблицею контракту: визначити `method` поточного користувача; **Apple, iOS** — `reauthenticateApple()` завжди → `revokeToken(getAuth(), authorizationCode)` → `deleteUser(currentUser)`; **Apple, Android** — `reauthenticateApple()` завжди → `deleteUser` (відкликання лише на iOS, FR-018); **Google** — `deleteUser`; лише на `auth/requires-recent-login` → `reauthenticateGoogle()` → `deleteUser`; після успіху Google — `revokeGoogle()`. Будь-яка помилка до `deleteUser` → `toAuthError` (акаунт і сесія лишаються, FR-020, FR-021). Дані на пристрої й `profileRepository.clear()` не чіпати (FR-022)
- [X] T024 [US4] У `src/app/(tabs)/profile/index.tsx` замінити `confirmDelete`: `message: 'Акаунт і всі ваші дані буде видалено назавжди. Цю дію не можна скасувати.'`, `confirmText: 'Видалити акаунт'`, `onConfirm: removeAccount` (FR-017); `removeAccount` — з тим самим прапорцем `isSigningOut` (FR-023) викликає `useAuth().deleteAccount()`; `cancelled` — нічого; `failed` — `Alert.alert('Не вдалося видалити акаунт', 'Перевірте інтернет і спробуйте ще раз.', [{ text: 'Скасувати', style: 'cancel' }, { text: 'Спробувати ще', onPress: removeAccount }])`; оновити коментар над функціями виходу
- [X] T025 [P] [US4] Оновити канвас (`docs/design.md`, Artifact `https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj`): в артборді 16b «Видалення акаунта» (`project/MoreDelete.dc.html`) текст підтвердження — «Акаунт і всі ваші дані буде видалено назавжди. Цю дію не можна скасувати.» (заголовок «Видалити акаунт?», кнопки «Видалити акаунт» і «Скасувати»); прочитати файл перед зміною, змінити лише текст, опублікувати за правилами канвасу

**Checkpoint**: видалення працює для обох провайдерів, скасування й невдача лишають акаунт.

---

## Phase 7: User Story 5 — Помилка входу і повторна спроба (Priority: P2)

**Goal**: екран «Не вдалося увійти» лише для справжніх помилок (FR-006)

**Independent Test**: quickstart — вхід в авіарежимі відкриває «Не вдалося увійти», повторна спроба після вмикання інтернету входить (виконує користувач)

- [X] T026 [US5] У `src/app/(auth)/auth-error.tsx` у `retry`: `cancelled` і `failed` лишають користувача на екрані з доступною кнопкою (явно перевірити `AuthError`, оновити коментар); вигляд і тексти не міняти

**Checkpoint**: усі історії реалізовані.

---

## Phase 8: Polish & Cross-Cutting

- [X] T027 [P] Переписати розділи «Дані профілю» і «Вихід і видалення акаунта» в `docs/patterns/account-actions.md`: сесія — Firebase (`src/services/auth/firebase-auth-service.ts`, провайдери в `src/services/auth/providers/`), скасування (`AuthError('cancelled')`) не показує помилок; «Вийти» завершує сесію Firebase і Google; «Видалити акаунт» — справжнє видалення з повторним підтвердженням (Apple завжди, відкликання лише на iOS; Google на `requires-recent-login`), фінальний текст підтвердження, `Alert` при невдачі, дані на пристрої лишаються до хмарного зберігання; прибрати згадки про імітацію й «поки це лише вихід» (FR-015, Constitution IV)
- [X] T028 [P] Оновити рядок про профіль/акаунт у `docs/patterns/README.md`, якщо його опис згадує імітацію чи «вихід без видалення»
- [X] T029 Передати користувачу ручну перевірку за [quickstart.md](quickstart.md) (сценарії 1–14, налаштування Apple Developer і Firebase з розділу 1); після його підтвердження поставити в `spec.md` **Status**: Implemented і короткий підсумок українською
- [X] T030 Запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки (Constitution VI: остання задача)

---

## Dependencies & Execution Order

- **Setup (T001–T006)** → **Foundational (T007–T013)** → історії.
- **US1 (T014–T017)** і **US2 (T018–T019)** незалежні між собою; обидві потрібні для US4 (T023 використовує `reauthenticateApple`, `reauthenticateGoogle`, `revokeGoogle`).
- **US3 (T020–T022)**: T020 залежить від T018 (`signOutGoogle`).
- **US4 (T023–T025)**: після US1 і US2; T024 після T023; T025 незалежна.
- **US5 (T026)**: лише після Foundational.
- **Polish**: T027, T028 паралельно після реалізації; T029 після всього коду; T030 (lint і tsc) останньою, і після правок за результатами ручної перевірки.
- Усередині `firebase-auth-service.ts` (T009, T017, T019, T020, T023) задачі послідовні — один файл.

### Parallel Opportunities

- Foundational: T008, T011, T012 паралельно після T007.
- US1: T014, T015, T016 паралельно; разом з ними T018 (US2).
- T022 (flow), T025 (канвас), T026, T027, T028 — окремі файли.

### Parallel Example: провайдери

```text
T014 apple.ios.ts     ─┐
T015 apple.android.ts ─┼─► T017 signIn('apple') ─┐
T016 apple.ts         ─┘                          ├─► T020 signOut ─► T023 deleteAccount ─► T024 профіль
T018 google.ts ─────────► T019 signIn('google') ──┘
```

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + US1 (T001–T017) — справжній вхід через Apple, без якого Google-вхід не пройде App Store. Коміт після T017 (з lint і tsc).
- **Далі**: US2 → коміт; US3 → коміт; US4 (разом із канвасом) → коміт; US5 → коміт; Polish (патерни комітяться разом з останньою зміною поведінки, яку вони описують).
- Конфіги Firebase (`GoogleService-Info.plist`, `google-services.json`) комітяться в репозиторій (клієнтські конфіги не секрет).
- Ручну перевірку входу, виходу й видалення виконує користувач; агент лише збирає (T006), запускає lint і typecheck.
