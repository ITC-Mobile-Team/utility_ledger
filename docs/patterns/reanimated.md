# Shared values і React Compiler

У проєкті ввімкнений React Compiler (`transform.reactCompiler`). Він мемоізує колбеки компонента й додає в залежності все, що вони читають. Якщо воркет читає `sv.value`, компілятор порівнює `sv.value` під час рендеру, і Reanimated у strict-режимі пише варнінг «Reading from `value` during component render».

## Правило

- У воркетах, які ми передаємо в сторонні хуки або пропси (`useKeyboardHandler`, жести, колбеки `withTiming` тощо), читаємо й пишемо shared values лише через `sv.get()` / `sv.set(...)`.
- У звичайному JS-коді компонента (обробники подій, `useEffect`) теж використовуємо `get()` / `set()`.
- Ніколи не читаємо shared value безпосередньо в тілі компонента. Значення, потрібне для рендеру, переносимо в стан через `useAnimatedReaction` + `scheduleOnRN`.

Приклад: [navigation-view.tsx](../../src/components/navigation-view.tsx), обробник клавіатури.
