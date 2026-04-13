import { callMethod } from '../../../utils/api'
import type {
  PaymentTransaction,
  BankInteraction,
  WireTransfer,
  BankInteractionSummary,
  VerifyResult,
} from '../../../types/payment'

const API = 'tradehub_core.api.payment'

interface ApiResponse<T> {
  message: T
}

function unwrap<T>(res: ApiResponse<T>): T {
  return res.message
}

// --- Section 1: Ödeme Yönetimi ---

export async function fetchRecentPayments(page = 1, pageSize = 10) {
  const res = await callMethod<ApiResponse<{
    success: boolean
    payments: PaymentTransaction[]
    total: number
    page: number
    page_size: number
  }>>(`${API}.get_recent_payments`, { page, page_size: pageSize })
  return unwrap(res)
}

export async function fetchRecentRefunds(page = 1, pageSize = 10) {
  const res = await callMethod<ApiResponse<{
    success: boolean
    refunds: PaymentTransaction[]
    total: number
    page: number
    page_size: number
  }>>(`${API}.get_recent_refunds`, { page, page_size: pageSize })
  return unwrap(res)
}

// --- Section 2: İşlemler ---

export async function fetchAllTransactions(params: {
  transaction_type?: string
  status?: string
  date_from?: string
  date_to?: string
  amount_min?: string
  amount_max?: string
  currency?: string
  page?: number
  page_size?: number
}) {
  const res = await callMethod<ApiResponse<{
    success: boolean
    transactions: PaymentTransaction[]
    total: number
    page: number
    page_size: number
  }>>(`${API}.get_all_transactions`, params)
  return unwrap(res)
}

export async function exportTransactions(params: {
  transaction_type?: string
  status?: string
  date_from?: string
  date_to?: string
  currency?: string
}) {
  const res = await callMethod<ApiResponse<{
    success: boolean
    file_url: string
  }>>(`${API}.export_transactions`, params)
  return unwrap(res)
}

// --- Section 3: Havale Hesapları ---

export async function fetchBankInteractions(params: {
  match_status?: string
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}) {
  const res = await callMethod<ApiResponse<{
    success: boolean
    interactions: BankInteraction[]
    total: number
    page: number
    page_size: number
  }>>(`${API}.get_bank_interactions`, params)
  return unwrap(res)
}

export async function fetchBankInteractionSummary() {
  const res = await callMethod<ApiResponse<BankInteractionSummary & { success: boolean }>>(
    `${API}.get_bank_interaction_summary`
  )
  return unwrap(res)
}

export async function verifySupplierAccount(iban: string) {
  const res = await callMethod<ApiResponse<VerifyResult & { success: boolean }>>(
    `${API}.verify_supplier_account`,
    { iban },
    true
  )
  return unwrap(res)
}

// --- Section 4: Havale Takibi ---

export async function fetchWireTransfers(params: {
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}) {
  const res = await callMethod<ApiResponse<{
    success: boolean
    transfers: WireTransfer[]
    total: number
    page: number
    page_size: number
  }>>(`${API}.get_wire_transfers`, params)
  return unwrap(res)
}

export async function fetchWireTransferDetail(transactionName: string) {
  const res = await callMethod<ApiResponse<{
    success: boolean
    transaction: WireTransfer
  }>>(`${API}.get_wire_transfer_detail`, { transaction_name: transactionName })
  return unwrap(res)
}
