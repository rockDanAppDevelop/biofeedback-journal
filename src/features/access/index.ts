export type {
  AccessPlan,
  FeatureKey,
  SubscriptionStatus,
  UserAccess,
} from './types/feature-access.types';

export {
  DEFAULT_USER_ACCESS,
  FEATURE_ACCESS_MODE,
} from './lib/feature-access.defaults';
export { canAccessFeature } from './lib/can-access-feature';
export {
  getFeatureAccessResult,
  type FeatureAccessResult,
} from './lib/get-feature-access-result';
export { FEATURE_ACCESS_CATALOG } from './constants/feature-access.catalog';
export { FeatureGate } from './components/FeatureGate';
