/**
 * Category Service — Merkezi kategori veri yönetimi
 * Backend'deki Product Category DocType'larını çeker ve önbelleğe alır.
 * Tüm bileşenler bu servisi kullanarak aynı API çağrısını paylaşır.
 */

import { callMethod } from "../utils/api";

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon_class?: string;
  children: ApiCategoryChild[];
}

export interface ApiCategoryChild {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

let _cache: ApiCategory[] | null = null;
let _promise: Promise<ApiCategory[]> | null = null;
const _listeners: Array<(cats: ApiCategory[]) => void> = [];

/**
 * Test/spam kategorilerini ayıklar. Backend cleanup yapılana kadar geçici filtre.
 * Eşleşen örüntüler: "test", "test-x", "test_x" + bilinen spam isimler +
 * 6 ya da daha kısa, salt küçük harfli ASCII'den oluşan ve sesli/sessiz
 * dağılımı bozuk klavye spam'i (örn. "dasdas", "adsf", "asdfsa").
 */
function isSpamCategoryName(name: string): boolean {
  const n = (name || "").trim().toLowerCase();
  if (!n) return true;
  if (/^test([-_ ].*)?$/.test(n)) return true;
  if (
    [
      "dasdas",
      "adsf",
      "asd",
      "asdfsa",
      "ressfd",
      "adas",
      "asdf",
      "qwe",
      "qwer",
      "qwerty",
      "zxc",
      "zxcv",
    ].includes(n)
  )
    return true;
  // 1-6 harfli, sadece [a-z], boşluksuz: muhtemelen klavye spam'i
  if (/^[a-z]{1,6}$/.test(n)) {
    const vowels = (n.match(/[aeiouıöü]/g) || []).length;
    const ratio = vowels / n.length;
    if (ratio < 0.25 || ratio > 0.75) return true;
  }
  return false;
}

function filterSpam(cats: ApiCategory[]): ApiCategory[] {
  return cats
    .filter((c) => !isSpamCategoryName(c.name))
    .map((c) => ({
      ...c,
      children: (c.children || []).filter((ch) => !isSpamCategoryName(ch.name)),
    }));
}

/**
 * Kategorileri API'den çeker ve önbelleğe alır.
 * Birden fazla çağrıda tek fetch yapılır (deduplication).
 */
export function loadCategories(): Promise<ApiCategory[]> {
  if (_cache !== null) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = callMethod<ApiCategory[]>("tradehub_core.api.category.get_mega_menu")
    .then((data) => {
      const raw: ApiCategory[] = Array.isArray(data) ? data : [];
      const cats = filterSpam(raw);
      _cache = cats;
      _promise = null;
      const toNotify = _listeners.splice(0);
      toNotify.forEach((fn) => fn(cats));
      return cats;
    })
    .catch(() => {
      _promise = null;
      if (_cache === null) _cache = [];
      return _cache;
    });

  return _promise;
}

/**
 * Önbellekteki kategorileri döndürür.
 * loadCategories() tamamlanmadan çağrılırsa boş dizi döner.
 */
export function getCategories(): ApiCategory[] {
  return _cache ?? [];
}

/**
 * Kategoriler yüklendiğinde çalışacak callback'i kaydeder.
 * Eğer zaten yüklendiyse hemen çalıştırır.
 */
export function onCategoriesLoaded(fn: (cats: ApiCategory[]) => void): void {
  if (_cache !== null) {
    fn(_cache);
    return;
  }
  _listeners.push(fn);
  loadCategories();
}

/** URL slug ile kategori bulur (üst + alt kategoriler dahil) */
export function findCategoryBySlug(slug: string): ApiCategory | ApiCategoryChild | undefined {
  const cats = _cache ?? [];
  for (const c of cats) {
    if (c.slug === slug) return c;
    const child = c.children?.find((ch) => ch.slug === slug);
    if (child) return child;
  }
  return undefined;
}

/** Frappe document ID ile kategori bulur (üst + alt kategoriler dahil) */
export function findCategoryById(id: string): ApiCategory | ApiCategoryChild | undefined {
  const cats = _cache ?? [];
  for (const c of cats) {
    if (c.id === id) return c;
    const child = c.children?.find((ch) => ch.id === id);
    if (child) return child;
  }
  return undefined;
}
