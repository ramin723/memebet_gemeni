export interface PendingCommissionAttributes {
  id?: string;
  userId?: string;
  eventId?: string;
  betId?: string;
  amount?: string;
  type?: 'PLATFORM' | 'CREATOR' | 'REFERRAL';
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt?: Date;
  updatedAt?: Date;
} 