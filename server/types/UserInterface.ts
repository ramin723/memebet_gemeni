export interface UserAttributes {
  id?: string;
  wallet_address?: string;
  username?: string | null;
  balance?: string;
  role?: 'USER' | 'ADMIN';
  referralCode?: string;
  permissions?: any;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt?: Date;
  updatedAt?: Date;
} 