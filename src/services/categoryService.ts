/**
 * Category Service — Merkezi kategori veri yönetimi
 * Backend'deki Product Category DocType'larını çeker ve önbelleğe alır.
 * Tüm bileşenler bu servisi kullanarak aynı API çağrısını paylaşır.
 */

import { callMethod } from '../utils/api'

export interface ApiCategory {
  id: string
  name: string
  slug: string
  image?: string
  icon_class?: string
  children: ApiCategoryChild[]
}

export interface ApiCategoryChild {
  id: string
  name: string
  slug: string
  image?: string
}

let _cache: ApiCategory[] | null = null
let _promise: Promise<ApiCategory[]> | null = null
const _listeners: Array<(cats: ApiCategory[]) => void> = []

/**
 * Kategorileri API'den çeker ve önbelleğe alır.
 * Birden fazla çağrıda tek fetch yapılır (deduplication).
 */
export function loadCategories(): Promise<ApiCategory[]> {
  if (_cache !== null) return Promise.resolve(_cache)
  if (_promise) return _promise

  _promise = (callMethod<ApiCategory[]>('tradehub_core.api.category.get_mega_menu'))
    .then((data) => {
      const cats: ApiCategory[] = Array.isArray(data) ? data : []
      _cache = cats
      _promise = null
      const toNotify = _listeners.splice(0)
      toNotify.forEach(fn => fn(cats))
      return cats
    })
    .catch(() => {
      _promise = null
      if (_cache === null) _cache = []
      return _cache
    })

  return _promise
}

/**
 * Önbellekteki kategorileri döndürür.
 * loadCategories() tamamlanmadan çağrılırsa boş dizi döner.
 */
export function getCategories(): ApiCategory[] {
  return _cache ?? []
}

/**
 * Kategoriler yüklendiğinde çalışacak callback'i kaydeder.
 * Eğer zaten yüklendiyse hemen çalıştırır.
 */
export function onCategoriesLoaded(fn: (cats: ApiCategory[]) => void): void {
  if (_cache !== null) {
    fn(_cache)
    return
  }
  _listeners.push(fn)
  loadCategories()
}

/** URL slug ile kategori bulur (üst + alt kategoriler dahil) */
export function findCategoryBySlug(slug: string): ApiCategory | ApiCategoryChild | undefined {
  const cats = _cache ?? []
  for (const c of cats) {
    if (c.slug === slug) return c
    const child = c.children?.find(ch => ch.slug === slug)
    if (child) return child
  }
  return undefined
}

/** Frappe document ID ile kategori bulur (üst + alt kategoriler dahil) */
export function findCategoryById(id: string): ApiCategory | ApiCategoryChild | undefined {
  const cats = _cache ?? []
  for (const c of cats) {
    if (c.id === id) return c
    const child = c.children?.find(ch => ch.id === id)
    if (child) return child
  }
  return undefined
}
