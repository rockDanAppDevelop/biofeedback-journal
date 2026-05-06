import type { UserAccess } from '../types/feature-access.types';

export const FEATURE_ACCESS_MODE = 'open';

export const DEFAULT_USER_ACCESS: UserAccess = {
  plan: 'free',
  entitlements: {},
  subscriptionStatus: 'none',
  subscriptionProvider: null,
  subscriptionExpiresAt: null,
  updatedAt: null,
};
