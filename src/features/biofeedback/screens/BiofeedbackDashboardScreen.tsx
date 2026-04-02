// src\features\biofeedback\screens\BiofeedbackDashboardScreen.tsx

import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FloatingAddButton from '../components/FloatingAddButton';
import MonthGrid from '../components/MonthGrid';

export default function BiofeedbackDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <MonthGrid />
        <FloatingAddButton />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
});