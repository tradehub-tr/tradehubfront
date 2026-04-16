import { callMethod } from '../../../utils/api'
import type {
  PaymentTransaction,
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

