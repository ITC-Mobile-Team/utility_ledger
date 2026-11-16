---

description: "Task list for 012-unified-navbar-glass"
---

# Tasks: Єдиний навбар і кнопки з рідкого скла

**Input**: Design documents from `/specs/012-unified-navbar-glass/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/interfaces.md](contracts/interfaces.md), [quickstart.md](quickstart.md)

**Tests**: автотестів специфікація не вимагає. Перевірка — `ui-check` (`navbar.flow`), скріншоти кнопок і [quickstart.md](quickstart.md).

**Organization**: US1 — скляні кнопки, US2 — канвас.

> **Оновлено 2026-11-16.** Перша редакція мала US2 «навбар без згортання» (T008–T023, T029, T030, T032, T033). Після уточнення користувача («поведінка має лишатися як до цього») ці задачі скасовано: зроблений код без згортання відкочено до коміту, згортання не змінювалось. Номери нижче — нові.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (різні файли, без залежностей)
- **[Story]**: US1, US2 зі [spec.md](spec.md)

---

## Phase 1: Setup

Підготовки не потрібно: `expo-glass-effect` уже в проєкті й нативній збірці (research R8).

---

## Phase 2: Foundational

Блокувальних задач немає.

---

## Phase 3: User Story 1 - Кнопки навбару зі скла (Priority: P1) 🎯 MVP

**Goal**: «Назад», ⚙️ і 📅 — однакові круглі кнопки 44×44: рідке скло на iOS 26+, однакова підкладка деінде; згортання навбару без змін.

**Independent Test**: quickstart 1–5, 7–10.

- [X] T001 [P] [US1] Створити `src/hooks/use-liquid-glass.ts`: `useLiquidGlass()` — iOS, `isGlassEffectAPIAvailable()`, `isLiquidGlassAvailable()` і вимкнене «Зменшити прозорість» з підпискою на `reduceTransparencyChanged`; до перевірки — `false`. FR-002, FR-003
- [X] T002 [US1] Переписати `src/components/navigation-bar/navigation-bar-icon-button.tsx` за contracts/interfaces.md: `content` (`icon` | `back`), `tone` (`colored` | `plain`), `GlassView` (`clear`/`regular`, `isInteractive`, тема застосунку) або запасна підкладка, `Pressable` з замком, без opacity на склі. FR-001–FR-003, FR-007
- [X] T003 [US1] У `src/components/navigation-bar/navigation-bar-header.tsx` рендерити «Назад» через `NavigationBarIconButton` (`tone` за `isTransparent`, `testID='navigationBar.back'`), коло з `marginStart: HORIZONTAL_PADDING`, короткий заголовок на 8 pt після кнопки; анімації згортання не чіпати. FR-004, FR-006
- [X] T004 [US1] `src/app/(tabs)/(outages)/index.tsx`: ⚙️ з `content={{ icon: 'gear' }}`, `tone='colored'`. FR-001
- [X] T005 [US1] `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx`: чип «Місяць» → `NavigationBarIconButton` (`calendar`, `colored`, «Змінити місяць», `month.change`), умова `!isReadOnly` лишається. FR-005
- [X] T006 [US1] Видалити `src/components/navigation-bar/navigation-bar-chip.tsx` і експорт з `src/components/navigation-bar/index.ts`; оновити коментар `headerAccessory` у `src/components/navigation-bar/types.ts`
- [X] T007 [US1] Патерн `docs/patterns/navigation-bar-icon-buttons.md`, рядок у `docs/patterns/README.md`, згадки чипа й вирівнювання «Назад» у `docs/patterns/navigation-bar-title.md`, `test-ids.md`, `pickers.md`, `outage-providers.md`. FR-009
- [X] T008 [US1] `ui-check` `.claude/skills/ui-check/flows/navbar.flow` без змін — згортання як раніше (SC-002); скріншоти «Назад», ⚙️ і 📅 на кольоровому навбарі в iOS Simulator (iOS 27.2)
- [ ] T009 [US1] Доперевірити в iOS Simulator (quickstart 2, 8, 9): «Назад» на прозорому навбарі («Додати показник», сума з рахунку) у світлій і темній темі; запасний вигляд з увімкненим «Зменшити прозорість» і перемикання на ходу; відгук `isInteractive` під `Pressable` (ризик research R2). Якщо відгуку немає — зробити `GlassView` коренем кнопки й зафіксувати рішення в `research.md` R2. SC-001, SC-004

**Checkpoint**: кнопки рядка навбару однакові й скляні; навбар поводиться як раніше.

---

## Phase 4: User Story 2 - Канвас збігається із застосунком (Priority: P2)

**Goal**: артборди показують ті самі скляні кнопки (`docs/design.md`).

**Independent Test**: quickstart 11.

- [ ] T010 [US2] Прочитати канвас (`Artifact` `read`, `https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj`): `project/ui.css`, артборди з `class="back"`, шестернею ⚙️ і чипом «Місяць». У `project/ui.css` перевести `.back` на скляне коло 44 (`border-radius: 22px`, `backdrop-filter: blur(...)`, на `.hero` — `rgba(255,255,255,.18)` з обвідкою `.5px rgba(255,255,255,.35)`; `.back.dark` на білому — `var(--glass-bg)` і `var(--glass-rim)`; відблиск `inset 0 1px 0 var(--glass-hi)`) без `margin-left: -10px`, і додати клас `.glass-btn` з тим самим виглядом для ⚙️ і 📅. FR-008
- [ ] T011 [US2] Артборди «Світла» (20, 20a–20e, 20l, 20s): шестерню перевести з `.chip` на `.glass-btn`. Артборди місяця (09, 09b, 09d–09i): чип «Місяць» → `.glass-btn` з 📅 (`aria-label="Змінити місяць"`) праворуч у `.hero-row`. FR-005, FR-008
- [ ] T012 [US2] Опублікувати змінені файли канваса (`Artifact` publish з `url` канваса, лише змінені `files`) і перечитати 09, 10, 20 для звірки з екранами. SC-003

---

## Phase 5: Polish

- [ ] T013 У `specs/012-unified-navbar-glass/spec.md` — **Status**: Implemented і підсумок українською
- [ ] T014 `npx expo lint` і `npx tsc --noEmit` з кореня проєкту без помилок (конституція VI)

## Dependencies

T001 → T002 → T003–T006 → T007–T009. US2 (T010 → T011 → T012) від коду не залежить. T013, T014 — останні.
