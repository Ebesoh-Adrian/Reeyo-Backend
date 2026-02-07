// ============================================================================
// libs/core-db/models/wallet.model.ts
// ============================================================================

import { TransactionType, TransactionCategory, PayoutStatus } from '../../constants';

export interface WalletBalanceModel {
  PK: string; // WALLET#entityType#entityId
  SK: string; // BALANCE
  entityType: 'USER' | 'VENDOR' | 'RIDER' | 'ADMIN';
  entityId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
  totalWithdrawn?: number;
  currency: 'XAF';
  lastTransactionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionModel {
  PK: string; // WALLET#entityType#entityId
  SK: string; // TXN#timestamp#txnId
  GSI1PK: string; // ORDER#orderId#TRANSACTIONS
  GSI1SK: string; // TXN#timestamp
  transactionId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: 'XAF';
  orderId?: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  metadata?: {
    paymentMethod?: string;
    paymentReference?: string;
    [key: string]: any;
  };
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface PayoutRequestModel {
  PK: string; // PAYOUT#payoutId
  SK: string; // REQUEST
  GSI1PK: string; // ENTITY#entityType#entityId#PAYOUTS
  GSI1SK: string; // PAYOUT#status#requestedAt
  payoutId: string;
  entityType: 'VENDOR' | 'RIDER';
  entityId: string;
  amount: number;
  currency: 'XAF';
  status: PayoutStatus;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
  };
  method: 'BANK_TRANSFER' | 'MOBILE_MONEY';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  transactionReference?: string;
  expectedCompletionDate?: string;
  notes?: string;
}
