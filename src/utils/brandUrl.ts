/**
 * Brand pretty URL helper (Faz 4 page_resolver).
 * Backend: tradehub_core.seo.page_resolver.render_brand(slug, lang)
 *
 * Dil öneki YOK — dil `?hl=` parametresiyle taşınır (K7, 16 Eyl 2026).
 * Eski `/en/...` adresleri nginx'te 301 ile buraya döner.
 */

import { sanitizeUrl } from "./sanitize";
import { isNativeBundleContext } from "./nativeHttp";

export interface BrandUrlInput {
  slug?: string;
  /** Yedek: backend'in döndürdüğü hazır URL */
  href?: string;
  /** Legacy fallback — slug yoksa kullanılır */
  id?: string;
}

export function getBrandUrl(brand: BrandUrlInput | null | undefined): string {
  if (!brand) return "#";
  if (brand.href && !isNativeBundleContext()) return sanitizeUrl(brand.href);
  if (isNativeBundleContext() && brand.id) return `/pages/brand.html?id=${brand.id}`;
  if (brand.slug) return `/marka/${brand.slug}`;
  if (brand.id) return `/pages/brand.html?id=${brand.id}`;
  return "#";
}
