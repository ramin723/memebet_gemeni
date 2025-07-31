export interface EventAttributes {
  id?: string;
  creatorId?: string;
  title?: string;
  description?: string;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
  bettingDeadline?: Date;
  resolutionSource?: string | null;
  winningOutcomeId?: string | null;
  isFeatured?: boolean;
  adminNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
} 