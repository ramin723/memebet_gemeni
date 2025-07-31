export interface PendingCommissionAttributes {
  id?: string;
  userId?: string;
  eventId?: string;
  betId?: string;
  amount?: string;
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt?: Date;
  updatedAt?: Date;
} 