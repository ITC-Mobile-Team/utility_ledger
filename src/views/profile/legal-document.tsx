import { NavigationView, ThemedText, ThemedView, VStack } from '@/components';
import { StyleSheet } from 'react-native';

export type LegalDocumentContent = {
  title: string;
  badge: string;
  intro: string;
  sections: { title: string; body: string }[];
};

type LegalDocumentProps = {
  document: LegalDocumentContent;
  testID: string;
};

// Екран документа з розділу «Документи» профілю
export function LegalDocument({ document, testID }: LegalDocumentProps) {
  return (
    <NavigationView
      type='short'
      title={document.title}
      barType='purple'
      contentInsets={{ bottom: 34 }}
      testID={testID}
    >
      <ThemedView backgroundColor='surface' style={styles.card}>
        <VStack spacing={12}>
          <ThemedView backgroundColor='purpleSoft' style={styles.badge}>
            <ThemedText font='labelStrong' color='purpleInk'>
              {document.badge}
            </ThemedText>
          </ThemedView>
          <ThemedText color='muted' style={styles.paragraph}>
            {document.intro}
          </ThemedText>
          {document.sections.map((section) => (
            <VStack key={section.title} spacing={12}>
              <ThemedText
                font='heading'
                accessibilityRole='header'
                style={styles.heading}
              >
                {section.title}
              </ThemedText>
              <ThemedText color='muted' style={styles.paragraph}>
                {section.body}
              </ThemedText>
            </VStack>
          ))}
        </VStack>
      </ThemedView>
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  heading: {
    marginTop: 6,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
  },
});
