/**
 * Seller Favorites Store
 *
 * Tedarikçi favorileri için localStorage tabanlı store. Yapı, ürün
 * favorileriyle (favorites.ts) hizalı: her seller bir veya birden çok
 * `listId` içerir. Listeler ürün store'undan paylaşılır (`getLists()`,
 * `createList()` favorites.ts'tan import edilir) — kullanıcı tek bir
 * "Favoriler/asdfsa/adas" havuzunu hem ürün hem seller için kullanır.
 *
 * Backend desteği yok — `Buyer Favorite Seller` DocType ileride
 * eklendiğinde fire-and-forget sync ekleyebiliriz.
 */

const DEFAULT_LIST_ID = "default";
const STORAGE_KEY = "tradehub-seller-favorites-v2";

export interface FavoriteSellerItem {
  code: string; // seller_code
  name: string;
  city?: string;
  country?: string;
  logo?: string;
  cover?: string;
  rating?: number;
  reviewCount?: number;
  listIds: string[];
  addedAt: number;
}

interface State {
  items: FavoriteSellerItem[];
}

function getState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { items: [] };
  }
}

function saveState(state: State): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("seller-favorites-changed", { detail: state }));
}

// ── Eski v1 → v2 migration (flat array → {items}) ──
(function migrateV1() {
  const oldKey = "tradehub-seller-favorites-v1";
  if (localStorage.getItem(STORAGE_KEY)) return;
  const raw = localStorage.getItem(oldKey);
  if (!raw) return;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    const migrated: State = {
      items: arr.map((s: any) => ({
        code: s.code,
        name: s.name || "",
        city: s.city,
        country: s.country,
        logo: s.logo,
        cover: s.cover,
        rating: s.rating,
        reviewCount: s.reviewCount,
        listIds: [DEFAULT_LIST_ID],
        addedAt: s.addedAt || Date.now(),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(oldKey);
  } catch {
    /* ignore */
  }
})();

export type SellerInput = Omit<FavoriteSellerItem, "addedAt" | "listIds">;

export function getFavoriteSellers(): FavoriteSellerItem[] {
  return getState().items;
}

export function isSellerFavorited(code: string): boolean {
  return getState().items.some((s) => s.code === code);
}

export function getSellerListIds(code: string): string[] {
  const item = getState().items.find((s) => s.code === code);
  return item ? item.listIds : [];
}

/**
 * Belirli bir listede toggle et. Yeni durum (true=eklendi) döner.
 * Listeden çıkarılınca seller başka listede kalmıyorsa item silinir.
 */
export function toggleSellerInList(seller: SellerInput, listId: string): boolean {
  const state = getState();
  const item = state.items.find((s) => s.code === seller.code);

  if (!item) {
    state.items.push({ ...seller, listIds: [listId], addedAt: Date.now() });
    saveState(state);
    return true;
  }

  const idx = item.listIds.indexOf(listId);
  if (idx >= 0) {
    item.listIds.splice(idx, 1);
    if (item.listIds.length === 0) {
      state.items = state.items.filter((s) => s.code !== seller.code);
    }
    saveState(state);
    return false;
  }
  item.listIds.push(listId);
  saveState(state);
  return true;
}

/** Tüm listelerden çıkar (kalp boşaltma). */
export function removeSellerFromAll(code: string): void {
  const state = getState();
  state.items = state.items.filter((s) => s.code !== code);
  saveState(state);
}

/** Liste silindiğinde seller item'larından da kaldır. */
export function pruneSellerListId(listId: string): void {
  const state = getState();
  let dirty = false;
  state.items.forEach((item) => {
    const before = item.listIds.length;
    item.listIds = item.listIds.filter((id) => id !== listId);
    if (item.listIds.length !== before) dirty = true;
  });
  state.items = state.items.filter((s) => s.listIds.length > 0);
  if (dirty) saveState(state);
}

export function getSellerFavoritesCount(): number {
  return getState().items.length;
}
