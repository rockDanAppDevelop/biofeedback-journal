//src\features\biofeedback\components\FloatingAddButton.tsx

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function FloatingAddButton() {
  return (
    <Pressable style={styles.button} onPress={() => router.push('/entries/new')}>
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e88e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  plus: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 34,
    marginTop: -2,
  },
});