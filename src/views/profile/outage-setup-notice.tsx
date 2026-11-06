import {
  HStack,
  IconView,
  Pressable,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { StyleSheet } from 'react-native';

type OutageSetupNoticeProps = {
  message: string;
  onSetup: () => void;
};

// Статус під перемикачем сповіщень: чому графіка (а отже й сповіщень) не буде,
// і кнопка, що відкриває налаштування «Світла»
export function OutageSetupNotice({
  message,
  onSetup,
}: OutageSetupNoticeProps) {
  return (
    <HStack align='top' spacing={12} style={styles.container}>
      <IconView
        icon='danger'
        background='amberSoft'
        iconColor='amber'
        iconSize={{ width: 16 }}
        size={{ width: 32 }}
      />
      <VStack spacing={10} style={styles.copy}>
        <ThemedText font='bodySmall' testID='profile.outageStatus'>
          {message}
        </ThemedText>
        <Pressable
          accessibilityRole='button'
          onPress={onSetup}
          testID='profile.outageSetup'
          style={(state) => [styles.button, state.pressed && styles.pressed]}
        >
          <ThemedView backgroundColor='blueSoft' style={styles.buttonBody}>
            <ThemedText font='button' color='blueInk' style={styles.buttonText}>
              Налаштувати
            </ThemedText>
          </ThemedView>
        </Pressable>
      </VStack>
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  copy: {
    flex: 1,
  },
  button: {
    alignSelf: 'flex-start',
  },
  buttonBody: {
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.6,
  },
});
