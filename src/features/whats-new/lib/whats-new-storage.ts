import AsyncStorage from '@react-native-async-storage/async-storage';

const WHATS_NEW_SEEN_VERSION_KEY = 'whatsNewSeenVersion';

export async function getSeenWhatsNewVersion(): Promise<string | null> {
  return AsyncStorage.getItem(WHATS_NEW_SEEN_VERSION_KEY);
}

export async function setSeenWhatsNewVersion(version: string): Promise<void> {
  await AsyncStorage.setItem(WHATS_NEW_SEEN_VERSION_KEY, version);
}
