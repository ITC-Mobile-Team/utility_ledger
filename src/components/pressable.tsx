import {
  Pressable as RNPressable,
  type PressableProps as RNPressableProps,
} from 'react-native';
import {
  Pressable as RNGHPressable,
  type PressableProps as RNGHPressableProps,
} from 'react-native-gesture-handler';

// Скільки після спрацьованого натискання ігноруються наступні. Вистачає, щоб
// новий екран чи шторка почали зʼявлятися й перекрили кнопку
export const PRESS_LOCK_MS = 500;

// Один замок на весь застосунок: блокує і подвійний тап по тій самій кнопці,
// і майже одночасний тап по двох різних (два рядки → два екрани)
let lockedUntil = 0;

// true — натискання можна обробити, і замок взято на PRESS_LOCK_MS
export function acquirePressLock(): boolean {
  const now = Date.now();
  if (now < lockedUntil) {
    return false;
  }
  lockedUntil = now + PRESS_LOCK_MS;
  return true;
}

// Обгортає обробник, щоб він спрацьовував не частіше за замок.
// Для місць, де натискання приходить не з Pressable (напр. колбеки навбару)
export function guardPress<Args extends unknown[]>(
  handler: (...args: Args) => void,
): (...args: Args) => void;
export function guardPress<Args extends unknown[]>(
  handler: ((...args: Args) => void) | null | undefined,
): ((...args: Args) => void) | undefined;
export function guardPress<Args extends unknown[]>(
  handler: ((...args: Args) => void) | null | undefined,
) {
  if (!handler) {
    return undefined;
  }
  return (...args: Args) => {
    if (acquirePressLock()) {
      handler(...args);
    }
  };
}

type GuardProps = {
  // false — лише для локальних змін стану, які нормально тапати часто
  // (степер, вибір клітинки, фокус поля, розгортання рядка). Таке натискання
  // не перевіряє й не бере замок
  guarded?: boolean;
};

export type PressableProps = RNPressableProps & GuardProps;

// Pressable застосунку: використовуй замість Pressable з react-native
export function Pressable({
  guarded = true,
  onPress,
  onLongPress,
  ...rest
}: PressableProps) {
  return (
    <RNPressable
      onPress={guarded ? guardPress(onPress) : onPress}
      onLongPress={guarded ? guardPress(onLongPress) : onLongPress}
      {...rest}
    />
  );
}

export type GesturePressableProps = RNGHPressableProps & GuardProps;

// Те саме для Pressable з gesture-handler — у рядках, які свайпають
export function GesturePressable({
  guarded = true,
  onPress,
  onLongPress,
  ...rest
}: GesturePressableProps) {
  return (
    <RNGHPressable
      onPress={guarded ? guardPress(onPress) : onPress}
      onLongPress={guarded ? guardPress(onLongPress) : onLongPress}
      {...rest}
    />
  );
}
