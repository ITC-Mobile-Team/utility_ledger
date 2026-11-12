import { colors } from '@/constants/colors';
import { Image } from 'expo-image';
import { type ComponentRef, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  TurboModuleRegistry,
  useColorScheme,
  type View,
} from 'react-native';

import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

type RootView = ComponentRef<typeof View>;
type Scheme = 'light' | 'dark';

const FADE_MS = 350;
// Скільки чекаємо знімок і його показ, перш ніж змінити тему без нього
const CAPTURE_TIMEOUT_MS = 150;
const DISPLAY_TIMEOUT_MS = 100;

const fadeOut = css.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

// Корінь, який знімаємо, і функції накладки ThemeTransition. Модульні, бо
// тему змінює PreferencesProvider, що лежить вище за дерево з накладкою
let snapshotRoot: RootView | null = null;
let showSnapshot: ((uri: string) => Promise<void>) | null = null;
let releaseSnapshot: (() => void) | null = null;

export function setThemeSnapshotRoot(view: RootView | null) {
  snapshotRoot = view;
}

const hasViewShot = () => TurboModuleRegistry.get('RNViewShot') !== null;

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} > ${ms} мс`)), ms),
    ),
  ]);

const warnFallback = (reason: string, startedAt: number) => {
  if (__DEV__) {
    console.warn('[theme] snapshot fallback', reason, Date.now() - startedAt);
  }
};

// Викликається перед зміною теми вибором користувача: знімає поточний
// екран і кладе знімок поверх усього, щоб після зміни схеми він розчинився
// в новій темі. Не вдалося вчасно — тема зміниться з накриттям фоном
export async function captureBeforeThemeChange() {
  const startedAt = Date.now();
  if (await AccessibilityInfo.isReduceMotionEnabled()) return;
  if (!snapshotRoot || !showSnapshot) {
    warnFallback('no root', startedAt);
    return;
  }
  // Стара development build без нативного модуля
  if (!hasViewShot()) {
    warnFallback('no RNViewShot', startedAt);
    return;
  }
  try {
    const uri = await withTimeout(
      captureRef(snapshotRoot, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      }),
      CAPTURE_TIMEOUT_MS,
      'capture',
    );
    await withTimeout(showSnapshot(uri), DISPLAY_TIMEOUT_MS, 'display');
  } catch (error) {
    releaseSnapshot?.();
    warnFallback(
      error instanceof Error ? error.message : String(error),
      startedAt,
    );
  }
}

// Після зміни схеми: знімок починає розчинятися
export function finishThemeChange() {
  releaseSnapshot?.();
}

type Snapshot = { uri: string; version: number; fading: boolean };
type Veil = { color: string; version: number };

// Плавна зміна теми (docs/patterns/preferences.md). Вибір користувача:
// знімок попереднього вигляду лежить поверх застосунку й розчиняється за
// 350 мс — справжнє перетікання старих кольорів у нові, включно з таб-баром.
// Зміна системою чи без знімка: на мить фон попередньої схеми накриває
// застосунок і розчиняється. «Зменшити рух» — без анімації
export function ThemeTransition() {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState<Scheme>(scheme);
  const [veil, setVeil] = useState<Veil | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [onDisplay, setOnDisplay] = useState<(() => void) | null>(null);

  useEffect(() => {
    showSnapshot = (uri) =>
      new Promise<void>((resolve) => {
        setOnDisplay(() => resolve);
        setSnapshot((prev) => ({
          uri,
          version: (prev?.version ?? 0) + 1,
          fading: false,
        }));
      });
    releaseSnapshot = () =>
      setSnapshot((prev) => prev && { ...prev, fading: true });
    return () => {
      showSnapshot = null;
      releaseSnapshot = null;
    };
  }, []);

  // Знімок, що розчинився, прибираємо
  useEffect(() => {
    if (!snapshot?.fading) return;
    const timer = setTimeout(() => setSnapshot(null), FADE_MS + 50);
    return () => clearTimeout(timer);
  }, [snapshot]);

  // Похідний стан під час рендеру: накриття зʼявляється в тому самому кадрі,
  // що й нова схема. Зі знімком накриття не потрібне
  if (current !== scheme) {
    setCurrent(scheme);
    if (!snapshot && !reduceMotion) {
      setVeil({ color: colors[current].bg, version: (veil?.version ?? 0) + 1 });
    }
  }

  return (
    <>
      {snapshot && (
        <Animated.View
          key={`snapshot-${snapshot.version}`}
          pointerEvents='none'
          style={[
            StyleSheet.absoluteFill,
            snapshot.fading && {
              animationName: fadeOut,
              animationDuration: FADE_MS,
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
            },
          ]}
        >
          <Image
            source={{ uri: snapshot.uri }}
            contentFit='fill'
            transition={0}
            onDisplay={() => {
              onDisplay?.();
              setOnDisplay(null);
            }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      {veil && !snapshot && (
        <Animated.View
          key={`veil-${veil.version}`}
          pointerEvents='none'
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: veil.color,
              animationName: fadeOut,
              animationDuration: FADE_MS,
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
            },
          ]}
        />
      )}
    </>
  );
}
