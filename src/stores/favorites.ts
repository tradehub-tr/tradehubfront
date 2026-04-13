/**
 * Favorites Store
 * YouTube-like list-based favorites system.
 *
 * Mimari:
 * - localStorage = anlık UI cache (sync okuma için)
 * - Login olduğunda backend (Buyer Favorite Item/List DocType) ile senkronlanır
 * - Misafir kullanıcılar sadece localStorage kullanır
 * - Tüm mutation'lar localStorage'a anında yazılır + login varsa backend'e
 *   fire-and-forget gönderilir (UI bloklamaz)
 */

import { callMethod } from '../utils/api';
import { isLoggedIn, waitForAuth } from '../utils/auth';

export interface FavoriteList {
  id: string;
  name: string;
  createdAt: number;
}

export interface FavoriteItem {
  id: string;
  image: string;
  title: string;
  priceRange: string;
  minOrder: string;
  listIds: string[];   // which lists this item belongs to ('default' = favoriler)
  addedAt: number;
}

export interface FavoritesState {
  lists: FavoriteList[];
  items: FavoriteItem[];
}

const STORAGE_KEY = 'tradehub-favorites-v2';
const DEFAULT_LIST_ID = 'default';

// Backend senkron işlemleri sırasında re-entrant çağrıları engellemek için flag
let _suppressBackendSync = false;

// ── Migration from old format ──
function migrateOldData(): void {
  const oldKey = 'tradehub-favorites';
  const oldData = localStorage.getItem(oldKey);
  if (!oldData) return;

  // Already migrated?
  if (localStorage.getItem(STORAGE_KEY)) return;

  try {
    const oldItems: any[] = JSON.parse(oldData);
    if (!Array.isArray(oldItems)) return;

    const state: FavoritesState = {
      lists: [],
      items: oldItems.map(item => ({
        id: item.id || crypto.randomUUID(),
        image: item.image || '',
        title: item.title || '',
        priceRange: item.priceRange || '',
        minOrder: item.minOrder || '',
        listIds: [DEFAULT_LIST_ID],
        addedAt: Date.now(),
      })),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.removeItem(oldKey);
  } catch { /* ignore */ }
}

// Run migration on load
migrateOldData();

// ── State helpers ──

function getState(): FavoritesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lists: [], items: [] };
    const parsed = JSON.parse(raw);
    return {
      lists: Array.isArray(parsed.lists) ? parsed.lists : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { lists: [], items: [] };
  }
}

function saveState(state: FavoritesState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('favorites-changed', { detail: state }));
}

// ── Backend sync helpers (fire-and-forget; UI bloklamaz) ──

function _bgSync(method: string, params: Record<string, unknown>): void {
  if (_suppressBackendSync) return;
  if (!isLoggedIn()) return;
  callMethod(method, params, true).catch((err) => {
    // Backend hata verirse sessizce yut; localStorage zaten güncel
    if (import.meta.env.DEV) console.warn('[favorites] backend sync failed:', method, err);
  });
}

// ── Public API ──

export function getFavoritesState(): FavoritesState {
  return getState();
}

export function getLists(): FavoriteList[] {
  return getState().lists;
}

export function getItems(): FavoriteItem[] {
  return getState().items;
}

export function isItemFavorited(productId: string): boolean {
  return getState().items.some(item => item.id === productId);
}

/** Get which list IDs a product belongs to */
export function getItemListIds(productId: string): string[] {
  const item = getState().items.find(i => i.id === productId);
  return item ? item.listIds : [];
}

/** Add item to favorites (optionally to specific lists). If no lists, uses 'default'. */
export function addToFavorites(
  product: { id: string; image: string; title: string; priceRange: string; minOrder: string },
  listIds?: string[]
): void {
  const state = getState();
  const existing = state.items.find(i => i.id === product.id);
  const targetLists = listIds && listIds.length > 0 ? listIds : [DEFAULT_LIST_ID];

  if (existing) {
    existing.listIds = [...new Set([...existing.listIds, ...targetLists])];
  } else {
    state.items.push({
      ...product,
      listIds: targetLists,
      addedAt: Date.now(),
    });
  }

  saveState(state);
  _bgSync('tradehub_core.api.favorites.upsert_favorite', {
    listing: product.id,
    list_ids: JSON.stringify(targetLists),
    image: product.image,
    title: product.title,
    price_range: product.priceRange,
    min_order: product.minOrder,
  });
}

/** Remove item from all favorites */
export function removeFromFavorites(productId: string): void {
  const state = getState();
  state.items = state.items.filter(i => i.id !== productId);
  saveState(state);
  _bgSync('tradehub_core.api.favorites.remove_favorite', { listing: productId });
}

/** Toggle item in a specific list. Returns true if item was added to list, false if removed. */
export function toggleItemInList(
  product: { id: string; image: string; title: string; priceRange: string; minOrder: string },
  listId: string
): boolean {
  const state = getState();
  let item = state.items.find(i => i.id === product.id);

  const syncToBackend = (): void => {
    _bgSync('tradehub_core.api.favorites.toggle_favorite_in_list', {
      listing: product.id,
      list_id: listId,
      image: product.image,
      title: product.title,
      price_range: product.priceRange,
      min_order: product.minOrder,
    });
  };

  if (!item) {
    // New item, add to this list
    state.items.push({
      ...product,
      listIds: [listId],
      addedAt: Date.now(),
    });
    saveState(state);
    syncToBackend();
    return true;
  }

  const idx = item.listIds.indexOf(listId);
  if (idx >= 0) {
    // Remove from this list
    item.listIds.splice(idx, 1);
    // If no lists left, remove item entirely
    if (item.listIds.length === 0) {
      state.items = state.items.filter(i => i.id !== product.id);
    }
    saveState(state);
    syncToBackend();
    return false;
  } else {
    // Add to this list
    item.listIds.push(listId);
    saveState(state);
    syncToBackend();
    return true;
  }
}

/** Create a new list */
export function createList(name: string): FavoriteList {
  const state = getState();
  const list: FavoriteList = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: Date.now(),
  };
  state.lists.push(list);
  saveState(state);
  _bgSync('tradehub_core.api.favorites.create_favorite_list', {
    name: list.name,
    list_id: list.id,
  });
  return list;
}

/** Delete a list and remove all items from it */
export function deleteList(listId: string): void {
  const state = getState();
  state.lists = state.lists.filter(l => l.id !== listId);
  // Remove this list from all items
  state.items.forEach(item => {
    item.listIds = item.listIds.filter(id => id !== listId);
  });
  // Remove orphaned items
  state.items = state.items.filter(i => i.listIds.length > 0);
  saveState(state);
  _bgSync('tradehub_core.api.favorites.delete_favorite_list', { list_id: listId });
}

/** Rename a list */
export function renameList(listId: string, newName: string): void {
  const state = getState();
  const list = state.lists.find(l => l.id === listId);
  if (list) {
    list.name = newName.trim();
    saveState(state);
    _bgSync('tradehub_core.api.favorites.rename_favorite_list', {
      list_id: listId,
      new_name: list.name,
    });
  }
}

/** Get items filtered by list ID. 'default' = ungrouped/default favorites. */
export function getItemsByList(listId: string): FavoriteItem[] {
  return getState().items.filter(item => item.listIds.includes(listId));
}

/** Get item count for a list */
export function getListItemCount(listId: string): number {
  return getState().items.filter(item => item.listIds.includes(listId)).length;
}

/** Get total favorites count */
export function getTotalCount(): number {
  return getState().items.length;
}

// ──────────────────────────── Backend Sync ────────────────────────────────

/**
 * Backend'den state'i çekip localStorage'a yazar (overwrite).
 * Login olunduğunda çağrılır — backend kullanıcının "ground truth"udur.
 */
async function fetchFromBackend(): Promise<FavoritesState | null> {
  try {
    const res = await callMethod<{ message: FavoritesState }>(
      'tradehub_core.api.favorites.get_my_favorites'
    );
    const remote = (res as any)?.message ?? res;
    if (!remote || typeof remote !== 'object') return null;
    return {
      lists: Array.isArray(remote.lists) ? remote.lists : [],
      items: Array.isArray(remote.items) ? remote.items : [],
    };
  } catch {
    return null;
  }
}

/**
 * Misafir kullanıcı login olduğunda localStorage state'ini backend ile birleştirir.
 * Backend birleştirilmiş state'i geri döndürür ve localStorage güncellenir.
 */
async function mergeLocalIntoBackend(): Promise<FavoritesState | null> {
  const local = getState();
  if (local.items.length === 0 && local.lists.length === 0) {
    // Yerel boş — direkt backend'den çek
    return fetchFromBackend();
  }
  try {
    const res = await callMethod<{ message: FavoritesState }>(
      'tradehub_core.api.favorites.sync_favorites',
      { state: JSON.stringify(local) },
      true
    );
    const merged = (res as any)?.message ?? res;
    if (!merged || typeof merged !== 'object') return null;
    return {
      lists: Array.isArray(merged.lists) ? merged.lists : [],
      items: Array.isArray(merged.items) ? merged.items : [],
    };
  } catch {
    return null;
  }
}

/**
 * Auth durumu hazır olduğunda favorileri senkronla.
 * - Login: backend'den çek + localStorage'ı merge et
 * - Misafir: hiçbir şey yapma (localStorage zaten var)
 *
 * Idempotent: birden fazla çağrılırsa son çağrı kazanır.
 */
let _initPromise: Promise<void> | null = null;
export function initFavoritesSync(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    try {
      const user = await waitForAuth();
      if (!user) return;

      // Login → localStorage'ı backend'e merge et, sonra fresh state'i yaz
      _suppressBackendSync = true;
      const merged = await mergeLocalIntoBackend();
      if (merged) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('favorites-changed', { detail: merged }));
      }
    } finally {
      _suppressBackendSync = false;
    }
  })();
  return _initPromise;
}

/**
 * Logout sonrası çağrılır — localStorage'ı temizler ki başka kullanıcı
 * önceki kullanıcının favorilerini görmesin.
 */
export function clearFavoritesOnLogout(): void {
  _initPromise = null;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { lists: [], items: [] } }));
}

// Modül yüklenince otomatik senkron başlat (her sayfa için)
initFavoritesSync();

// Logout event'ini dinle ve localStorage'ı temizle
window.addEventListener('auth-logout', () => {
  clearFavoritesOnLogout();
});
