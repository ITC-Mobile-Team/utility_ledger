import { colors } from '@/constants/colors';
import { Image } from 'expo-image';
import { type ComponentRef, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  PixelRatio,
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
// Виміряно на Android-емуляторі: знімок ~170 мс, показ ~100 мс — ліміти з
// запасом, щоб не падати на накриття фоном
const CAPTURE_TIMEOUT_MS = 400;
const DISPLAY_TIMEOUT_MS = 250;

const fadeOut = css.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

// Корінь, який знімаємо, і функції накладки ThemeTransition. Модульні, бо
// тему змінює PreferencesProvider, що лежить вище за дерево з накладкою
let snapshotRoot: RootView | null = null;
let showOverlay: ((overlay: OverlaySource) => Promise<void>) | null = null;
let releaseOverlay: (() => void) | null = null;
let currentBackground: string | null = null;

export function setThemeSnapshotRoot(view: RootView | null) {
  snapshotRoot = view;
}

// Знімок не більший за щільність 2x: на екранах 3x+ кодування повного
// розміру в JPEG займає основний час, а за 350 мс перетікання різниці не видно
const snapshotSize = () => {
  const scale = PixelRatio.get();
  if (scale <= 2) return {};
  const { width, height } = Dimensions.get('window');
  return {
    width: Math.round((width * 2) / scale),
    height: Math.round((height * 2) / scale),
  };
};

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

// Запасне накриття фоном попередньої схеми — теж ДО зміни схеми: інакше
// нативний фон вікна темніє на кадр раніше за вміст (мішаний кадр), а
// накриття зʼявляється вже після нього спалахом (видно на відео покадрово)
const coverWithBackground = async () => {
  if (!showOverlay || !currentBackground) return;
  await withTimeout(
    showOverlay({ color: currentBackground }),
    DISPLAY_TIMEOUT_MS,
    'cover',
  ).catch(() => {});
};

// Викликається перед зміною теми вибором користувача: знімає поточний
// екран і кладе знімок поверх усього, щоб після зміни схеми він розчинився
// в новій темі. Не вдалося вчасно — накриття фоном попередньої схеми
export async function captureBeforeThemeChange() {
  const startedAt = Date.now();
  if (await AccessibilityInfo.isReduceMotionEnabled()) return;
  if (!snapshotRoot || !showOverlay) {
    warnFallback('no root', startedAt);
    return;
  }
  // Стара development build без нативного модуля
  if (!hasViewShot()) {
    warnFallback('no RNViewShot', startedAt);
    await coverWithBackground();
    return;
  }
  try {
    const uri = await withTimeout(
      captureRef(snapshotRoot, {
        format: 'jpg',
        quality: 0.8,
        result: 'tmpfile',
        ...snapshotSize(),
      }),
      CAPTURE_TIMEOUT_MS,
      'capture',
    );
    await withTimeout(showOverlay({ uri }), DISPLAY_TIMEOUT_MS, 'display');
  } catch (error) {
    warnFallback(
      error instanceof Error ? error.message : String(error),
      startedAt,
    );
    await coverWithBackground();
  }
}

// Після зміни схеми накладка розчиняється, але не одразу: `setColorScheme`
// спершу перемикає нативне (фон вікна, таб-бар), а дерево RN перемальовується
// на кадр-два пізніше. Якщо розчиняти одразу, крізь накладку видно мішаний
// кадр. Тож чекаємо, доки ThemeTransition побачить нову схему, плюс два кадри
// (запасний таймер — якщо схема фактично не змінилась, напр. «Як у системі»)
export function finishThemeChange(target: Scheme) {
  awaitingScheme = target;
  releaseTimer && clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => {
    awaitingScheme = null;
    releaseOverlay?.();
  }, RELEASE_FALLBACK_MS);
}

let awaitingScheme: Scheme | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
const RELEASE_FALLBACK_MS = 300;

type OverlaySource = { uri: string } | { color: string };
type Overlay = OverlaySource & { version: number; fading: boolean };

const fadeStyle = {
  animationName: fadeOut,
  animationDuration: FADE_MS,
  animationTimingFunction: 'ease-out',
  animationFillMode: 'forwards',
} as const;

// Плавна зміна теми (docs/patterns/preferences.md). Вибір користувача:
// знімок попереднього вигляду кладеться поверх застосунку ДО зміни схеми й
// розчиняється за 350 мс — справжнє перетікання старих кольорів у нові,
// включно з таб-баром. Без знімка — так само, але фоном попередньої схеми.
// Зміна системою (момент не передбачити): накриття фоном у кадрі зміни.
// «Зменшити рух» — без анімації
export function ThemeTransition() {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState<Scheme>(scheme);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [onShown, setOnShown] = useState<(() => void) | null>(null);

  // Фон поточної схеми для запасного накриття перед зміною
  useEffect(() => {
    currentBackground = colors[current].bg;
  }, [current]);

  useEffect(() => {
    showOverlay = (source) =>
      new Promise<void>((resolve) => {
        setOnShown(() => resolve);
        setOverlay((prev) => ({
          ...source,
          version: (prev?.version ?? 0) + 1,
          fading: false,
        }));
      });
    releaseOverlay = () =>
      setOverlay((prev) => prev && { ...prev, fading: true });
    return () => {
      showOverlay = null;
      releaseOverlay = null;
    };
  }, []);

  // Нова схема вже в дереві RN — ще два кадри, щоб вона намалювалась, і
  // накладка починає розчинятися
  useEffect(() => {
    if (awaitingScheme !== scheme) return;
    awaitingScheme = null;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (releaseTimer) clearTimeout(releaseTimer);
        releaseOverlay?.();
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [scheme]);

  // Накладка, що розчинилась, прибирається
  useEffect(() => {
    if (!overlay?.fading) return;
    const timer = setTimeout(() => setOverlay(null), FADE_MS + 50);
    return () => clearTimeout(timer);
  }, [overlay]);

  // Зміна схеми без накладки (системою): накриття фоном у тому самому
  // рендері, що й нова схема
  if (current !== scheme) {
    setCurrent(scheme);
    if (!overlay && !reduceMotion) {
      setOverlay({
        color: colors[current].bg,
        // Накладки зараз немає, тож новий вузол змонтується й анімація
        // стартує з початку
        version: 0,
        fading: true,
      });
    }
  }

  const shown = () => {
    onShown?.();
    setOnShown(null);
  };

  if (!overlay) return null;

  return (
    <Animated.View
      key={`overlay-${overlay.version}`}
      pointerEvents='none'
      onLayout={'color' in overlay ? shown : undefined}
      style={[
        StyleSheet.absoluteFill,
        'color' in overlay && { backgroundColor: overlay.color },
        overlay.fading && fadeStyle,
      ]}
    >
      {'uri' in overlay && (
        <Image
          source={{ uri: overlay.uri }}
          contentFit='fill'
          transition={0}
          onDisplay={shown}
          style={StyleSheet.absoluteFill}
        />
      )}
    </Animated.View>
  );
}
