---
description: "Задачі для фічі «Таб «Профіль»»"
---

# Tasks: Таб «Профіль»

**Input**: Design documents from `specs/002-profile-tab/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: автотестів спека не вимагає і в проєкті їх немає; перевірка — сценарії ui-check і ручні кроки з [quickstart.md](quickstart.md).

**Organization**: задачі згруповані за історіями зі spec.md (US1, US2, US3, US3a, US4, US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (інші файли, немає залежності від незавершених задач)
- **[Story]**: історія зі spec.md
- Шляхи — від кореня репозиторію

---

## Phase 1: Setup (дизайн і каркас)

**Purpose**: оновити канвас-еталон і створити порожній стек табу, щоб далі верстати по макету

- [X] T001 Оновити канвас https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj (читати й публікувати через Artifact, як у `docs/design.md`): у `project/canvas.json` нотатка `flowMore.text` → «Профіль», назви артбордів `More.dc.html` → «16 · Профіль», `MoreGoogle.dc.html` → «16a · Профіль — вхід через Google» (16b «Видалення акаунта» лишається); у `project/More.dc.html` заголовок `<h1>` «Профіль», підзаголовок «Імʼя, документи та акаунт», над карткою «Видалити акаунт» нова картка з рядком «Вийти» (іконка виходу в `.ic`, `row-title` «Вийти», `row-sub` «Дані на цьому пристрої буде стерто», без coral), `initialDialog` отримує варіант `signout` з діалогом «Вийти з акаунта?» / «Обʼєкти, показники й налаштування на цьому пристрої буде стерто. Наступний вхід почнеться з нуля.» / кнопки «Вийти» (coral) і «Скасувати», `screenHeight` і `h` артборда збільшити під новий рядок
- [X] T002 Додати в канвас артборд «16c · Вихід з акаунта» `project/MoreSignOut.dc.html` (як `MoreDelete.dc.html`, але `<dc-import name="More" initial-dialog="signout">`), запис у `boards` (x: 1446, y: 4668 — зсунути `EditName`, `Privacy`, `Terms` на +482 по x) і в `order` після `MoreDelete.dc.html`
- [X] T003 У таб-барі всіх артбордів канвасу (`project/*.dc.html` з `<nav class="tabbar">`) замінити останній таб: підпис «Профіль», іконка людини (`<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>`), `href="More.dc.html"` лишається; у `project/Privacy.dc.html` розділ 5 → «…в розділі «Профіль».», у `project/Terms.dc.html` розділ 5 → «…у розділі «Профіль».»; опублікувати канвас і перевірити, що в ньому не лишилось «Ще» (`grep` по завантажених файлах)
- [X] T004 Створити стек табу `src/app/(tabs)/profile/_layout.tsx` (`Stack` з `headerShown: false`, екрани `index`, `edit-name`, `privacy`, `terms`) і тимчасову `src/app/(tabs)/profile/index.tsx`; видалити `src/app/(tabs)/more.tsx`
- [X] T005 У `src/app/(tabs)/_layout.tsx` замінити `NativeTabs.Trigger name='more'` на `name='profile'`: підпис «Профіль», `sf='person.crop.circle'`, `md='person'`, колір `purpleInk` (змінна `moreColor` → `profileColor`); умова `isTabBarHidden` додає `segments[1] === 'profile'` до `(objects)`/`(outages)` з тим самим `segments.length > 2`

**Checkpoint**: канвас оновлений, таб «Профіль» відкривається, вкладені екрани без таб-бару

---

## Phase 2: Foundational (дані профілю)

**Purpose**: шар профілю і спосіб входу — без них не працює жодна історія

**⚠️ CRITICAL**: історії починаються лише після цієї фази

- [X] T006 [P] У `src/services/auth/types.ts` додати в `AuthUser` поле `method?: SignInMethod`; у `src/services/auth/local-auth-service.ts` `signIn(method)` записує `method` у `next`
- [X] T007 [P] Створити `src/services/profile/types.ts` з `UserProfile` (`userId: string`, `name: string | null`, `nameSource: 'provider' | 'user'`, `email: string | null`, `method: SignInMethod | null`) і `ProfileRepository` (`load`, `getSnapshot(): UserProfile | null`, `subscribe`, `syncFromAuth(user: AuthUser)`, `setName(name: string)`, `clear()`) точно за `specs/002-profile-tab/contracts/profile-repository.md`; константа `NAME_MAX_LENGTH = 40`
- [X] T008 Створити `src/services/profile/local-profile-repository.ts` — `createLocalProfileRepository(storage: KeyValueStorage)` з ключем `userProfile` (JSON), за зразком `src/services/outages/settings-repository.ts`: незмінний знімок + слухачі; `syncFromAuth`: якщо профілю немає або `userId !== user.id` — новий профіль з `name: user.name`, `nameSource: 'provider'`, `email`, `method: user.method ?? null`; якщо той самий — оновити `email`, `method`, а `name` лише при `nameSource = 'provider'`; без змін — не будити слухачів; `setName`: `trim`, відхилити порожнє й довше за 40 символів, `nameSource = 'user'`, знімок оновити до запису, при помилці запису повернути попередній і пробросити помилку; `clear`: знімок `null`, `removeItem('userProfile')`
- [X] T009 [P] Створити `src/services/profile/format.ts`: `getInitial(name)` — `Array.from(name.trim())[0]?.toLocaleUpperCase('uk') ?? '?'`; `getDisplayName(profile)` — `name ?? 'Без імені'`; `formatProfileEmail(email)` — `null` → «Email не вказано», домен `privaterelay.appleid.com` → «Прихована пошта Apple · <маска>», інакше маска «перша літера + `••••` + `@домен`»; `getProviderName(method)` — «Apple»/«Google»; `getProviderSubtitle(method)` — «Apple ID · вхід без пароля» / «Google-акаунт · вхід без пароля» / `null` для `null`
- [X] T010 Створити `src/services/profile/index.ts`: реекспорт типів і `format`, `export const profileRepository = createLocalProfileRepository(storage)` (місце майбутньої заміни на Firestore — коментар)
- [X] T011 Створити `src/providers/profile-provider.tsx` за зразком `src/providers/outage-provider.tsx`: `ProfileProvider` (завантажує репозиторій, до завантаження рендерить `null`; бере `useAuth().user` і в `useEffect` викликає `syncFromAuth(user)`, коли користувач увійшов), `useProfileRepository()`, `useProfile()` через `useSyncExternalStore`
- [X] T012 Підключити `ProfileProvider` у `src/app/_layout.tsx` всередині `AuthProvider`, поруч з `LedgerProvider`/`OutageProvider`

**Checkpoint**: після входу в сховищі є `userProfile` з імʼям, email і способом входу

---

## Phase 3: User Story 1 — Переглянути профіль (Priority: P1) 🎯 MVP

**Goal**: кореневий екран табу як на артбордах 16/16a

**Independent Test**: увійти через Apple або Google, відкрити таб «Профіль» і звірити з артбордом 16 (16a)

- [X] T013 [P] [US1] Створити `src/views/profile/avatar.tsx`: коло з ініціалом на фоні `purple` (hero), білий текст; розміри 56 (картка, шрифт 22/700) і 88 (екран імені, шрифт 36/700); `accessibilityElementsHidden`/`importantForAccessibility='no-hide-descendants'`
- [X] T014 [P] [US1] Створити `src/views/profile/profile-card.tsx`: картка радіус 22, padding 16, `Avatar` 56 + імʼя (`rowTitle`, 18) + email (`caption`, muted) + шеврон, одним `Pressable` з `testID='profile.card'`, `accessibilityRole='button'`, `accessibilityLabel` «Профіль: <імʼя>. Змінити імʼя»; імʼя й email в один рядок з трикрапкою (`numberOfLines={1}`)
- [X] T015 [P] [US1] Створити `src/views/profile/sign-in-method-row.tsx`: рядок 42-pt іконки провайдера (Apple — `AppImage`/SF `apple.logo` на `ink` з `surface`-кольором; Google — кольоровий логотип на `surface2`), «Спосіб входу» + `getProviderSubtitle`, `ThemedBadge` «Підключено» (ok); для `method: null` — без іконки й підпису; `testID='profile.signInMethod'`
- [X] T016 [US1] Створити `src/views/profile/index.ts` з реекспортами і додати `export * from './profile'` у `src/views/index.tsx`
- [X] T017 [US1] Зверстати `src/app/(tabs)/profile/index.tsx`: `NavigationView` з `title='Профіль'`, `subtitle='Імʼя, документи та акаунт'`, `barType='purple'`, згортання заголовка за `docs/patterns/navigation-bar-title.md`, `testID='profile.screen'`; у вмісті за артбордом 16: `ProfileCard`, `SectionHeader` «Акаунт» (`variant='overline'`) + `ListCard` з `ListRow` «Імʼя» / «Як до вас звертатися в застосунку» / значення імені (`testID='profile.name'`) і `SignInMethodRow`; «Сповіщення» (місце для перемикача з US4), «Документи» з рядками «Політика конфіденційності» / «Які дані ми зберігаємо і навіщо» (`profile.privacy`) і «Умови використання» / «Правила користування застосунком» (`profile.terms`), картки «Вийти» і «Видалити акаунт» (поки без дії — US3/US3a), підвал `ThemedText` footnote «Utility Ledger · версія {Constants.expoConfig?.version}» з `expo-constants` (`testID='profile.version'`); відступ знизу під таб-бар
- [X] T018 [US1] Звірити `/profile` зі скриншотами артбордів 16 і 16a у світлій і темній темі (`ui-check` `shot`), виправити відступи/кольори за `project/ui.css` — *світла й темна теми звірені*

**Checkpoint**: таб показує профіль з реальними даними; рядки «Імʼя», документи, «Вийти», «Видалити» ще не діють

---

## Phase 4: User Story 2 — Змінити імʼя (Priority: P1)

**Goal**: екран «Ваше імʼя» (артборд 17), імʼя переживає перезапуск

**Independent Test**: змінити імʼя, перезапустити застосунок, у профілі нове імʼя

- [X] T019 [US2] Зверстати `src/app/(tabs)/profile/edit-name.tsx` за артбордом 17 і `docs/patterns/keyboard.md`: білий екран, `NavigationView` з кнопкою «Назад» (`navigationBar.back`), заголовок «Ваше імʼя», підзаголовок «Як до вас звертатися в застосунку», `Avatar` 88 з ініціалом з поточного введення (`getInitial(value)`, `testID='editName.avatar'`), `ThemedTextInput` з підписом «Імʼя», плейсхолдером «Введіть імʼя», `maxLength={40}`, `autoComplete='given-name'`, `autoFocus`, `testID='editName.input'`; підказка-callout на `purpleSoft`/`purpleInk` з логотипом провайдера: «Отримано з Apple» (Google) + «Імʼя підставилось під час реєстрації. Зміна тут не впливає на ваш Apple ID.» («…на ваш Google-акаунт.»), для `method: null` не показується (`testID='editName.hint'`); `FormFooter` з `ActionButton` «Зберегти» (`testID='editName.save'`) і `useFormFooterKeyboardInsets()`
- [X] T020 [US2] Логіка збереження в `src/app/(tabs)/profile/edit-name.tsx`: початкове значення — `profile.name ?? ''`; «Зберегти» неактивна, якщо `value.trim()` порожнє або дорівнює поточному імені; натискання → `profileRepository.setName(value)` → `router.back()`; помилка → `Alert.alert('Не вдалося зберегти', 'Спробуйте ще раз.')`, екран і введення лишаються; «Назад» не зберігає
- [X] T021 [US2] У `src/app/(tabs)/profile/index.tsx` картка профілю і рядок «Імʼя» відкривають `router.push('/profile/edit-name')`

**Checkpoint**: US1 + US2 — MVP: профіль видно, імʼя змінюється і зберігається

---

## Phase 5: User Story 3 — Видалити акаунт (Priority: P2)

**Goal**: підтвердження 16b і повне стирання локальних даних

**Independent Test**: створити обʼєкт і показник, видалити акаунт → перший екран; після входу немає обʼєктів і зміненого імені

- [X] T022 [P] [US3] Додати `clear()` в інтерфейс `LedgerRepository` у `src/services/ledger/types.ts` і реалізацію в `src/services/ledger/local-ledger-repository.ts`: стан `emptyState`, сповістити слухачів, `storage.removeItem('ledgerState')`
- [X] T023 [P] [US3] Додати `clear()` в `OutageSettingsRepository` у `src/services/outages/settings-repository.ts`: налаштування `emptySettings`, сповістити слухачів, видалити `outageSettings` і `outageSchedule:<id>` для кожного постачальника з реєстру `src/services/outages/registry.ts` (передати список id у фабрику або імпортувати реєстр)
- [X] T024 [P] [US3] Додати `export async function cancelOutageNotifications()` у `src/services/outages/notifications.ts` (знімає всі заплановані з префіксом `ID_PREFIX`; `syncOutageNotifications` використовує її на початку) і реекспорт у `src/services/outages/index.ts`
- [X] T025 [P] [US3] Додати `resetOnboarding()` у `src/providers/onboarding-provider.tsx` (`storage.removeItem('hasSeenOnboarding')`, стан `false`) і в `OnboardingContextValue`
- [X] T026 [US3] Створити `src/services/account/wipe-local-data.ts` і `src/services/account/index.ts`: `PENDING_WIPE_KEY = 'pendingWipe'`; `wipeLocalData()` — 1) `storage.setItem('pendingWipe', 'true')`, 2) `authService.signOut()`, 3) `cancelOutageNotifications()` (помилку ігнорувати), 4) `ledgerRepository.clear()`, `outageSettingsRepository.clear()`, `profileRepository.clear()`, `storage.removeItem('hasSeenOnboarding')`, 5) `storage.removeItem('pendingWipe')`; `finishPendingWipe()` — якщо маркер є, виконати кроки 2–5; коментар про майбутнє серверне видалення у Firebase
- [X] T027 [US3] У `src/providers/auth-provider.tsx` перед підпискою на `onAuthStateChanged` викликати `finishPendingWipe()` і рендерити `null`, доки не завершиться (`OnboardingProvider` вкладений в `AuthProvider`, тож читає `hasSeenOnboarding` уже після довершення стирання); у звичайному сценарії React-стан онбордингу оновлює `resetOnboarding()` з контексту, який екран профілю викликає після `wipeLocalData()` (T029)
- [X] T028 [P] [US3] Створити `src/views/profile/confirm-destructive.ts`: `confirmDestructive({ title, message, confirmText, onConfirm })` — iOS: `ActionSheetIOS.showActionSheetWithOptions` з `options: [confirmText, 'Скасувати']`, `destructiveButtonIndex: 0`, `cancelButtonIndex: 1`, `title`, `message`; Android: `Alert.alert(title, message, [{ text: 'Скасувати', style: 'cancel' }, { text: confirmText, style: 'destructive', onPress }])`; реекспорт у `src/views/profile/index.ts`
- [X] T029 [US3] У `src/app/(tabs)/profile/index.tsx` рядок «Видалити акаунт» (`testID='profile.delete'`, coral-іконка кошика на `coralSoft`, `row-title` coral, підпис «Обʼєкти, показники та розрахунки буде стерто») викликає `confirmDestructive` з «Видалити акаунт?» / «Усі обʼєкти, послуги, показники й розрахунки буде видалено назавжди. Відновити їх не вийде. Вхід через {getProviderName(method)} буде відʼєднано.» (без методу — останнє речення пропустити) / «Видалити акаунт»; підтвердження → `wipeLocalData()` + `resetOnboarding()`; прапорець `isWiping` блокує повторний запуск
- [X] T030 [US3] Перевірити на симуляторі: діалог як на 16b, «Скасувати» нічого не змінює, після видалення — перший екран, після входу — онбординг і порожні «Обʼєкти»; перерване стирання (`xcrun simctl terminate` одразу після підтвердження) → після запуску перший екран без даних — *діалог 16b і «Скасувати», повне видалення та перерване стирання (маркер `pendingWipe` + перезапуск) перевірені*

**Checkpoint**: видалення акаунта працює повністю й атомарно

---

## Phase 6: User Story 3a — Вийти з акаунта (Priority: P2)

**Goal**: рядок «Вийти» і підтвердження 16c

**Independent Test**: створити обʼєкт, вийти, увійти — обʼєктів немає, імʼя від провайдера

- [X] T031 [US3a] У `src/app/(tabs)/profile/index.tsx` окрема картка над «Видалити акаунт» з `ListRow` «Вийти» / «Дані на цьому пристрої буде стерто» (`testID='profile.signOut'`, іконка виходу, без coral) → `confirmDestructive` з «Вийти з акаунта?» / «Обʼєкти, показники й налаштування на цьому пристрої буде стерто. Наступний вхід почнеться з нуля.» / «Вийти» → той самий шлях, що в T029
- [X] T032 [US3a] Перевірити на симуляторі вигляд 16c і сценарії 1–3 історії US3a зі spec.md

**Checkpoint**: «Вийти» й «Видалити акаунт» обидва працюють

---

## Phase 7: User Story 4 — Сповіщення про вимкнення світла (Priority: P2)

**Goal**: перемикач у профілі, спільний із налаштуваннями «Світла»

**Independent Test**: увімкнути в профілі → у налаштуваннях відключень увімкнено, і навпаки

- [X] T033 [US4] Додати хук `useOutageNotificationToggle()` у `src/providers/outage-provider.tsx`: `enabled = normalizeNotificationSettings(settings.notifications).enabled`; `setEnabled(next)` — при `next` спершу `ensureNotificationPermission()`, при відмові `Alert.alert('Сповіщення вимкнені', 'Дозвольте сповіщення для застосунку в Параметрах, щоб отримувати попередження про вимкнення.', [Скасувати, Параметри → Linking.openSettings()])` і вихід; інакше `repository.save({ ...settings, notifications: { ...normalized, enabled: next } })` і `syncOutageNotifications(saved, cached)` з `repository.loadCachedSchedule(provider.id)`, де `provider = getProviderForCity(settings.city)` (помилки планування ігнорувати)
- [X] T034 [US4] У `src/app/(tabs)/(outages)/outage-settings.tsx` замінити копію `Alert` у `toggleNotifications` на спільну функцію з T033 (винести показ алерту у `src/services/outages/notifications.ts` як `showNotificationPermissionAlert()`), поведінка екрана не змінюється
- [X] T035 [US4] У `src/app/(tabs)/profile/index.tsx` розділ «Сповіщення»: картка з іконкою дзвоника на `powerOnSoft`/`powerOnInk`, «Вимкнення світла» і підпис «Попереджати перед вимкненням за графіком» / «Сповіщення вимкнено», `Switch` з `trackColor={{ true: green }}`, `accessibilityLabel='Вимкнення світла'`, `testID='profile.notify'`, `onValueChange={setEnabled}` з T033
- [X] T036 [US4] Перевірити SC-004 на симуляторі: зміна в профілі видна в «Світло» → налаштування після відкриття, і навпаки; відмова в дозволі лишає перемикач вимкненим — *перевірено в обидва боки після дозволу на сповіщення*

**Checkpoint**: перемикач синхронний з налаштуваннями «Світла»

---

## Phase 8: User Story 5 — Прочитати документи (Priority: P3)

**Goal**: екрани 18 і 19

**Independent Test**: відкрити кожен документ, прокрутити, повернутися «Назад»

- [X] T037 [P] [US5] Створити `src/views/profile/legal-document.tsx`: картка-документ (padding 22/20, gap 12) з бейджем на `purpleSoft`/`purpleInk`, заголовками розділів і абзацами; дані — `{ badge: string; intro: string; sections: { title: string; body: string }[] }`
- [X] T038 [P] [US5] Створити `src/app/(tabs)/profile/privacy.tsx`: `NavigationView` `barType='purple'`, заголовок «Політика конфіденційності», «Назад», `testID='privacy.screen'`; текст з артборда 18 (бейдж «Оновлено: [ДАТА]», вступ і розділи 1–6, у 5-му «…в розділі «Профіль».»)
- [X] T039 [P] [US5] Створити `src/app/(tabs)/profile/terms.tsx`: те саме з заголовком «Умови використання», `testID='terms.screen'`, текст з артборда 19 (бейдж «Набирають чинності: [ДАТА]», розділи 1–6, у 5-му «…у розділі «Профіль».»)
- [X] T040 [US5] У `src/app/(tabs)/profile/index.tsx` рядки документів відкривають `router.push('/profile/privacy')` і `router.push('/profile/terms')`; перевірити таб-бар прихований на документах і видно після «Назад»

**Checkpoint**: усі історії функціональні

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T041 [P] Створити `docs/patterns/account-actions.md`: профіль через `ProfileRepository`/`useProfile` (заміна на Firebase в `src/services/profile/index.ts`), підтвердження деструктивних дій акаунта через `confirmDestructive` (iOS action sheet, Android alert), стирання лише через `wipeLocalData()` з маркером `pendingWipe`, новий репозиторій MUST мати `clear()` і бути доданим у `wipeLocalData`; додати рядок у `docs/patterns/README.md`
- [X] T042 [P] Оновити `docs/patterns/tab-bar.md` (таб-бар ховається і в стеку `profile`) і `docs/patterns/test-ids.md` (префікси `profile`, `editName`, `privacy`, `terms`)
- [X] T043 [P] Оновити `.claude/skills/ui-check/flows/smoke.flow`: `open /profile` і `check role=tab&label=Профіль value=1`, `wait id=profile.screen`
- [X] T044 [P] Створити `.claude/skills/ui-check/flows/profile.flow` за [quickstart.md](quickstart.md) розділ 2 (таб → `profile.card` → `editName.screen` → `keys` латиницею → `editName.save` → `see` → `profile.privacy` → `privacy.screen` → back → `profile.terms` → `terms.screen` → back) і прогнати його та `smoke.flow` — усі кроки `ok`
- [X] T045 Пройти ручні перевірки з [quickstart.md](quickstart.md) розділ 3, включно з edge cases спеки (довге імʼя з трикрапкою, імʼя з емодзі, подвійний тап «Зберегти»/«Видалити акаунт», темна тема) і `grep -rn "«Ще»\|label=Ще\|'Ще'" src .claude/skills/ui-check docs` (порожньо, SC-005) — *вихід, видалення, перерване стирання, Google/Apple, сповіщення, темна тема, довге імʼя з трикрапкою, `grep` SC-005 — пройдено; імʼя з емодзі й подвійний тап перевірені лише за кодом (`getInitial`, глобальний замок `Pressable`, `isWiping`)*
- [X] T046 У `specs/002-profile-tab/spec.md` поставити **Status**: Implemented і коротко українською підсумувати зміни
- [X] T047 Запустити `npx expo lint` і `npx tsc --noEmit` і виправити всі помилки

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001–T003 (канвас) незалежні від коду; T004 → T005
- **Foundational (Phase 2)**: після T004–T005; блокує всі історії
- **US1 (Phase 3)**: після Phase 2
- **US2, US3, US3a, US4, US5**: після US1 (усі додають елементи на `profile/index.tsx`); між собою незалежні, крім US3a → US3 (спільні `wipeLocalData` і `confirmDestructive`)
- **Polish (Phase 9)**: після потрібних історій; T047 — останньою

### User Story Dependencies

- **US1 (P1)**: лише Foundational
- **US2 (P1)**: US1 (картка й рядок «Імʼя» на корені)
- **US3 (P2)**: US1
- **US3a (P2)**: US3 (T026, T028)
- **US4 (P2)**: US1
- **US5 (P3)**: US1

### Within Each User Story

- Сервіси/провайдери → компоненти `src/views/profile` → екран `src/app/(tabs)/profile/*` → перевірка на симуляторі
- Задачі, що правлять `src/app/(tabs)/profile/index.tsx` (T017, T021, T029, T031, T035, T040), виконуються послідовно

### Parallel Opportunities

- T001–T003 (канвас) паралельно з T004–T012 (код)
- Phase 2: T006, T007, T009 паралельно; T008 після T007
- US1: T013, T014, T015 паралельно
- US3: T022, T023, T024, T025, T028 паралельно, потім T026 → T027 → T029
- US5: T037, T038, T039 паралельно
- Polish: T041–T044 паралельно

---

## Parallel Example: User Story 3

```bash
Task: "Додати clear() у LedgerRepository в src/services/ledger/local-ledger-repository.ts"
Task: "Додати clear() в OutageSettingsRepository в src/services/outages/settings-repository.ts"
Task: "Додати cancelOutageNotifications() у src/services/outages/notifications.ts"
Task: "Додати resetOnboarding() у src/providers/onboarding-provider.tsx"
Task: "Створити confirmDestructive у src/views/profile/confirm-destructive.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1: канвас і каркас табу
2. Phase 2: шар профілю
3. Phase 3–4: перегляд профілю і зміна імені
4. **STOP and VALIDATE**: звірка з 16/16a/17, імʼя переживає перезапуск
5. Коміт

### Incremental Delivery

1. Setup + Foundational → коміт
2. US1 + US2 → коміт (MVP)
3. US3 + US3a → коміт (стирання даних)
4. US4 → коміт
5. US5 → коміт
6. Polish (патерни, ui-check, lint/typecheck) → коміт разом з оновленими `docs/patterns/`

---

## Phase 10: Convergence

- [X] T048 Показати підтвердження «Видалити акаунт?» (і «Вийти з акаунта?») знизу екрана, як на артбордах 16b/16c: на iOS 27 `ActionSheetIOS` без якоря з'являється по центру — або власна шторка з карткою й окремою «Скасувати» у `src/views/profile/confirm-destructive.ts`, або узгодити з дизайном системний вигляд і оновити `docs/patterns/account-actions.md` per US3/AC1, SC-001 (partial) — *вирішено лишити системний діалог; зафіксовано в `docs/patterns/account-actions.md`*
- [ ] T049 [P] Шрифт імені в картці профілю `src/views/profile/profile-card.tsx` — 18 pt / 600, як `row-title` 18 на артборді 16 (зараз `headline` 17 / 700) per plan: T014 (partial)
- [ ] T050 [P] Додати `accessibilityRole='header'` підписам секцій «Акаунт», «Сповіщення», «Документи» на `src/app/(tabs)/profile/index.tsx` (через `SectionHeader` у `src/views/objects/section-header.tsx` для `variant='overline'`) per plan: contracts/ui.md (partial)
- [ ] T051 [P] Узгодити ліміт 40 символів імені: `maxLength` у `src/app/(tabs)/profile/edit-name.tsx` рахує UTF-16, а `setName` у `src/services/profile/local-profile-repository.ts` — кодові точки, тож імʼя з емодзі обрізається раніше; рахувати однаково (обрізати введення за `Array.from`) per FR-005 (partial)
