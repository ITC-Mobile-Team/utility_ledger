import { HStack, NavigationView, ThemedText, VStack } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useLedger, useLedgerState } from '@/providers/ledger-provider';
import { getArchivedObjects, getObjectServices } from '@/services/ledger';
import { EmptyStateView, ObjectCard } from '@/views';
import { router } from 'expo-router';
import { StyleSheet, Switch } from 'react-native';

// Архівовані адреси: лише перегляд історії, «Повернути з архіву» — у деталях
// обʼєкта. Перемикач вирішує, чи враховувати адресу в «Аналітиці»
export default function ArchiveScreen() {
  const ledger = useLedger();
  const state = useLedgerState();
  const objects = getArchivedObjects(state);
  const switchOn = useThemeColor('green');

  return (
    <NavigationView
      type='short'
      title='Архів'
      barType='blue'
      testID='archive.screen'
      contentInsets={{ bottom: 32 }}
    >
      {objects.length === 0 ? (
        <EmptyStateView
          icon='archive'
          title='Архів порожній'
          message='Архівуйте адресу в її деталях, щоб прибрати зі списку, не втрачаючи історії.'
          showsPlusBadge={false}
          testID='archive.empty'
        />
      ) : (
        <VStack spacing={12}>
          {objects.map((object, index) => (
            <ObjectCard
              key={object.id}
              testID={`archive.card.${index}`}
              object={object}
              services={getObjectServices(state, object.id)}
              onPress={() =>
                router.push({
                  pathname: '/[objectId]',
                  params: { objectId: object.id },
                })
              }
              footer={
                <HStack align='center' spacing={12}>
                  <ThemedText font='rowTitle' style={styles.flex}>
                    Враховувати в аналітиці
                  </ThemedText>
                  <Switch
                    value={object.includeInAnalytics !== false}
                    onValueChange={(value) =>
                      ledger.setObjectArchive(object.id, {
                        archived: true,
                        includeInAnalytics: value,
                      })
                    }
                    trackColor={{ true: switchOn }}
                    accessibilityLabel='Враховувати в аналітиці'
                    testID={`archive.analytics.${index}`}
                  />
                </HStack>
              }
            />
          ))}
        </VStack>
      )}
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
