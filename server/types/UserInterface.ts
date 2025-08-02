export interface UserAttributes {
  id?: string;
  wallet_address?: string;
  username?: string | null;
  balance?: string;
  role?: 'USER' | 'ADMIN';
  referralCode?: string;
  permissions?: any;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  level?: number;
  xp?: string;
  avatarUrl?: string | null;
  headerUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
} 