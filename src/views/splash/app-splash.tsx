import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSunCycle } from '../brand/use-sun-cycle';
import { useSplashGate } from './use-splash-gate';

// Колір системного splash (app.json) — перший кадр накладки той самий
const BACKGROUND = '#14213A';
// splash-icon.png: полотно 288, знак у ньому 132 (як imageWidth у app.json)
const MARK_CANVAS = 288;
const MARK_SIZE = 132;
// На iOS системний splash — повноекранне splash-full-ios.png (402×874 pt) з
// градієнтом накладки й знаком, показане з `cover`; перший кадр накладки —
// те саме зображення з тією самою геометрією
const IS_IOS = Platform.OS === 'ios';
const FULL_WIDTH = 402;
const FULL_HEIGHT = 874;
// iOS: сонце, тінь і текст проявляються м'якше, бо градієнт уже на екрані
const APPEAR = IS_IOS
  ? { duration: 500, easing: Easing.inOut(Easing.ease) }
  : { duration: 300 };
const SUN_SIZE = 960;
const SHADOW_WIDTH = 220;
const SHADOW_HEIGHT = 1000;

const markSource = require('@/assets/images/app/splash-icon.png');
const fullSource = require('@/assets/images/app/splash-full-ios.png');

// Накладка показується один раз за процес: при вході/виході дерево під
// AccountDataProvider перемонтовується, і splash не має зʼявитися знову
let splashFinished = false;

// Анімований splash (артборд «00 · Splash», docs/patterns/splash.md):
// перший кадр збігається з системним splash і ховає його, далі проявляються
// градієнт, «сонце» над будинком і тінь, що хитається протилежно
export function AppSplash() {
  const [done, setDone] = useState(splashFinished);
  if (done) return null;
  return <SplashOverlay onFinish={() => setDone(true)} />;
}

function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  // Момент, коли накладка справді показана (системний splash сховано):
  // від нього рахуються мінімальна секунда й чекання даних
  const [shownAt, setShownAt] = useState<number | null>(null);
  const canHide = useSplashGate(shownAt);
  // Системний splash ховаємо, коли накладка розмічена і перший кадр уже
  // намальований (знак, на iOS — повноекранне зображення): expo-image вантажить
  // картинку асинхронно, і без цього на мить видно фон без знака
  const firstFrame = useRef({ laidOut: false, markShown: false, done: false });

  const appear = useSharedValue(0);
  const opacity = useSharedValue(1);
  // Сонце стартує з вершини дуги — світла пляма проявляється над будинком,
  // а не збоку, — далі цикл 7 с туди й назад (спільний зі сценами теми)
  const sun = useSunCycle();

  useEffect(() => {
    if (!canHide) return;
    opacity.set(
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) scheduleOnRN(finish);
      }),
    );
    function finish() {
      splashFinished = true;
      onFinish();
    }
  }, [canHide, opacity, onFinish]);

  const revealIfReady = (step: 'laidOut' | 'markShown') => {
    const frame = firstFrame.current;
    frame[step] = true;
    if (frame.done || !frame.laidOut || !frame.markShown) return;
    frame.done = true;
    SplashScreen.hide();
    appear.set(withTiming(1, APPEAR));
    setShownAt(Date.now());
  };
  const revealFallback = useEffectEvent(() => revealIfReady('markShown'));

  // Запасний шлях: якщо подія показу знака не прийде, не тримати системний
  // splash довше за пів секунди
  useEffect(() => {
    const timer = setTimeout(revealFallback, 500);
    return () => clearTimeout(timer);
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const appearStyle = useAnimatedStyle(() => ({ opacity: appear.get() }));
  // Дуга з ключових кадрів артборда: (−170, 40) → (0, −60) → (170, 40)
  const sunStyle = useAnimatedStyle(() => {
    const p = sun.get();
    return {
      transform: [
        { translateX: -170 + 340 * p },
        { translateY: 40 - 100 * Math.sin(Math.PI * p) },
      ],
    };
  });
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-38 + 76 * sun.get()}deg` }],
  }));

  const centerX = width / 2;
  const centerY = height / 2;
  // Масштаб знака: на iOS як у `cover` повноекранного зображення, на Android 1
  const scale = IS_IOS ? Math.max(width / FULL_WIDTH, height / FULL_HEIGHT) : 1;
  const markCanvas = MARK_CANVAS * scale;
  // Низ знака: будинок у полотні 132 закінчується на y = 127
  const markBottom = centerY + (127 - MARK_SIZE / 2) * scale;

  return (
    <Animated.View
      testID='splash'
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel='Utility Ledger, завантаження'
      // Під час згасання дотики вже йдуть до застосунку
      pointerEvents={canHide ? 'none' : 'auto'}
      onLayout={() => revealIfReady('laidOut')}
      style={[styles.root, rootStyle]}
    >
      <StatusBar style='light' />
      {IS_IOS && (
        <Image
          source={fullSource}
          contentFit='cover'
          onDisplay={() => revealIfReady('markShown')}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Animated.View
        pointerEvents='none'
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        style={[StyleSheet.absoluteFill, appearStyle]}
      >
        {/* На iOS градієнт уже в повноекранному зображенні */}
        {!IS_IOS && (
          <LinearGradient
            colors={['#2B3A52', '#14213A', '#0B1424']}
            locations={[0, 0.48, 1]}
            // 160°: зверху трохи ліворуч донизу трохи праворуч
            start={{ x: 0.32, y: 0 }}
            end={{ x: 0.68, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Animated.View
          style={[
            styles.sun,
            { left: centerX - SUN_SIZE / 2, top: 120 - SUN_SIZE / 2 },
            sunStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.shadow,
            {
              left: centerX - SHADOW_WIDTH / 2,
              // Тінь падає від середини будинку, під знаком
              top: centerY,
            },
            shadowStyle,
          ]}
        />
      </Animated.View>

      {/* Знак над тінню; на iOS точно накриває знак повноекранного зображення */}
      <Image
        source={markSource}
        contentFit='contain'
        onDisplay={IS_IOS ? undefined : () => revealIfReady('markShown')}
        style={[
          styles.mark,
          {
            width: markCanvas,
            height: markCanvas,
            left: centerX - markCanvas / 2,
            top: centerY - markCanvas / 2,
          },
        ]}
      />

      <Animated.View
        style={[styles.title, { top: markBottom + 28 }, appearStyle]}
      >
        <Text style={styles.titleText}>Utility Ledger</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, appearStyle]}>
        <ActivityIndicator
          testID='splash.progress'
          size='large'
          color='#FFFFFF'
        />
        <Text style={styles.footerText}>Комуналка під контролем</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: BACKGROUND,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    width: SUN_SIZE,
    height: SUN_SIZE,
    borderRadius: SUN_SIZE / 2,
    backgroundImage:
      'radial-gradient(circle, rgba(255,236,200,0.20) 0%, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0) 60%)',
  },
  // Замість linear-gradient + mask + blur з артборда (mask у RN немає, blur
  // лише на Android) — еліптичний радіальний градієнт від верху
  shadow: {
    position: 'absolute',
    width: SHADOW_WIDTH,
    height: SHADOW_HEIGHT,
    transformOrigin: 'top',
    backgroundImage:
      'radial-gradient(ellipse at top, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0) 85%)',
  },
  mark: {
    position: 'absolute',
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'Onest',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.6,
    lineHeight: 44,
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 58,
    alignItems: 'center',
    gap: 14,
  },
  footerText: {
    fontFamily: 'Onest',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.62)',
  },
});
