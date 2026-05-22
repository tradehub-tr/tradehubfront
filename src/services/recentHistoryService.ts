/**
 * Recent History Service
 * Storefront header search dropdown'un "son gezilen" bölümünü besler.
 * 4 tip ayrı localStorage key'inde (FIFO, max 3).
 *
 * NOT: Mevcut `browsingHistoryService.ts` (sadece ürünler, anasayfa "geçmiş")
 * korunur; bu servis search autocomplete için ayrı, hafif veriyle çalışır.
 */

const MAX_ITEMS = 3;

const KEYS = {
  product: "istoc_recent_search_products",
  category: "istoc_recent_search_categories",
  brand: "istoc_recent_search_brands",
  seller: "istoc_recent_search_sellers",
} as const;

export interface RecentProduct {
  id: string;
  name: string;
  image?: string;
}

export interface RecentCategory {
  name: string;
  slug: string;
}

export interface RecentBrand {
  code: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface RecentSeller {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    // quota / unavailable — silent
  }
}

function dedupePush<T>(list: T[], item: T, isSame: (a: T, b: T) => boolean): T[] {
  return [item, ...list.filter((x) => !isSame(x, item))].slice(0, MAX_ITEMS);
}

// ── Product ─────────────────────────────────────────
export function saveRecentProduct(p: RecentProduct): void {
  const list = dedupePush(readList<RecentProduct>(KEYS.product), p, (a, b) => a.id === b.id);
  writeList(KEYS.product, list);
}
export function getRecentProducts(): RecentProduct[] {
  return readList<RecentProduct>(KEYS.product);
}

// ── Category ────────────────────────────────────────
export function saveRecentCategory(c: RecentCategory): void {
  if (!c.slug) return;
  const list = dedupePush(readList<RecentCategory>(KEYS.category), c, (a, b) => a.slug === b.slug);
  writeList(KEYS.category, list);
}
export function getRecentCategories(): RecentCategory[] {
  return readList<RecentCategory>(KEYS.category);
}

// ── Brand ───────────────────────────────────────────
export function saveRecentBrand(b: RecentBrand): void {
  const list = dedupePush(readList<RecentBrand>(KEYS.brand), b, (a, b2) => a.code === b2.code);
  writeList(KEYS.brand, list);
}
export function getRecentBrands(): RecentBrand[] {
  return readList<RecentBrand>(KEYS.brand);
}

// ── Seller ──────────────────────────────────────────
export function saveRecentSeller(s: RecentSeller): void {
  const list = dedupePush(readList<RecentSeller>(KEYS.seller), s, (a, b) => a.id === b.id);
  writeList(KEYS.seller, list);
}
export function getRecentSellers(): RecentSeller[] {
  return readList<RecentSeller>(KEYS.seller);
}

/** Tüm 4 type'ı tek seferde döner. Search dropdown için kullanılır. */
export function getAllRecent(): {
  products: RecentProduct[];
  categories: RecentCategory[];
  brands: RecentBrand[];
  sellers: RecentSeller[];
} {
  return {
    products: getRecentProducts(),
    categories: getRecentCategories(),
    brands: getRecentBrands(),
    sellers: getRecentSellers(),
  };
}

/** En az bir tipte kayıt var mı? Search dropdown fallback kararı için. */
export function hasAnyRecent(): boolean {
  return (
    getRecentProducts().length > 0 ||
    getRecentCategories().length > 0 ||
    getRecentBrands().length > 0 ||
    getRecentSellers().length > 0
  );
}
