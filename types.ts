export enum UserRole {
  USER_1 = 'Idham',
  USER_2 = 'Halim',
  USER_3 = 'Zuraidah',
  USER_4 = 'Zureen',
}

export interface PRRecord {
  id: string;
  prNumber: string;
  date: string; // ISO Date string DD-MM-YYYY
  requestedBy: UserRole | string;
  vendor: string;
  description: string;
  timestamp: number; // For sorting
}

export interface DashboardStats {
  totalUsed: number;
  thisMonth: number;
  topUser: string;
}
