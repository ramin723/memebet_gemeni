export interface OutcomeAttributes {
  id?: string;
  eventId?: string;
  title?: string;
  totalAmount?: string;
  totalBets?: number;
  isWinner?: boolean;
  imageUrl?: string | null;
  status?: 'ACTIVE' | 'DISABLED';
  createdAt?: Date;
  updatedAt?: Date;
} 