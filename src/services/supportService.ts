/**
 * Support Service — Helpdesk (HD Ticket) entegrasyonu.
 *
 * Headless mimari — frappe/helpdesk kendi UI'i kapali, sadece veri/API katmani.
 * Guest (login olmayan) musteri icin `tradehub_core.api.public.create_ticket`
 * wrapper'i kullanilir. Login'li musteri icin ayni wrapper (session.user ile)
 * veya dogrudan /api/resource/HD Ticket.
 *
 * Permission query condition (tradehub_core.permissions.helpdesk_ticket_query)
 * musteri icin listeyi otomatik raised_by = current_user olarak filtreler.
 */

import { callMethod, api } from '../utils/api'

// ── Tipler ──────────────────────────────────────────────────────────────

export interface CreateTicketInput {
  subject: string
  description: string
  email?: string         // Guest icin zorunlu, login'li icin opsiyonel
  name?: string
  phone?: string
  priority?: '' | 'Low' | 'Medium' | 'High' | 'Urgent'
  ticket_type?: string
  /** Sipariş referansı — varsa ticket o siparişin satıcı team'ine düşer. */
  order_ref?: string
}

export interface CreateTicketResponse {
  name: string
  ok: boolean
}

export interface TicketSummary {
  name: string
  subject: string
  status: string
  priority: string
  ticket_type: string
  raised_by: string
  creation: string
  modified: string
}

export interface TicketDetail extends TicketSummary {
  description: string
  customer?: string
  contact?: string
  agent_group?: string
  resolution_by?: string
}

export interface TicketComm {
  name: string
  subject: string
  content: string
  sender: string
  sender_full_name: string
  communication_date: string
  sent_or_received: 'Sent' | 'Received'
}

interface ListParams {
  status?: string
  page?: number
  pageSize?: number
}

// ── API ─────────────────────────────────────────────────────────────────

/** Yeni destek talebi olustur (guest veya login'li). */
export async function createTicket(
  input: CreateTicketInput
): Promise<CreateTicketResponse> {
  // callMethod zaten {message:T}'yi unwrap edip T döner — direkt kullan
  return await callMethod<CreateTicketResponse>(
    'tradehub_core.api.public.create_ticket',
    input as unknown as Record<string, unknown>,
    true,
  )
}

/** Musterinin taleplerini listele.
 *
 * tradehub_core whitelisted wrapper: list + total tek istek.
 * Permission query'nin get_count ile combine olunca 0 dönmesi sorununu önler. */
export async function listMyTickets(
  params: ListParams = {}
): Promise<{ data: TicketSummary[]; total: number }> {
  const payload = await callMethod<{ data: TicketSummary[]; total: number }>(
    'tradehub_core.api.public.list_my_tickets',
    {
      status: params.status || 'all',
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  )
  return { data: payload?.data || [], total: payload?.total || 0 }
}

/** Tab sayıları (Açık/Yanıtlandı/Çözüldü/Kapalı) — tek istek. */
export interface StatusCounts {
  all: number
  Open: number
  Replied: number
  Resolved: number
  Closed: number
}
export async function fetchTicketStatusCounts(): Promise<StatusCounts> {
  return await callMethod<StatusCounts>(
    'tradehub_core.api.public.my_ticket_status_counts',
  )
}

/** Ticket detayi. */
export async function getTicket(name: string): Promise<TicketDetail> {
  const res = await api<{ data: TicketDetail }>(
    `/resource/HD Ticket/${encodeURIComponent(name)}`
  )
  return res.data
}

/** Ticket'a ait iletisim gecmisi (musteri + ajan mesajlari).
 *
 * Müşteri Communication doctype'ına direkt read yetkisine sahip değil;
 * tradehub_core whitelist wrapper HD Ticket ownership varsa dönüyor. */
export async function getTicketCommunications(
  ticketName: string
): Promise<TicketComm[]> {
  return await callMethod<TicketComm[]>(
    'tradehub_core.api.public.get_ticket_communications',
    { ticket: ticketName },
  )
}

export interface OrderForTicket {
  order_number: string
  seller_name: string
  order_date: string
  status: string
}

/** Login'li musterinin siparisleri — ticket formunda dropdown icin.
 * Guest'te veya buyer profili yoksa bos dondurur (catch edilir). */
export async function listMyOrdersForTicket(): Promise<OrderForTicket[]> {
  try {
    const payload = await callMethod<{ orders: any[] }>(
      'tradehub_core.api.order.get_my_orders',
      { page_size: 100 },
    )
    const orders = payload?.orders || []
    return orders.map((o: any) => ({
      order_number: o.order_number || o.name,
      seller_name: o.seller_name || o.seller || '',
      order_date: o.order_date || '',
      status: o.status || '',
    }))
  } catch {
    return []
  }
}

/** Musteri ticket'a yanit ekler (Communication olarak). */
export async function replyTicket(
  ticketName: string,
  content: string
): Promise<void> {
  await callMethod(
    'tradehub_core.api.public.reply_ticket',
    { ticket: ticketName, content },
    true,
  )
}

/** Musteri ticket durumunu gunceller (ornegin Resolved → Closed onayi). */
export async function updateTicketStatus(
  ticketName: string,
  status: 'Open' | 'Replied' | 'Resolved' | 'Closed'
): Promise<void> {
  await api(`/resource/HD Ticket/${encodeURIComponent(ticketName)}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}
