import type { CartDrawerItemModel } from "./SharedCartDrawer";

/**
 * Sol önizleme panelinin gösterim listesi. Öncelik renk varyantı görselleri;
 * renk ekseni yoksa ürünün galeri görsellerine düşer (Alibaba deseni) —
 * böylece varyantsız üründe panel boş kalmaz.
 */
export interface PreviewEntry {
  imageUrl?: string;
  colorHex?: string;
  label?: string;
  isColor: boolean;
}

export function getPreviewEntries(item: CartDrawerItemModel | null): PreviewEntry[] {
  if (!item) return [];

  if (item.colors.length > 0) {
    return item.colors.map((color) => ({
      imageUrl: color.imageUrl,
      colorHex: color.colorHex,
      label: color.label,
      isColor: true,
    }));
  }

  return (item.galleryImages ?? [])
    .filter((src) => !!src)
    .map((src) => ({ imageUrl: src, isColor: false }));
}
