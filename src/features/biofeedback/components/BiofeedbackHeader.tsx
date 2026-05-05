import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { UserMenu } from '../../auth/components/UserMenu';

function getDashboardGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'בוקר טוב 🌱';
  }

  if (hour >= 12 && hour < 17) {
    return 'צהריים טובים ☀️';
  }

  if (hour >= 17 && hour < 21) {
    return 'ערב טוב 🌙';
  }

  return 'לילה טוב ✨';
}

export default function BiofeedbackHeader() {
  const dashboardGreeting = useMemo(() => getDashboardGreeting(), []);

  return (
    <View style={styles.dashboardHeader}>
      <UserMenu variant="inline" />
      <Text style={styles.dashboardGreeting}>{dashboardGreeting}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardHeader: {
    minHeight: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dashboardGreeting: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'left',
    marginRight: 12,
  },
});
