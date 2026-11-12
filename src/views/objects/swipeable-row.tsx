import { AppImage, ThemedText, ThemedView, Pressable } from '@/components';
import type { AppColor } from '@/constants/colors';
import type { AppIcon } from '@/constants/app-icons';
import { iconTiles } from '@/constants/icon-sizes';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

export type SwipeAction = {
  title: string;
  icon: AppIcon;
  background: AppColor;
  testID?: string;
  onPress: () => void;
};

type SwipeableRowProps = PropsWithChildren<{
  actions: SwipeAction[];
  // false — свайп вимкнено (архівований обʼєкт лише для перегляду)
  enabled?: boolean;
}>;

// Рядок, що при свайпі вліво відкриває кнопки дій
export function SwipeableRow({
  actions,
  enabled = true,
  children,
}: SwipeableRowProps) {
  return (
    <ReanimatedSwipeable
      enabled={enabled}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <>
          {/* Контейнер дій має row-reverse, тож розвертаємо, щоб порядок збігався з переданим */}
          {[...actions].reverse().map((action) => (
            <Pressable
              key={action.title}
              accessibilityRole='button'
              testID={action.testID}
              onPress={() => {
                methods.close();
                action.onPress();
              }}
            >
              <ThemedView
                backgroundColor={action.background}
                style={styles.action}
              >
                <AppImage icon={action.icon} container={iconTiles.menu} />
                <ThemedText color='onPrimary' font='labelStrong'>
                  {action.title}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </>
      )}
    >
      <ThemedView backgroundColor='surface'>{children}</ThemedView>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
