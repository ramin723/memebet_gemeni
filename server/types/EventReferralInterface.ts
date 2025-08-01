export interface EventReferralAttributes {
  id: string;
  eventId: string;
  referrerId: string;
  referredId: string;
  commission: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventReferralInput {
  eventId: string;
  referrerId: string;
  referredId: string;
  commission?: number;
}

export interface UpdateEventReferralInput {
  commission?: number;
  status?: 'pending' | 'approved' | 'rejected';
} 