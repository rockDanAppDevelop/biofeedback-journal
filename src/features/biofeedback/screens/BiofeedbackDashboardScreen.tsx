// src\features\biofeedback\screens\BiofeedbackDashboardScreen.tsx

import { router } from 'expo-router';
import { Button, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DaysStrip from '../components/DaysStrip';

export default function BiofeedbackDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.daysSection}>
          <DaysStrip />
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  daysSection: {
    marginBottom: 20,
  },
});