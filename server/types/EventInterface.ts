export interface EventAttributes {
  id?: string;
  creatorId?: string;
  title?: string;
  description?: string;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
  bettingDeadline?: Date;
  resolutionSource?: string | null;
  resolutionSourceUrl?: string | null;
  winningOutcomeId?: string | null;
  isCustom?: boolean;
  isFeatured?: boolean;
  adminNote?: string | null;
  imageUrl?: string | null;
  minBetAmount?: string | null;
  maxBetAmount?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
} 