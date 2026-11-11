# Implementation Plan: Іконка застосунку, splash з анімацією та пульсація порожніх станів

**Branch**: `feature/splash-and-animation` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-icon-splash-pulse/spec.md`

## Summary

Фірмова іконка з канвасу на iOS (бандл Icon Composer `assets/app.icon` з векторними шарами — темний і тонований варіанти дає система) і Android (адаптивна іконка: тло з градієнтом і тінню, передній план і монохром із будинком у безпечній зоні). PNG генеруються з вихідних SVG, що лежать у репозиторії. Системний splash — `#14213A` зі знаком будинку, підібраним так, щоб на iOS і в колі Android 12+ знак мав 132 pt. Поверх навігатора — JS-накладка `AppSplash`: перший кадр збігається з системним splash, далі проявляються градієнт, «сонце» з `radial-gradient` і тінь, що хитається від спільної shared value (цикл 7 с), нативний `ActivityIndicator`, «Комуналка під контролем». Накладка згасає за 300 мс, коли минуло ≥ 1 с і дані акаунта готові (або користувач не увійшов, або минуло 3 с); показується лише раз за процес. Пульсація порожніх станів — спільні `PulseRings` + `PulseCore` (Reanimated, лише transform/opacity), вимикаються поза фокусом і при «Зменшити рух»; підключаються в `EmptyStateView`, `OutageMessage` (новий проп `pulse`) і `AccountDataOffline`. Деталі — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19 з React Compiler, React Native 0.88

**Primary Dependencies**: Expo SDK 58 (`expo-router`, `expo-splash-screen` 58, `expo-linear-gradient`, `expo-status-bar`), `react-native-reanimated` 4.7. Нових залежностей немає.

**Storage**: N/A — фіча нічого не зберігає (стан splash — модульний прапорець у памʼяті)

**Testing**: ручна перевірка за [quickstart.md](quickstart.md) на release-збірках iOS/Android; `ui-check` у симуляторі iOS для порожніх станів і зникнення splash; `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS 26 (Icon Composer, Xcode 26) і Android 8+ (адаптивні іконки), Android 12+ SplashScreen API, Android 13+ тематичні іконки

**Project Type**: mobile-app (Expo, CNG; `ios/` і `android/` під git, регенеруються `expo prebuild`)

**Performance Goals**: анімації 60 к/с на UI-потоці; splash ≥ 1 с і ≤ ~3,5 с через дані акаунта; згасання 300 мс

**Constraints**: системний splash і перший кадр накладки — піксель у піксель (без стрибка); лише `.png` для splash; «Зменшити рух» зупиняє анімації; без нових нативних модулів

**Scale/Scope**: 7 артбордів з пульсацією (9 місць на екрані), 1 артборд splash, 1 артборд іконки; ~10 файлів коду, 7 PNG/SVG-ресурсів

## Дизайн і патерни

- **Артборди**: «Іконка застосунку · 1024×1024» (`AppIcon.dc.html`), «00 · Splash» (`Splash.dc.html`), порожні стани 05a `PropertiesEmpty`, 08e `PropertyEmpty`, 12e `PropertyMetersEmpty`, 09e `PropertyMonthEmpty`, 20 `OutageEmpty`/`Outage` (`empty`), 20c `OutageCityMissing`, 05o `PropertiesOffline`; токени й анімації — `ui.css` («Pulse — empty / waiting states»).
- **Патерни, що застосовуються**: `reanimated.md` (лише `get()/set()`), `preferences.md` (налаштування читаються до першого кадру під splash — змінюється, хто ховає системний splash), `user-data.md` (статуси `loading`/`offline`/`ready`, скелетони після splash), `test-ids.md` (`splash`, `splash.progress`, `…emptyState.pulse`), `icons.md` (emoji в ілюстраціях не змінюються).
- **Нові/змінені патерни** (окремі задачі в `tasks.md`): новий `docs/patterns/splash.md` (два етапи splash, умови зникнення, лише холодний запуск, як змінити іконку/знак — із SVG-джерел); новий `docs/patterns/empty-state-pulse.md` (`PulseRings`/`PulseCore`, кольори за станом, фокус і «Зменшити рух»); оновити `preferences.md` (системний splash ховає `AppSplash`) і індекс `docs/patterns/README.md`.

## Development build / OTA

Потрібна нова нативна збірка: іконки (iOS `.icon`, Android adaptive) і системний splash — нативні ресурси, після змін `app.json` і assets — `npx expo prebuild --clean` (регенерує `ios/` і `android/`, вручну не редагуються) і `npx expo run:ios|android` / `eas build`. Анімований splash і пульсація — JS, доставляються OTA. Splash перевіряти на release/preview-збірці (документація Expo).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Як дотримано |
|---|---|---|
| I. Expo за документацією своєї версії | ✅ | Конфіг splash і `ios.icon`/`adaptiveIcon` звірено з документацією SDK 58 (research, джерела); `preventAutoHideAsync` у глобальній області, `hide()` після готовності — як радить документація. Нових залежностей немає; растеризація — разовий скрипт Swift без пакетів. |
| II. Expo Router і структура `src/` | ✅ | Нові файли поза `src/app/`: `src/components/pulse.tsx`, `src/views/splash/*`; у `src/app/` лише підключення в `_layout.tsx` і проп у `(tabs)/(outages)/index.tsx`. |
| III. Нативне через CNG | ✅ | Лише `app.json` і assets; `ios/`/`android/` регенеруються `expo prebuild`; потреба в новій збірці зазначена вище. |
| IV. Дизайн і патерни | ✅ | Артборди перелічено; відхилення (знак splash по центру замість −40 px, тінь через `radial-gradient` замість `mask`+`blur`) обґрунтовані в research R5; нові патерни `splash.md`, `empty-state-pulse.md` + оновлення `preferences.md` і `README.md` — окремі задачі. |
| V. Українська мова | ✅ | Тексти UI з канвасу («Utility Ledger», «Комуналка під контролем», «Utility Ledger, завантаження»); артефакти українською. |
| VI. Lint і typecheck | ✅ | Остання задача `tasks.md` — `npx expo lint` і `npx tsc --noEmit`. |

**Повторна перевірка після Phase 1**: дизайн (data-model, contracts) не вводить нових залежностей, файлів у `src/app/` крім підключення, чи ручних змін нативних каталогів — усі пункти ✅.

## Project Structure

### Documentation (this feature)

```text
specs/008-icon-splash-pulse/
├── spec.md
├── plan.md              # цей файл
├── research.md          # R1–R8
├── data-model.md        # ресурси, стан splash, параметри анімацій
├── quickstart.md        # сценарії перевірки
├── contracts/
│   └── ui-components.md # PulseRings/PulseCore, AppSplash, зміни компонентів
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app.json                                   # ios.icon → ./assets/app.icon; adaptiveIcon (backgroundColor #14213A); expo-splash-screen (#14213A, imageWidth 288, dark)
assets/
├── app.icon/                              # НОВИЙ бандл Icon Composer (icon.json, Assets/house.svg, Assets/shadow.svg)
├── expo.icon/                             # ВИДАЛИТИ
└── images/app/
    ├── source/                            # НОВІ вихідні SVG + README.md (як перегенерувати)
    ├── icon.png                           # ЗАМІНИТИ
    ├── android-icon-background.png        # ЗАМІНИТИ
    ├── android-icon-foreground.png        # ЗАМІНИТИ
    ├── android-icon-monochrome.png        # ЗАМІНИТИ
    └── splash-icon.png                    # ЗАМІНИТИ
scripts/render-icons.swift                 # НОВИЙ: SVG → PNG точних розмірів
src/
├── app/
│   ├── _layout.tsx                        # + <AppSplash /> поруч із RootNavigator
│   └── (tabs)/(outages)/index.tsx         # pulse для «Оберіть свою чергу» і «Постачальник … не доданий»
├── components/
│   ├── pulse.tsx                          # НОВИЙ: PulseRings, PulseCore, usePulseActive
│   └── index.ts                           # + експорт
├── providers/preferences-provider.tsx     # прибрати SplashScreen.hideAsync (глобальний preventAutoHideAsync лишається)
└── views/
    ├── splash/                            # НОВІ: app-splash.tsx, use-splash-gate.ts, index.ts
    ├── index.tsx                          # + експорт splash
    ├── objects/empty-state-view.tsx       # PulseRings blueSoft2 + PulseCore
    ├── outages/outage-message.tsx         # проп pulse
    └── account-data/account-data-offline.tsx # PulseRings line + PulseCore
docs/patterns/
├── splash.md                              # НОВИЙ
├── empty-state-pulse.md                   # НОВИЙ
├── preferences.md                         # оновити: хто ховає системний splash
└── README.md                              # + 2 рядки індексу
ios/, android/                             # регенеруються expo prebuild --clean
```

**Structure Decision**: один Expo-застосунок; спільні примітиви анімації — у `src/components`, екранна логіка splash — у `src/views/splash`, маршрути лише підключають.

## Complexity Tracking

Порушень конституції немає.
