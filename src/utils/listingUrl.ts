/**
 * Listing pretty URL helper (Faz 4 page_resolver pattern).
 *
 * Backend `/urun/<slug>` rotasını tradehub_core.seo.page_resolver.render_listing
 * ile render eder. Storefront tüm linkleri bu pretty URL formatında üretmeli ki
 * (a) SEO meta server-side inject edilsin, (b) Google indeksleme doğru olsun.
 *
 * Dil öneki YOK — dil `?hl=` parametresiyle taşınır (K7, 16 Eyl 2026).
 * Eski `/en/...` adresleri nginx'te 301 ile buraya döner.
 *
 * Eski format `/pages/product-detail.html?id=<id>` deprecated — slug yoksa
 * legacy fallback olarak kullanılır (gradual migration için).
 */

import { sanitizeUrl } from "./sanitize";
import { isNativeBundleContext } from "./nativeHttp";

export interface ListingUrlInput {
  /** Listing.name (örn. "LST-00201"). slug yoksa fallback için kullanılır. */
  id?: string;
  /** Listing.slug (örn. "premium-kadin-canta-..."). */
  slug?: string;
  /** Backend zaten hazır URL döndürdüyse onu kullan. */
  href?: string;
}

/**
 * Bir listing kaydı için ürün detay sayfasının URL'ini döner.
 *
 * Öncelik: href > /urun/<slug> > /pages/product-detail.html?id=<id> (legacy fallback)
 *
 * Capacitor bundle modunda pretty URL'ler (/urun/<slug>) fiziksel dosyaya karşılık
 * gelmediği için daima legacy formata düşer.
 */
export function getListingUrl(listing: ListingUrlInput | null | undefined): string {
  if (!listing) return "#";
  // Backend href is untrusted — reject javascript:/data:/protocol-relative
  // (open redirect / XSS) before it reaches an href attribute sink.
  // Native bundle'da backend href'i de legacy'ye çevir (pretty URL dosya yok).
  if (listing.href && !isNativeBundleContext()) return sanitizeUrl(listing.href);
  // Native bundle modunda pretty URL çalışmaz → legacy fallback kullan
  if (isNativeBundleContext() && listing.id) {
    return `/pages/product-detail.html?id=${listing.id}`;
  }
  if (listing.slug) return `/urun/${listing.slug}`;
  if (listing.id) return `/pages/product-detail.html?id=${listing.id}`;
  return "#";
}
