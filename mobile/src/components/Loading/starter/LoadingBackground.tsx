import React, { ActivityIndicator, StyleSheet, View } from "react-native";

export default function LoadingBackground() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // clean, safe, modern background
    alignItems: "center",
    justifyContent: "center",
  },
});
