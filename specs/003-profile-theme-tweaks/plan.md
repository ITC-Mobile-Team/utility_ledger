# Implementation Plan: Профіль — тема застосунку та дрібні правки

**Branch**: `feature/outages-tab` (тека фічі `specs/003-profile-theme-tweaks`) | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-profile-theme-tweaks/spec.md`

## Summary

Спершу оновлюється канвас: артборди 16 і 16a (картка без стрілки, рядок «Імʼя» без підпису, розділ «Оформлення» з рядком «Тема», більший відступ перед «Вийти»), нові артборди 16d/16e «Тема» (світла й темна) і 16f «Профіль — Світло не налаштоване». Потім у коді: вибір теми (`light` / `dark` / `system`) зберігається в наявному `KeyValueStorage` під ключем `themePreference`, новий `AppearanceProvider` читає його до першого рендеру й передає в `Appearance.setColorScheme`, тож усі 7 місць із `useColorScheme()` і нативні елементи (таб-бар, `Alert`, `ActionSheetIOS`, `Switch`) ідуть за вибором без змін. Зміну теми згладжує короткий fade-оверлей у кореневому лейауті. Новий екран `profile/theme.tsx` з трьома картками-мініатюрами. Статус «Світла» обчислює спільна функція `getOutageSetupStatus()`, яку бере і вкладка «Світло», і профіль; кнопка «Налаштувати» відкриває `/outage-settings` через `router.navigate`, а `anchor: 'index'` у стеку «Світла» кладе головний екран під налаштування. `wipeLocalData()` стирає ще й `themePreference`. Деталі рішень — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.3, React Native 0.88, Expo SDK 58 (`expo@^58.0.14`)

**Primary Dependencies**: `Appearance` / `useColorScheme` з React Native; Expo Router 58 (`Stack`, `NativeTabs`, `router.navigate`, `unstable_settings.anchor`); `expo-system-ui` (фон кореневого вікна, уже є); `react-native-reanimated` 4.7 (fade-оверлей, анімація вибору карток); `@react-native-async-storage/async-storage` за `KeyValueStorage`. Нових залежностей немає.

**Storage**: `KeyValueStorage` (`src/storage`) — новий ключ `themePreference` (`'light' | 'dark' | 'system'`, відсутній = `system`); стирається в `wipeLocalData()` разом з іншими ключами.

**Testing**: автотестів у проєкті немає; перевірка — ui-check у iOS Simulator (оновлений `.claude/skills/ui-check/flows/profile.flow`, новий `theme.flow`), звірка скриншотів з артбордами у світлій і темній темі, `npx expo lint`, `npx tsc --noEmit`.

**Target Platform**: iOS 26+ та Android (Expo dev build); макети — iOS.

**Project Type**: mobile-app (Expo, Continuous Native Generation).

**Performance Goals**: тема застосовується менш ніж за 0,5 с після дотику (SC-001); холодний старт без спалаху іншої теми (SC-002) — тема ставиться до першого рендеру навігатора.

**Constraints**: без нових нативних модулів (доставка OTA); `app.json` лишає `userInterfaceStyle: "automatic"` (інакше `setColorScheme` не зможе повернутися до системи); українські тексти; повторні тапи — глобальний замок `Pressable`, але картки теми з `guarded={false}` (локальний вибір, `buttons.md`).

**Scale/Scope**: 1 новий екран, 1 провайдер, 1 сервіс (тема), 1 функція статусу; правки в `profile/index.tsx`, `ProfileCard`, кореневому `_layout.tsx`, `(outages)/_layout.tsx`, `(outages)/index.tsx`, `wipe-local-data.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Як дотримано | Статус |
|---|---|---|
| I. Expo за документацією версії | `Appearance.setColorScheme('light' \| 'dark' \| 'auto')` звірено з reactnative.dev/docs/appearance (0.88; `'unspecified'` застарів, `null` не приймається) і docs.expo.dev/develop/user-interface/color-themes; `anchor` у `unstable_settings` звірити з `docs.expo.dev/versions/v58.0.0/` (router settings) перед задачею навігації | ✅ |
| II. Expo Router і `src/` | Новий маршрут лише `src/app/(tabs)/profile/theme.tsx`; сервіс у `src/services/appearance`, провайдер у `src/providers`, компоненти в `src/views/profile` | ✅ |
| III. CNG | `ios/`/`android/` не чіпаємо; `app.json` без змін; нативних модулів немає → **development build не потрібна, доставка OTA** | ✅ |
| IV. Дизайн і патерни | Артборди 16, 16a оновлюються, 16d/16e/16f додаються першою задачею; застосовні патерни — `account-actions.md` (стирання), `pickers.md` (відхід: лишаємось на екрані), `buttons.md`, `tab-bar.md`, `test-ids.md`, `reanimated.md`, `navigation-bar-title.md`; новий патерн `appearance.md` і правки `pickers.md`, `account-actions.md`, `test-ids.md`, `README.md` — окремою задачею | ✅ |
| V. Українська | Тексти UI з артбордів; артефакти українською | ✅ |
| VI. Lint і typecheck | Остання задача `tasks.md` — `npx expo lint` і `npx tsc --noEmit` | ✅ |

Порушень немає — Complexity Tracking не заповнюється.

**Повторна перевірка після Phase 1**: [data-model.md](data-model.md) і [contracts/](contracts/) не додають залежностей, не виходять за `src/` і не потребують нативних змін — ✅.

## Дизайн: артборди

Канвас: https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj (читання й правки — `docs/design.md`). Нові артборди стають у ряд «Профіль» (`y: 4668`) після `Terms.dc.html` (`x: 3374`, `3856`, `4338`); `maxW` нотатки `flowMore` збільшується.

| Артборд | Файл | Зміна в канвасі | Екран |
|---|---|---|---|
| 16 · Профіль | `More.dc.html` | картка без стрілки; рядок «Імʼя» без підпису; розділ «Оформлення» з рядком «Тема · Як у системі» між «Сповіщеннями» і «Документами»; відступ перед «Вийти» вдвічі більший; `h` під новий розділ | `profile/index.tsx` |
| 16a · Профіль — вхід через Google | `MoreGoogle.dc.html` | ті самі зміни | `profile/index.tsx` (method = google) |
| 16b, 16c | `MoreDelete.dc.html`, `MoreSignOut.dc.html` | лише фон профілю під діалогом за 16 | діалоги на `profile/index.tsx` |
| 16d · Тема | новий `Theme.dc.html` | екран «Тема»: «Назад», заголовок, три картки-мініатюри, вибрано «Як у системі» | `profile/theme.tsx` |
| 16e · Тема — темна | новий `ThemeDark.dc.html` | той самий екран у темній палітрі `ui.css`, вибрано «Темна» | `profile/theme.tsx` |
| 16f · Профіль — Світло не налаштоване | новий `MoreOutageSetup.dc.html` | «Сповіщення» зі статусом «Місто й черги не налаштовані» і кнопкою «Налаштувати» | `profile/index.tsx` |

## Застосовні патерни

- `docs/patterns/account-actions.md` — стирання лише через `wipeLocalData()`; додати `themePreference` у список стертих ключів і `resetAppearance()` поруч із `resetOnboarding()`.
- `docs/patterns/pickers.md` — додати розділ «Налаштування з миттєвим застосуванням»: екран «Тема» лишається відкритим після вибору.
- `docs/patterns/buttons.md` — картки теми з `guarded={false}`; кнопка «Налаштувати» — звичайний `Pressable` (з замком).
- `docs/patterns/tab-bar.md` — екран «Тема» вкладений, таб-бару немає; перехід у налаштування «Світла» з іншого табу.
- `docs/patterns/reanimated.md` — оверлей і картки анімуються через `get()`/`set()` чи CSS-переходи Reanimated.
- `docs/patterns/test-ids.md` — нові `profile.theme`, `theme.screen`, `theme.option.<light|dark|system>`, `profile.outageStatus`, `profile.outageSetup`; прибрати `profile.card` з інтерактивних.
- Новий `docs/patterns/appearance.md` — як читати тему (`useColorScheme`/`useThemeColor`, ніколи не кешувати), де зберігається вибір, чому `'auto'`, як додати новий колір.

## Project Structure

### Documentation (this feature)

```text
specs/003-profile-theme-tweaks/
├── plan.md              # цей файл
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── appearance.md    # ThemePreference, AppearanceProvider, сховище
│   ├── outage-setup.md  # getOutageSetupStatus і тексти статусу
│   └── ui.md            # профіль, екран «Тема», навігація, testID
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── _layout.tsx                      # AppearanceProvider зовні, ThemeProvider усередині; fade-оверлей
│   └── (tabs)/
│       ├── (outages)/
│       │   ├── _layout.tsx              # unstable_settings = { anchor: 'index' }
│       │   └── index.tsx                # isConfigured через getOutageSetupStatus
│       └── profile/
│           ├── _layout.tsx              # + Stack.Screen 'theme'
│           ├── index.tsx                # картка без onPress, «Імʼя» без підпису, «Оформлення», статус «Світла», відступ
│           └── theme.tsx                # НОВИЙ екран «Тема»
├── providers/
│   └── appearance-provider.tsx          # НОВИЙ: читання/запис вибору, Appearance.setColorScheme
├── services/
│   ├── appearance/                      # НОВИЙ: types.ts, preference.ts (parse, ключ, підписи), index.ts
│   ├── account/wipe-local-data.ts       # + storage.removeItem(THEME_KEY)
│   └── outages/setup-status.ts          # НОВИЙ: getOutageSetupStatus + тексти
└── views/profile/
    ├── profile-card.tsx                 # без Pressable, onPress і стрілки
    ├── theme-option-card.tsx            # НОВИЙ: картка з мініатюрою
    ├── theme-preview.tsx                # НОВИЙ: мініатюра застосунку в палітрі
    └── outage-setup-notice.tsx          # НОВИЙ: статус і кнопка «Налаштувати»

.claude/skills/ui-check/flows/
├── profile.flow                         # оновити: без тапу по картці, рядок «Тема», статус
└── theme.flow                           # НОВИЙ

docs/patterns/                           # appearance.md (новий), pickers.md, account-actions.md, test-ids.md, README.md
```

**Structure Decision**: одна мобільна апка з наявною розкладкою `src/app` (маршрути) / `src/providers` / `src/services` / `src/views`; нове лягає в ті самі теки поруч із профілем і «Світлом».

## Complexity Tracking

Порушень конституції немає.
