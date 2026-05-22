/**
 * Listing pretty URL helper (Faz 4 page_resolver pattern).
 *
 * Backend `/urun/<slug>` rotasını tradehub_core.seo.page_resolver.render_listing
 * ile render eder. Storefront tüm linkleri bu pretty URL formatında üretmeli ki
 * (a) SEO meta server-side inject edilsin, (b) Google indeksleme doğru olsun.
 *
 * Multi-language: lang='en' verilirse /en/urun/<slug> (Faz 7 path prefix).
 *
 * Eski format `/pages/product-detail.html?id=<id>` deprecated — slug yoksa
 * legacy fallback olarak kullanılır (gradual migration için).
 */

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
 */
export function getListingUrl(
	listing: ListingUrlInput | null | undefined,
	lang: "tr" | "en" = "tr",
): string {
	if (!listing) return "#";
	if (listing.href) return listing.href;
	const prefix = lang === "en" ? "/en" : "";
	if (listing.slug) return `${prefix}/urun/${listing.slug}`;
	if (listing.id) return `/pages/product-detail.html?id=${listing.id}`;
	return "#";
}
