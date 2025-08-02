export interface UserTaskAttributes {
  id?: string;
  userId?: string;
  taskId?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED';
  progress?: any;
  completedAt?: Date | null;
  rewardClaimed?: boolean;
  rewardClaimedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
} 