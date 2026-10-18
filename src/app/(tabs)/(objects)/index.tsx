import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Objects screen</Text>
      <Link href='/preview' style={styles.preview}>
        Open preview
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  preview: {
    padding: 16,
    backgroundColor: 'red',
    borderRadius: 30,
  },
});
