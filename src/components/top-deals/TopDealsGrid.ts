/**
 * TopDealsGrid Component
 * Paylaşılan zengin ürün kartıyla (ListingCard) düz grid. Sayfalama
 * numaralıdır (append yok) — scale-resilience: DOM'da her an tek
 * sayfalık kart bulunur. Kart render'ı Alpine container'daki
 * renderCard() üzerinden gelir (pages/top-deals.ts).
 */
import { t } from "../../i18n";
import { renderListingCardSkeletons } from "../shared/ListingCardSkeleton";

// İskelet: masaüstünde 2 satır (5 sütun × 2), mobilde 2 satır (2 sütun × 2) görünür.
// Viewport'u doldurmak yeter; gerçek 24 kart geldiğinde fazlası katlanma
// çizgisinin altına düşer (görünmeyen kayma CLS'e girmez), sonuç boş çıktığında
// da boş-durum bloğu aynı yüksekliği korur.
const SKELETON_MOBILE_VISIBLE = 4;

/**
 * @param skeletonCount İskelet kart sayısı (MOGEM-638 §2.3): eskiden 10 iskelet
 *   `<template x-if>` içindeydi — Alpine açılana kadar HİÇ çizilmiyor, footer
 *   ızgaranın yerine boyanıyordu. Statik `x-show` iskelet Alpine'dan önce görünür.
 *   Ölçüm (15 Eyl) kaymanın asıl kaynağını gösterdi: sonuç BOŞ dönünce iskelet
 *   çöküyor, footer yukarı fırlıyordu (0,649'un tamamı). Çözüm: viewport'u dolduran
 *   iskelet + aynı yükseklikte boş-durum bloğu (`min-h`).
 */
export function TopDealsGrid(skeletonCount = 10): string {
  return `
    <section class="mt-4" aria-label="Top deals products">
      <!-- Yükleme skeleton'ı (ilk yükleme + sayfa geçişi) — statik, Alpine'dan önce görünür -->
      <div x-show="loading" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
        ${renderListingCardSkeletons(skeletonCount, SKELETON_MOBILE_VISIBLE)}
      </div>

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

          <!-- Boş durum: iskelet bloğuyla AYNI yükseklik (2 satır) — sonuç boş çıkınca
               iskelet çökmesin, footer yukarı fırlamasın (ölçüldü: 0,649'un tamamı buydu) -->
          <div class="flex items-center justify-center py-12 min-h-[600px] md:min-h-[740px]" x-show="products.length === 0">
            <p class="text-sm text-gray-400" data-i18n="topDealsPage.noResults">${t("topDealsPage.noResults")}</p>
          </div>

          <!-- Numaralı sayfalama (paylaşılan Pagination çıktısı) -->
          <div x-html="paginationHtml" @click="onPageClick($event)"></div>
        </div>
      </template>
    </section>
  `;
}
