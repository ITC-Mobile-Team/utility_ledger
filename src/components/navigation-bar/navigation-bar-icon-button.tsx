import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { type AppIcon } from '@/constants/app-icons';
import { iconTiles } from '@/constants/icon-sizes';
import { useLiquidGlass } from '@/hooks/use-liquid-glass';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { AppImage } from '../app-image';
import { Pressable } from '../pressable';

const SIZE = iconTiles.touch;
const BACK_ICON_SIZE = 22;

type NavigationBarIconButtonProps = {
  // Вміст: emoji-іконка або стрілка «Назад»
  content: { icon: AppIcon } | { kind: 'back' };
  // Тон за фоном навбару: 'colored' — градієнт, 'plain' — прозорий навбар
  tone: 'colored' | 'plain';
  accessibilityLabel: string;
  testID?: string;
  onPress: () => void;
};

// Кругла кнопка рядка навбару: «Назад», «Налаштування», вибір місяця.
// На iOS 26+ — системне рідке скло (на кольоровому навбарі clear, щоб
// просвічував градієнт), деінде й з «Зменшити прозорість» — напівпрозора
// підкладка того самого розміру. На склі й предках opacity < 1 не можна:
// за малої прозорості скло не малюється, тож відгук дає саме скло
// (isInteractive), а opacity натискання — лише запасному вигляду
export function NavigationBarIconButton({
  content,
  tone,
  accessibilityLabel,
  testID,
  onPress,
}: NavigationBarIconButtonProps) {
  const hasGlass = useLiquidGlass();
  const scheme = useColorScheme() ?? 'light';
  const plainBackground = useThemeColor('surface2');
  const plainBorder = useThemeColor('line');
  const backTint = useThemeColor(tone === 'colored' ? 'onPrimary' : 'coral');

  const icon =
    'kind' in content ? (
      <Image
        source={require('@/assets/images/icons/arrow-back.svg')}
        contentFit='contain'
        tintColor={backTint}
        style={styles.backIcon}
      />
    ) : (
      <AppImage icon={content.icon} container={SIZE} />
    );

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={(state) => [
        styles.button,
        !hasGlass &&
          (tone === 'colored'
            ? styles.coloredFallback
            : { backgroundColor: plainBackground, borderColor: plainBorder }),
        !hasGlass && styles.fallbackBorder,
        !hasGlass && state.pressed && styles.pressed,
      ]}
    >
      {hasGlass && (
        <GlassView
          glassEffectStyle={tone === 'colored' ? 'clear' : 'regular'}
          isInteractive
          colorScheme={scheme}
          style={styles.glass}
        />
      )}
      <View pointerEvents='none' style={styles.content}>
        {icon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  glass: {
    position: 'absolute',
    inset: 0,
    borderRadius: SIZE / 2,
  },
  content: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coloredFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  fallbackBorder: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  backIcon: {
    width: BACK_ICON_SIZE,
    height: BACK_ICON_SIZE,
  },
  pressed: {
    opacity: 0.7,
  },
});
