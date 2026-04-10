export interface RankedProduct {
  id: string;
  name: string;
  href: string;
  price: string;
  imageSrc: string;
  moq: string;
  rank: 1 | 2 | 3;
}

export interface RankingCategoryGroup {
  id: string;
  name: string;
  nameKey: string;
  categoryId: string;
  /** URL-friendly slug for the category. Used by the storefront listing
   * link so the products page receives a slug (not a UUID-shaped name). */
  slug?: string;
  products: RankedProduct[];
}
