/**
 * Category Service — Merkezi kategori veri yönetimi
 * Backend'deki Product Category DocType'larını çeker ve önbelleğe alır.
 * Tüm bileşenler bu servisi kullanarak aynı API çağrısını paylaşır.
 */

import { callMethod } from "../utils/api";
import { queryFetch, queryKeys, policies } from "../lib/query";

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
  /** 3. seviye yaprak kategoriler (grup → yaprak). 2 seviyeli veride yok. */
  children?: ApiCategoryChild[];
}

/** Kökten yaprağa kadar bir kategori zinciri (breadcrumb için). */
export interface CategoryPathItem {
  id: string;
  name: string;
  slug: string;
}

let _cache: ApiCategory[] | null = null;
// Kalıcı aboneler — dil değiştiğinde kategoriler yeniden çekilip bunlara tekrar bildirilir.
const _subscribers: Array<(cats: ApiCategory[]) => void> = [];

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

function filterSpamChildren(children: ApiCategoryChild[]): ApiCategoryChild[] {
  return (children || [])
    .filter((ch) => !isSpamCategoryName(ch.name))
    .map((ch) => ({
      ...ch,
      children: ch.children ? filterSpamChildren(ch.children) : ch.children,
    }));
}

function filterSpam(cats: ApiCategory[]): ApiCategory[] {
  return cats
    .filter((c) => !isSpamCategoryName(c.name))
    .map((c) => ({
      ...c,
      children: filterSpamChildren(c.children || []),
    }));
}

/**
 * Kategorileri API'den çeker ve önbelleğe alır.
 *
 * Fetch + dedup + IndexedDB persist artık `queryFetch` cache katmanı üzerinden:
 * aynı key'e gelen paralel çağrılar dedup edilir ve sonuç MPA sayfa
 * yüklemeleri arasında IndexedDB'de saklanır (her yüklemede yeniden çekilmez).
 * Senkron getter'lar için modül-içi `_cache` ve `onCategoriesLoaded`
 * dinleyicileri burada beslenir.
 */
export function loadCategories(): Promise<ApiCategory[]> {
  if (_cache !== null) return Promise.resolve(_cache);

  return queryFetch(
    queryKeys.categories(),
    async () => {
      const data = await callMethod<ApiCategory[]>("tradehub_core.api.category.get_mega_menu");
      const raw: ApiCategory[] = Array.isArray(data) ? data : [];
      return filterSpam(raw);
    },
    policies.categories
  )
    .then((cats) => {
      _cache = cats;
      _subscribers.forEach((fn) => fn(cats));
      return cats;
    })
    .catch(() => {
      if (_cache === null) _cache = [];
      return _cache;
    });
}

// Dil değiştiğinde kategori önbelleğini geçersiz kıl ve yeni dilde yeniden çek;
// kalıcı aboneler (mega menü, sidebar vb.) yeni içerikle tekrar render olur.
if (typeof window !== "undefined") {
  window.addEventListener("languageChanged", () => {
    _cache = null;
    loadCategories();
  });
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
  // Kalıcı kayıt: dil değişiminde de tekrar bildirilebilsin.
  _subscribers.push(fn);
  if (_cache !== null) {
    fn(_cache);
    return;
  }
  loadCategories();
}

/** URL slug ile kategori bulur (3 seviye: sektör + grup + yaprak) */
export function findCategoryBySlug(slug: string): ApiCategory | ApiCategoryChild | undefined {
  return findInTree((c) => c.slug === slug);
}

/** Frappe document ID ile kategori bulur (3 seviye: sektör + grup + yaprak) */
export function findCategoryById(id: string): ApiCategory | ApiCategoryChild | undefined {
  return findInTree((c) => c.id === id);
}

/** Cache ağacında (3 seviye) predicate'i sağlayan ilk kategoriyi döndürür. */
function findInTree(
  match: (c: ApiCategory | ApiCategoryChild) => boolean
): ApiCategory | ApiCategoryChild | undefined {
  for (const sector of _cache ?? []) {
    if (match(sector)) return sector;
    for (const group of sector.children ?? []) {
      if (match(group)) return group;
      const leaf = group.children?.find(match);
      if (leaf) return leaf;
    }
  }
  return undefined;
}

/**
 * slug ya da ID ile eşleşen kategorinin kökten kendisine kadar olan zincirini
 * döndürür (breadcrumb için). Eşleşme yoksa boş dizi.
 */
export function findCategoryPath(slugOrId: string): CategoryPathItem[] {
  const pick = (c: ApiCategory | ApiCategoryChild): CategoryPathItem => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  });
  const matches = (c: ApiCategory | ApiCategoryChild) => c.slug === slugOrId || c.id === slugOrId;

  for (const sector of _cache ?? []) {
    if (matches(sector)) return [pick(sector)];
    for (const group of sector.children ?? []) {
      if (matches(group)) return [pick(sector), pick(group)];
      for (const leaf of group.children ?? []) {
        if (matches(leaf)) return [pick(sector), pick(group), pick(leaf)];
      }
    }
  }
  return [];
}
