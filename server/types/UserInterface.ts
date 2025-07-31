export interface UserAttributes {
  id?: string;
  wallet_address?: string;
  username?: string | null;
  balance?: string;
  role?: 'USER' | 'ADMIN';
  createdAt?: Date;
  updatedAt?: Date;
} 