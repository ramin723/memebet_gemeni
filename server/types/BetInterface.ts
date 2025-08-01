export interface BetAttributes {
  id?: string;
  userId?: string;
  eventId?: string;
  outcomeId?: string;
  amount?: string;
  status?: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';
  createdAt?: Date;
  updatedAt?: Date;
} 