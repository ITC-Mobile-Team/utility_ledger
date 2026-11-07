import { iconTiles } from '@/constants/icon-sizes';
import { StyleSheet } from 'react-native';
import { Pressable, type PressableProps } from './pressable';
import { type AppIcon } from '@/constants/app-icons';
import type { AppColor } from '@/constants/colors';
import { HStack, VStack } from './stack';
import { ThemedText, type AppFont } from './themed-text';
import { IconView } from './icon-view';

type TransparentActionButtonProps = PressableProps & {
  icon?: AppIcon;
  iconBackground?: AppColor;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export function TransparentActionButton({
  icon,
  iconBackground,
  title,
  subtitle,
  disabled,
  style,
  ...rest
}: TransparentActionButtonProps) {
  const isFull = icon != null;
  const paddingVertical = isFull ? 14 : 8;
  const paddingHorizontal = isFull ? 16 : 14;
  const titleFont: AppFont = isFull ? 'rowTitle' : 'segment';
  const borderRadius = isFull ? 22 : 999;
  return (
    <Pressable
      style={(state) => [
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
        styles.button,
        { borderRadius: borderRadius },
      ]}
      {...rest}
    >
      <HStack
        align='center'
        spacing={10}
        style={{
          paddingVertical: paddingVertical,
          paddingHorizontal: paddingHorizontal,
        }}
      >
        {isFull && <IconView icon={icon} size={{ width: iconTiles.menu }} />}
        <VStack>
          <ThemedText color='onPrimary' font={titleFont}>
            {title}
          </ThemedText>
          {subtitle && <ThemedText color='onPrimary'>{subtitle}</ThemedText>}
        </VStack>
      </HStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  pressed: {
    opacity: 0.5,
  },
});
