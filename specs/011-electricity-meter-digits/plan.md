# Implementation Plan: Барабани світла й води вміщають справжній показник

**Branch**: `feature/splash-and-animation` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-electricity-meter-digits/spec.md`

## Summary

Формати барабана визначає одна функція, `getMeterFormat` у `src/services/ledger/meter-format.ts`. Зараз вона повертає 5/2 для світла і 6/3 для води, тому цілих клітинок лише 3, а показник понад 999 не ввести. Нові значення: світло **7/2**, вода **8/3**, газ лишається 8/3.

Решта коду вже параметризована форматом, тож змінювати його не треба:
- `digitsToReading` / `readingToDigits`;
- `sanitizeReadingInput` / `parseReadingInput`;
- підказки «N цифр» у `reading.tsx`;
- `MeterReadingInput` (проміжок 4 pt при більше ніж 6 клітинках);
- `billing.ts`, `bill.tsx`, `[month]/index.tsx` (беруть лише `fractionDigits`, а він не змінюється).

Збережені показники вже лежать в одиницях з дробом, тож міграція не потрібна. Старий показник світла 19 082 тепер показується повністю, `19082|00`, а не обрізаним до останніх 5 цифр.

Окрім коду, у цій самій зміні оновлюються:
- патерн `docs/patterns/meter-reading.md`;
- сценарій `ui-check` `meter.flow`;
- коментарі в `reading.tsx`, `meter-format.ts` і `meter-reading-input.tsx`.

Деталі — у [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.3, React Native 0.88, Expo SDK 58

**Primary Dependencies**: наявні (`expo-router`, `react-native-reanimated`); нових немає

**Storage**: Firestore `users/{uid}/readings` і локальне сховище: формат даних без змін (показник — число в одиницях з дробом)

**Testing**: `ui-check` (`.claude/skills/ui-check/flows/meter.flow`, iOS Simulator), `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS і Android (Expo, CNG)

**Project Type**: mobile-app

**Performance Goals**: без змін: введення цифри миттєве, барабан рендерить до 8 клітинок

**Constraints**: барабан із 8 клітинками вміщається в один рядок на ширині 320 pt. Для газу (8 клітинок) це вже так: клітинка `flex: 1, maxWidth: 46`, проміжок 4.

**Scale/Scope**: 1 функція формату, 1 екран (`reading.tsx`) і форма послуги (`service-form.tsx`, без змін коду), 1 патерн, 1 flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Як дотримано |
|---|---|---|
| I. Expo за документацією версії | ✅ | Expo/RN API не зачіпаються, нових залежностей немає |
| II. Expo Router і `src/` | ✅ | Логіка лишається в `src/services/ledger/`, екрани в `src/app/` не змінюють структуру |
| III. CNG | ✅ | Нативних змін немає, **development build не потрібна**: зміна доставляється OTA (`eas update`) |
| IV. Дизайн і патерни | ✅ | Артборди 10, 10a–10d (екран «Додати показник») задають вигляд клітинки, а нова тільки кількість клітинок. `docs/patterns/meter-reading.md` оновлюється в тій самій зміні (окрема задача) |
| V. Українська мова | ✅ | Артефакти українською; тексти підказок без змін, лише число N |
| VI. Lint і typecheck | ✅ | Остання задача — `npx expo lint` і `npx tsc --noEmit` |

Порушень немає, Complexity Tracking не потрібен.

**Повторна перевірка після Phase 1**: дизайн нічого не додав: ні нових залежностей, ні нативних змін, ні нових патернів. Гейти пройдено.

## Project Structure

### Documentation (this feature)

```text
specs/011-electricity-meter-digits/
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
src/services/ledger/meter-format.ts              # getMeterFormat: світло 7/2, вода 8/3; коментарі
src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx   # лише коментар «світло 5/2, вода 6/3» → 7/2, 8/3
src/views/meter/meter-reading-input.tsx          # без змін логіки (перевірити ширину 7–8 клітинок)
src/app/(tabs)/(objects)/[objectId]/service-form.tsx      # без змін коду: sanitizeReadingInput бере формат
docs/patterns/meter-reading.md                   # нові формати, прибрати «лише 3 цілі клітинки»
.claude/skills/ui-check/flows/meter.flow         # «7 цифр», знімок барабана світла
```

**Structure Decision**: мобільний застосунок з одним пакетом. Зміна вміщається в сервіс формату, документацію патерну та UI-сценарій.

## Complexity Tracking

Не потрібно: порушень конституції немає.
