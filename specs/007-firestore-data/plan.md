# Implementation Plan: Зберігання даних користувача в хмарі (Firestore)

**Branch**: `firestore` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-firestore-data/spec.md`

## Summary

Профіль, обʼєкти, послуги, місяці, показники, дні, суми й місто/черги «Світла» переїжджають з AsyncStorage у Firestore під `users/{uid}`. Локальна копія й офлайн — постійний кеш і черга записів нативного Firestore SDK (черга окрема для кожного користувача, тож незбережені зміни переживають вихід і відправляються при наступному вході того самого акаунта). Інтерфейси репозиторіїв лишаються, екрани не змінюються: `load()` замінюється на `setUser(uid)`, мутації застосовуються до знімка одразу без очікування сервера. Новий `AccountDataProvider` керує першим завантаженням (скелетони / «Немає інтернету» / дані), перенесенням даних попередньої версії й видаленням даних перед видаленням акаунта. Деталі рішень — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19 з React Compiler, React Native через Expo SDK 58

**Primary Dependencies**: `@react-native-firebase/firestore` 27.1.1 (нова; `app`/`auth` 27.1.1 уже є), Expo Router, Reanimated, `expo-linear-gradient` (скелетони)

**Storage**: Cloud Firestore (`users/{uid}/…`, [data-model.md](data-model.md)) з постійним кешем SDK; `KeyValueStorage` (AsyncStorage) для налаштувань пристрою, сповіщень «Світла», кешу графіків і прапорця `accountDataSynced:{uid}`

**Testing**: автотестів у проєкті немає; lint + tsc, ручна перевірка за [quickstart.md](quickstart.md) (вхід — користувач), скелетони — skill `ui-check` за можливості

**Target Platform**: iOS і Android (development build); web — локальні репозиторії, поза обсягом

**Project Type**: mobile-app (Expo, CNG; `ios/`/`android/` згенеровані prebuild і закомічені)

**Performance Goals**: повторний запуск показує дані без помітного очікування (знімок з кешу); зміна з іншого пристрою — ≤ 5 с (SC-002)

**Constraints**: офлайн-first; записи не чекають сервера; батчі ≤ 500 операцій; без серверних функцій (тариф Spark)

**Scale/Scope**: один користувач — одиниці обʼєктів, десятки послуг, сотні–тисячі показників за роки

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Як дотримано |
|---|---|---|
| I. Expo за документацією версії | ✅ | SDK 58; пакет ставиться `npx expo install`; модуля Expo для Firestore немає — стороння бібліотека обґрунтована в research R1 (той самий RN Firebase, що вже в проєкті) |
| II. Expo Router і `src/` | ✅ | Нових маршрутів немає; код у `src/services/firestore`, `src/services/account-data`, `src/providers`, `src/views/account-data`, `src/components` |
| III. CNG | ✅ | Нативний модуль → **потрібна нова development build**; `ios/`/`android/` лише через `npx expo prebuild --clean`; config plugin для Firestore не потрібен; можливе доповнення `plugins/with-google-signin-spm-link.js` (R2) |
| IV. Дизайн і патерни | ✅ | Нові артборди скелетонів і офлайн-стану в канвасі (R12, нижче); патерни: `account-actions.md` (вихід/видалення з даними в хмарі), новий `user-data.md` (де дані, офлайн, перше завантаження, скелетони) + індекс `README.md`; `outage-providers.md` — посилання на спільний `SkeletonBone` |
| V. Українська | ✅ | Артефакти українською; тексти UI: «Немає інтернету», «Дані акаунта ще не завантажено», «Спробувати ще» |
| VI. Lint і typecheck | ✅ | Остання задача `tasks.md` — `npx expo lint` і `npx tsc --noEmit` |

Після Phase 1: порушень немає, Complexity Tracking не потрібен.

## Дизайн (артборди)

Нові артборди в канвасі `https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj` (стиль — наявний `.skel` з 20l «Завантаження графіка»):

- **05s · Обʼєкти — завантаження** — навбар «Обʼєкти» і 2–3 картки-скелетони обʼєкта (як 05).
- **20d · Світло — завантаження даних акаунта** — як 20l, але без назви черги в навбарі.
- **14s · Аналітика — завантаження** — скелетон суми періоду й графіка (як 14).
- **16s · Профіль — завантаження** — аватар/імʼя скелетоном, решта рядків профілю звичайні (як 16).
- **05o · Немає інтернету — дані не завантажено** — на місці вмісту вкладки: emoji 📡, заголовок «Немає інтернету», текст «Дані акаунта ще не завантажено. Підключіться до інтернету й спробуйте ще раз.», кнопка «Спробувати ще»; той самий стан на всіх чотирьох вкладках.

Звірка: наявні 05, 14, 16, 20l (`docs/design.md`).

## Застосовні патерни

`docs/patterns/account-actions.md` (вихід, видалення, профіль), `outage-providers.md` (скелетон «Світла», кеш графіка), `preferences.md` (що лишається на пристрої), `tab-bar.md` (кореневі екрани табів), `buttons.md` («Спробувати ще» через `Pressable`), `test-ids.md` (testID скелетонів і офлайн-стану), `reanimated.md` (відблиск скелетона).

## Project Structure

### Documentation (this feature)

```text
specs/007-firestore-data/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── repositories.md
│   └── firestore-rules.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
firestore.rules                                   # нове: правила безпеки
firebase.json                                     # нове: посилання на правила
package.json                                      # + @react-native-firebase/firestore
ios/, android/                                    # перегенеровано prebuild
plugins/with-google-signin-spm-link.js            # лише якщо iOS-лінкування вимагатиме

src/services/firestore/
├── index.ts          # db = getFirestore(), userDoc(uid), userCollection(uid, name)
└── batch.ts          # commitInChunks (≤500), withoutUndefined, logWriteError (dev)

src/services/ledger/
├── types.ts                         # LedgerRepository: load/clear → setUser
├── firestore-ledger-repository.ts   # нове: 6 слухачів, оптимістичні мутації, каскади, відкидання сиріт
├── local-ledger-repository.ts       # setUser замість load (web)
├── index.ts                         # Firestore-реалізація
└── index.web.ts                     # нове: локальна реалізація

src/services/outages/
├── settings-repository.ts           # setUser; city/queues → Firestore, notifications → KeyValueStorage
├── settings-repository.web.ts       # нове або параметр сховища: локальна реалізація
└── index.ts

src/services/profile/
├── types.ts                         # load/clear → setUser
├── firestore-profile-repository.ts  # нове: users/{uid}, правила syncFromAuth
├── local-profile-repository.ts      # setUser (web); ключ userProfile — джерело перенесення імені
├── index.ts / index.web.ts

src/services/account-data/
├── index.ts          # status machine, accountDataSynced:{uid}, fetchFromServer, deleteAccountData
└── migrate-legacy.ts # перенесення ledgerState / outageSettings / userProfile (R7)

src/services/auth/
├── types.ts                         # deleteAccount(deleteData)
├── firebase-auth-service.ts         # виклик deleteData після перепідтвердження Apple, до deleteUser
└── firebase-auth-service.web.ts     # сигнатура

src/providers/
├── account-data-provider.tsx        # нове: setUser у трьох репозиторіях, status, retry
├── auth-provider.tsx                # deleteAccount передає deleteAccountData(user.id)
├── ledger-provider.tsx / outage-provider.tsx / profile-provider.tsx  # без load(); готовність від AccountDataProvider
src/views/app-providers.tsx          # AccountDataProvider між AuthProvider і LedgerProvider

src/components/skeleton.tsx          # нове: SkeletonBone + useSkeletonShine (з outage-skeleton)
src/views/outages/outage-skeleton.tsx  # на спільному SkeletonBone
src/views/account-data/
├── account-data-gate.tsx            # status → skeleton | offline | children
├── account-data-offline.tsx         # «Немає інтернету» + «Спробувати ще»
├── objects-skeleton.tsx / analytics-skeleton.tsx / profile-skeleton.tsx
└── index.ts

src/app/(tabs)/(objects)/index.tsx   # обгортка AccountDataGate
src/app/(tabs)/(outages)/index.tsx   # обгортка AccountDataGate (OutageSkeleton)
src/app/(tabs)/analytics.tsx         # обгортка AccountDataGate
src/app/(tabs)/profile/index.tsx     # обгортка AccountDataGate

docs/patterns/user-data.md           # нове
docs/patterns/account-actions.md, outage-providers.md, README.md
```

**Structure Decision**: наявна структура Expo-застосунку; Firestore-реалізації стоять поруч із локальними за тими самими інтерфейсами, підміна — в `index.ts` кожного сервісу (як і задумано коментарями в коді). Вкладені екрани табів досяжні лише з кореневих, тож gate потрібен тільки на чотирьох кореневих екранах.

## Ризики

- iOS-лінкування FirebaseFirestore з precompiled modules (R2) — може знадобитися ще один продукт у SPM-плагіні.
- Поведінку черги записів «окремо для кожного користувача» перевіряють сценарії 7–8 quickstart; якщо вона не підтвердиться на якійсь платформі, запасний план — блокувати вихід до `waitForPendingWrites` (повернення до варіанта D з уточнень, потребує рішення користувача).
- Видалення даних, після якого `deleteUser` Google не вдався, лишає порожній акаунт (R6) — свідомий компроміс.

## Complexity Tracking

Порушень Constitution Check немає.
