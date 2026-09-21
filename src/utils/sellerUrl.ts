/**
 * Admin Seller Profile pretty URL helper (Faz 4 page_resolver).
 * Backend: tradehub_core.seo.page_resolver.render_seller(slug, lang)
 *
 * Dil öneki YOK — dil `?hl=` parametresiyle taşınır (K7, 16 Eyl 2026).
 * Eski `/en/...` adresleri nginx'te 301 ile buraya döner.
 */

import { isNativeBundleContext } from "./nativeHttp";

export interface SellerUrlInput {
  slug?: string;
  href?: string;
  id?: string;
}

export function getSellerUrl(seller: SellerUrlInput | null | undefined): string {
  if (!seller) return "#";
  if (seller.href && !isNativeBundleContext()) return seller.href;
  if (isNativeBundleContext() && seller.id)
    return `/pages/seller/seller-shop.html?seller=${encodeURIComponent(seller.id)}`;
  if (seller.slug) return `/magaza/${seller.slug}`;
  if (seller.id) return `/pages/seller/seller-shop.html?seller=${encodeURIComponent(seller.id)}`;
  return "#";
}

/**
 * Mağazanın DÜKKAN sayfası (/magaza/<satıcı kodu>/dukkan) — "Mağazayı Ziyaret Et"
 * aksiyonu buraya gider; /magaza/<slug> profil sayfasıdır. Native bundle'da
 * pretty route yok → seller-shop.html?seller= yoluna düşer.
 */
export function getSellerStoreUrl(sellerCode: string | null | undefined): string {
  if (!sellerCode) return "#";
  if (isNativeBundleContext())
    return `/pages/seller/seller-shop.html?seller=${encodeURIComponent(sellerCode)}`;
  return `/magaza/${encodeURIComponent(sellerCode)}/dukkan`;
}
