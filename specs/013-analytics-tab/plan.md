# Implementation Plan: Вкладка «Аналітика»

**Branch**: `013-analytics-tab` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-analytics-tab/spec.md`

## Summary

Заглушка `(tabs)/analytics.tsx` стає стеком із двох екранів: головний («14 · Аналітика») і «Витрати — деталі» («15»). Обчислення — чисті функції в новому `src/services/analytics/` поверх наявних `calculateMonth`/`calculateService` і `getAnalyticsObjects`: рахуються лише додані до обʼєкта місяці, що перетинаються з періодом. Вибір періоду й адреси живе в `AnalyticsSelectionProvider` у layout вкладки (не зберігається між запусками). Календар днів — власна шторка на `BottomSheet`; графік і смуга розподілу — звичайні `View`. Плитка ↗️ отримує синю мʼяку підкладку й центрування через `AppImage`.

У тій самій зміні: розділ про вибір дати в `docs/patterns/pickers.md`, правка `user-data.md`, флоу `ui-check`, у канвасі — плитка ↗️ на артборді 14 і нові артборди порожнього стану й завантаження.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.3, React Native 0.88, Expo SDK 58

**Primary Dependencies**: `expo-router` (Stack у вкладці `NativeTabs`), `react-native-reanimated` і `react-native-gesture-handler` (через наявний `BottomSheet`, `Segment`); нових немає

**Storage**: N/A — лише читання `LedgerState` через `useLedgerState`; вибір у памʼяті

**Testing**: `ui-check` (новий `analytics.flow`), ручні сценарії [quickstart.md](quickstart.md), `npx expo lint`, `npx tsc --noEmit`; unit-тестів у проєкті немає

**Target Platform**: iOS і Android

**Project Type**: mobile-app

**Performance Goals**: перерахунок при зміні періоду чи адреси < 0,5 с для 3 адрес × 36 місяців (SC-003); ≈ 540 `calculateService`

**Constraints**: працює без інтернету (локальна копія Firestore); лише перегляд; кольори з токенів обох тем; зона тапа ≥ 44

**Scale/Scope**: 3 маршрути (layout, 2 екрани), 1 провайдер, 1 сервісний модуль, ~9 компонентів у `src/views/analytics/`, 1 скелетон, правки таб-бару, іконок, форм множини, 2 патерни, канвас

## Constitution Check

| Принцип | Статус | Як дотримано |
|---|---|---|
| I. Expo за документацією версії | ✅ | нових залежностей немає; використання expo-router (Stack у вкладці `NativeTabs`, typed routes, `useLocalSearchParams`) звіряється з документацією v58 першим кроком T001 до коду, висновок — у research R1 |
| II. Expo Router і `src/` | ✅ | маршрути в `src/app/(tabs)/analytics/`; логіка в `src/services/analytics/`, стан у `src/providers/`, компоненти в `src/views/analytics/` |
| III. CNG | ✅ | нативних змін немає; **development build не потрібна**, доставка OTA |
| IV. Дизайн і патерни | ✅ | артборди 14, 14a–14d, 15; нові 14e (порожній) і 14s (завантаження) та плитка ↗️ на 14 — у канвасі; патерни `navigation-bar-title`, `navigation-bar-icon-buttons`, `tab-bar`, `pickers`, `empty-state-pulse`, `user-data`, `icons`, `buttons`, `test-ids`; `pickers.md`, `user-data.md` і `README.md` оновлюються в тій самій зміні |
| V. Українська мова | ✅ | тексти з макета: «Аналітика», «Від», «До», «Витрати», «У середньому … на місяць», «Місяців заповнено», «Початкова дата», «Адреса» тощо |
| VI. Lint і typecheck | ✅ | остання задача |

Порушень немає. Повторна перевірка після Phase 1 — без змін.

## Project Structure

### Documentation (this feature)

```text
specs/013-analytics-tab/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/interfaces.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
src/app/(tabs)/analytics.tsx                      # ВИДАЛИТИ (заглушка)
src/app/(tabs)/analytics/_layout.tsx              # НОВИЙ: Stack + AnalyticsSelectionProvider
src/app/(tabs)/analytics/index.tsx                # НОВИЙ: головний екран (14, 14a–14d)
src/app/(tabs)/analytics/details.tsx              # НОВИЙ: «Витрати — деталі» (15), ?tab=
src/app/(tabs)/_layout.tsx                        # таб-бар ховається на деталях; disableAutomaticContentInsets
src/services/analytics/{types,period,summary,format,index}.ts   # НОВИЙ модуль
src/providers/analytics-selection-provider.tsx    # НОВИЙ
src/views/analytics/                              # НОВІ: period-button, date-range-sheet, address-sheet,
                                                  #   address-row, expenses-card, month-bars,
                                                  #   service-share-bar, service-row, month-row, index.ts
src/views/account-data/analytics-skeleton.tsx     # НОВИЙ, експорт в index.ts
src/constants/app-icons.tsx, icon-sizes.ts        # іконка chart 📊 і тон; тон arrowUpRight — blueSoft
src/constants/service-icons.ts                    # getServiceAccent
src/services/ledger/format.ts                     # pluralForms.record, serviceKind
docs/patterns/pickers.md, user-data.md, README.md # вибір дати й періоду; аналітика зі скелетоном
.claude/skills/ui-check/flows/analytics.flow      # НОВИЙ
канвас: project/Analytics.dc.html (↗️), нові AnalyticsEmpty / AnalyticsLoading, canvas.json   # Artifact publish
```

**Structure Decision**: стек вкладки за зразком `(tabs)/profile/`; обчислення відокремлені від UI в `src/services/analytics/`, щоб головний екран, деталі й шторка адрес мали один результат.

## Complexity Tracking

Не потрібно.
