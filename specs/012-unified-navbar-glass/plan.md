# Implementation Plan: Єдиний навбар і кнопки з рідкого скла

**Branch**: `012-unified-navbar-glass` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-unified-navbar-glass/spec.md`

## Summary

Три зміни в навбарі (`src/components/navigation-bar/`, `src/components/navigation-view.tsx`).

**1. Згортання немає.** Навбар лишається накладкою над скролом, але має фіксовану висоту — ту, з якою відкрився екран. Хук прогресу видаляється. З `NavigationView` прибираються:
- доводка;
- розпірка;
- згортання клавіатурою.

Кути шторки завжди 28.

**2. Одна структура.**
- Корені вкладок («Обʼєкти», «Світло», «Профіль») — `full`: великий заголовок 28, підзаголовок.
- Усі інші екрани — `short`: один рядок, скляна «Назад», короткий заголовок 22, необовʼязкова скляна кнопка праворуч, без підзаголовка.

Сім вкладених екранів переходять з `full` на `short`. На екрані місяця чип «Місяць» стає скляною кнопкою 📅.

**3. Скляні кнопки.**
- `NavigationBarIconButton` малює системне рідке скло (`GlassView` з `expo-glass-effect`) на iOS 26+.
- Якщо скла немає (Android, iOS < 26, «Зменшити прозорість»), він малює однакову напівпрозору підкладку.
- «Назад» рендериться тим самим компонентом.

У тій самій зміні оновлюються:
- канвас: `ui.css` і артборди;
- патерни `navigation-bar-title.md` і `navigation-bar-buttons.md`, новий `navigation-bar-icon-buttons.md`, індекс;
- флоу `ui-check`.

Деталі — у [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.3, React Native 0.88, Expo SDK 58

**Primary Dependencies**: `expo-glass-effect` ~58.0.4 (уже в `package.json`, досі не використовувався), `react-native-reanimated`, `react-native-keyboard-controller`, `expo-router`; нових залежностей немає

**Storage**: N/A

**Testing**: `ui-check` (`.claude/skills/ui-check/flows/navbar.flow`, `theme.flow`; iOS Simulator з iOS 26), скріншоти Android-емулятора для запасного вигляду, `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS (скло на 26+, запасний вигляд нижче) і Android (запасний вигляд)

**Project Type**: mobile-app

**Performance Goals**:
- скрол без перерахунку розкладки навбару: тепер навбар не анімується зовсім;
- до 2 `GlassView` на екрані.

**Constraints**:
- на `GlassView` і його предках немає opacity < 1;
- зона тапа 44×44;
- короткий заголовок обрізається трикрапкою й масштабується не більше ніж у 1,5 раза.

**Scale/Scope**:
- компоненти: `navigation-view.tsx` і 6 файлів `navigation-bar/` (один видаляється — хук прогресу, ще один — `navigation-bar-chip.tsx`);
- 1 новий хук;
- 7 екранів переходять на `short`, 1 екран отримує нову праву кнопку;
- 3 патерни, 2 флоу, `ui.css` і близько 40 артбордів.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Як дотримано |
|---|---|---|
| I. Expo за документацією версії | ✅ | `GlassView`, `isLiquidGlassAvailable`, `isGlassEffectAPIAvailable` і обмеження opacity звірено з документацією v58 (research R1–R2). Нових залежностей немає: `expo-glass-effect` — це модуль Expo, а не сторонній |
| II. Expo Router і `src/` | ✅ | Хук `useLiquidGlass` у `src/hooks/`, компоненти в `src/components/navigation-bar/`. Екрани в `src/app/` змінюють лише пропи `NavigationView` |
| III. CNG | ✅ | `ExpoGlassEffect` уже в нативному проєкті (`Podfile.lock`) і в Expo Go. **Development build не потрібна**, доставка OTA (`eas update`) |
| IV. Дизайн і патерни | ✅ | Артборди: 05/05b, 08/08b, 09*, 10*, 12*/12b, 13*, 16/16d/16e, 17–19, 20/20s, 21*, 06*, 07, 02, 04 (research R6). Канвас оновлюється окремими задачами. Патерни `navigation-bar-title.md` і `navigation-bar-buttons.md` переписуються, додається `navigation-bar-icon-buttons.md`, оновлюється `README.md` — окрема задача, той самий коміт |
| V. Українська мова | ✅ | Артефакти українською; підписи «Назад», «Налаштування графіка», «Змінити місяць» |
| VI. Lint і typecheck | ✅ | Остання задача — `npx expo lint` і `npx tsc --noEmit` |

Порушень немає.

**Повторна перевірка після Phase 1**: дизайн додав хук `useLiquidGlass` і контракт пропів (contracts/interfaces.md). Нових залежностей і нативних змін немає, нові патерни задокументовано. Гейти пройдено.

## Project Structure

### Documentation (this feature)

```text
specs/012-unified-navbar-glass/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── interfaces.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/hooks/use-liquid-glass.ts                          # НОВИЙ: скло доступне && не «Зменшити прозорість»
src/components/navigation-bar/navigation-bar-icon-button.tsx  # скляна кнопка: GlassView / запасна View; icon | back; tone
src/components/navigation-bar/navigation-bar-header.tsx       # без анімацій; «Назад» через NavigationBarIconButton; рядок short з accessory праворуч
src/components/navigation-bar/themed-navigation-bar.tsx       # без scrollY/collapseDistance/isCollapsed; статичні градієнт і кути
src/components/navigation-bar/navigation-bar-background.tsx   # статичні стилі замість анімованих
src/components/navigation-bar/use-navigation-bar-progress.ts  # ВИДАЛИТИ
src/components/navigation-bar/navigation-bar-chip.tsx         # ВИДАЛИТИ (єдине використання — «Місяць»)
src/components/navigation-bar/types.ts, index.ts, constants.ts # прибрати пропи згортання й експорт чипа
src/components/navigation-view.tsx                     # без доводки, розпірки, keyboardCollapse
src/app/(tabs)/(objects)/object-form.tsx               # type='short', без subtitle
src/app/(tabs)/(objects)/preview.tsx                   # type='short', без subtitle
src/app/(tabs)/(objects)/[objectId]/service-form.tsx   # type='short', без subtitle
src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx  # type='short', без subtitle, 📅 NavigationBarIconButton замість чипа
src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx # type='short', без subtitle
src/app/(tabs)/profile/theme.tsx                       # type='short', без subtitle
src/app/(tabs)/profile/edit-name.tsx                   # type='short', без subtitle
docs/patterns/navigation-bar-title.md                  # переписати: навбар без згортання, корені full / вкладені short
docs/patterns/navigation-bar-buttons.md                # кнопки не ховаються під час скролу
docs/patterns/navigation-bar-icon-buttons.md           # НОВИЙ: скляні кнопки рядка навбару
docs/patterns/README.md                                # індекс
.claude/skills/ui-check/flows/navbar.flow              # без згортання; висота до/після скролу
.claude/skills/ui-check/flows/theme.flow               # без «Оформлення застосунку»
канвас: project/ui.css, артборди з research R6         # Artifact publish
```

**Structure Decision**: мобільний застосунок з одним пакетом. Зміна зосереджена в спільних компонентах навбару; екрани змінюють лише пропи.

## Complexity Tracking

Не потрібно: порушень конституції немає.
