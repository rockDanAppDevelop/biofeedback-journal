import { FEATURE_ACCESS_CATALOG } from '../constants/feature-access.catalog';
import type {
  AccessPlan,
  FeatureKey,
  UserAccess,
} from '../types/feature-access.types';
import { FEATURE_ACCESS_MODE } from './feature-access.defaults';

const ACCESS_PLAN_RANK: Record<AccessPlan, number> = {
  free: 0,
  coach: 1,
  premium: 2,
  pro: 3,
};

export function canAccessFeature(
  userAccess: UserAccess | null | undefined,
  featureKey: FeatureKey,
): boolean {
  if (FEATURE_ACCESS_MODE === 'open') {
    return true;
  }

  if (!userAccess) {
    return true;
  }

  if (userAccess.entitlements[featureKey] === true) {
    return true;
  }

  const featureRule = FEATURE_ACCESS_CATALOG[featureKey];

  return (
    ACCESS_PLAN_RANK[userAccess.plan] >=
    ACCESS_PLAN_RANK[featureRule.minimumPlan]
  );
}
