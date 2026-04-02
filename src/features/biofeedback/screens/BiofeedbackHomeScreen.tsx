// src\features\biofeedback\screens\BiofeedbackHomeScreen.tsx

import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function BiofeedbackHomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Biofeedback Journal</Text>
        <Text style={styles.subtitle}>Welcome</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
  },
});