/**
 * Chat transport layer — TeamsLike (via tradehub_core proxy) integration.
 *
 * Frontend tüm chat çağrılarını `/api/method/tradehub_core.api.chat.*` üstünden
 * yapar. Backend proxy teamslike `/v1/portal/me/*` endpoint'lerine bağlanır;
 * auth: Frappe session cookie. Buyer'ın teamslike kimliği tradehub_core
 * tarafında tenant signing-secret ile imzalanmış kısa ömürlü JWT olarak mint
 * edilir.
 *
 * Conversation.id  = teamslike thread id (int → string)
 * Conversation.sellerId = teamslike seller user_id (UUID) — bilgi amaçlı;
 *   start_or_get_thread her zaman idempotent çalıştığı için match için
 *   frontend'de kullanılmaya gerek yok.
 * Message.id       = chatwoot message id (int → string)
 * Direction        = message_type 0 ("incoming"/buyer) → "me",
 *                    message_type 1 ("outgoing"/seller) → "them"
 */

import type { Conversation, Message, PinnedProduct } from "../types/chat";
import { callMethod, clearCsrfCache, fetchCsrfToken } from "../utils/api";
import { t } from "../i18n";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// ──────────────────────────────────────────────────────────────────────────
// Wire types (teamslike → frappe proxy passthrough)
// ──────────────────────────────────────────────────────────────────────────

interface ChatwootSender {
  id?: number;
  name?: string;
  email?: string;
  identifier?: string;
}

interface ChatwootAttachment {
  id?: number;
  file_type?: string; // "image" | "file" | "video" | "audio"
  data_url?: string;
  thumb_url?: string;
  file_name?: string;
  file_size?: number;
  extension?: string;
}

interface ChatwootMessage {
  id?: number;
  content?: string | null;
  message_type?: number; // 0=incoming(buyer), 1=outgoing(seller), 2=activity
  created_at?: string | number;
  sender?: ChatwootSender;
  private?: boolean;
  attachments?: ChatwootAttachment[] | null;
}

interface TeamslikeThread {
  id?: number | null;
  inbox_id?: number;
  status?: string;
  tenant?: { tenant_id?: string; slug?: string; name?: string } | null;
  seller?: { user_id?: string; email?: string; full_name?: string; role?: string } | null;
  contact?: { id?: number; name?: string; email?: string } | null;
  last_non_activity_message?: ChatwootMessage | null;
  unread_count?: number;
}

interface ChatwootMessagesResponse {
  payload?: ChatwootMessage[];
  meta?: unknown;
}

// ──────────────────────────────────────────────────────────────────────────
// Time helpers
// ──────────────────────────────────────────────────────────────────────────

function toDate(value: string | number | undefined): Date | null {
  if (value === undefined || value === null) return null;
  // Chatwoot bazen unix epoch (saniye) dönüyor
  if (typeof value === "number") {
    return new Date(value < 1e12 ? value * 1000 : value);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toHHMM(d: Date | null): string {
  if (!d) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toRelative(d: Date | null): string {
  if (!d) return "";
  const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return t("commonSvc.now");
  if (diffSec < 3600) return t("commonSvc.minutesShort", { n: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return t("commonSvc.hoursShort", { n: Math.floor(diffSec / 3600) });
  if (diffSec < 172800) return t("commonSvc.yesterday");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

// ──────────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────────

function threadToConversation(thread: TeamslikeThread): Conversation {
  const seller = thread.seller ?? {};
  const last = thread.last_non_activity_message ?? null;
  const lastDate = toDate(last?.created_at);
  const name = seller.full_name || seller.email || t("commonSvc.seller");
  return {
    id: String(thread.id ?? ""),
    name,
    company: seller.full_name || seller.email || "",
    sellerId: seller.user_id || undefined,
    localTimeHHMM: "",
    online: false,
    lastMessage: last?.content || "",
    lastTime: toRelative(lastDate),
    unread: typeof thread.unread_count === "number" ? thread.unread_count : 0,
    tags: [],
  };
}

const VIDEO_CALL_MARKER = "🎥";
const URL_REGEX = /(https?:\/\/[^\s]+)/;

function extractVideoCallUrl(text: string): string | undefined {
  if (!text.includes(VIDEO_CALL_MARKER)) return undefined;
  const match = text.match(URL_REGEX);
  return match ? match[1] : undefined;
}

function messageToView(m: ChatwootMessage, conversationId: string): Message {
  const date = toDate(m.created_at);
  const isOutgoing = m.message_type === 1;
  const text = m.content || "";
  // Chatwoot bir mesaja birden fazla dosya bağlayabilir ama bizim send_attachment
  // her zaman tek dosya gönderiyor; gelen ilkini render ediyoruz.
  const att = m.attachments?.[0];
  let body: Message["body"];
  if (att?.data_url) {
    const url = absolutizeAttachmentUrl(att.data_url);
    if (att.file_type === "image") {
      body = { type: "image", url, caption: text };
    } else {
      body = {
        type: "file",
        url,
        name: att.file_name || t("commonSvc.file"),
        size: att.file_size || 0,
        mimeType: att.file_type || "application/octet-stream",
      };
    }
  } else {
    body = { type: "text", text };
  }
  return {
    id: String(m.id ?? `m-${Date.now()}`),
    conversationId,
    direction: isOutgoing ? "them" : "me",
    body,
    time: toHHMM(date),
    dateLabel: date
      ? date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
      : undefined,
    read: true,
    videoCallUrl: extractVideoCallUrl(text),
  };
}

// Chatwoot FRONTEND_URL'i `0.0.0.0:3000` olarak yapılandırıldığında attachment
// URL'lerini bind address'le döner; browser bunu çözemez (NS_ERROR_CONNECTION_REFUSED).
// localhost:3000 host'a bağlı port → herkes çekebilir. Kalıcı düzeltme:
// chatwoot-docker/.env içinde FRONTEND_URL=http://localhost:3000 yapmak.
function absolutizeAttachmentUrl(url: string): string {
  if (!url) return url;
  return url.replace(
    /^https?:\/\/0\.0\.0\.0(:\d+)?\//,
    (_m, port) => `http://localhost${port || ""}/`
  );
}

function extractMessages(raw: unknown): ChatwootMessage[] {
  // Chatwoot bazen düz array, bazen {payload: [...]} döner
  if (Array.isArray(raw)) return raw as ChatwootMessage[];
  if (raw && typeof raw === "object" && Array.isArray((raw as ChatwootMessagesResponse).payload)) {
    return (raw as ChatwootMessagesResponse).payload as ChatwootMessage[];
  }
  return [];
}

// Aktivite mesajları (system events, type 2) gösterme — testbaba ile aynı.
// Content boş ama attachment varsa yine geçerli (dosya/resim mesajı).
function isUserMessage(m: ChatwootMessage): boolean {
  if (m.message_type === 2) return false;
  const hasText = Boolean(m.content && m.content.trim());
  const hasAttachment = Boolean(m.attachments && m.attachments.length > 0);
  return hasText || hasAttachment;
}

// ──────────────────────────────────────────────────────────────────────────
// API helpers (Frappe callMethod sarmalayıcıları)
// ──────────────────────────────────────────────────────────────────────────

interface FrappeMessage<T> {
  message?: T;
}

async function frappePOST<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await callMethod<FrappeMessage<T>>(method, params, true);
  return (res?.message ?? (res as unknown)) as T;
}

async function frappeGET<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await callMethod<FrappeMessage<T>>(method, params, false);
  return (res?.message ?? (res as unknown)) as T;
}

// ──────────────────────────────────────────────────────────────────────────
// Public API (signature uyumluluğu korunur)
// ──────────────────────────────────────────────────────────────────────────

export async function listConversations(): Promise<Conversation[]> {
  const threads = await frappeGET<TeamslikeThread[]>("tradehub_core.api.chat.list_my_threads", {
    perspective: "buyer",
  });
  if (!Array.isArray(threads)) return [];
  return threads.map(threadToConversation).filter((c) => c.id);
}

/**
 * Eski signature — yeni akışta önerilmiyor. `startOrGetThread` her zaman doğru
 * conversation'ı (varsa bul, yoksa yarat) döndürür. Burada şimdiki listeden
 * client-side match'e devam ediyoruz ki çağıran kod kırılmasın.
 */
export async function findConversationBySellerId(sellerId: string): Promise<Conversation | null> {
  if (!sellerId) return null;
  const list = await listConversations();
  return list.find((c) => c.sellerId === sellerId) ?? null;
}

/**
 * Buyer için seller ile thread'i bul-ya-yarat. seller_id = Admin Seller Profile
 * slug veya User email/name. Backend her iki formu da resolve eder.
 */
export async function startOrGetThread(
  sellerId: string,
  initialMessage?: string
): Promise<Conversation> {
  const thread = await frappePOST<TeamslikeThread>("tradehub_core.api.chat.start_or_get_thread", {
    seller_id: sellerId,
    initial_message: initialMessage ?? null,
  });
  return threadToConversation(thread || {});
}

export interface VideoCallResult {
  meeting_id?: string;
  room_name?: string;
  join_url?: string;
  title?: string;
}

/** Aktif konuşmada Jitsi görüntülü görüşme başlatır; davet mesajı thread'e
 *  otomatik post edilir. Frontend caller'ı yeni sekmede join_url'e götürür. */
export async function startVideoCall(conversationId: string): Promise<VideoCallResult> {
  return frappePOST<VideoCallResult>("tradehub_core.api.chat.start_video_call", {
    conversation_id: conversationId,
  });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!conversationId) return [];
  const raw = await frappeGET<unknown>("tradehub_core.api.chat.list_messages", {
    conversation_id: conversationId,
    perspective: "buyer",
  });
  const arr = extractMessages(raw)
    .filter(isUserMessage)
    // Chatwoot çoğunlukla DESC (en yeni başta) döner; UI ASC bekliyor
    .sort((a, b) => {
      const da = toDate(a.created_at)?.getTime() ?? 0;
      const db = toDate(b.created_at)?.getTime() ?? 0;
      return da - db;
    });
  return arr.map((m) => messageToView(m, conversationId));
}

export async function sendTextMessage(
  conversationId: string,
  text: string,
  _pinnedProduct?: PinnedProduct
): Promise<Message> {
  if (!conversationId) throw new Error("conversationId yok");
  const raw = await frappePOST<ChatwootMessage | { message?: ChatwootMessage }>(
    "tradehub_core.api.chat.send_message",
    { conversation_id: conversationId, content: text, perspective: "buyer" }
  );
  const m =
    (raw && "message" in (raw as Record<string, unknown>)
      ? ((raw as { message?: ChatwootMessage }).message ?? ({} as ChatwootMessage))
      : (raw as ChatwootMessage)) ?? ({} as ChatwootMessage);
  // Backend kendi yaptığı POST için "me" döner; mapper bunu zaten message_type=1
  // görse "them" yapardı (yanlış). Manuel düzelt:
  const view = messageToView(m, conversationId);
  view.direction = "me";
  if (!view.body || (view.body.type === "text" && !view.body.text)) {
    view.body = { type: "text", text };
  }
  return view;
}

export async function sendAttachment(
  conversationId: string,
  file: File,
  content = ""
): Promise<Message> {
  if (!conversationId) throw new Error("conversationId yok");
  if (!file) throw new Error(t("commonSvc.noFile"));

  const url = `${API_BASE}/method/tradehub_core.api.chat.send_attachment`;
  const doFetch = async (csrf: string): Promise<Response> => {
    const fd = new FormData();
    fd.append("conversation_id", conversationId);
    fd.append("content", content);
    fd.append("file", file, file.name);
    return fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "X-Frappe-CSRF-Token": csrf },
      body: fd,
    });
  };

  let csrf = (await fetchCsrfToken()) ?? "None";
  let res = await doFetch(csrf);
  if (res.status === 403) {
    clearCsrfCache();
    csrf = (await fetchCsrfToken()) ?? "None";
    res = await doFetch(csrf);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { message?: ChatwootMessage };
  const m = data.message ?? ({} as ChatwootMessage);
  const view = messageToView(m, conversationId);
  view.direction = "me";
  return view;
}

// ──────────────────────────────────────────────────────────────────────────
// Stubs — şimdilik teamslike'da karşılığı yok (read-receipt, block, mute, pin).
// Backend tarafına eklenince burası gerçek API'ye bağlanır. Bu fonksiyonların
// çağrıldığı yerlerde UI optimistic davranıyor (Alpine store kendi state'ini
// güncelliyor), o yüzden sessizce no-op kalmaları akışı kırmaz.
// ──────────────────────────────────────────────────────────────────────────

export async function markConversationRead(_conversationId: string): Promise<void> {
  // TODO(backend): chat.mark_read endpoint'i ekle (chatwoot conversation/{id}/update_last_seen)
}

export async function blockConversation(_conversationId: string): Promise<void> {
  // TODO(backend): chat.block_contact
}

export async function deleteConversation(_conversationId: string): Promise<void> {
  // TODO(backend): chat.archive_thread (chatwoot conversation status=resolved)
}

export async function muteConversation(_conversationId: string, _mute: boolean): Promise<void> {
  // TODO(backend): chat.mute_thread (chatwoot mute API)
}

export async function pinConversation(_conversationId: string, _pin: boolean): Promise<void> {
  // TODO(backend): kalıcı pin için Teamslike Settings'e per-user metadata gerekir
}
