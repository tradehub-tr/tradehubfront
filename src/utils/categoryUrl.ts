/**
 * Product Category pretty URL helper (Faz 4 page_resolver).
 * Backend: tradehub_core.seo.page_resolver.render_category(slug, lang)
 *
 * NOT: Category'de slug field'ı `url_slug` (Listing/Brand/Seller'dan farklı).
 * Helper her ikisini de kabul eder — `url_slug` öncelikli.
 */

export interface CategoryUrlInput {
	/** Category.url_slug öncelikli */
	url_slug?: string;
	/** Geriye dönük: slug field'ı varsa */
	slug?: string;
	href?: string;
	id?: string;
}

export function getCategoryUrl(
	category: CategoryUrlInput | null | undefined,
	lang: "tr" | "en" = "tr",
): string {
	if (!category) return "#";
	if (category.href) return category.href;
	const prefix = lang === "en" ? "/en" : "";
	const slug = category.url_slug || category.slug;
	if (slug) return `${prefix}/kategori/${slug}`;
	if (category.id) return `/pages/categories.html?id=${category.id}`;
	return "#";
}
