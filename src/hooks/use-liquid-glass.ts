import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

// Системне рідке скло можна малювати: iOS 26+ з API скла (деякі бети iOS 26
// його не мають і падають) і вимкнене «Зменшити прозорість».
// isLiquidGlassAvailable() може повернути true і за увімкненого налаштування,
// тож його перевіряємо окремо й слухаємо зміни на ходу.
// Поки асинхронна перевірка не завершилась — false: спершу запасний вигляд,
// без мерехтіння скла
const isGlassSupported =
  Platform.OS === 'ios' &&
  isGlassEffectAPIAvailable() &&
  isLiquidGlassAvailable();

export function useLiquidGlass(): boolean {
  const [isReduceTransparency, setReduceTransparency] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (!isGlassSupported) return;
    let isMounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
      if (isMounted) setReduceTransparency(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return isGlassSupported && isReduceTransparency === false;
}
