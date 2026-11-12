import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSunCycle } from './use-sun-cycle';

export type LogoSceneVariant = 'day' | 'night' | 'split';

type LogoSceneProps = {
  variant: LogoSceneVariant;
  // Світило рухається дугою, тінь будинку повертається протилежно (як на
  // splash). Без анімації — світило у вершині дуги
  animated: boolean;
  height?: number;
};

const markSource = require('@/assets/images/app/splash-icon.png');
// splash-icon.png: знак 132 на полотні 288
const MARK_RATIO = 288 / 132;

const SKY = {
  day: ['#2F6FD0', '#5C97E6', '#9CC3F3'],
  night: ['#0B1226', '#16213F', '#26335A'],
} as const;

// Зірки нічного неба: частки ширини й висоти сцени
const STARS = [
  [0.12, 0.2, 2],
  [0.24, 0.42, 1.5],
  [0.36, 0.14, 1.5],
  [0.64, 0.24, 2],
  [0.78, 0.12, 1.5],
  [0.88, 0.38, 2],
  [0.52, 0.08, 1],
] as const;

// Сцена знака застосунку для вибору теми: «Світла» — денне небо й сонце,
// «Темна» — нічне небо, місяць і зірки, «Як у системі» — навпіл.
// Декоративна: читач екрана її пропускає
export function LogoScene({ variant, animated, height = 132 }: LogoSceneProps) {
  const [width, setWidth] = useState(0);
  const sun = useSunCycle(animated);

  return (
    <View
      style={[styles.root, { height }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      pointerEvents='none'
    >
      {width > 0 &&
        (variant === 'split' ? (
          <>
            <View style={[styles.half, { width: width / 2 }]}>
              <Scene time='day' width={width} height={height} sun={sun} />
            </View>
            <View style={[styles.half, styles.right, { width: width / 2 }]}>
              <View style={{ marginLeft: -width / 2 }}>
                <Scene time='night' width={width} height={height} sun={sun} />
              </View>
            </View>
          </>
        ) : (
          <Scene time={variant} width={width} height={height} sun={sun} />
        ))}
    </View>
  );
}

type SceneProps = {
  time: 'day' | 'night';
  width: number;
  height: number;
  sun: SharedValue<number>;
};

function Scene({ time, width, height, sun }: SceneProps) {
  const isNight = time === 'night';
  const markSize = height * 0.5;
  const markCanvas = markSize * MARK_RATIO;
  const centerX = width / 2;
  const markCenterY = height * 0.62;
  const orb = height * 0.24;
  // Дуга світила: від країв (низько) до вершини над будинком
  const arcHalf = Math.min(width * 0.36, 150);
  const arcLow = height * 0.36;
  const arcHigh = height * 0.12;

  const orbStyle = useAnimatedStyle(() => {
    const p = sun.get();
    return {
      transform: [
        { translateX: -arcHalf + 2 * arcHalf * p },
        { translateY: arcLow - (arcLow - arcHigh) * Math.sin(Math.PI * p) },
      ],
    };
  });
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-38 + 76 * sun.get()}deg` }],
  }));

  return (
    <View style={{ width, height }}>
      <LinearGradient
        colors={isNight ? SKY.night : SKY.day}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {isNight &&
        STARS.map(([x, y, size]) => (
          <View
            key={`${x}-${y}`}
            style={[
              styles.star,
              {
                left: x * width,
                top: y * height,
                width: size * 2,
                height: size * 2,
                borderRadius: size,
              },
            ]}
          />
        ))}
      <Animated.View
        style={[
          styles.orbWrap,
          { left: centerX - orb / 2, top: -orb / 2, width: orb, height: orb },
          orbStyle,
        ]}
      >
        {isNight ? (
          <View style={[styles.moon, { borderRadius: orb / 2 }]}>
            {/* Серп: тінь неба накриває частину диска */}
            <View
              style={[
                styles.moonCut,
                {
                  width: orb,
                  height: orb,
                  borderRadius: orb / 2,
                  left: orb * 0.32,
                  top: -orb * 0.12,
                },
              ]}
            />
          </View>
        ) : (
          <View style={[styles.sun, { borderRadius: orb / 2 }]} />
        )}
      </Animated.View>
      <Animated.View
        style={[
          styles.shadow,
          {
            left: centerX - markSize * 0.45,
            top: markCenterY,
            width: markSize * 0.9,
            height: height,
          },
          shadowStyle,
        ]}
      />
      <Image
        source={markSource}
        contentFit='contain'
        style={{
          position: 'absolute',
          width: markCanvas,
          height: markCanvas,
          left: centerX - markCanvas / 2,
          top: markCenterY - markCanvas / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  half: {
    height: '100%',
    overflow: 'hidden',
  },
  right: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  orbWrap: {
    position: 'absolute',
  },
  sun: {
    flex: 1,
    backgroundColor: '#FFD86B',
    boxShadow: '0 0 18px 6px rgba(255,216,107,0.55)',
  },
  moon: {
    flex: 1,
    backgroundColor: '#F3EEDC',
    overflow: 'hidden',
    boxShadow: '0 0 14px 3px rgba(243,238,220,0.35)',
  },
  moonCut: {
    position: 'absolute',
    backgroundColor: '#16213F',
  },
  // Тінь будинку: еліптичний градієнт від середини знака, повертається
  // протилежно до світила
  shadow: {
    position: 'absolute',
    transformOrigin: 'top',
    backgroundImage:
      'radial-gradient(ellipse at top, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0) 85%)',
  },
});
