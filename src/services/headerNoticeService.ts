/**
 * Header Notice Service
 * - localStorage cache ile FOUC'suz başlangıç
 * - Stale-while-revalidate: TTL aşılsa da cache döner, arka planda yeni veri çekilir
 */

const CACHE_KEY = "tradehub-header-notices-v1";
const CACHE_TTL_MS = 60_000;

export interface HeaderNoticeItem {
  name: string;
  message_tr: string;
  message_en?: string;
  link_text_tr?: string;
  link_text_en?: string;
  link_href?: string;
  icon: string;
  sort_order: number;
}

interface CacheShape {
  ts: number;
  data: HeaderNoticeItem[];
}

export function getCachedNotices(): HeaderNoticeItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed || !Array.isArray(parsed.data)) return [];
    return parsed.data;
  } catch {
    return [];
  }
}

export async function fetchActiveNotices(): Promise<HeaderNoticeItem[]> {
  try {
    const res = await fetch("/api/method/tradehub_core.api.header_notice.get_active_notices", {
      credentials: "include",
    });
    if (!res.ok) return getCachedNotices();
    const json = (await res.json()) as { message?: { notices?: HeaderNoticeItem[] } };
    const list = json?.message?.notices ?? [];
    const payload: CacheShape = { ts: Date.now(), data: list };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    return list;
  } catch (err) {
    console.warn("[HeaderNotice] fetch failed", err);
    return getCachedNotices();
  }
}

export function isCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CacheShape;
    return Date.now() - parsed.ts < CACHE_TTL_MS;
  } catch {
    return false;
  }
}
