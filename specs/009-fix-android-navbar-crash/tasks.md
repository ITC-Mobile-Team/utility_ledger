---

description: "Задачі для виправлення краху на Android через обгортку ряду кнопок навбару"
---

# Tasks: Краш на Android під час відкриття екрана з великими кнопками навбару

**Input**: Design documents from `/specs/009-fix-android-navbar-crash/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: автотестів спека не вимагає; перевірка — ручні сценарії з [quickstart.md](quickstart.md) на Android-емуляторі та `ui-check` на iOS.

**Organization**: задачі згруповано за user stories зі spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (інші файли, без залежностей)
- **[Story]**: до якої user story належить задача (US1, US2, US3)

## Phase 1: Setup

Не потрібна: залежностей і нативних змін немає, development build на емуляторі та в симуляторі вже встановлена (plan.md, Constitution III).

## Phase 2: Foundational

Не потрібна: усі історії залежать від однієї зміни в компоненті, вона йде в US1.

---

## Phase 3: User Story 1 — Застосунок відкривається на Android (Priority: P1) 🎯 MVP

**Goal**: застосунок на Android доходить до першого екрана без краху.

**Independent Test**: холодний запуск development build на `emulator-5554` показує список об'єктів або екран входу, `adb logcat -d -b crash` порожній.

- [ ] T001 [US1] У `src/components/navigation-bar/navigation-bar-buttons-row.tsx` рендерити `ScrollViewMarker` лише на iOS per FR-001, FR-002, research.md (Рішення 1): імпортувати `Platform` з `react-native`, горизонтальний `ScrollView` разом із `HStack` і кнопками зберегти в локальну змінну `row` (пропи `horizontal`, `contentInsetAdjustmentBehavior='never'`, `automaticallyAdjustContentInsets={false}`, `contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}`, `showsHorizontalScrollIndicator={false}` без змін) і всередині зовнішнього `View` з `onLayout` повертати `Platform.OS === 'ios' ? <ScrollViewMarker scrollEdgeEffects={HIDDEN_EDGE_EFFECTS}>{row}</ScrollViewMarker> : row`. Оновити коментар над маркером українською: на iOS 26+ маркер вимикає верхній ефект краю (світла смуга над кнопками); на Android його немає, бо нативний `ScrollViewMarker` шукає серед прямих дочірніх лише вертикальний `ScrollView`, не знаходить горизонтальний і падає (`Failed to find supported type of ScrollView`), а ефектів краю на Android і так немає
- [ ] T002 [US1] Перевірити запуск на Android per SC-001, quickstart.md (Android, кроки 1–3, 5–6): запустити Metro (`npx expo start --dev-client`), `adb reverse tcp:8081 tcp:8081`, відкрити `exp+utilityledger://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081` у `com.bogdanpoh.utilityledger`; 10 холодних запусків поспіль (`adb shell am force-stop com.bogdanpoh.utilityledger` між ними) доходять до першого екрана без екрана «There was a problem loading the project»; `adb logcat -d -b crash` порожній, `adb logcat -d | grep RNScreens` без `ScrollViewMarker`. Сценарій «без входу» (US1, сценарій 2) окремо не перевіряти: на екрані входу немає ряду великих кнопок

**Checkpoint**: застосунок відкривається на Android — MVP.

---

## Phase 4: User Story 2 — Усі екрани з великими кнопками навбару працюють на Android (Priority: P1)

**Goal**: кожен екран з рядом великих кнопок відкривається, гортається й реагує на натискання на Android.

**Independent Test**: обхід вкладок і екранів з рядом кнопок на емуляторі без жодного краху.

- [ ] T003 [US2] Пройти на Android-емуляторі всі вкладки й екрани з рядом великих кнопок per FR-002, FR-003, SC-002, quickstart.md (Android, крок 4): екрани, що передають `navigationBarButtons` у `NavigationView` (`src/components/navigation-view.tsx` → `ThemedNavigationBar` → `NavigationBarButtonsRow`): `src/app/(tabs)/(objects)/index.tsx` (список об'єктів), `src/app/(tabs)/(objects)/[objectId]/index.tsx` (об'єкт), `src/app/(tabs)/(objects)/[objectId]/services.tsx` (сервіси), `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx` (місяць), `src/app/(tabs)/(objects)/preview.tsx` (службовий перегляд); на кожному прогорнути ряд убік (якщо кнопок більше, ніж вміщує екран), натиснути кнопку й перевірити дію, повернутися назад, переключити вкладку туди й назад, згорнути й розгорнути застосунок (`adb shell input keyevent KEYCODE_HOME`, потім знову відкрити); поворот екрана не перевіряти — `app.json` фіксує `"orientation": "portrait"`; ряд лишається одним рядом з кнопками 50% ширини (патерн `docs/patterns/navigation-bar-buttons.md`), `adb logcat -d -b crash` порожній. Окремо — екран з однією кнопкою і зміна набору кнопок на відкритому екрані (додати або прибрати сервіс у місяці), Edge Cases зі spec.md

**Checkpoint**: Android-сторона спеки закрита.

---

## Phase 5: User Story 3 — На iOS виправлення світлої смуги не ламається (Priority: P2)

**Goal**: на iOS 26+ над рядом кнопок не з'являється світла смуга.

**Independent Test**: сценарій з `bc7c55c` в iOS Simulator і `navbar.flow`.

- [ ] T004 [P] [US3] Перевірити iOS per FR-004, SC-003, quickstart.md (iOS): у iOS Simulator (iPhone 17 Pro) після Fast Refresh відкрити місяць з десятьма сервісами, перейти на екран з клавіатурою і прокруткою, повернутися назад — градієнт навбару тягнеться до кнопок без світлої смуги; `ui-check` `.claude/skills/ui-check/flows/navbar.flow` проходить

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T005 [P] Оновити `docs/patterns/navigation-bar-buttons.md` per FR-005, Constitution IV: у пункті про `ScrollViewMarker` (рядок 11) дописати, що обгортка рендериться лише на iOS (`Platform.OS === 'ios'`), бо `scrollEdgeEffects` — тільки iOS 26+, а на Android нативний маркер вимагає вертикальний `ScrollView` серед прямих дочірніх і падає на горизонтальному; правило для нових рядів — ніколи не обгортати горизонтальний скрол у `ScrollViewMarker` на Android. Індекс `docs/patterns/README.md` не змінюється (файл уже в ньому). Комітити разом із T001
- [ ] T006 Перевірити реліз-збірку Android per SC-004, quickstart.md (Android release): `npx expo run:android --variant release` на емуляторі, відкрити екран з рядом кнопок — без краху; після перевірки повернути development build (`npx expo run:android`), щоб емулятор лишився з dev-клієнтом
- [ ] T007 Позначити в `specs/009-fix-android-navbar-crash/spec.md` **Status**: Implemented і коротко підсумувати українською, що змінилося і що перевірено, а що лишається вручну (запуск на реальному Android-пристрої користувача); зупинити Metro, запущений для перевірок, і видалити тимчасові файли зі scratchpad
- [ ] T008 Запустити `npx expo lint` і `npx tsc --noEmit` і виправити помилки (Constitution VI)

---

## Dependencies & Execution Order

- T001 блокує всі перевірки (T002, T003, T004, T006).
- US1 (T001–T002) → US2 (T003): обхід екранів має сенс лише після того, як застосунок відкривається.
- US3 (T004) залежить лише від T001 і може йти паралельно з T002–T003 (iOS Simulator проти Android-емулятора).
- T005 не залежить від коду, можна писати паралельно з T001, але комітити разом.
- T006 — після T003 (реліз-збірка замінює dev-клієнт на емуляторі).
- T007 → T008 — в кінці.

## Parallel Example

```text
Після T001:
  T002, T003 — Android-емулятор (послідовно)
  T004       — iOS Simulator (паралельно з T002–T003)
  T005       — docs/patterns/navigation-bar-buttons.md (паралельно)
```

## Implementation Strategy

1. **MVP**: T001 + T002 — застосунок знову відкривається на Android; цього достатньо, щоб розблокувати користувача.
2. T003 закриває решту Android-екранів, T004 — що iOS не зламався.
3. T005–T008 — патерн, реліз-збірка, статус спеки, lint і typecheck.
