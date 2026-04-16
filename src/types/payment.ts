export interface PaymentTransaction {
  name: string;
  transaction_type: string;
  transaction_type_en: "Payment" | "Refund";
  order: string;
  seller_name: string;
  payment_method: string;
  amount: number;
  currency: string;
  transaction_fee: number;
  transaction_date: string;
  status: string;
  status_en: string;
  status_color: string;
  reference_number: string;
  receipt_url: string;
  refund_reason?: string;
}

export interface BankInteraction {
  name: string;
  seller: string;
  seller_name: string;
  seller_iban: string;
  seller_bank_name: string;
  seller_account_holder: string;
  total_wire_amount: number;
  pending_match_amount: number;
  currency: string;
  last_transaction_date: string;
  match_status: string;
  match_status_en: string;
  is_verified: boolean;
}

export interface WireTransfer {
  name: string;
  order: string;
  seller_name: string;
  amount: number;
  currency: string;
  transaction_date: string;
  status: string;
  status_en: string;
  status_color: string;
  reference_number: string;
  remittance_sender: string;
  seller_bank_name: string;
  seller_iban: string;
  receipt_url: string;
}

export interface TransactionFilter {
  status: "all" | "not_arrived" | "pending_match" | "completed";
  transactionType: "payment" | "refund" | "";
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  currency: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface BankInteractionSummary {
  total_wire_amount: number;
  pending_match_amount: number;
}

export interface VerifyResult {
  verified: boolean;
  message?: string;
  seller_name?: string;
  bank_name?: string;
  iban?: string;
  account_holder?: string;
}
