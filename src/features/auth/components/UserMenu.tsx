//src\features\auth\components\UserMenu.tsx

import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { getGoogleSigninOrNull } from '../api/google-sign-in-adapter';

type UserMenuProps = {
  variant?: 'absolute' | 'inline';
};

const navigationItems = [
  { label: 'סיכום שבועי', route: '/weekly-summary' },
  { label: 'ייצוא נתונים', route: '/export' },
  { label: 'רוטינות', route: '/planning' },
  { label: 'ניהול התרגולים שלי', route: '/custom-activities/manage' },
] as const;

export function UserMenu({ variant = 'absolute' }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const appVersion = Constants.expoConfig?.version ?? '';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return unsubscribe;
  }, []);

  if (!user) {
    return null;
  }

  const handleToggleMenu = () => {
    setOpen((current) => !current);
  };

  const handleCloseMenu = () => {
    setOpen(false);
  };

  const handleNavigate = (route: (typeof navigationItems)[number]['route']) => {
    setOpen(false);
    router.replace(route);
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

  const menuContent = (
    <>
      <Text style={styles.menuTitle}>מחובר כעת</Text>
      <Text
        style={styles.emailText}
        numberOfLines={Platform.OS === 'web' ? 1 : undefined}
      >
        {user.email ?? 'ללא אימייל'}
      </Text>

      <View style={styles.menuDivider} />
      <View style={styles.navSection}>
        {navigationItems.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => handleNavigate(item.route)}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {appVersion ? <Text style={styles.versionText}>v{appVersion}</Text> : null}

      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>התנתקות</Text>
      </Pressable>
    </>
  );

  return (
    <>
      {open && Platform.OS !== 'web' ? (
        <Pressable style={styles.backdrop} onPress={handleCloseMenu} />
      ) : null}

      <View style={variant === 'inline' ? styles.anchorInline : styles.anchorAbsolute}>
        <Pressable onPress={handleToggleMenu} style={styles.avatarButton}>
          <Text style={styles.avatarText}>👤</Text>
        </Pressable>

        {open && Platform.OS !== 'web' ? (
          <View style={styles.menu}>{menuContent}</View>
        ) : null}
      </View>

      {Platform.OS === 'web' ? (
        <Modal transparent visible={open} onRequestClose={handleCloseMenu}>
          <View style={styles.webModalRoot}>
            <Pressable
              style={styles.webModalBackdrop}
              onPress={handleCloseMenu}
            />
            <View style={styles.webModalMenu}>{menuContent}</View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    top: -1000,
    right: -1000,
    bottom: -1000,
    left: -1000,
    zIndex: 9,
  },
  anchorAbsolute: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
    alignItems: 'flex-end',
  },
  anchorInline: {
    position: 'relative',
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
    position: 'absolute',
    top: 48,
    right: 0,
    zIndex: 20,
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
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  navSection: {
    gap: 4,
    marginBottom: 12,
  },
  menuItem: {
    minHeight: 40,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#243447',
    textAlign: 'right',
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
  webModalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  webModalMenu: {
    position: 'absolute',
    top: 64,
    right: 16,
    width: 280,
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
