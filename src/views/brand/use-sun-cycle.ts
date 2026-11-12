import { useEffect } from 'react';
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Положення «сонця» на дузі над знаком застосунку: 0 — ліворуч, 0.5 —
// вершина, 1 — праворуч. Спільне для splash і сцен вибору теми
// (docs/patterns/splash.md). Цикл стартує з вершини: 3,5 с до краю, далі
// 7 с туди й назад. Без анімації чи при «Зменшити рух» — вершина дуги
export function useSunCycle(animated = true) {
  const reduceMotion = useReducedMotion();
  const sun = useSharedValue(0.5);

  useEffect(() => {
    if (!animated || reduceMotion) {
      sun.set(reduceMotion ? 0.5 : withTiming(0.5, { duration: 400 }));
      return;
    }
    const easing = Easing.inOut(Easing.ease);
    sun.set(
      withSequence(
        withTiming(1, { duration: 3500, easing }),
        withRepeat(withTiming(0, { duration: 7000, easing }), -1, true),
      ),
    );
  }, [animated, reduceMotion, sun]);

  return sun;
}
