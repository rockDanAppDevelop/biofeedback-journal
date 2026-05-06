export type AccessPlan = 'free' | 'coach' | 'premium' | 'pro';

export type FeatureKey =
  | 'reports'
  | 'coachReports'
  | 'advancedInsights'
  | 'multiDevice'
  | 'exportCsv';

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'expired'
  | 'grace'
  | 'revoked';

export type UserAccess = {
  plan: AccessPlan;
  entitlements: Partial<Record<FeatureKey, boolean>>;
  subscriptionStatus: SubscriptionStatus;
  subscriptionProvider: 'apple' | 'google' | null;
  subscriptionExpiresAt: string | null;
  updatedAt: string | null;
};
