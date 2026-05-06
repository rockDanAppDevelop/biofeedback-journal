import type { ReactNode } from 'react';
import { canAccessFeature } from '../lib/can-access-feature';
import type { FeatureKey, UserAccess } from '../types/feature-access.types';

type FeatureGateProps = {
  feature: FeatureKey;
  userAccess?: UserAccess | null;
  children: ReactNode;
  fallback?: ReactNode;
};

export function FeatureGate({
  feature,
  userAccess,
  children,
  fallback = null,
}: FeatureGateProps) {
  if (!canAccessFeature(userAccess, feature)) {
    return fallback;
  }

  return children;
}
