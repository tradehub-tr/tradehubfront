/**
 * TopRankingGrid Component
 *
 * Two-mode rendering driven by the parent `topRankingPage` Alpine state:
 *
 *   - "grouped" mode (Tümü tab): category cards each holding 3 ranked
 *     products with #1/#2/#3 badges. Driven by get_top_ranking_grouped.
 *   - "flat" mode (specific category tab): a flat 2x5 product grid (mobile
 *     2 cols, tablet 3, desktop 5) driven by searchListings({ category }).
 *
 * Both modes share a single load-more button and a single empty state.
 */

import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import type { RankingCategoryGroup, RankedProduct } from "../../types/topRanking";

/** HTML-encode dynamic strings before injecting into innerHTML. */
function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Parse numeric MOQ out of legacy backend format ("532 Nos" → 532). */
function moqCount(moq: string | undefined): number {
  if (!moq) return 1;
  const m = String(moq).match(/(\d+)/);
  return m ? parseInt(m[1], 10) || 1 : 1;
}

function moqLabel(moq: string | undefined): string {
  return t("common.moq", { count: moqCount(moq), unit: t("common.moqUnit") });
}

/** Build the URL for a category's "Daha fazla yükle" detail page. */
function categoryHref(group: RankingCategoryGroup): string {
  // /pages/products.html?cat=<slug> — must be the URL-friendly slug, not
  // the Product Category's UUID-shaped `name`, otherwise the listing
  // endpoint can't resolve the category and shows "0 ürün".
  const slug = group.slug || group.categoryId || group.id;
  return `/pages/products.html?cat=${encodeURIComponent(slug)}&sort=orders`;
}

export function renderRankingGroupCard(group: RankingCategoryGroup): string {
  const safeName = escapeHtml(group.name);
  const headerHref = categoryHref(group);

  const productsHtml = group.products
    .map((product) => {
      // Rank badge colors using theme semantic colors
      let badgeClass = "";
      if (product.rank === 1) badgeClass = "bg-success-500";
      else if (product.rank === 2) badgeClass = "bg-info-500";
      else badgeClass = "bg-warning-500";

      const safeProductName = escapeHtml(product.name);
      const safeMoq = escapeHtml(product.moq);
      const safeImg = escapeHtml(product.imageSrc || "");
      const safeHref = escapeHtml(product.href || "#");

      return `
      <a href="${safeHref}" class="relative z-10 min-w-0 group/product" aria-label="${safeProductName}">
        <div class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-raised">
          <img
            src="${safeImg}"
            alt="${safeProductName}"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-300 group-hover/product:scale-105"
          />
          <!-- Rank badge -->
          <span
            class="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-white shadow-sm ${badgeClass}"
          >#${product.rank}</span>
        </div>
        <div class="mt-1.5">
          <p class="text-sm font-semibold text-text-primary">${formatPrice(product.price)}</p>
          <p class="text-xs text-text-tertiary mt-0.5">${escapeHtml(moqLabel(safeMoq))}</p>
        </div>
      </a>
    `;
    })
    .join("");

  // Stretched-link pattern: the header anchor's ::before pseudo element
  // covers the entire card via `before:absolute before:inset-0`, so clicking
  // any background area (header, padding, gaps between products, empty
  // grid cells) navigates to the category page. Each individual product
  // anchor carries its own `relative z-10` so it sits above the stretched
  // layer — only the actual thumbnail rectangles intercept clicks for
  // product detail navigation.
  return `
    <div class="relative bg-surface border border-border-default rounded-md p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <a href="${headerHref}" class="block group/header before:absolute before:inset-0 before:content-['']" aria-label="${safeName}">
        <h3 class="text-sm font-bold text-text-primary mb-3 truncate group-hover/header:underline" title="${safeName}">${safeName}</h3>
      </a>
      <div class="grid grid-cols-3 gap-3">
        ${productsHtml}
      </div>
    </div>
  `;
}

/**
 * Flat-mode product card (single category tab). No category header — the
 * page chrome already shows the active tab name. Each card is a small tile
 * with image, price and MOQ.
 */
export function renderRankingFlatCard(product: RankedProduct): string {
  const safeProductName = escapeHtml(product.name);
  const safeMoq = escapeHtml(product.moq);
  const safeImg = escapeHtml(product.imageSrc || "");
  const safeHref = escapeHtml(product.href || "#");

  return `
    <a href="${safeHref}" class="pc-topranking group/product flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-200" aria-label="${safeProductName}">
      <div class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-raised mb-2">
        <img
          src="${safeImg}"
          alt="${safeProductName}"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-300 group-hover/product:scale-105"
        />
      </div>
      <p class="text-sm font-semibold text-text-primary">${formatPrice(product.price)}</p>
      <p class="text-xs text-text-secondary mt-1 line-clamp-2 min-h-[2.4em]">${safeProductName}</p>
      <p class="text-xs text-text-tertiary mt-0.5 truncate">${escapeHtml(moqLabel(safeMoq))}</p>
    </a>
  `;
}

/** Skeleton placeholder used while a fetch is in flight. */
function renderSkeletonCard(): string {
  return `
    <div class="bg-surface border border-border-default rounded-md p-4 animate-pulse">
      <div class="h-4 w-1/2 rounded bg-gray-200 mb-3"></div>
      <div class="grid grid-cols-3 gap-3">
        <div>
          <div class="aspect-square w-full rounded-md bg-gray-200"></div>
          <div class="mt-1.5 h-3 w-2/3 rounded bg-gray-200"></div>
          <div class="mt-1 h-3 w-1/2 rounded bg-gray-200"></div>
        </div>
        <div>
          <div class="aspect-square w-full rounded-md bg-gray-200"></div>
          <div class="mt-1.5 h-3 w-2/3 rounded bg-gray-200"></div>
          <div class="mt-1 h-3 w-1/2 rounded bg-gray-200"></div>
        </div>
        <div>
          <div class="aspect-square w-full rounded-md bg-gray-200"></div>
          <div class="mt-1.5 h-3 w-2/3 rounded bg-gray-200"></div>
          <div class="mt-1 h-3 w-1/2 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  `;
}

export function TopRankingGrid(): string {
  return `
    <section class="mt-4" aria-label="Top ranking products">
      <!-- ──────────────────────────────────────────────────
           Grouped mode (Tümü tab): category cards with #1/#2/#3 product previews
           ────────────────────────────────────────────────── -->
      <template x-if="mode === 'grouped'">
        <div
          id="top-ranking-grid"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5"
          role="list"
          aria-label="Ranking category groups"
        >
          <template x-for="group in allGroups" :key="group.id">
            <div role="listitem" x-html="renderGroupCard(group)"></div>
          </template>

          <!-- Loading skeletons on initial load -->
          <template x-if="loading && allGroups.length === 0">
            <div role="listitem">${renderSkeletonCard()}</div>
          </template>
          <template x-if="loading && allGroups.length === 0">
            <div role="listitem">${renderSkeletonCard()}</div>
          </template>
          <template x-if="loading && allGroups.length === 0">
            <div role="listitem">${renderSkeletonCard()}</div>
          </template>
        </div>
      </template>

      <!-- ──────────────────────────────────────────────────
           Flat mode (single category tab): 2x5 product grid (responsive)
           ────────────────────────────────────────────────── -->
      <template x-if="mode === 'flat'">
        <div
          id="top-ranking-flat-grid"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4"
          role="list"
          aria-label="Ranking products"
        >
          <template x-for="product in flatProducts" :key="product.id">
            <div role="listitem" x-html="renderFlatCard(product)"></div>
          </template>
        </div>
      </template>

      <!-- Inline loader for "load more" requests (when there is already data) -->
      <div class="flex items-center justify-center py-4" x-show="loading && (allGroups.length > 0 || flatProducts.length > 0)" x-cloak>
        <div class="h-6 w-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
      </div>

      <!-- Empty state (works in both modes) -->
      <div
        class="flex items-center justify-center py-16"
        x-show="!loading && allGroups.length === 0 && flatProducts.length === 0"
        x-cloak
      >
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p class="text-sm text-gray-400" data-i18n="topRankingPage.empty">${t("topRankingPage.empty")}</p>
        </div>
      </div>

      <!-- Load more button (works in both modes) -->
      <div class="flex justify-center mt-8" x-show="hasMore && (allGroups.length > 0 || flatProducts.length > 0)" x-cloak>
        <button
          type="button"
          class="px-8 py-2.5 rounded-full border border-border-default text-sm font-semibold text-text-secondary bg-surface hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="loadMore()"
          :disabled="loading"
          data-i18n="topRankingPage.loadMore"
        >
          <span x-show="!loading" data-i18n="topRankingPage.loadMore">${t("topRankingPage.loadMore")}</span>
          <span x-show="loading" data-i18n="topRankingPage.loading">${t("topRankingPage.loading")}</span>
        </button>
      </div>
    </section>
  `;
}
