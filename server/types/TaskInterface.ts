export interface TaskAttributes {
  id?: string;
  title?: string;
  description?: string | null;
  type?: 'DAILY' | 'LEVEL' | 'SPECIAL';
  rewardAmount?: string;
  rewardType?: 'SPARKS' | 'COINS' | 'XP';
  conditions?: any;
  isActive?: boolean;
  maxCompletions?: number | null;
  levelRequirement?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
} 