# testID для UI-перевірок

UI-сценарії (`.claude/skills/ui-check`) знаходять елементи за `testID` — на iOS він стає accessibility identifier. Без нього сценарій тримається за тексти, які ламаються від правки копірайту чи перекладу.

- Ставимо `testID` на те, з чим взаємодіє або що перевіряє сценарій: кнопки й рядки (`Pressable` з `@/components` передає його далі), поля вводу, контейнери списків, які скролимо, і корінь екрана.
- Схема: `екран.компонент.елемент` у camelCase — `objects.addButton`, `objectForm.name`, `outageSettings.queue.3`. Однакові елементи в списках розрізняємо індексом або id даних (`objects.card.<objectId>`).
- `testID` ставимо на сам `Pressable`, а не на `Text` усередині: `Pressable` — один accessible-елемент, і дочірні тексти в дереві окремо не видно.
- Кнопкам, які не `ActionButton`/`TextButton`, додаємо `accessibilityRole="button"` — тоді вони і для VoiceOver кнопки, і в дереві `role=button`.
- Нативні таби (`role=tab`) шукаємо за `label`, testID на них не ставимо.
- `testID` не перекладаємо і не формуємо з тексту — лише з назви екрана й даних.
