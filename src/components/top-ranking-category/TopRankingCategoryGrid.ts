/**
 * TopRankingCategoryGrid — Adanmış Top Ranking Category sayfasının ürün grid'i.
 *
 * Mevcut `TopRankingGrid` flat modundan farkları:
 *  - Büyük rank rozeti (#1..#100). #1/#2/#3 canlı renk; #4+ koyu nötr.
 *  - Yıldız + ortalama + count satırı (rating > 0 ise).
 *  - Ürün adı 2 satır clamp.
 *  - "Karşılaştır" checkbox, sepete ekle vb. yok.
 *
 * Parent Alpine state: { products: RankedProduct[], loading: boolean, page: number }
 */

import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import type { RankedProduct } from "../../types/topRanking";

const PAGE_SIZE = 50;

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function moqCount(moq: string | undefined): number {
  if (!moq) return 1;
  const m = String(moq).match(/(\d+)/);
  return m ? parseInt(m[1], 10) || 1 : 1;
}

function moqLabel(moq: string | undefined): string {
  return t("common.moq", { count: moqCount(moq), unit: t("common.moqUnit") });
}

/** Rozet renk seçici — 1/2/3 canlı, 4+ nötr. */
function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-success-500";
  if (rank === 2) return "bg-info-500";
  if (rank === 3) return "bg-warning-500";
  return "bg-secondary-700";
}

/** Yıldız simgeleri — 5 yıldız, dolu/yarım/boş. */
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    "★".repeat(full) +
    (half ? "☆" : "") +
    "☆".repeat(empty)
  );
}

/**
 * Tek bir rank kartını render et. `rank` parametresi, parent'in
 * (page-1)*PAGE_SIZE + index + 1 ile hesapladığı 1..100 değeri.
 */
export function renderRankedCategoryCard(product: RankedProduct, rank: number): string {
  const safeName = escapeHtml(product.name);
  const safeMoq = escapeHtml(product.moq);
  const safeImg = escapeHtml(product.imageSrc || "");
  const safeHref = escapeHtml(product.href || "#");
  const badgeClass = rankBadgeClass(rank);

  const rating = product.averageRating || 0;
  const ratingCount = product.ratingCount || 0;
  const ratingHtml = rating > 0
    ? `
      <div class="flex items-center gap-1.5 mt-1.5">
        <span class="text-warning-500 text-[13px] leading-none" aria-hidden="true">${renderStars(rating)}</span>
        <span class="text-[13px] text-text-secondary">${rating.toFixed(1)}</span>
        ${ratingCount > 0 ? `<span class="text-[13px] text-text-tertiary">${t("topRankingCategoryPage.ratingCount", { count: ratingCount })}</span>` : ""}
      </div>
    `
    : "";

  return `
    <a href="${safeHref}" class="group/product flex flex-col bg-surface border border-border-default rounded-md p-2.5 hover:-translate-y-0.5 hover:shadow-md hover:border-primary-300 transition-all duration-200" aria-label="${safeName}">
      <div class="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-surface-raised mb-2">
        <img
          src="${safeImg}"
          alt="${safeName}"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-300 group-hover/product:scale-105"
        />
        <span
          class="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-white shadow-sm ${badgeClass}"
          aria-label="Rank ${rank}"
        >#${rank}</span>
      </div>
      <p class="text-sm font-medium text-text-primary line-clamp-2 leading-snug">${safeName}</p>
      ${ratingHtml}
      <p class="text-base font-bold text-text-primary mt-1">${formatPrice(product.price)}</p>
      <p class="text-xs text-text-tertiary mt-0.5 truncate">${escapeHtml(moqLabel(safeMoq))}</p>
    </a>
  `;
}

function renderSkeletonCard(): string {
  return `
    <div class="bg-surface border border-border-default rounded-md p-2.5 animate-pulse">
      <div class="aspect-[4/3] w-full rounded-md bg-gray-200 mb-2"></div>
      <div class="h-4 w-3/4 rounded bg-gray-200"></div>
      <div class="h-3 w-1/2 rounded bg-gray-200 mt-2"></div>
      <div class="h-4 w-1/3 rounded bg-gray-200 mt-2"></div>
    </div>
  `;
}

export function TopRankingCategoryGrid(): string {
  return `
    <section class="mt-4" aria-label="Top ranking products">
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3"
        role="list"
        aria-label="Ranking products"
      >
        <template x-for="(product, idx) in products" :key="product.id + '-' + idx">
          <div role="listitem" x-html="renderCard(product, (page - 1) * ${PAGE_SIZE} + idx + 1)"></div>
        </template>

        <!-- Skeletons on initial load only -->
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
      </div>

      <!-- Inline loader for page-change requests (when there is already data) -->
      <div class="flex items-center justify-center py-4" x-show="loading && products.length > 0" x-cloak>
        <div class="h-6 w-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
      </div>

      <!-- Empty state -->
      <div
        class="flex items-center justify-center py-16"
        x-show="!loading && products.length === 0"
        x-cloak
      >
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p class="text-sm text-gray-400" data-i18n="topRankingCategoryPage.empty">${t("topRankingCategoryPage.empty")}</p>
        </div>
      </div>
    </section>
  `;
}
