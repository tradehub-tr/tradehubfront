/**
 * Recent Categories — localStorage tabanlı son ziyaret edilen kategori listesi.
 * Anonim ve giriş yapmış kullanıcılar için aynı kaynak. FIFO, max 12 kayıt.
 * "Sizin için kategoriler" panelinde personalization sinyali olarak kullanılır.
 */

const STORAGE_KEY = "istoc_recent_categories";
const MAX_ITEMS = 12;

export interface RecentCategory {
  slug: string;
  name: string;
  image?: string;
  visitedAt: number; // epoch ms
}

/**
 * Read raw list from localStorage.
 * Returns [] on missing key, parse error, or non-array payload.
 */
function readRaw(): RecentCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentCategory[];
  } catch {
    // SyntaxError veya localStorage erişim hatası — sessizce boş listeye düş
    return [];
  }
}

/**
 * Returns the most recently visited categories, sorted by `visitedAt` desc.
 * Invalid entries (missing slug/name) are filtered out.
 */
export function getRecentCategories(limit = MAX_ITEMS): RecentCategory[] {
  const list = readRaw();
  return list
    .filter(
      (item): item is RecentCategory =>
        !!item &&
        typeof item === "object" &&
        typeof item.slug === "string" &&
        item.slug.length > 0 &&
        typeof item.name === "string" &&
        item.name.length > 0
    )
    .sort((a, b) => (b.visitedAt ?? 0) - (a.visitedAt ?? 0))
    .slice(0, limit);
}

/**
 * Pushes a category visit to the head of the list, deduping by slug.
 * Trims the list to MAX_ITEMS and persists to localStorage.
 */
export function pushRecentCategory(item: { slug: string; name: string; image?: string }): void {
  if (!item || !item.slug || !item.name) return;

  try {
    const current = readRaw();
    // Aynı slug varsa eski kaydı kaldır (dedupe)
    const filtered = current.filter((c) => c && c.slug !== item.slug);
    const next: RecentCategory[] = [
      { slug: item.slug, name: item.name, image: item.image, visitedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // private mode / quota exceeded — sessizce yut
  }
}

/** Clears the recent categories list. */
export function clearRecentCategories(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
