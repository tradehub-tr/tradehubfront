/**
 * Category Showcase Service
 * - localStorage cache ile FOUC'suz başlangıç
 * - Stale-while-revalidate: TTL aşılsa da cache döner, arka planda yeni veri çekilir
 * - headerNoticeService.ts deseninin ikizi
 */

const CACHE_KEY = "tradehub-category-showcase-v1";
const CACHE_TTL_MS = 60_000;

export type ShowcaseTileType = "category" | "promo";

export interface ShowcaseTile {
  name: string;
  tile_type: ShowcaseTileType;
  col_span: number;
  row_span: number;
  sort_order: number;
  label_tr: string;
  label_en: string;
  image: string;
  link_href: string;
  hover_text_tr: string;
  hover_text_en: string;
  promo_badge_tr: string;
  promo_badge_en: string;
  promo_title_tr: string;
  promo_title_en: string;
  background_color: string;
  cta_text_tr: string;
  cta_text_en: string;
  cta_href: string;
}

export interface ShowcaseData {
  enabled: boolean;
  section_title: { tr: string; en: string };
  columns: number;
  tiles: ShowcaseTile[];
}

interface CacheShape {
  ts: number;
  data: ShowcaseData;
}

const EMPTY: ShowcaseData = {
  enabled: false,
  section_title: { tr: "", en: "" },
  columns: 4,
  tiles: [],
};

export function getCachedShowcase(): ShowcaseData {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed || !Array.isArray(parsed.data?.tiles)) return EMPTY;
    return parsed.data;
  } catch {
    return EMPTY;
  }
}

export async function fetchActiveShowcase(): Promise<ShowcaseData> {
  try {
    const res = await fetch("/api/method/tradehub_core.api.category_showcase.get_active_tiles", {
      credentials: "include",
    });
    if (!res.ok) return getCachedShowcase();
    const json = (await res.json()) as { message?: Partial<ShowcaseData> };
    const m = json?.message ?? {};
    const data: ShowcaseData = {
      enabled: Boolean(m.enabled),
      section_title: {
        tr: m.section_title?.tr ?? "",
        en: m.section_title?.en ?? "",
      },
      columns: m.columns ?? 4,
      tiles: Array.isArray(m.tiles) ? m.tiles : [],
    };
    const payload: CacheShape = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    return data;
  } catch (err) {
    console.warn("[CategoryShowcase] fetch failed", err);
    return getCachedShowcase();
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
