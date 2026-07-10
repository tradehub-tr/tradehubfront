/**
 * TailoredProductGrid Component
 * Paylaşılan zengin ürün kartıyla (shared/ListingCard renderListingCard) 5
 * kolonlu grid kabuğu. İlk render'da boş — kartlar tailored-selections.ts
 * içindeki loadPage()/renderProducts() ile doldurulur (bkz. top-deals
 * TopDealsGrid deseni). Sayfalama numaralıdır (append yok).
 */
export function TailoredProductGrid(): string {
  return `
    <section class="pt-4 pb-8 lg:pb-12">
      <div class="container-boxed">
        <div id="ts-product-grid-empty" class="flex items-center justify-center py-12">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <p class="text-sm text-gray-400">Yakında yeni ürünler eklenecek</p>
          </div>
        </div>
        <div
          id="ts-product-grid"
          class="group/grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 hidden"
          data-list-mode="grid"
          role="list"
          aria-label="Tailored selection products"
        ></div>
        <div id="ts-pagination"></div>
      </div>
    </section>
  `;
}
