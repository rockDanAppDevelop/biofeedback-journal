import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserMenu } from '../../auth/components/UserMenu';

type BiofeedbackHeaderProps = {
  variant?: 'home' | 'screen';
  title?: string;
};

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

export default function BiofeedbackHeader({
  variant = 'home',
  title = '',
}: BiofeedbackHeaderProps) {
  const dashboardGreeting = useMemo(() => getDashboardGreeting(), []);

  if (variant === 'screen') {
    return (
      <View style={styles.dashboardHeader}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.screenTitle}>{title}</Text>
      </View>
    );
  }

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f6fb',
    borderWidth: 1,
    borderColor: '#d7e3f4',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e4f8a',
    lineHeight: 26,
  },
  screenTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginRight: 12,
  },
});
