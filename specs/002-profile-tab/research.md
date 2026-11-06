# Research: Таб «Профіль»

Невідомих у Technical Context не лишилося; нижче — рішення, ухвалені під час планування.

## R1. Де зберігати профіль («UserDefaults»)

- **Decision**: спільне сховище ключ-значення `KeyValueStorage` з `src/storage` (зараз `AsyncKeyValueStorage` на `@react-native-async-storage/async-storage`), ключ `userProfile`, значення — JSON.
- **Rationale**: це вже аналог UserDefaults у застосунку: ним користуються `authUser`, `ledgerState`, `outageSettings`, `hasSeenOnboarding`. Нових залежностей і development build не треба.
- **Alternatives considered**: `expo-sqlite/kv-store` (синхронне API, але ще один модуль і друге сховище поруч з наявним); нативний `UserDefaults` через власний модуль (порушує принцип I «Expo-модулі насамперед» і потребує development build); `expo-secure-store` (для секретів, імʼя не секрет).

## R2. Шар збереження з майбутньою заміною на Firebase

- **Decision**: інтерфейс `ProfileRepository` у `src/services/profile/types.ts` (`load`, `getSnapshot`, `subscribe`, `syncFromAuth`, `setName`, `clear`) і локальна реалізація `createLocalProfileRepository(storage)`; екрани читають профіль лише через `ProfileProvider` / `useProfile()`. Контракт — [contracts/profile-repository.md](contracts/profile-repository.md).
- **Rationale**: так само влаштовані `LedgerRepository` і `OutageSettingsRepository` (знімок + `subscribe` для `useSyncExternalStore`), а `AuthService` уже має коментар про асинхронне відновлення сесії Firebase. Firestore-реалізація (`users/{uid}`) підставиться в `src/services/profile/index.ts` без змін в екранах.
- **Alternatives considered**: зберігати імʼя прямо в `AuthUser` (тоді змінене імʼя перезаписується при кожному вході й змішує сесію з даними профілю — суперечить FR-006); Zustand/Redux (нова залежність без потреби).

## R3. Спосіб входу і перше заповнення профілю

- **Decision**: `AuthUser` отримує необовʼязкове поле `method?: SignInMethod`; `local-auth-service` записує його при `signIn`. `ProfileProvider` після входу викликає `syncFromAuth(user)`: якщо профілю немає або `userId` інший — створює його з `name`, `email`, `method` користувача; якщо є — оновлює лише `email` і `method`, імʼя не чіпає.
- **Rationale**: виконує FR-006 (імʼя не перезаписується провайдером) і FR-008. Старі сесії без `method` показують нейтральний рядок «Спосіб входу» (edge case зі спеки).
- **Alternatives considered**: окремий ключ лише для методу (дублює сесію); вимагати повторного входу для старих сесій (зайве тертя).

## R4. Вихід і видалення акаунта: стирання локальних даних

- **Decision**: модуль `src/services/account/wipe-local-data.ts` з `wipeLocalData()` у такому порядку:
  1. записати маркер `pendingWipe = 'true'`;
  2. `authService.signOut()` — користувач одразу на першому екрані (захищені маршрути в `src/app/_layout.tsx`);
  3. скасувати заплановані сповіщення «Світла» (`cancelOutageNotifications()` — нова експортована функція в `src/services/outages/notifications.ts`, що знімає запити з префіксом `outage:`);
  4. `ledgerRepository.clear()`, `outageSettingsRepository.clear()` (налаштування + кеш графіків для всіх постачальників з реєстру), `profileRepository.clear()`, скидання `hasSeenOnboarding`;
  5. видалити маркер.
  При старті `AuthProvider` перевіряє маркер і, якщо він є, спершу доводить стирання до кінця. «Вийти» і «Видалити акаунт» поки викликають ту саму функцію з різним `reason` (для майбутнього серверного видалення).
- **Rationale**: виконує edge case «перерване видалення»: сесія знімається першою, тож стан «сесія є, профіль частково стертий» неможливий, а недостерті дані добиваються маркером при наступному запуску. Репозиторії вже тримають дані в памʼяті — `clear()` оновлює знімок і слухачів, тож екрани не показують старі дані.
- **Alternatives considered**: `AsyncStorage.clear()` (зносить і чужі ключі бібліотек, обходить репозиторії з їхнім станом у памʼяті); стирати до `signOut` (перерване стирання лишає користувача в акаунті з напівпорожніми даними).
- **Онбординг**: скидається, бо «наступний вхід починається з нуля» (клар. 1).

## R5. Підтвердження виходу й видалення

- **Decision**: хелпер `confirmDestructive({ title, message, action })` у `src/views/profile/confirm-destructive.ts`: на iOS — `ActionSheetIOS.showActionSheetWithOptions` з `title`, `message`, деструктивною кнопкою й «Скасувати» (це саме той вигляд, що на артборді 16b: картка знизу і окрема кнопка «Скасувати»); на Android — `Alert.alert` з кнопками «Скасувати» і деструктивною дією.
- **Rationale**: нативний компонент дає вигляд макета без власної шторки, а Android отримує той самий системний діалог, що й скидання в `docs/patterns/swipe-actions.md`. Кнопки системного діалогу не обгортаються в `guardPress` (патерн кнопок), а повторний запуск самої дії блокує прапорець «йде стирання».
- **Alternatives considered**: власна шторка з `BottomSheet` (більше коду, треба повторювати доступність alertdialog); лише `Alert.alert` (на iOS діалог по центру, не як у макеті).
- **Патерн**: новий файл `docs/patterns/account-actions.md`.

## R6. Версія застосунку в підвалі

- **Decision**: `Constants.expoConfig?.version` з `expo-constants` (уже в залежностях, `~58.0.12`); формат «Utility Ledger · версія 1.0.0».
- **Rationale**: документація SDK 58 (`/versions/v58.0.0/sdk/constants.md`): `expoConfig` містить app config, а `version` з `app.json` — це версія, яку бачить користувач і яка оновлюється разом з OTA-конфігом. Без нового нативного модуля.
- **Alternatives considered**: `expo-application` `nativeApplicationVersion` (точніше для бінарника, але нова нативна залежність і development build заради одного рядка).

## R7. Ініціал на аватарі

- **Decision**: `getInitial(name)`: перший символ обрізаного імені за кодовими точками (`Array.from(trimmed)[0]`), `toLocaleUpperCase('uk')`; для порожнього — «?».
- **Rationale**: не розрізає емодзі навпіл (edge case). Складені емодзі (ZWJ) покажуть першу частину — прийнятно для аватара.
- **Alternatives considered**: `Intl.Segmenter` (підтримка в Hermes не гарантована для SDK 58 — не перевіряли, ризик краху).

## R8. Маршрут і структура табу

- **Decision**: папка `src/app/(tabs)/profile/` (без дужок) зі стеком: `_layout.tsx`, `index.tsx` → `/profile`, `edit-name.tsx` → `/profile/edit-name`, `privacy.tsx`, `terms.tsx`. `NativeTabs.Trigger name='profile'`, підпис «Профіль», іконка SF `person.crop.circle` / Material `person`, колір `purpleInk`. `more.tsx` видаляється.
- **Rationale**: групи `(…)` не додають сегмент в URL, тож для адреси `/profile` (клар. 4) потрібна звичайна папка. Таб-бар ховається, коли `segments[1] === 'profile' && segments.length > 2` — розширення наявної умови з `docs/patterns/tab-bar.md`.
- **Alternatives considered**: група `(profile)` з `index.tsx` (URL `/` конфліктує з «Обʼєктами»).

## R9. Перемикач сповіщень у профілі

- **Decision**: хук `useOutageNotificationToggle()` у `src/providers/outage-provider.tsx` (або поруч), винесений з `outage-settings.tsx`: читає `settings.notifications.enabled`, при увімкненні викликає `ensureNotificationPermission()` і при відмові показує той самий `Alert` «Сповіщення вимкнені» з «Параметри»; зберігає через `repository.save` і переплановує `syncOutageNotifications` за кешованим графіком.
- **Rationale**: FR-009 і SC-004 — одне джерело правди (`outageSettings`), однакова поведінка в обох місцях. Екран налаштувань «Світла» тримає локальну чернетку до «Зберегти» — він і далі ініціалізується з репозиторію, тож зміна з профілю там видна при наступному відкритті.
- **Alternatives considered**: окремий ключ для прапорця в профілі (два джерела правди, розсинхрон).
