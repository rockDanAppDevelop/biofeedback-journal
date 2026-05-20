import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getSeenWhatsNewVersion,
  setSeenWhatsNewVersion,
} from '../lib/whats-new-storage';

const WHATS_NEW_VERSION = '0.11.3';

let activeModalInstanceId: symbol | null = null;

export default function WhatsNewModal() {
  const instanceIdRef = useRef(Symbol('WhatsNewModal'));
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const instanceId = instanceIdRef.current;

    if (activeModalInstanceId && activeModalInstanceId !== instanceId) {
      return;
    }

    activeModalInstanceId = instanceId;
    setIsActiveInstance(true);

    return () => {
      if (activeModalInstanceId === instanceId) {
        activeModalInstanceId = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isActiveInstance) {
      return;
    }

    let isMounted = true;

    async function checkSeenVersion() {
      try {
        const seenVersion = await getSeenWhatsNewVersion();

        if (isMounted && seenVersion !== WHATS_NEW_VERSION) {
          setIsVisible(true);
        }
      } catch (error) {
        console.warn('WHATS NEW STORAGE READ FAILED:', error);

        if (isMounted) {
          setIsVisible(true);
        }
      }
    }

    void checkSeenVersion();

    return () => {
      isMounted = false;
    };
  }, [isActiveInstance]);

  async function handleDismiss() {
    try {
      await setSeenWhatsNewVersion(WHATS_NEW_VERSION);
    } catch (error) {
      console.warn('WHATS NEW STORAGE WRITE FAILED:', error);
    } finally {
      setIsVisible(false);
    }
  }

  if (!isActiveInstance) {
    return null;
  }

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>חדש בגרסה 0.11.3</Text>

          <View style={styles.body}>
            <Text style={styles.bullet}>• לכל תרגול מתוכנן יש עכשיו תזכורת נפרדת.</Text>
            <Text style={styles.bullet}>• ההתראות מציגות את שם התרגול המתוכנן.</Text>
            <Text style={styles.bullet}>
              • אם נכנסת מתזכורת ולא ביצעת, האפליקציה יכולה להזכיר שוב בהמשך היום.
            </Text>
          </View>

          <Text style={styles.note}>
            התזכורות המתוכננות אמורות להיות ברורות יותר, ולהיעלם כשמסיימים את התרגול.
          </Text>

          <Pressable style={styles.button} onPress={handleDismiss}>
            <Text style={styles.buttonText}>הבנתי</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 16,
  },
  body: {
    gap: 8,
    marginBottom: 16,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    textAlign: 'right',
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4b5563',
    textAlign: 'right',
    marginBottom: 20,
  },
  button: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e88e5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
