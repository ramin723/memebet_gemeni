export interface WalletHistoryAttributes {
  id?: string;
  userId?: string;
  type?: 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'REFUND';
  amount?: string;
  balanceBefore?: string;
  balanceAfter?: string;
  description?: string;
  referenceId?: string | null; // برای ارجاع به تراکنش یا شرط
  createdAt?: Date;
  updatedAt?: Date;
} 