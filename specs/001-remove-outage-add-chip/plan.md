# Implementation Plan: Ряд черг без кнопки «+» на екрані «Відсутність світла»

**Branch**: `feature/outages-tab` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-remove-outage-add-chip/spec.md`

> Перенесено з OpenSpec (`proposal.md`, розділ Impact) зміни `remove-outage-add-chip`.

## Summary

Прибрати з ряду черг у шапці екрана «Відсутність світла» чип «+», що дублював шестерню в навбарі. `QueueChips` втрачає проп `onAdd`, екран його більше не передає; оновити опис шапки в патерні та артборд у канвасі.

## Technical Context

**Language/Version**: TypeScript, React Native (Expo SDK — версія `expo` з `package.json`)

**Primary Dependencies**: Expo Router, компоненти `@/components` (`Pressable`, `AppImage`)

**Storage**: N/A

**Testing**: ручна перевірка в симуляторі; `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS та Android

**Project Type**: mobile-app

**Constraints**: без нативних змін — доставляється OTA-оновленням

**Scale/Scope**: один компонент, один екран

## Constitution Check

- I. Expo за документацією — нових API і залежностей немає. ✅
- II. Expo Router і структура — компонент у `src/views/outages/`, екран у `src/app/`. ✅
- III. CNG — нативних змін немає, development build не потрібна. ✅
- IV. Дизайн і патерни — артборд «20 · Відсутність світла» (`project/Outage.dc.html`) і похідні 20a, 20b, 20l, 20s; патерн `docs/patterns/outage-providers.md` оновлюється. ✅
- V. Українська — так. ✅
- VI. Lint і typecheck — фінальна задача. ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-remove-outage-add-chip/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/(tabs)/(outages)/index.tsx      # не передає onAdd у QueueChips
└── views/outages/queue-chips.tsx       # без чипа «+», пропа onAdd і стилю add
docs/patterns/outage-providers.md       # опис шапки без «+»
```

**Structure Decision**: зміни лише в наявних файлах; шестерня `settingsButton` і `openSettings` для порожніх станів лишаються.
