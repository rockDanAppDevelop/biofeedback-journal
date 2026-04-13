//src\features\auth\components\UserMenu.tsx

import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { getGoogleSigninOrNull } from '../api/google-sign-in-adapter';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const user = auth.currentUser;
  const appVersion = Constants.expoConfig?.version ?? '';

  if (!user) {
    return null;
  }

  const handleToggleMenu = () => {
    setOpen((current) => !current);
  };

  const handleCloseMenu = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      const googleSignin = await getGoogleSigninOrNull();
      if (googleSignin) {
        await googleSignin.signOut();
      }

      setOpen(false);
    } catch (error) {
      console.error('SIGN OUT FAILED:', error);
      Alert.alert('שגיאה', 'ההתנתקות נכשלה.');
    }
  };

  return (
    <>
      {open ? <Pressable style={styles.backdrop} onPress={handleCloseMenu} /> : null}

      <View style={styles.anchor}>
        <Pressable onPress={handleToggleMenu} style={styles.avatarButton}>
          <Text style={styles.avatarText}>👤</Text>
        </Pressable>

        {open ? (
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>מחובר כעת</Text>
            <Text style={styles.emailText}>{user.email ?? 'ללא אימייל'}</Text>
            {appVersion ? <Text style={styles.versionText}>v{appVersion}</Text> : null}

            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>התנתקות</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  anchor: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
    alignItems: 'flex-end',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f6fb',
    borderWidth: 1,
    borderColor: '#d7e3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  menu: {
    marginTop: 8,
    minWidth: 220,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e3e7ee',
    elevation: 4,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  emailText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  versionText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 12,
  },
  logoutButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be123c',
  },
});
