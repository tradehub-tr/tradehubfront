/**
 * Admin Seller Profile pretty URL helper (Faz 4 page_resolver).
 * Backend: tradehub_core.seo.page_resolver.render_seller(slug, lang)
 *
 * Multi-language: lang='en' verilirse /en/magaza/<slug> (Faz 7 path prefix).
 */

export interface SellerUrlInput {
  slug?: string;
  href?: string;
  id?: string;
}

export function getSellerUrl(
  seller: SellerUrlInput | null | undefined,
  lang: "tr" | "en" = "tr"
): string {
  if (!seller) return "#";
  if (seller.href) return seller.href;
  const prefix = lang === "en" ? "/en" : "";
  if (seller.slug) return `${prefix}/magaza/${seller.slug}`;
  if (seller.id) return `/pages/seller/seller-shop.html?id=${seller.id}`;
  return "#";
}
