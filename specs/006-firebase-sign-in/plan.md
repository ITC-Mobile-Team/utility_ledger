# Implementation Plan: Справжній вхід, вихід і видалення акаунта через Apple і Google (Firebase)

**Branch**: `feature/outages-tab` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-firebase-sign-in/spec.md`

## Summary

Імітацію входу (`local-auth-service.ts`) замінює `AuthService` на React Native Firebase: Apple на iOS — `expo-apple-authentication` з nonce, Apple на Android — нативний веб-вхід Firebase (`signInWithPopup`), Google — `@react-native-google-signin/google-signin`. Інтерфейс `AuthService` отримує `deleteAccount()` і типізовані помилки (скасування, невдача), екрани `(auth)` лишаються як є, «Профіль» отримує справжнє видалення з повторним підтвердженням (Apple — завжди, з відкликанням токена на iOS; Google — лише на `requires-recent-login`) і фінальний текст підтвердження. Дані на пристрої не стираються. Потрібна нова development build. Деталі рішень — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6.0, React 19.3, React Native 0.88 (New Architecture), Expo SDK 58

**Primary Dependencies**: нові — `@react-native-firebase/app`, `@react-native-firebase/auth` (27.x), `@react-native-google-signin/google-signin` (17.x), `expo-apple-authentication`, `expo-crypto`, `expo-build-properties`; наявні — Expo Router, AsyncStorage (`src/storage`)

**Storage**: сесія — нативне сховище Firebase Auth; профіль, дані, налаштування — наявні локальні репозиторії (без змін, крім правила імені в `syncFromAuth`)

**Testing**: `npx expo lint`, `npx tsc --noEmit`; ручна перевірка входу/виходу/видалення користувачем за [quickstart.md](quickstart.md); `ui-check` лише для частин без провайдера

**Target Platform**: iOS 15.1+ і Android (development build, CNG); web поза обсягом (заглушка сервісу)

**Project Type**: mobile-app (Expo, Continuous Native Generation)

**Performance Goals**: вхід < 15 с за нормального інтернету (SC-001); відновлення сесії при старті без миготіння екрана входу

**Constraints**: офлайн-відновлення сесії; ручне редагування `ios/` і `android/` заборонене; конфіги Firebase у репозиторії (Android — оновлений файл з SHA-1 debug-ключа; SHA-1 EAS/release додається перед release-збіркою)

**Scale/Scope**: 2 провайдери × 2 платформи; зачеплені екрани — `(auth)/sign-in.tsx`, `(auth)/auth-error.tsx`, `(tabs)/profile/index.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Як виконується |
|---|---|---|
| I. Expo за документацією версії | ✅ | Expo SDK 58; залежності через `npx expo install`; Expo-модулі там, де є (`expo-apple-authentication`, `expo-crypto`, `expo-build-properties`). Сторонні: RNFirebase (модуля Expo для Firebase Auth немає; Expo сам радить RNFirebase для нативних провайдерів) і Google Sign-In (у Expo немає нативного входу Google; `expo-auth-session` для Google застарілий і без нативного вибору акаунта). |
| II. Expo Router і `src/` | ✅ | Нових маршрутів немає; сервіс — `src/services/auth/`, провайдери входу — `src/services/auth/providers/`, екрани лише викликають `useAuth()`. |
| III. Нативне через CNG | ✅ | Плагіни й `googleServicesFile` в `app.json`; `npx expo prebuild --clean`. **Потрібна нова development build**, OTA не доставляється. Увага: `ios/` і `android/` зараз відстежуються git (старий коміт `523603d`); prebuild перепише ці файли — їх або комітять разом зі зміною, або прибирають з git (вирішує користувач, у задачах — окремий пункт). |
| IV. Дизайн і патерни | ✅ | Екрани входу без змін (наявні артборди); артборд 16b «Видалення акаунта» (`MoreDelete.dc.html`) оновлюється новим текстом. Патерни: `docs/patterns/account-actions.md` (вихід/видалення — переписується), `docs/patterns/test-ids.md` (без нових id, крім потреби), `docs/patterns/buttons.md` (стани завантаження кнопок входу — без змін). |
| V. Українська | ✅ | Артефакти й тексти українською; повідомлення про невдачу видалення — українською. |
| VI. Lint і typecheck | ✅ | Остання задача `tasks.md`. |

**Gate**: пройдено. Обмеження відкликання Apple на Android погоджене й відображене у FR-018 (Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/006-firebase-sign-in/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-service.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
GoogleService-Info.plist              # новий, з ~/Downloads (iOS-конфіг Firebase)
google-services.json                  # новий, з ~/Downloads/google-services (1).json (Android-конфіг з OAuth-клієнтом типу 1, SHA-1 debug-ключа)
app.json                              # googleServicesFile, usesAppleSignIn, плагіни
plugins/with-google-signin-spm-link.js # config plugin: лінкує спільні SPM-продукти GoogleSignIn/Firebase у застосунок (research R2)
plugins/with-gradle-memory.js         # config plugin: памʼять Gradle-демона для release-збірки з R8 (research R2a)
src/services/auth/
├── types.ts                          # + deleteAccount(), AuthError (cancelled | failed)
├── index.ts                          # authService = createFirebaseAuthService(storage)
├── firebase-auth-service.ts          # новий: onAuthStateChanged, signIn, signOut, deleteAccount
├── firebase-auth-service.web.ts      # заглушка для web (завжди «не увійшов»), щоб веб-бандл не тягнув нативні модулі
├── errors.ts                         # toAuthError: cancelled | failed
├── local-auth-service.ts             # видаляється
└── providers/
    ├── apple.ios.ts                  # expo-apple-authentication + nonce, reauth, revokeToken
    ├── apple.android.ts              # signInWithPopup / reauthenticateWithPopup (OAuthProvider apple.com)
    ├── apple.ts                      # заглушка для web (кидає failed)
    └── google.ts                     # GoogleSignin.configure/signIn/signOut/revokeAccess
src/providers/auth-provider.tsx       # + deleteAccount у контексті
src/services/profile/local-profile-repository.ts  # syncFromAuth не затирає імʼя null-ом; переносить змінене імʼя з профілю імітації
.claude/skills/ui-check/SKILL.md                  # flow з увійденим користувачем — після ручного входу
src/app/(auth)/sign-in.tsx            # скасування → без екрана помилки
src/app/(auth)/auth-error.tsx         # скасування → лишаємося на екрані
src/app/(tabs)/profile/index.tsx      # справжнє видалення, новий текст, Alert про невдачу, блок повторного запуску
docs/patterns/account-actions.md      # справжній вхід/вихід/видалення
.claude/skills/ui-check/flows/sign-out.flow       # без імітованого повторного входу
```

**Додавання конфігів Firebase** (перша задача реалізації, до встановлення пакетів):

1. Скопіювати `~/Downloads/GoogleService-Info.plist` → `GoogleService-Info.plist` у корені проєкту.
2. Скопіювати `~/Downloads/google-services (1).json` → `google-services.json` у корені проєкту (саме оновлений файл, не перший `google-services.json` без Android-клієнта).
3. Перевірити, що в `google-services.json` є `oauth_client` з `client_type: 1`, `package_name` `com.bogdanpoh.utilityledger` і `certificate_hash`, що збігається з SHA-1 `android/app/debug.keystore`; `package_name` = `android.package` в `app.json`, `BUNDLE_ID` у plist = `ios.bundleIdentifier`.
4. В `app.json`: `ios.googleServicesFile: "./GoogleService-Info.plist"`, `android.googleServicesFile: "./google-services.json"`. Плагін `@react-native-firebase/app` при prebuild копіює їх у `ios/` і `android/app/` та підключає Gradle-плагін `google-services`.
5. `npx expo prebuild --clean` → нова development build. `prebuild --clean` відтворює `android/app/debug.keystore` зі стандартного шаблону, тож SHA-1 лишається тим самим (перевірити `keytool` після prebuild; якщо змінився — додати новий SHA-1 у Firebase).

**Structure Decision**: мобільний застосунок Expo з наявною розкладкою `src/`; платформна різниця Apple — через розширення `.ios.ts` / `.android.ts`, решта коду спільна.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Відкликання доступу до Apple ID при видаленні лише на iOS (FR-018 уточнено 2026-11-11 за рішенням користувача) | RNFirebase 27 не прокидає відкликання на Android (`revokeToken` — no-op, `revokeAccessToken` лише Web) | Cloud Function з Apple REST `/auth/revoke` (план Blaze, приватний ключ Apple на сервері) — окрема серверна частина; користувач обрав не додавати її в цю фічу. На Android свіже підтвердження Apple перед видаленням лишається. |
