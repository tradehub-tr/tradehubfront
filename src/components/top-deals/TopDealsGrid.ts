/**
 * TopDealsGrid Component
 * Paylaşılan zengin ürün kartıyla (ListingCard) düz grid. Sayfalama
 * numaralıdır (append yok) — scale-resilience: DOM'da her an tek
 * sayfalık kart bulunur. Kart render'ı Alpine container'daki
 * renderCard() üzerinden gelir (pages/top-deals.ts).
 */
import { t } from "../../i18n";

/** Zengin kart anatomisine uygun skeleton (görsel + başlık + fiyat + butonlar). */
function renderSkeletonCard(): string {
  return `
    <div class="animate-pulse rounded-md border border-gray-200 bg-white overflow-hidden">
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

export function TopDealsGrid(): string {
  return `
    <section class="mt-4" aria-label="Top deals products">
      <!-- Yükleme skeleton'ı (ilk yükleme + sayfa geçişi) -->
      <template x-if="loading">
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          ${Array.from({ length: 10 }).map(renderSkeletonCard).join("")}
        </div>
      </template>

      <template x-if="!loading">
        <div>
          <!-- group/grid + data-list-mode: ListingCard'ın grid-mode variant'ları için zorunlu -->
          <div
            class="group/grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4"
            data-list-mode="grid"
            role="list"
            aria-label="Deal products"
          >
            <template x-for="product in products" :key="product.id">
              <div role="listitem" class="flex" x-html="renderCard(product)"></div>
            </template>
          </div>

          <!-- Boş durum -->
          <div class="flex items-center justify-center py-12" x-show="products.length === 0">
            <p class="text-sm text-gray-400" data-i18n="topDealsPage.noResults">${t("topDealsPage.noResults")}</p>
          </div>

          <!-- Numaralı sayfalama (paylaşılan Pagination çıktısı) -->
          <div x-html="paginationHtml" @click="onPageClick($event)"></div>
        </div>
      </template>
    </section>
  `;
}
