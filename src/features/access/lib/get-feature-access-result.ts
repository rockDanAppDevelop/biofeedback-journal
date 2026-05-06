import { FEATURE_ACCESS_CATALOG } from '../constants/feature-access.catalog';
import type { FeatureKey, UserAccess } from '../types/feature-access.types';
import { FEATURE_ACCESS_MODE } from './feature-access.defaults';

export type FeatureAccessResult = {
  allowed: boolean;
  reason:
    | 'open_mode'
    | 'feature_enabled'
    | 'feature_missing'
    | 'missing_access'
    | 'plan_required';
};

export function getFeatureAccessResult(
  userAccess: UserAccess | null | undefined,
  featureKey: FeatureKey,
): FeatureAccessResult {
  if (FEATURE_ACCESS_MODE === 'open') {
    return {
      allowed: true,
      reason: 'open_mode',
    };
  }

  if (!FEATURE_ACCESS_CATALOG[featureKey]) {
    return {
      allowed: false,
      reason: 'feature_missing',
    };
  }

  if (!userAccess) {
    return {
      allowed: true,
      reason: 'missing_access',
    };
  }

  if (userAccess.entitlements[featureKey] === true) {
    return {
      allowed: true,
      reason: 'feature_enabled',
    };
  }

  return {
    allowed: false,
    reason: 'plan_required',
  };
}
