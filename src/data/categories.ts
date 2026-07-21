/**
 * Categories Page — Data types.
 *
 * Kategori verisi artık API'den (categoryService) geliyor; bu dosya yalnızca render
 * bileşenlerinin paylaştığı tipleri barındırır. Eski hardcoded `getCategorySections()`
 * (Unsplash görselli statik veri) kaldırıldı — hiçbir yerden çağrılmıyordu.
 */

export interface NavCategoryItem {
  id: string;
  name: string;
  href: string;
  image: string;
  subcategories: { name: string; href: string }[];
}

export interface CategorySection {
  title: string;
  slug?: string;
  categories: NavCategoryItem[];
}
