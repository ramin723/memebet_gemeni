export interface TransactionAttributes {
  id?: string;
  userId?: string;
  type?: 'DEPOSIT' | 'WITHDRAWAL';
  amount?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'FAILED';
  txHash?: string | null; // برای تراکنش‌های بلاکچین
  walletAddress?: string;
  description?: string;
  metadata?: Record<string, any> | null; // برای اطلاعات اضافی
  createdAt?: Date;
  updatedAt?: Date;
} 