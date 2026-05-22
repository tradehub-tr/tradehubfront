/**
 * Brand pretty URL helper (Faz 4 page_resolver).
 * Backend: tradehub_core.seo.page_resolver.render_brand(slug, lang)
 *
 * Multi-language: lang='en' verilirse /en/marka/<slug> (Faz 7 path prefix).
 */

export interface BrandUrlInput {
  slug?: string;
  /** Yedek: backend'in döndürdüğü hazır URL */
  href?: string;
  /** Legacy fallback — slug yoksa kullanılır */
  id?: string;
}

export function getBrandUrl(
  brand: BrandUrlInput | null | undefined,
  lang: "tr" | "en" = "tr"
): string {
  if (!brand) return "#";
  if (brand.href) return brand.href;
  const prefix = lang === "en" ? "/en" : "";
  if (brand.slug) return `${prefix}/marka/${brand.slug}`;
  if (brand.id) return `/pages/brand.html?id=${brand.id}`;
  return "#";
}
