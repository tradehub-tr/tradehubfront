/**
 * Product Category pretty URL helper (Faz 4 page_resolver).
 * Backend: tradehub_core.seo.page_resolver.render_category(slug, lang)
 *
 * Dil öneki YOK — dil `?hl=` parametresiyle taşınır (K7, 16 Eyl 2026).
 * Eski `/en/...` adresleri nginx'te 301 ile buraya döner.
 *
 * NOT: Category'de slug field'ı `url_slug` (Listing/Brand/Seller'dan farklı).
 * Helper her ikisini de kabul eder — `url_slug` öncelikli.
 */

import { isNativeBundleContext } from "./nativeHttp";

export interface CategoryUrlInput {
  /** Category.url_slug öncelikli */
  url_slug?: string;
  /** Geriye dönük: slug field'ı varsa */
  slug?: string;
  href?: string;
  id?: string;
}

export function getCategoryUrl(category: CategoryUrlInput | null | undefined): string {
  if (!category) return "#";
  if (category.href && !isNativeBundleContext()) return category.href;
  if (isNativeBundleContext() && category.id) return `/pages/categories.html?id=${category.id}`;
  const slug = category.url_slug || category.slug;
  if (slug) return `/kategori/${slug}`;
  if (category.id) return `/pages/categories.html?id=${category.id}`;
  return "#";
}
