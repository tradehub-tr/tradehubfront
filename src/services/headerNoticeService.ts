/**
 * Header Notice Service
 * - localStorage cache ile FOUC'suz başlangıç
 * - Stale-while-revalidate: TTL aşılsa da cache döner, arka planda yeni veri çekilir
 */

const CACHE_KEY = "tradehub-header-notices-v2"; // bumped: schema change (display_mode + background_color)
const CACHE_TTL_MS = 60_000;

export type HeaderNoticeDisplayMode = "single" | "slide" | "marquee";

/**
 * Duyuru metinlerinin dilleri — backend `header_notice.DILLER` ile birebir.
 *
 * 2026-09-21: `ar` ve `ru` eklendi. Vitrin dört dile açılırken yapılan kırma
 * turunda bulundu: bu modül de yalnız `_tr`/`_en` taşıyordu ve duyuru şeridi
 * sitenin HER sayfasında çiziliyor — Arapça/Rusça ziyaretçi her sayfada
 * Türkçe bir şerit görüyordu. Kusur o gün gizliydi (canlıda aktif duyuru yok).
 */
export const NOTICE_LANGS = ["tr", "en", "ar", "ru"] as const;
export type NoticeLang = (typeof NOTICE_LANGS)[number];

/** Duyuru başına çevrilebilir alan kökleri. */
export const NOTICE_CEVRILEBILIR_KOKLER = ["message", "link_text"] as const;
export type NoticeKok = (typeof NOTICE_CEVRILEBILIR_KOKLER)[number];

/** `message_tr` … `link_text_ru` — 2 kök × 4 dil = 8 alan, elle yazılmaz. */
export type DilliNoticeAlanlari = { [K in `${NoticeKok}_${NoticeLang}`]?: string } & {
  /** Kaynak dil zorunlu: diğerleri boşsa ekran buna düşer. */
  message_tr: string;
};

export interface HeaderNoticeItem extends DilliNoticeAlanlari {
  name: string;
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
