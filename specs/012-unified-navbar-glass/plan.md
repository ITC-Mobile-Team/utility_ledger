# Implementation Plan: Єдиний навбар і кнопки з рідкого скла

**Branch**: `012-unified-navbar-glass` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-unified-navbar-glass/spec.md`

## Summary

Кнопки рядка навбару — «Назад», ⚙️ на «Світлі», 📅 на екрані місяця — стають одним компонентом `NavigationBarIconButton`. На iOS 26+ він малює системне рідке скло (`GlassView` з `expo-glass-effect`), деінде — однакову напівпрозору підкладку. Чип «Місяць» замінюється скляною 📅, `NavigationBarChip` видаляється. Поведінка навбару (згортання, розміри, шрифти, поділ на великий заголовок і короткий рядок) не змінюється.

У тій самій зміні: патерн `navigation-bar-icon-buttons.md` і індекс, правки згадок чипа в інших патернах, канвас (`ui.css` і артборди з «Назад», ⚙️, «Місяць»).

Перша редакція плану прибирала згортання навбару (research R3, R4, R6 у старій формі) — це скасовано уточненням користувача; див. [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.3, React Native 0.88, Expo SDK 58

**Primary Dependencies**: `expo-glass-effect` ~58.0.4 (уже в `package.json` і нативному проєкті), `expo-image`, `react-native-reanimated`; нових немає

**Storage**: N/A

**Testing**: `ui-check` (`navbar.flow` без змін, скріншоти кнопок), iOS Simulator з iOS 26+, `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS (скло на 26+) і Android (запасний вигляд)

**Project Type**: mobile-app

**Performance Goals**: до 2 `GlassView` на екрані

**Constraints**: без opacity < 1 на склі та його предках (крім згортання великого блоку, що й так ховає ⚙️); зона тапа 44×44

**Scale/Scope**: 1 новий хук, 1 переписаний компонент, шапка навбару, 2 екрани, 1 видалений компонент, патерни, канвас

## Constitution Check

| Принцип | Статус | Як дотримано |
|---|---|---|
| I. Expo за документацією версії | ✅ | `GlassView`, `isLiquidGlassAvailable`, `isGlassEffectAPIAvailable` звірено з документацією v58 (research R1–R2); нових залежностей немає |
| II. Expo Router і `src/` | ✅ | хук у `src/hooks/`, компонент у `src/components/navigation-bar/` |
| III. CNG | ✅ | `ExpoGlassEffect` уже в нативному проєкті й Expo Go; **development build не потрібна**, доставка OTA |
| IV. Дизайн і патерни | ✅ | артборди з «Назад», ⚙️ (20*) і «Місяць» (09*) оновлюються (US2); `navigation-bar-icon-buttons.md` і `README.md` — у тій самій зміні |
| V. Українська мова | ✅ | підписи «Назад», «Налаштування графіка», «Змінити місяць» |
| VI. Lint і typecheck | ✅ | остання задача |

Порушень немає.

## Project Structure

### Documentation (this feature)

```text
specs/012-unified-navbar-glass/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/interfaces.md
└── tasks.md
```

### Source Code (repository root)

```text
src/hooks/use-liquid-glass.ts                                 # НОВИЙ
src/components/navigation-bar/navigation-bar-icon-button.tsx  # скляна кнопка: content (icon | back), tone
src/components/navigation-bar/navigation-bar-header.tsx       # «Назад» через NavigationBarIconButton, коло на полі 20 pt
src/components/navigation-bar/navigation-bar-chip.tsx         # ВИДАЛИТИ
src/components/navigation-bar/index.ts, types.ts              # експорт чипа й коментар accessory
src/app/(tabs)/(outages)/index.tsx                            # ⚙️ з новими пропами
src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx         # 📅 замість чипа
docs/patterns/navigation-bar-icon-buttons.md, README.md, …    # патерн і згадки
канвас: project/ui.css, артборди з .back, ⚙️, «Місяць»         # Artifact publish
```

**Structure Decision**: зміна в спільних компонентах навбару; екрани змінюють лише кнопки.

## Complexity Tracking

Не потрібно.
