import {
  ActionButton,
  AppImage,
  ScreenView,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { useLedgerObject } from '@/providers/ledger-provider';
import { FormFooter, ObjectCard } from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function ObjectAdded() {
  const { objectId } = useLocalSearchParams<{ objectId: string }>();
  const object = useLedgerObject(objectId);

  const finish = () => {
    if (!object) {
      router.back();
      return;
    }
    // Замінюємо екран успіху, щоб «назад» з місяців вело до списку адрес
    router.replace({
      pathname: '/[objectId]',
      params: { objectId: object.id },
    });
  };

  return (
    <View style={styles.screen}>
      <ScreenView backgroundColor='bg' edges={['top']} style={styles.screen}>
        <VStack spacing={28} align='center' style={styles.content}>
          <ThemedView backgroundColor='blue' style={styles.check}>
            <AppImage icon='check' role='heroLarge' />
          </ThemedView>

          <VStack spacing={10} align='center'>
            <ThemedText font='emptyStateTitle' align='center'>
              Адресу додано
            </ThemedText>
            <ThemedText color='muted' align='center'>
              Журнал комунальних послуг для нової адреси готовий. Додайте
              послуги, щоб почати вести облік.
            </ThemedText>
          </VStack>

          {object && (
            <View style={styles.card}>
              <ObjectCard object={object} />
            </View>
          )}
        </VStack>
      </ScreenView>

      <FormFooter>
        <ActionButton
          title='Готово'
          testID='objectAdded.done'
          onPress={finish}
        />
      </FormFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  check: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignSelf: 'stretch',
  },
});
