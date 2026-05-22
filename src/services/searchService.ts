import { api } from "../utils/api";

interface FrappeResponse<T> {
  message: {
    data: T;
    total?: number;
    page?: number;
  };
}

export interface UnifiedSuggestProduct {
  id: string;
  name: string;
  image?: string;
}

export interface UnifiedSuggestCategory {
  name: string;
  slug: string;
}

export interface UnifiedSuggestBrand {
  code: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface UnifiedSuggestSeller {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
}

export interface UnifiedSuggestResult {
  products: UnifiedSuggestProduct[];
  categories: UnifiedSuggestCategory[];
  brands: UnifiedSuggestBrand[];
  sellers: UnifiedSuggestSeller[];
}

const EMPTY: UnifiedSuggestResult = {
  products: [],
  categories: [],
  brands: [],
  sellers: [],
};

/**
 * Storefront header arama autocomplete'i için 4 grupta gruplu sonuç çeker.
 * q boş/1 karakter → backend popular-mode (her gruptan en yeni 5 kayıt).
 * q ≥ 2 karakter → LIKE %q% filtresi.
 * Hata durumunda silent fail — chip listesi mevcut akışta kalır.
 *
 * Frappe `@frappe.whitelist`-decorated fonksiyon plain dict döndürdüğünde
 * wrapper genelde `{ message: <dict> }`. Bazı list-helper akışlarında ise
 * `{ message: { data: <dict> } }` şeklinde nested oluyor — defansif olarak
 * iki şekli de destekliyoruz.
 */
export async function unifiedSuggest(q: string): Promise<UnifiedSuggestResult> {
  const query = q.trim();
  try {
    const response = await api<FrappeResponse<UnifiedSuggestResult>>(
      `/method/tradehub_core.api.search.unified_suggest?q=${encodeURIComponent(query)}&limit_per_group=3`
    );
    const msg = response.message as unknown;
    const data = (msg as { data?: UnifiedSuggestResult })?.data ?? (msg as UnifiedSuggestResult);
    return data ?? EMPTY;
  } catch {
    return EMPTY;
  }
}
