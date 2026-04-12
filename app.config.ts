import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json');

export default (): ExpoConfig => {
  const appEnv =
    process.env.APP_ENV?.trim().toLowerCase() === 'prod' ? 'prod' : 'dev';

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      appEnv,
    },
  };
};
