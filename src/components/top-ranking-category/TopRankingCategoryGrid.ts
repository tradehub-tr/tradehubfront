/**
 * TopRankingCategoryGrid — Adanmış Top Ranking Category sayfasının ürün grid'i.
 *
 * Kartlar paylaşılan zengin ListingCard'dır (listeleme sayfasıyla aynı tasarım);
 * sıra rozeti karta `rank` opsiyonuyla geçilir. group/grid + data-list-mode
 * attribute'ları ListingCard'ın grid-mode variant'ları için zorunludur.
 * Kart render'ı Alpine container'daki renderCard() üzerinden gelir
 * (pages/top-ranking-category.ts).
 *
 * Parent Alpine state: { products: ProductListingCard[], loading: boolean, page: number }
 */

import { t } from "../../i18n";

const PAGE_SIZE = 50;

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

export function TopRankingCategoryGrid(): string {
  return `
    <section class="mt-4" aria-label="Top ranking products">
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
            aria-label="Ranking products"
          >
            <template x-for="(product, idx) in products" :key="product.id + '-' + idx">
              <div role="listitem" class="flex" x-html="renderCard(product, (page - 1) * ${PAGE_SIZE} + idx + 1)"></div>
            </template>
          </div>

          <!-- Boş durum -->
          <div class="flex items-center justify-center py-16" x-show="products.length === 0">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="text-sm text-gray-400" data-i18n="topRankingCategoryPage.empty">${t("topRankingCategoryPage.empty")}</p>
            </div>
          </div>
        </div>
      </template>
    </section>
  `;
}
