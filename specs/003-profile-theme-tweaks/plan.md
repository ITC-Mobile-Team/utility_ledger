# Implementation Plan: Профіль — стартова вкладка, тема застосунку та дрібні правки

**Branch**: `feature/outages-tab` (тека фічі `specs/003-profile-theme-tweaks`) | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-profile-theme-tweaks/spec.md`

## Summary

Спершу оновлюється канвас: артборди 16 і 16a (картка без стрілки, рядок «Імʼя» без підпису, розділ «Застосунок» з рядками «Стартова вкладка» і «Тема», статус «Світла», більший відступ перед «Вийти»), нові артборди 16d/16e «Тема» (світла й темна), 16f «Профіль — Світло не налаштоване» і 16g «Профіль — меню стартової вкладки».

У коді два налаштування пристрою — тема (`light` / `dark` / `system`) і стартова вкладка (`objects` / `outages` / `analytics`) — живуть у наявному `KeyValueStorage` під ключами `themePreference` і `startTab`. Новий `PreferencesProvider` читає обидва до першого рендеру. Тему він передає в `Appearance.setColorScheme`, тож усі 7 місць із `useColorScheme()` і нативні елементи (`NativeTabs`, `Alert`, `ActionSheetIOS`, `Switch`) ідуть за вибором без змін; зміну згладжує короткий fade-оверлей. Стартову вкладку таб-бар бере як `initialRouteName` при монтуванні; якщо Expo Router перекриє її початковим URL, запасний шлях — одноразовий `router.replace` під утриманим splash.

Новий екран `profile/theme.tsx` з трьома картками-мініатюрами. Рядок «Стартова вкладка» відкриває нативне меню з `@expo/ui` (SwiftUI `Menu` з `Picker` на iOS, Compose `DropdownMenu` на Android). Статус «Світла» обчислює спільна функція `getOutageSetupStatus()`; «Налаштувати» відкриває `/outage-settings` через `router.navigate`, а `anchor: 'index'` кладе головний екран «Світла» під налаштування. `wipeLocalData()` стирає обидва ключі. Деталі рішень — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.3, React Native 0.88, Expo SDK 58 (`expo@^58.0.14`)

**Primary Dependencies**: `Appearance` / `useColorScheme` з React Native; Expo Router 58 (`Stack`, `NativeTabs` з `initialRouteName`, `router.navigate`, `unstable_settings.anchor`); `@expo/ui` ~58.0.20 (уже в `package.json` і в dev build з першого коміту; `swift-ui`: `Host`, `Menu`, `Picker`, `RNHostView`; `jetpack-compose`: `DropdownMenu`); `expo-splash-screen` (лише для запасного шляху R10); `expo-system-ui`; `react-native-reanimated` 4.7; `@react-native-async-storage/async-storage` за `KeyValueStorage`. Нових залежностей немає.

**Storage**: `KeyValueStorage` (`src/storage`) — нові ключі `themePreference` (`'light' | 'dark' | 'system'`, відсутній = `system`) і `startTab` (`'objects' | 'outages' | 'analytics'`, відсутній = `objects`); обидва стираються в `wipeLocalData()`.

**Testing**: автотестів у проєкті немає; перевірка — ui-check у iOS Simulator (оновлений `.claude/skills/ui-check/flows/profile.flow`, нові `theme.flow` і `start-tab.flow`), звірка скриншотів з артбордами у світлій і темній темі, холодний перезапуск симулятора для стартової вкладки, `npx expo lint`, `npx tsc --noEmit`.

**Target Platform**: iOS 26+ та Android (Expo dev build); макети — iOS.

**Project Type**: mobile-app (Expo, Continuous Native Generation).

**Performance Goals**: тема застосовується менш ніж за 0,5 с після дотику (SC-001); холодний старт без спалаху іншої теми чи іншої вкладки (SC-002, SC-007) — обидва налаштування читаються до першого рендеру навігатора.

**Constraints**: без нових нативних модулів (доставка OTA; `@expo/ui` уже в збірці); `app.json` лишає `userInterfaceStyle: "automatic"`; українські тексти; повторні тапи — глобальний замок `Pressable`, картки теми з `guarded={false}` (`buttons.md`).

**Scale/Scope**: 1 новий екран, 1 провайдер, 1 сервіс налаштувань, 1 функція статусу, 1 рядок-меню з двома платформними реалізаціями; правки в `profile/index.tsx`, `ProfileCard`, кореневому `_layout.tsx`, `(tabs)/_layout.tsx`, `(outages)/_layout.tsx`, `(outages)/index.tsx`, `wipe-local-data.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Як дотримано | Статус |
|---|---|---|
| I. Expo за документацією версії | `Appearance.setColorScheme('light' \| 'dark' \| 'auto')` звірено з reactnative.dev/docs/appearance (0.88) і docs.expo.dev/develop/user-interface/color-themes; типи `@expo/ui` Menu/Picker/DropdownMenu і `initialRouteName` звірено з `node_modules` 58; перед задачами меню, `anchor` і стартової вкладки — звірка з `docs.expo.dev/versions/v58.0.0/` (sdk/ui, router) | ✅ |
| II. Expo Router і `src/` | Новий маршрут лише `src/app/(tabs)/profile/theme.tsx`; сервіс у `src/services/preferences`, провайдер у `src/providers`, компоненти в `src/views/profile` | ✅ |
| III. CNG | `ios/`/`android/` і `app.json` не чіпаємо; `@expo/ui` уже в dev build → **нова development build не потрібна, доставка OTA** | ✅ |
| IV. Дизайн і патерни | Артборди 16, 16a оновлюються, 16d/16e/16f/16g додаються першою задачею; застосовні патерни — `account-actions.md`, `pickers.md`, `buttons.md`, `tab-bar.md`, `test-ids.md`, `reanimated.md`, `navigation-bar-title.md`; новий патерн `preferences.md` і правки `pickers.md`, `account-actions.md`, `tab-bar.md`, `test-ids.md`, `README.md` — окремою задачею | ✅ |
| V. Українська | Тексти UI з артбордів; артефакти українською | ✅ |
| VI. Lint і typecheck | Остання задача `tasks.md` — `npx expo lint` і `npx tsc --noEmit` | ✅ |

Порушень немає — Complexity Tracking не заповнюється.

**Повторна перевірка після Phase 1**: [data-model.md](data-model.md) і [contracts/](contracts/) не додають залежностей, не виходять за `src/` і не потребують нативних змін — ✅.

## Дизайн: артборди

Канвас: https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj (читання й правки — `docs/design.md`). Нові артборди стають у ряд «Профіль» (`y: 4668`) після `Terms.dc.html` (`x: 3374`, `3856`, `4338`, `4820`); `maxW` нотатки `flowMore` збільшується.

| Артборд | Файл | Зміна в канвасі | Екран |
|---|---|---|---|
| 16 · Профіль | `More.dc.html` | картка без стрілки; рядок «Імʼя» без підпису; розділ «Застосунок» («Стартова вкладка · Обʼєкти», «Тема · Як у системі») між «Сповіщеннями» і «Документами»; відступ перед «Вийти» вдвічі більший; `h` під новий розділ | `profile/index.tsx` |
| 16a · Профіль — вхід через Google | `MoreGoogle.dc.html` | ті самі зміни | `profile/index.tsx` (method = google) |
| 16b, 16c | `MoreDelete.dc.html`, `MoreSignOut.dc.html` | лише фон профілю під діалогом за 16 | діалоги на `profile/index.tsx` |
| 16d · Тема | новий `Theme.dc.html` | екран «Тема»: «Назад», заголовок, три картки-мініатюри, вибрано «Як у системі» | `profile/theme.tsx` |
| 16e · Тема — темна | новий `ThemeDark.dc.html` | той самий екран у темній палітрі `ui.css`, вибрано «Темна» | `profile/theme.tsx` |
| 16f · Профіль — Світло не налаштоване | новий `MoreOutageSetup.dc.html` | «Сповіщення» зі статусом «Місто й черги не налаштовані» і кнопкою «Налаштувати» | `profile/index.tsx` |
| 16g · Профіль — стартова вкладка | новий `MoreStartTab.dc.html` | системне меню iOS від рядка «Стартова вкладка»: «Обʼєкти» ✓, «Світло», «Аналітика» з іконками табів | `profile/index.tsx` |

## Застосовні патерни

- `docs/patterns/account-actions.md` — стирання лише через `wipeLocalData()`; додати `themePreference` і `startTab` у список стертих ключів і `resetPreferences()` поруч із `resetOnboarding()`.
- `docs/patterns/pickers.md` — розділ «Налаштування з миттєвим застосуванням»: екран «Тема» лишається відкритим після вибору; короткий вибір із 2–5 значень без опису — нативне меню від рядка (стартова вкладка).
- `docs/patterns/buttons.md` — картки теми з `guarded={false}`; кнопка «Налаштувати» — звичайний `Pressable` (з замком).
- `docs/patterns/tab-bar.md` — екран «Тема» вкладений, таб-бару немає; стартова вкладка при холодному запуску; перехід у налаштування «Світла» з іншого табу.
- `docs/patterns/reanimated.md` — оверлей і картки анімуються через `get()`/`set()` чи CSS-переходи Reanimated.
- `docs/patterns/test-ids.md` — нові `profile.startTab`, `profile.theme`, `theme.screen`, `theme.option.<system|light|dark>`, `profile.outageStatus`, `profile.outageSetup`; `profile.card` більше не інтерактивний.
- Новий `docs/patterns/preferences.md` — налаштування пристрою: де зберігаються, як читаються до першого рендеру, як стираються; як читати тему (`useColorScheme`/`useThemeColor`, ніколи не кешувати), чому `'auto'`; як додати нове налаштування.

## Project Structure

### Documentation (this feature)

```text
specs/003-profile-theme-tweaks/
├── plan.md              # цей файл
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── preferences.md   # ThemePreference, StartTab, PreferencesProvider, сховище, стартова вкладка
│   ├── outage-setup.md  # getOutageSetupStatus і тексти статусу
│   └── ui.md            # профіль, меню стартової вкладки, екран «Тема», навігація, testID
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── _layout.tsx                      # PreferencesProvider зовні, ThemeProvider усередині; fade-оверлей
│   └── (tabs)/
│       ├── _layout.tsx                  # NativeTabs initialRouteName={startTab}
│       ├── (outages)/
│       │   ├── _layout.tsx              # unstable_settings = { anchor: 'index' }
│       │   └── index.tsx                # isConfigured через getOutageSetupStatus
│       └── profile/
│           ├── _layout.tsx              # + Stack.Screen 'theme'
│           ├── index.tsx                # картка без onPress, «Імʼя» без підпису, «Застосунок», статус «Світла», відступ
│           └── theme.tsx                # НОВИЙ екран «Тема»
├── providers/
│   └── preferences-provider.tsx         # НОВИЙ: читання/запис теми й стартової вкладки, Appearance.setColorScheme
├── services/
│   ├── preferences/                     # НОВИЙ: types.ts, theme.ts, start-tab.ts (ключі, parse, підписи), index.ts
│   ├── account/wipe-local-data.ts       # + removeItem(THEME_KEY), removeItem(START_TAB_KEY)
│   └── outages/setup-status.ts          # НОВИЙ: getOutageSetupStatus + тексти
└── views/profile/
    ├── profile-card.tsx                 # без Pressable, onPress і стрілки
    ├── start-tab-row.ios.tsx            # НОВИЙ: ListRow у SwiftUI Menu + Picker
    ├── start-tab-row.android.tsx        # НОВИЙ: ListRow як тригер Compose DropdownMenu
    ├── start-tab-row.tsx                # НОВИЙ: спільні пропси й тип
    ├── theme-option-card.tsx            # НОВИЙ: картка з мініатюрою
    ├── theme-preview.tsx                # НОВИЙ: мініатюра застосунку в палітрі
    └── outage-setup-notice.tsx          # НОВИЙ: статус і кнопка «Налаштувати»

.claude/skills/ui-check/flows/
├── profile.flow                         # оновити: без тапу по картці, «Застосунок», статус
├── theme.flow                           # НОВИЙ
└── start-tab.flow                       # НОВИЙ

docs/patterns/                           # preferences.md (новий), pickers.md, account-actions.md, tab-bar.md, test-ids.md, README.md
```

**Structure Decision**: одна мобільна апка з наявною розкладкою `src/app` (маршрути) / `src/providers` / `src/services` / `src/views`; нове лягає в ті самі теки поруч із профілем і «Світлом». Тема й стартова вкладка — один сервіс і один провайдер, бо обидві читаються до першого рендеру й стираються разом.

## Complexity Tracking

Порушень конституції немає.
