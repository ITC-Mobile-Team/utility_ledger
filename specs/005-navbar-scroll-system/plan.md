# Implementation Plan: Єдиний навбар — поведінка, скрол, заокруглення й відступи

**Branch**: `feature/outages-tab` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-navbar-scroll-system/spec.md`

## Summary

Навбар переходить з «блоку в розкладці, що міняє висоту» на **накладку над скролом**, яка згортається лише трансформаціями за одним прогресом `p = scrollY / D`. Контент рухається 1:1 з пальцем, на кадр скролу немає перерахунку розкладки, а заголовок, великі кнопки, градієнт і кути шторки завершують згортання одночасно. Короткі кнопки-«пігулки» прибираються повністю: великі кнопки ховаються разом із великим заголовком. Доводка до ближчого стану (межа `D/2`) відбувається після зупинки, один раз, і скасовується новим дотиком. Радіус шторки (28) і відступи (поле 20, до першого блоку 24) задає `NavigationView`, а не екрани. Деталі й відкинуті варіанти — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.x, React 19 з React Compiler

**Primary Dependencies**: Expo SDK 58, React Native 0.88 (Fabric), Expo Router, `react-native-reanimated` 4.7.1, `react-native-worklets` 0.13.0, `react-native-keyboard-controller` 1.22.7, `react-native-safe-area-context`

**Storage**: N/A

**Testing**: `ui-check` (iOS Simulator, сценарії `.flow`), ручна перевірка на Android, `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS і Android

**Project Type**: mobile-app

**Performance Goals**: 60 fps (120 на ProMotion) під час різких свайпів; без перерахунку розкладки на кадр скролу

**Constraints**: React Compiler — у воркетах лише `get()`/`set()`; `scrollEnabled` не перемикається посеред жесту; без нових нативних модулів (OTA)

**Scale/Scope**: 1 спільний компонент (`NavigationView` + `navigation-bar/`), ~20 екранів-споживачів у `src/app/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Як дотримано |
|---|---|---|
| I. Expo за документацією версії | ✅ | SDK 58 / RN 0.88. Поведінку `snapToOffsets` звірено з вихідним кодом RN 0.88 (`RCTEnhancedScrollView.mm`), API `KeyboardAwareScrollView` — з вихідним кодом 1.22.7. Нових залежностей немає |
| II. Expo Router і структура `src/` | ✅ | Логіка лише в `src/components/`; у `src/app/` міняються тільки пропси екранів |
| III. Нативне через CNG | ✅ | `ios/`/`android/` не чіпаються; development build не потрібна, доставка OTA (R11) |
| IV. Дизайн і патерни | ✅ | Артборди нижче; `docs/patterns/navigation-bar-buttons.md` і `navigation-bar-title.md` переписуються, `README.md` оновлюється (окрема задача) |
| V. Українська мова | ✅ | Артефакти українською; тексти інтерфейсу не змінюються |
| VI. Lint і typecheck | ✅ | Фінальна задача `tasks.md` — обидві команди |

Повторна перевірка після Phase 1: порушень немає, Complexity Tracking не потрібен.

## Дизайн

Канвас: `docs/design.md` → https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj

- Розгорнутий стан: 05 «Обʼєкти», 08 «Місяці обʼєкта», 09 «Послуги місяця», 12 «Послуги обʼєкта», 20 «Відсутність світла», 16 «Профіль».
- Згорнутий стан (тут зараз намальовані «пігулки» — оновити, щоб лишились тільки рядок «назад» і короткий заголовок): 05b `PropertiesScrolled`, 08b `PropertyScrolled`, 08c `PropertyScrolledActions`, 09b `PropertyMonthScrolled`, 12b `PropertyMetersScrolled`, 20s `OutageScrolled`. Згорнутий стан рендерять спільні компоненти `Properties`, `Property` та інші з `start-collapsed`.
- Токени: `ui.css` `.sheet` — радіус `--r-xl` (28), `margin-top: -28px`, `padding: 24px 20px 0`.

## Застосовні патерни

- `docs/patterns/navigation-bar-title.md` — переписується: накладка, один прогрес, кути, доводка, клавіатура, розпірка.
- `docs/patterns/navigation-bar-buttons.md` — прибирається пункт про «пігулки»; кнопки ховаються з великим заголовком.
- `docs/patterns/reanimated.md` — `get()`/`set()` у воркетах.
- `docs/patterns/keyboard.md` — згорнутий навбар із клавіатурою.
- `docs/patterns/test-ids.md` — testID кнопок навбару без дублів.
- `docs/patterns/README.md` — оновити описи двох файлів навбару.

## Project Structure

### Documentation (this feature)

```text
specs/005-navbar-scroll-system/
├── plan.md              # цей файл
├── research.md          # Phase 0: R1–R11
├── data-model.md        # Phase 1: стан навбару (D, p, переходи)
├── quickstart.md        # Phase 1: 15 сценаріїв перевірки
├── contracts/
│   └── ui.md            # Phase 1: пропси NavigationView і гарантії
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/components/
├── navigation-view.tsx                       # накладка, нормалізований scrollY, доводка, розпірка, клавіатура, refresh offset, шторка/відступи
├── content-insets.ts                         # без top; horizontal за замовчуванням 20
└── navigation-bar/
    ├── constants.ts                          # + SHEET_RADIUS, SHEET_CONTENT_TOP; − COLLAPSE_DISTANCE, SHORT_ROW_*
    ├── types.ts                              # − titleShrink, collapseScroll, maxScrollY; titleCollapseDistance → collapseDistance; + onHeightChange; cornerRadius @deprecated до T030
    ├── themed-navigation-bar.tsx             # absolute-накладка, шторка всередині, onLayout → H
    ├── navigation-bar-header.tsx             # великий блок включає ряд кнопок; трансформації замість height
    ├── use-title-collapse.ts                 # → use-navigation-bar-progress.ts: один прогрес p і стилі з нього
    ├── use-navigation-bar-collapse.ts        # прибрати (злито в прогрес)
    ├── navigation-bar-buttons.tsx            # один ряд, без перехресного затухання
    ├── navigation-bar-buttons-row.tsx        # без variant; pointerEvents/доступність за p ≥ 0.5
    ├── navigation-bar-background.tsx         # градієнт іде вище верху екрана (відскок)
    ├── short-navigation-bar-button.tsx       # видалити
    └── index.ts                              # − ShortNavigationBarButton

src/app/                                      # лише пропси: − cornerRadius, − contentInsets.top
├── (auth)/sign-in.tsx, auth-error.tsx
├── (onboarding)/index.tsx
├── (tabs)/(objects)/index.tsx, object-form.tsx, preview.tsx
├── (tabs)/(objects)/[objectId]/index.tsx, services.tsx, service-form.tsx
├── (tabs)/(objects)/[objectId]/[month]/index.tsx, reading.tsx, amount.tsx, bill.tsx
├── (tabs)/(outages)/index.tsx, outage-settings.tsx
└── (tabs)/profile/index.tsx, theme.tsx, edit-name.tsx

.claude/skills/ui-check/flows/navbar.flow     # нові сценарії 1, 2, 5, 8–11 з quickstart
docs/patterns/navigation-bar-title.md, navigation-bar-buttons.md, README.md
```

**Structure Decision**: одна мобільна апка. Уся поведінка зосереджена в `src/components/navigation-view.tsx` і `src/components/navigation-bar/`, а екрани в `src/app/` лише втрачають пропси, які тепер задає спільний компонент.

## Порядок робіт (для `/speckit-tasks`)

1. **Фундамент**: константи, один прогрес `p`, накладка з трансформаціями, один ряд кнопок у великому блоці, кути шторки `SHEET_RADIUS` під накладкою кольором градієнта, нормалізований `scrollY` (`paddingTop` на обох платформах; iOS-таби без автоматичних інсетів), `top = H + SHEET_CONTENT_TOP`. `cornerRadius` і `contentInsets.top` лишаються `@deprecated` і ігноруються, тож tsc проходить після кожного кроку.
2. **US1**: прибрати мертвий `ShortNavigationBarButton`, оновити канвас, перевірити testID.
3. **US2**: доводка (межа `D/2`, скасування дотиком, без гілки «повернутись»), відскок, розпірка R6, клавіатура R7, refresh R8, зміна фокуса й висоти шапки.
4. **US3**: прибрати `cornerRadius` і `contentInsets.top` з екранів, потім з типів; звірити екрани з власною версткою.
5. **US4**: регресія правил короткого й ледь довшого контенту.
6. Канвас: артборди «після скролу» без «пігулок».
7. Патерни `docs/patterns/` + `README.md`.
8. `navbar.flow` в `ui-check`, ручна перевірка на Android (quickstart 15).
9. `npx expo lint` і `npx tsc --noEmit`.

## Ризики

- **Клавіатура з накладкою (R7)**: анімація верхнього відступу під час клавіатури може конфліктувати з прокруткою `KeyboardAwareScrollView` до поля. Перевірка — quickstart 13; запасний варіант — прокрутка до `D` на старті клавіатури.
- **Затримка доводки з JS (R3)**: якщо на Android доводка помітно запізнюється, треба злити ref через власний `ScrollViewComponent` і викликати Reanimated `scrollTo` в UI-потоці.
- **Висота накладки міняється** (підзаголовок «оновлюємо…», чипи черг): `H` і `L` міряються максимумом. Якщо вміст зменшився, під шапкою лишиться зайвий відступ. Перевірити на «Світлі».

## Complexity Tracking

Порушень конституції немає.
