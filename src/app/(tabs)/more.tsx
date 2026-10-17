import { StyleSheet, Text, View } from "react-native";

export default function More() {
  return (
    <View style={styles.container}>
      <Text>More screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
