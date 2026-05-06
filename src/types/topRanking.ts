export interface RankedProduct {
  id: string;
  name: string;
  href: string;
  price: string;
  imageSrc: string;
  moq: string;
  /** 1..100 — rank rozetinde gösterilen sıra. Grouped modda 1|2|3, flat/category sayfada 1..100. */
  rank: number;
  /** 0..5 — backend `mapListingCard` `rating` alanından kopyalanır. Yoksa undefined. */
  averageRating?: number;
  /** Backend `mapListingCard` `reviewCount` alanından. Yoksa undefined. */
  ratingCount?: number;
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
