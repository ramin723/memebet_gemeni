export interface UserAttributes {
  id: bigint;
  wallet_address: string;
  username: string | null;
  balance: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttributes {
  id: bigint;
  creatorId: bigint;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
  bettingDeadline: Date;
  resolutionSource: string | null;
  winningOutcomeId: bigint | null;
  isFeatured: boolean;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutcomeAttributes {
  id: bigint;
  eventId: bigint;
  title: string;
  totalAmount: bigint;
  totalBets: number;
  isWinner: boolean;
  createdAt: Date;
  updatedAt: Date;
} 