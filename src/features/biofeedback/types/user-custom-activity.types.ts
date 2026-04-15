export type UserCustomActivity = {
  id: string;
  label: string;
  measurementType: 'hrv' | 'rlx' | 'none';
  createdAt: string;
  isActive: boolean;
};

export type CreateUserCustomActivityInput = {
  label: string;
  measurementType: UserCustomActivity['measurementType'];
};
