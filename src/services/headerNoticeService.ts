/**
 * Header Notice Service
 * - localStorage cache ile FOUC'suz başlangıç
 * - Stale-while-revalidate: TTL aşılsa da cache döner, arka planda yeni veri çekilir
 */

const CACHE_KEY = "tradehub-header-notices-v2"; // bumped: schema change (display_mode + background_color)
const CACHE_TTL_MS = 60_000;

export type HeaderNoticeDisplayMode = "single" | "slide" | "marquee";

export interface HeaderNoticeItem {
  name: string;
  message_tr: string;
  message_en?: string;
  link_text_tr?: string;
  link_text_en?: string;
  link_href?: string;
  icon: string;
  background_color?: string;
  sort_order: number;
}

export interface HeaderNoticeData {
  display_mode: HeaderNoticeDisplayMode;
  notices: HeaderNoticeItem[];
}

interface CacheShape {
  ts: number;
  data: HeaderNoticeData;
}

const EMPTY: HeaderNoticeData = { display_mode: "marquee", notices: [] };

export function getCachedNoticeData(): HeaderNoticeData {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed || !Array.isArray(parsed.data?.notices)) return EMPTY;
    return parsed.data;
  } catch {
    return EMPTY;
  }
}

export async function fetchActiveNoticeData(): Promise<HeaderNoticeData> {
  try {
    const res = await fetch("/api/method/tradehub_core.api.header_notice.get_active_notices", {
      credentials: "include",
    });
    if (!res.ok) return getCachedNoticeData();
    const json = (await res.json()) as {
      message?: { display_mode?: HeaderNoticeDisplayMode; notices?: HeaderNoticeItem[] };
    };
    const data: HeaderNoticeData = {
      display_mode: json?.message?.display_mode ?? "marquee",
      notices: json?.message?.notices ?? [],
    };
    const payload: CacheShape = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    return data;
  } catch (err) {
    console.warn("[HeaderNotice] fetch failed", err);
    return getCachedNoticeData();
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

// Backward-compat helpers (some pages may still call the old name)
export function getCachedNotices(): HeaderNoticeItem[] {
  return getCachedNoticeData().notices;
}
export async function fetchActiveNotices(): Promise<HeaderNoticeItem[]> {
  return (await fetchActiveNoticeData()).notices;
}
