# Implementation Plan: Архівування обʼєктів, лічильники за типом послуги, стартова черга «Світла» і візуальні правки

**Branch**: `feature/splash-and-animation` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-ui-polish-archive/spec.md`

## Summary

**Архів.** В обʼєкта зʼявляються поля `archived` / `archivedAt` / `includeInAnalytics` і метод репозиторію `setObjectArchive`. Список «Обʼєкти» показує лише активні адреси. Наявна кнопка «Архів» відкриває новий екран `archive.tsx` з перемикачем «Враховувати в аналітиці» в кожного обʼєкта. Архівований обʼєкт доступний лише для перегляду, у навбарі в нього дві кнопки: «Повернути з архіву» і «Видалити».

**Лічильники.** Барабан бере формат з послуги: світло 5/2, вода 6/3, газ 8/3. Показники зберігаються в одиницях з дробовою частиною, старі цілі значення лишаються валідними.

**Світло.** Стартова черга зберігається в налаштуваннях акаунта й вибирається нативним меню в налаштуваннях «Світла». Вона стає початковим станом вибраного чипа.

**Тема.**
- Перемикання — через знімок кореня (`react-native-view-shot`, потрібна нова development build) з розчиненням за 350 мс.
- Картки на екрані «Тема» показують сцену логотипу зі splash: день, ніч або навпіл. Вибрана картка анімована й має рамку.

**Решта — точкові правки:**
- позначки «заповнено» лише галочкою;
- новий токен `plusSoft`;
- усі послуги в `ObjectCard`;
- шрифт заголовка `title` для всіх повних навбарів;
- без індикаторів прокрутки;
- кольори `NativeTabs` на Android;
- профіль: «Змінити імʼя» і `expo-application` для номера білда.

Деталі й альтернативи — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.3, React Native 0.88, Expo SDK 58

**Primary Dependencies**:
- наявні: `expo-router` ~58.0.23 (`NativeTabs`), `react-native-reanimated` 4.7 (CSS-анімації, shared values), `@expo/ui` (нативні меню), `@react-native-firebase/firestore` 27.1;
- нові через `npx expo install`: `react-native-view-shot` (нативний модуль) і `expo-application` (уже лінкований транзитивно).

**Storage**: Firestore `users/{uid}/objects` (нові поля обʼєкта), `users/{uid}/readings` (дробові значення), документ налаштувань «Світла» (`startQueue`); правила без змін

**Testing**: `ui-check` (iOS Simulator, `.flow`-сценарії), ручна перевірка на Android-емуляторі, `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS 26+ і Android

**Project Type**: mobile-app (Expo/React Native, CNG)

**Performance Goals**:
- перехід теми ≤ 0,5 с без кадру з різкою зміною;
- знімок для переходу ≤ 400 мс і його показ ≤ 250 мс до зміни схеми (виміряно: iOS Simulator 85/17 мс, Android-емулятор ~180/100 мс; початкові 150 мс на Android не витримувались — research R6);
- анімація сцен логотипу 60 fps.

**Constraints**: офлайн-мутації як у решти даних; зворотна сумісність збережених показників і обʼєктів без міграції; «Зменшити рух» вимикає анімації; лише `get()`/`set()` для shared values

**Scale/Scope**: ~25 файлів у `src/`, 1 новий екран, 3 нові компоненти (`LogoScene`, `StartQueueRow`, `archive.tsx`), 9 файлів патернів

**Прийнятий ризик**: у світла 5/2 лише 3 цілі цифри (≤ 999,99 кВт·год). Користувач підтвердив цей формат 2026-11-12 (research R4).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Примітка |
|---|---|---|
| I. Expo за документацією версії | ✅ | Звірено з v58: `captureRef` (`react-native-view-shot`), `expo-application` (`nativeBuildVersion`, `nativeApplicationVersion`), Android-пропси `NativeTabs` (`backgroundColor`, `indicatorColor`, `rippleColor`, `labelVisibilityMode`). Залежності — лише через `npx expo install`. `react-native-view-shot` — сторонній, але його документує Expo як `captureRef`; модуля Expo для знімка View немає |
| II. Expo Router і структура `src/` | ✅ | Новий маршрут `src/app/(tabs)/(objects)/archive.tsx`; компоненти в `src/views/brand/`, `src/views/outages/`; селектори й формат лічильника в `src/services/ledger/` |
| III. Нативне через CNG | ✅ | `ios/` і `android/` руками не змінюються. **Потрібна нова development build** через `react-native-view-shot`. Решта JS-only, OTA. До нової збірки тема працює з запасним накриттям (перевірка наявності нативного модуля) |
| IV. Дизайн і патерни | ✅ | Артборди оновлюються в канвасі (`docs/design.md`): «Обʼєкти» (коло плюса, усі послуги), «Обʼєкт» (кнопка «Архівувати», галочка), новий «Архів» (зі станом порожнього), «Оберіть місяць», «Введення показника» (5/6/8 клітинок), налаштування «Світла» (стартова черга), «Профіль», «Тема» (сцени логотипу). Патерни, що змінюються: `meter-reading.md`, `pickers.md` (тема, вибір місяця, стартова черга), `navigation-bar-title.md` (шрифти, без індикаторів), `tab-bar.md` (кольори Android, архів у стеку), `preferences.md` (перехід теми знімком), `user-data.md` (архів, `getAnalyticsObjects`), `icons.md` (галочка без фону), `splash.md` (сцена в `LogoScene`), `outage-providers.md` (`startQueue`), індекс `README.md`. Окрема задача на патерни в кожній фазі `tasks.md` |
| V. Українська мова | ✅ | Артефакти й тексти інтерфейсу українською |
| VI. Lint і typecheck | ✅ | Остання задача — `npx expo lint` і `npx tsc --noEmit` |

Повторна перевірка після Phase 1: порушень немає. Стороння бібліотека обґрунтована в R6 і в таблиці.

## Project Structure

### Documentation (this feature)

```text
specs/010-ui-polish-archive/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/interfaces.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── _layout.tsx                              # кореневий View з ref для знімка теми
│   └── (tabs)/
│       ├── _layout.tsx                          # кольори NativeTabs на Android
│       ├── (objects)/
│       │   ├── index.tsx                        # лише активні, «Архів» → /archive
│       │   ├── archive.tsx                      # НОВИЙ: архівовані + «Враховувати в аналітиці»
│       │   ├── object-form.tsx                  # заборона для архівованого
│       │   └── [objectId]/
│       │       ├── index.tsx                    # «Архівувати» / «Повернути», лише перегляд, галочка без фону
│       │       ├── service-form.tsx             # дробовий початковий показник; заборона для архівованого
│       │       ├── services.tsx                 # лише перегляд для архівованого
│       │       ├── icon-picker.tsx              # без індикатора прокрутки
│       │       └── [month]/
│       │           ├── index.tsx                # лише перегляд для архівованого
│       │           ├── reading.tsx              # формат барабана з послуги
│       │           └── amount.tsx               # заборона для архівованого
│       ├── (outages)/
│       │   ├── index.tsx                        # початковий чип = startQueue
│       │   └── outage-settings.tsx              # рядок «Стартова черга»
│       └── profile/
│           ├── index.tsx                        # «Змінити імʼя», версія (білд)
│           └── theme.tsx                        # картки з LogoScene
├── components/
│   ├── theme-transition.tsx                     # знімок + розчинення, запасне накриття
│   ├── navigation-view.tsx, screen-view.tsx, save-area-scoll-view.tsx
│   └── navigation-bar/
│       ├── navigation-bar-header.tsx            # full → завжди 'title'
│       └── navigation-bar-buttons-row.tsx       # без індикатора
├── constants/colors.ts                          # plusSoft
├── providers/preferences-provider.tsx           # setTheme чекає знімок
├── services/
│   ├── ledger/
│   │   ├── types.ts                             # поля архіву, setObjectArchive
│   │   ├── meter-format.ts                      # НОВИЙ: формат барабана, перетворення, formatReading
│   │   ├── billing.ts                           # округлення до копійок
│   │   ├── firestore-ledger-repository.ts, local-ledger-repository.ts
│   │   └── (селектори архіву поруч з getObjectServices)
│   └── outages/
│       ├── types.ts                             # startQueue
│       └── firestore-settings-repository.ts     # читання/запис startQueue
└── views/
    ├── object-card.tsx                          # усі послуги, перенос
    ├── brand/logo-scene.tsx                     # НОВИЙ: сцена логотипу (зі splash)
    ├── splash/app-splash.tsx                    # використовує LogoScene
    ├── meter/meter-reading-input.tsx, meter-digit.tsx  # fractionDigits
    ├── objects/month-picker-sheet.tsx, city-picker-sheet.tsx
    ├── outages/start-queue-row{,.ios,.android}.tsx     # НОВИЙ
    ├── outages/outage-city-sheet.tsx, queue-chips.tsx
    └── profile/theme-option-card.tsx            # без радіо; theme-preview.tsx видаляється
```

**Structure Decision**: один Expo-застосунок, маршрути в `src/app/`, решта в `src/components`, `src/views`, `src/services` за конституцією (II).

**Порядок реалізації (незалежні частини)**:
1. Візуальні правки й профіль (US5, US6) — JS-only, без залежностей.
2. Архів (US1) — дані → селектори → екрани.
3. Лічильники (US2).
4. Стартова черга (US3).
5. Тема (US4) — `LogoScene`, потім перехід знімком і нова development build.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Стороння нативна бібліотека `react-native-view-shot` | Справжній crossfade теми, включно з нативним таб-баром (FR-014, SC-004) | Модуля Expo для знімка View немає; теперішнє накриття фоном — і є той «різкий» перехід; анімація кольорів кожного компонента — переписування всіх `Themed*` |
