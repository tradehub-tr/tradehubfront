/**
 * Browsing History Service
 * Stores recently viewed products in LocalStorage (max 5, FIFO).
 */

import { sanitizeUrl } from "../utils/sanitize";

const STORAGE_KEY = "istoc_browsing_history";
const MAX_ITEMS = 5;

export interface BrowsingHistoryItem {
  id: string;
  image: string;
  title: string;
  href: string;
  price?: number;
  currency?: string;
  minOrder?: string;
  priceRange?: string;
  timestamp: number;
}

export function saveToBrowsingHistory(item: Omit<BrowsingHistoryItem, "timestamp">): void {
  const history = getBrowsingHistory();

  // Remove duplicate if already exists
  const filtered = history.filter((h) => h.id !== item.id);

  // Sanitize URL fields at the storage boundary so a malicious scheme
  // (javascript:/data:/protocol-relative) can never be persisted and later
  // reach an href/src sink (defense-in-depth against stored XSS).
  const safeItem: BrowsingHistoryItem = {
    ...item,
    image: sanitizeUrl(item.image),
    href: sanitizeUrl(item.href),
    timestamp: Date.now(),
  };

  // Add to front
  filtered.unshift(safeItem);

  // Keep max items
  const trimmed = filtered.slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // LocalStorage full or unavailable - silently fail
  }
}

export function getBrowsingHistory(): BrowsingHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BrowsingHistoryItem[];
  } catch {
    return [];
  }
}
