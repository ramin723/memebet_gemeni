export interface ReportAttributes {
  id?: string;
  reporterId?: string;
  entityType?: 'EVENT' | 'COMMENT';
  entityId?: string;
  reason?: string;
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  adminNote?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateReportInput {
  entityType: 'EVENT' | 'COMMENT';
  entityId: string;
  reason: string;
}

export interface UpdateReportInput {
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  adminNote?: string;
}

export interface ReportWithReporter {
  id: string;
  entityType: 'EVENT' | 'COMMENT';
  entityId: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  adminNote: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    id: string;
    username: string | null;
    wallet_address: string;
  };
  resolver?: {
    id: string;
    username: string | null;
    wallet_address: string;
  };
} 