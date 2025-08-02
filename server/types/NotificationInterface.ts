export interface NotificationAttributes {
  id?: string;
  userId?: string;
  type?: 'EVENT_RESOLVED' | 'LEVEL_UP' | 'NEW_TASK' | 'SYSTEM' | 'BET_WON' | 'BET_LOST' | 'COMMENT_REPLY' | 'REPORT_RESOLVED';
  title?: string;
  message?: string;
  isRead?: boolean;
  isArchived?: boolean;
  relatedEntity?: any;
  actionUrl?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: 'EVENT_RESOLVED' | 'LEVEL_UP' | 'NEW_TASK' | 'SYSTEM' | 'BET_WON' | 'BET_LOST' | 'COMMENT_REPLY' | 'REPORT_RESOLVED';
  title: string;
  message: string;
  relatedEntity?: any;
  actionUrl?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiresAt?: Date;
}

export interface UpdateNotificationInput {
  isRead?: boolean;
  isArchived?: boolean;
}

export interface NotificationWithUser {
  id: string;
  type: 'EVENT_RESOLVED' | 'LEVEL_UP' | 'NEW_TASK' | 'SYSTEM' | 'BET_WON' | 'BET_LOST' | 'COMMENT_REPLY' | 'REPORT_RESOLVED';
  title: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  relatedEntity: any;
  actionUrl: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string | null;
    wallet_address: string;
  };
} 