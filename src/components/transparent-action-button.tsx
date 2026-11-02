import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { appIcons, type AppIcon } from '@/constants/app-icons';
import type { AppColor } from '@/constants/colors';
import { HStack, VStack } from './stack';
import { ThemedText, type AppFont } from './themed-text';
import { AppImage } from './app-image';
import { ThemedView } from './themed-view';

type TransparentActionButtonProps = Omit<PressableProps, 'children'> & {
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
        state.pressed && styles.pressed,
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
        {isFull && (
          <ThemedView
            backgroundColor={iconBackground}
            size={{ width: 40 }}
            style={[
              {
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
              },
              !iconBackground && {
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
              },
            ]}
          >
            <AppImage icon={icon} tintColor='onPrimary' size={{ width: 18 }} />
          </ThemedView>
        )}
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
