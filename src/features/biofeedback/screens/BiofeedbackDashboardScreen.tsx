// src\features\biofeedback\screens\BiofeedbackDashboardScreen.tsx

import { router } from 'expo-router';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function BiofeedbackDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Biofeedback Journal</Text>
        <Text style={styles.subtitle}>מעקב יומי</Text>

        <View style={styles.calendarPlaceholder}>
          <Text style={styles.placeholderTitle}>כאן יהיה לוח המעקב</Text>
          <Text style={styles.placeholderText}>ירוק = יש דיווח</Text>
          <Text style={styles.placeholderText}>אדום = אין דיווח</Text>
        </View>

        <Button title="הוסף מדידה" onPress={() => router.push('/entries/new')} />
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  calendarPlaceholder: {
    marginBottom: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 15,
    marginBottom: 4,
  },
});