/**
 * ProductGrid Component
 * Ana sayfa ürün vitrini — liste/arama sayfasıyla AYNI kartı kullanır
 * (shared/ListingCard) ama butonsuz: `renderListingCard(card, { showActions: false })`.
 * Tek kart bileşeni birden çok sayfada → "az kod, çok yer" (DRY).
 *
 * Veri kaynağı zaten ortak: searchListings() → ProductListingCard[]. Eski sürüm
 * bu veriyi ayrı bir ProductCard tipine yeniden map'leyip ayrı renderProductCard
 * ile basıyordu; o kopya kaldırıldı.
 */
import { searchListings } from "../../services/listingService";
import { initCurrency } from "../../services/currencyService";
import { renderListingCard, initProductSliders } from "../shared/ListingCard";
import {
  initListingFavoriteTriggers,
  syncListingFavoriteHearts,
} from "../products/initListingFavorites";
import { applyListingSocialProof } from "../products/initListingSocialProof";

/** Load real products from API and re-render the grid. */
export function initProductGrid(): void {
  // Kart etkileşimleri (slider okları/dot, favori kalbi) document-delegation +
  // idempotent guard'lı — grid basılmadan önce bağlanması güvenli.
  initProductSliders();
  initListingFavoriteTriggers();

  initCurrency()
    // 14 = büyük ekran gridinin (2xl: 7 kolon) tam 2 satırı — alt satırda boşluk kalmasın.
    .then(() => searchListings({ page_size: 14 }))
    .then((result) => {
      if (result.products.length === 0) return;

      // Hide empty state
      const emptyState = document.getElementById("product-grid-empty");
      if (emptyState) emptyState.style.display = "none";

      const grid = document.getElementById("home-product-grid");
      if (!grid) return;

      // Liste sayfasıyla birebir aynı kart; ana sayfa vitrini aksiyon butonlarını
      // ve "Minimum sipariş" (MOQ) satırını gizler, görseli kırpmadan kare sığdırır.
      grid.innerHTML = result.products
        .map(
          (card) =>
            `<div role="listitem" class="flex">${renderListingCard(card, { showActions: false, showMoq: false, containImage: true })}</div>`
        )
        .join("");

      // Kartlar DOM'a girdi → favori kalplerini mevcut favori durumuna göre doldur.
      syncListingFavoriteHearts();
      // Sosyal kanıt: sinyali olan kartların ad↔fiyat arası slotunu dinamik
      // (dönen) etiketle doldur — grid innerHTML yazıldıktan SONRA çağrılır.
      applyListingSocialProof(result.products);
    })
    .catch((err) => console.warn("[ProductGrid] API load failed:", err));
}

export function ProductGrid(): string {
  return `
    <section
      data-theme-section="productgrid"
      aria-label="Recommended Products"
      style="background-color: var(--product-bg, #f4f4f4); padding-top: 28px; padding-bottom: 28px;"
    >
      <div class="container-wide">
        <div
          id="home-product-grid"
          class="group/grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 product-grid home-product-grid"
          style="gap: var(--product-grid-gap, 16px);"
          data-list-mode="grid"
          role="list"
          aria-label="Product listings"
        >
          <div id="product-grid-empty" class="col-span-full flex items-center justify-center py-12">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="text-sm text-gray-400">Yakında yeni ürünler eklenecek</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
