export interface UserPreferenceAttributes {
  userId?: string;
  favoriteTopics?: string[] | null;
  language?: string;
  currency?: string;
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  betNotifications?: boolean;
  eventNotifications?: boolean;
  taskNotifications?: boolean;
  systemNotifications?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserPreferenceInput {
  favoriteTopics?: string[];
  language?: string;
  currency?: string;
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  betNotifications?: boolean;
  eventNotifications?: boolean;
  taskNotifications?: boolean;
  systemNotifications?: boolean;
}

export interface UpdateUserPreferenceInput {
  favoriteTopics?: string[];
  language?: string;
  currency?: string;
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  betNotifications?: boolean;
  eventNotifications?: boolean;
  taskNotifications?: boolean;
  systemNotifications?: boolean;
} 