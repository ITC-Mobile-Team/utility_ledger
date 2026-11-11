# Research: Справжній вхід, вихід і видалення акаунта (Firebase)

Джерела: Expo guide «Using Firebase» (оновлено 2026-11-02), документація `expo-apple-authentication` для SDK 58, Expo-налаштування `@react-native-google-signin/google-signin`, документація Firebase Android «Apple», а також вихідний код опублікованих пакетів `@react-native-firebase/{app,auth}@27.1.1` і `@react-native-google-signin/google-signin@17.0.0` (rnfirebase.io під час дослідження не відкривався, тому API звірено з кодом пакетів).

## R1. SDK Firebase: React Native Firebase, а не JS SDK

- **Decision**: `@react-native-firebase/app` + `@react-native-firebase/auth` (27.x, модульне API: `getAuth`, `onAuthStateChanged`, `signInWithCredential`, `signInWithPopup`, `reauthenticateWithCredential`, `reauthenticateWithPopup`, `deleteUser`, `revokeToken`, `signOut`).
- **Rationale**: Expo для нативних провайдерів радить React Native Firebase; він сам зберігає сесію в нативному сховищі (FR-008, офлайн-відновлення), має нативний веб-вхід провайдера на Android (`signInWithPopup` → нативний `signInWithProvider`, Custom Tab) і `revokeToken` для Apple. Модуля Expo для Firebase Auth немає.
- **Alternatives**: Firebase JS SDK — працює в Expo Go, але не має нативного веб-входу Apple на Android, сесію треба зберігати вручну через AsyncStorage-персистенцію, а `revokeToken` для Apple відсутній.

## R2. Збірка iOS: SPM і динамічні фреймворки

- **Decision**: `expo-build-properties` з `ios.useFrameworks: "dynamic"`; у плагіні Google Sign-In `iosDependencyManager: "spm"`.
- **Rationale**: RNFirebase 27 (Firebase iOS 13+) лише SPM; плагін `@react-native-firebase/app` кидає помилку на `ios.disableSPM` і прямо вимагає `useFrameworks: "dynamic"`. Firebase і Google Sign-In мають використовувати один менеджер залежностей, а плагін Google Sign-In за замовчуванням ставить CocoaPods.
- **Risk**: динамічні фреймворки можуть зламати збірку інших нативних модулів (Reanimated/Worklets, keyboard-controller, screens). Перевіряється першою збіркою; при збої — шукати фікс конкретного модуля, а не вертатися на RNFirebase 26.

## R3. Apple на iOS

- **Decision**: `expo-apple-authentication` (`signInAsync` з `FULL_NAME`, `EMAIL` і хешованим nonce) + `expo-crypto` (випадковий nonce і SHA-256). Firebase отримує `OAuthProvider('apple.com').credential({ idToken, rawNonce, fullName })`.
- **Rationale**: модуль Expo (принцип I); Apple отримує SHA-256 nonce, Firebase — сирий (так описано в документації Firebase; `AppleAuthProvider` у RNFirebase 27 застарів на користь `OAuthProvider('apple.com')`). `authorizationCode` з відповіді потрібен для `revokeToken` під час видалення. Конфіг: `ios.usesAppleSignIn: true` + плагін `expo-apple-authentication`.
- **Cancel**: `e.code === 'ERR_REQUEST_CANCELED'`.
- **Name**: Apple повертає імʼя лише при першому вході. Його передаємо в `fullName` і, якщо в користувача Firebase немає `displayName`, зберігаємо через `updateProfile`, щоб імʼя повертав і наступний вхід.

## R4. Apple на Android

- **Decision**: `signInWithPopup(auth, new OAuthProvider('apple.com'))` з `addScope('email')`, `addScope('name')`; повторне підтвердження — `reauthenticateWithPopup(user, provider)`.
- **Rationale**: у RNFirebase 27 це нативний `signInWithProvider` → `startActivityForSignInWithProvider` (сторінка Apple у Custom Tab, повернення в застосунок без deep link з боку застосунку).
- **Config (робить користувач)**: у Apple Developer — Services ID, повʼязаний з App ID, return URL `https://utility-ledger-4b1aa.firebaseapp.com/__/auth/handler`, ключ Sign in with Apple; у Firebase → Apple: Services ID, Team ID, key ID, приватний ключ.
- **Cancel**: закриття Custom Tab дає помилку Firebase з кодом `auth/web-context-canceled` (перевіряється в реалізації; невідомий код вважається помилкою, а не скасуванням, лише якщо він не збігається з цим).

## R5. Відкликання доступу Apple при видаленні

- **Decision**: iOS — `revokeToken(auth, authorizationCode)` зі свіжого входу Apple перед `deleteUser`. Android — відкликання клієнтом неможливе.
- **Finding**: у RNFirebase 27 `revokeToken` «Supported on iOS… On Android and Web the bridge resolves without performing revocation (no-op)», а `revokeAccessToken` кидає «only supported on Web». Нативний Android SDK має `revokeAccessToken(accessToken)`, але RNFirebase його не прокидає.
- **Consequence**: FR-018 виконується повністю на iOS (саме там App Store перевіряє вимогу Apple). На Android свіже підтвердження Apple перед видаленням усе одно запитується, але доступ до Apple ID не відкликається. Повне виконання на Android потребує серверної функції з Apple REST `/auth/revoke` (Cloud Functions, план Blaze) — користувач вирішив (2026-11-11) прийняти обмеження: FR-018 уточнено «відкликання лише на iOS», Cloud Function поза обсягом.

## R6. Google

- **Decision**: `@react-native-google-signin/google-signin` 17.x, плагін `["@react-native-google-signin/google-signin", { "iosDependencyManager": "spm" }]` (лише цей ключ — плагін бере клієнт із `googleServicesFile`). `GoogleSignin.configure({ webClientId })`, де `webClientId` — клієнт типу 3 з `google-services.json` (`776268107209-1h1v…a1ne.apps.googleusercontent.com`). Відповідь `signIn()` → `isSuccessResponse` / `isCancelledResponse`; `idToken` → `GoogleAuthProvider.credential(idToken)` → `signInWithCredential`.
- **Sign out / delete**: вихід — `GoogleSignin.signOut()` (наступний вхід показує вибір акаунта, FR-010); видалення — `GoogleSignin.revokeAccess()` після `deleteUser`.
- **Reauth**: спершу `deleteUser`; лише на `auth/requires-recent-login` — `GoogleSignin.signIn()` і `reauthenticateWithCredential`; інший акаунт дає `auth/user-mismatch` → повідомлення про невдачу (FR-019, FR-021).
- **Android-конфіг**: перший `google-services.json` не мав Android OAuth-клієнта (тип 1), тож вхід Google на Android повертав би `DEVELOPER_ERROR`. Оновлений файл (`~/Downloads/google-services (1).json`) уже містить клієнт `776268107209-nic2…a8a.apps.googleusercontent.com` (тип 1) з SHA-1 `5e8f1606…f625` — це SHA-1 debug-ключа `android/app/debug.keystore` (перевірено `keytool`), тож debug-збірки працюватимуть. Решта файлу (проєкт, `mobilesdk_app_id`, API key, вебклієнт типу 3) не змінилась, `webClientId` той самий. У репозиторій кладеться саме оновлений файл під назвою `google-services.json`.
- **Release/EAS**: SHA-1 ключа підпису EAS (і Google Play App Signing після публікації) ще не додано — для release-збірок його треба додати у Firebase і знову завантажити `google-services.json`. Для поточної ручної перевірки (debug) не блокує.

## R7. Перехід з імітації

- **Decision**: нова реалізація `AuthService` (`firebase-auth-service.ts`) замість `local-auth-service.ts`; при старті видаляється старий ключ `authUser` зі сховища. Сесія визначається лише Firebase (FR-013).
- **Rationale**: прапорець онбордингу, профіль і дані зберігаються окремо й не чіпаються; профіль з новим `userId` створюється з даних провайдера.
- **Profile**: `syncFromAuth` не перезаписує наявне імʼя `null`-ом від провайдера (FR-012).

## R8. Перевірка

- **Decision**: lint + typecheck агентом; вхід, вихід і видалення перевіряє користувач за `quickstart.md`. `sign-out.flow` залежить від імітованого входу — переписується на перевірку лише того, що доступно без провайдера (тексти підтверджень, перехід на екран входу), повторний вхід прибирається.
