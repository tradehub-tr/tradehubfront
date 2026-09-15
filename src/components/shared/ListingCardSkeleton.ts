/**
 * Zengin ürün kartı (ListingCard) anatomisiyle aynı yükseklikte iskelet:
 * kare görsel + iki satır başlık + fiyat + MOQ + iki buton. Yükleme sırasında
 * ızgaraya SAYFA BOYUTU kadar basılır ki footer gerçek kartlar gelmeden
 * viewport'a girip sonra aşağı itilmesin (MOGEM-638 §2.3: top-deals CLS 0,649,
 * ürün listesi 0,44 — ikisi de FOOTER kaynaklı).
 */
export function renderListingCardSkeleton(extraClass = ""): string {
  return `
    <div class="animate-pulse rounded-md border border-gray-200 bg-white overflow-hidden ${extraClass}" aria-hidden="true">
      <div class="aspect-square bg-gray-200"></div>
      <div class="p-3 space-y-2">
        <div class="h-4 w-full bg-gray-200 rounded"></div>
        <div class="h-4 w-2/3 bg-gray-200 rounded"></div>
        <div class="h-5 w-24 bg-gray-200 rounded"></div>
        <div class="h-3 w-20 bg-gray-200 rounded"></div>
        <div class="flex gap-2 pt-1">
          <div class="h-9 flex-1 bg-gray-200 rounded-md"></div>
          <div class="h-9 flex-1 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * `mobileVisible` verilirse o dizinden sonraki kartlar mobilde gizlenir (`hidden
 * md:block`): mobilde 2 sütun × 2 satır viewport'u doldurur, fazlası sonuç boş
 * çıkınca büyük bir çökme (CLS) üretir.
 */
export function renderListingCardSkeletons(count: number, mobileVisible?: number): string {
  return Array.from({ length: count }, (_, i) =>
    renderListingCardSkeleton(
      mobileVisible !== undefined && i >= mobileVisible ? "hidden md:block" : ""
    )
  ).join("");
}
