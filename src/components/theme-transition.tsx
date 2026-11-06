import { colors } from '@/constants/colors';
import { useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, { css } from 'react-native-reanimated';

type Scheme = 'light' | 'dark';

const fadeOut = css.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

// Накриття, що гасне при зміні теми: на мить фон попередньої схеми закриває
// застосунок і плавно розчиняється, тож перемикання не різке. Анімація
// стартує в тому самому кадрі, де змінилась тема, а `key` перезапускає її від
// повної непрозорості, якщо тему змінили знову до завершення (проміжні теми
// не лишаються видимими)
export function ThemeTransition() {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [current, setCurrent] = useState<Scheme>(scheme);
  const [veil, setVeil] = useState<{ color: string; version: number } | null>(
    null,
  );

  // Похідний стан під час рендеру: накриття зʼявляється в тому самому кадрі
  if (current !== scheme) {
    setCurrent(scheme);
    setVeil({
      color: colors[current].bg,
      version: (veil?.version ?? 0) + 1,
    });
  }

  if (!veil) return null;

  return (
    <Animated.View
      key={veil.version}
      pointerEvents='none'
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: veil.color,
          animationName: fadeOut,
          animationDuration: 250,
          animationTimingFunction: 'ease-out',
          animationFillMode: 'forwards',
        },
      ]}
    />
  );
}
