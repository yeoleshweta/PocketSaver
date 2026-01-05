/**
 * Transaction Types
 */
export interface Transaction {
  id: number;
  amount: number;
  rounded_diff: number;
  merchant: string | null;
  description: string | null;
  category: string;
  created_at: string;
}

export interface Category {
  name: string;
  icon: string;
  color: string;
}

export interface SpendingSummary {
  category: string;
  transaction_count: string;
  total_spent: string;
  total_round_up: string;
  icon: string;
  color: string;
}

export interface Budget {
  id: number;
  category: string;
  monthly_limit: string;
}

