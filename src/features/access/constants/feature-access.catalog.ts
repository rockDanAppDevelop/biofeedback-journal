import type { AccessPlan, FeatureKey } from '../types/feature-access.types';

export type FeatureAccessRule = {
  key: FeatureKey;
  minimumPlan: AccessPlan;
  label: string;
};

export const FEATURE_ACCESS_CATALOG: Record<FeatureKey, FeatureAccessRule> = {
  reports: {
    key: 'reports',
    minimumPlan: 'free',
    label: 'Reports',
  },
  coachReports: {
    key: 'coachReports',
    minimumPlan: 'coach',
    label: 'Coach reports',
  },
  advancedInsights: {
    key: 'advancedInsights',
    minimumPlan: 'premium',
    label: 'Advanced insights',
  },
  multiDevice: {
    key: 'multiDevice',
    minimumPlan: 'premium',
    label: 'Multi-device',
  },
  exportCsv: {
    key: 'exportCsv',
    minimumPlan: 'premium',
    label: 'CSV export',
  },
};
