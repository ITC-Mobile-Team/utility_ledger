---

description: "Task list for removing the «+» chip from the outage queue row"
---

# Tasks: Ряд черг без кнопки «+» на екрані «Відсутність світла»

**Input**: Design documents from `/specs/001-remove-outage-add-chip/`

**Prerequisites**: plan.md, spec.md

> Перенесено з OpenSpec (`tasks.md` зміни `remove-outage-add-chip`); усі задачі виконано в коміті `18b0ce2`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: User Story 1 - Ряд черг показує лише обрані черги (Priority: P1) 🎯 MVP

**Goal**: у шапці лише чипи обраних черг, без «+».

- [x] T001 [US1] У `src/views/outages/queue-chips.tsx` прибрати чип «+» («Змінити черги»), проп `onAdd`, стиль `add` і непотрібний імпорт `AppImage`; оновити коментар над компонентом — перевірка: у файлі немає `onAdd`, `icon='plus'` і `styles.add`
- [x] T002 [US1] У `src/app/(tabs)/(outages)/index.tsx` більше не передавати `onAdd` у `QueueChips` (шестерня `settingsButton` і `openSettings` для порожніх станів лишаються) — перевірка: `grep -n onAdd src` нічого не знаходить
- [x] T003 [P] [US1] Оновити розділ «Вигляд» у `docs/patterns/outage-providers.md`: у шапці під підзаголовком лише чипи обраних черг, черги змінюються через шестерню — перевірка: у файлі немає згадки «+» про ряд черг
- [x] T004 [P] [US1] У канвасі (посилання в `docs/design.md`) прибрати з `project/Outage.dc.html` елемент `<a class="chip" … aria-label="Додати чергу">` і опублікувати оновлену версію — перевірка: на артбордах 20, 20a, 20b, 20l, 20s у ряду черг лише чипи черг

**Checkpoint**: ряд черг без «+».

---

## Phase 2: User Story 2 - Зміна черг через шестерню в навбарі (Priority: P1)

- [x] T005 [US2] Відкрити вкладку «Відсутність світла» з двома обраними чергами (1.1 і 3.1) у симуляторі — перевірка: у ряду лише чипи «1.1» і «3.1», перемикання працює, шестерня відкриває «Налаштування», після додавання черги її чип зʼявляється в ряду

---

## Phase 3: Polish

- [x] T006 Запустити `npx expo lint` і `npx tsc --noEmit` та виправити помилки — перевірка: обидві команди завершуються без помилок
