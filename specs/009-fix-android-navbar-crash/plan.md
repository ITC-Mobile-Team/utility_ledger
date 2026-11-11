# Implementation Plan: Краш на Android під час відкриття екрана з великими кнопками навбару

**Branch**: `feature/splash-and-animation` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-fix-android-navbar-crash/spec.md`

## Summary

На Android застосунок падає, щойно показується ряд великих кнопок навбару: нативний `ScrollViewMarker`
(`react-native-screens/experimental`) у `onAttachedToWindow` шукає серед прямих дочірніх `ScrollView` або
`NestedScrollView`, а горизонтальний RN `ScrollView` на Android — це `HorizontalScrollView`, тож пошук
кидає `IllegalStateException`. Сам проп `scrollEdgeEffects` у бібліотеці позначено `@platform ios`
(iOS 26+), тобто на Android обгортка нічого корисного не робить. Рішення: рендерити `ScrollViewMarker`
лише на iOS, на Android віддавати горизонтальний `ScrollView` без обгортки. Деталі — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript, React Native 0.88, Expo SDK 58

**Primary Dependencies**: `react-native-screens` 4.30.0 (`ScrollViewMarker` з `/experimental`), `expo-router` ~58.0.23

**Storage**: N/A

**Testing**: ручна перевірка на Android-емуляторі (`emulator-5554`) і в iOS Simulator; `ui-check` `navbar.flow` (iOS); `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS 26+ і Android (реальний пристрій і емулятор)

**Project Type**: mobile-app (Expo/React Native)

**Performance Goals**: без змін; ряд кнопок гортається плавно, як раніше

**Constraints**: виправлення лише в JS (доставка OTA, без нової development build); поведінка на iOS з `bc7c55c` зберігається

**Scale/Scope**: один компонент `src/components/navigation-bar/navigation-bar-buttons-row.tsx`, який використовують усі екрани з великими кнопками навбару; один файл патерну

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Примітка |
|---|---|---|
| I. Expo за документацією версії | ✅ | Expo API не змінюється; `Platform.OS` — базовий RN API; поведінку `ScrollViewMarker` звірено з вихідним кодом встановленої версії 4.30.0 (JS-типи і `ScrollViewMarker.kt`). Нових залежностей немає |
| II. Expo Router і структура `src/` | ✅ | Змінюється лише компонент у `src/components/navigation-bar/`, маршрути не зачіпаються |
| III. Нативне через CNG | ✅ | `ios/`, `android/`, `app.json` не змінюються; нова development build **не потрібна**, зміна доставляється OTA / Fast Refresh |
| IV. Дизайн і патерни | ✅ | Вигляд ряду не змінюється, артборд не потрібен. Застосовний патерн: `docs/patterns/navigation-bar-buttons.md` — оновлюється (обгортка лише на iOS і чому), окрема задача в `tasks.md`; індекс `README.md` не змінюється, бо файл уже в ньому |
| V. Українська мова | ✅ | Артефакти українською |
| VI. Lint і typecheck | ✅ | Остання задача — `npx expo lint` і `npx tsc --noEmit` |

Повторна перевірка після Phase 1: порушень немає.

## Project Structure

### Documentation (this feature)

```text
specs/009-fix-android-navbar-crash/
├── plan.md              # цей файл
├── research.md          # Phase 0
├── quickstart.md        # Phase 1
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

`data-model.md` і `contracts/` не створюються: фіча не має даних і зовнішніх інтерфейсів, змінюється
лише внутрішня розмітка одного компонента.

### Source Code (repository root)

```text
src/components/navigation-bar/
└── navigation-bar-buttons-row.tsx   # ScrollViewMarker лише на iOS

docs/patterns/
└── navigation-bar-buttons.md        # правило: обгортка ефекту краю — тільки iOS, на Android падає
```

**Structure Decision**: змінюється наявний компонент на місці; нових файлів у `src/` немає.

## Дизайн

- Артборд: не потрібен, вигляд ряду кнопок на обох платформах лишається як у патерні `navigation-bar-buttons.md` (50% ширини екрана, один ряд зі скролом).
- `navigation-bar-buttons-row.tsx`: горизонтальний `ScrollView` винести в змінну/фрагмент і обгортати в `ScrollViewMarker` тільки при `Platform.OS === 'ios'`. Коментар пояснює, чому на Android обгортки немає (нативний маркер вимагає вертикальної прокрутки серед прямих дочірніх і падає на `HorizontalScrollView`; ефектів краю на Android немає).
- Пропи `contentInsetAdjustmentBehavior` і `automaticallyAdjustContentInsets` лишаються: на Android їх ігнорують.

## Complexity Tracking

Порушень конституції немає.
