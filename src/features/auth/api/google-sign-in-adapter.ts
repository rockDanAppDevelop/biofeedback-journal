import Constants from 'expo-constants';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');
type GoogleSigninClient = GoogleSigninModule['GoogleSignin'];

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

export function isGoogleSignInSupported(): boolean {
  return !isExpoGo();
}

export async function getGoogleSigninOrNull(): Promise<GoogleSigninClient | null> {
  if (isExpoGo()) {
    return null;
  }

  const module = await import('@react-native-google-signin/google-signin');
  return module.GoogleSignin;
}

export async function configureGoogleSignInIfSupported(
  webClientId: string,
): Promise<boolean> {
  const googleSignin = await getGoogleSigninOrNull();

  if (!googleSignin) {
    return false;
  }

  googleSignin.configure({
    webClientId,
  });

  return true;
}
