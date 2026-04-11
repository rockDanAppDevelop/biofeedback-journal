import Constants from 'expo-constants';

export type AppEnv = 'dev' | 'prod';

type ExpoExtra = {
  appEnv?: string;
};

function readRawAppEnv(): string | undefined {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  return extra?.appEnv;
}

export function getAppEnv(): AppEnv {
  const raw = readRawAppEnv()?.trim().toLowerCase();

  if (raw === 'prod') {
    return 'prod';
  }

  return 'dev';
}

export function isDev(): boolean {
  return getAppEnv() === 'dev';
}

export function isProd(): boolean {
  return getAppEnv() === 'prod';
}
