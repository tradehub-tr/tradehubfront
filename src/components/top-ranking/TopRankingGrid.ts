/**
 * TopRankingGrid Component
 *
 * Grouped mode only: category cards each holding 3 ranked products with
 * #1/#2/#3 badges. Driven by get_top_ranking_grouped.
 *
 * Flat (single-category) mode has been removed — it is now handled by the
 * dedicated "Top Ranking Category" page (/pages/top-ranking-category.html).
 */

import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import type { RankingCategoryGroup } from "../../types/topRanking";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

/** Rank rozetinin iki yanındaki küçük defne dalı süsü (emoji yasak → inline SVG). */
function laurelBranch(mirrored = false): string {
  return `
    <svg viewBox="0 0 10 20" fill="currentColor" aria-hidden="true"
      class="w-[6px] h-3 sm:w-[7px] sm:h-3.5 shrink-0${mirrored ? " -scale-x-100" : ""}">
      <ellipse cx="7.3" cy="17.6" rx="2.4" ry="1.5" transform="rotate(40 7.3 17.6)"/>
      <ellipse cx="4.9" cy="13.2" rx="2.4" ry="1.5" transform="rotate(70 4.9 13.2)"/>
      <ellipse cx="4.3" cy="8.6" rx="2.4" ry="1.5" transform="rotate(100 4.3 8.6)"/>
      <ellipse cx="5.8" cy="4.2" rx="2.4" ry="1.5" transform="rotate(130 5.8 4.2)"/>
    </svg>`;
}

/** Build the URL for a category's "Daha fazla yükle" detail page. */
function categoryHref(group: RankingCategoryGroup): string {
  const slug = group.slug || group.categoryId || group.id;
  return `/pages/top-ranking-category.html?cat=${encodeURIComponent(slug)}&sort=hot-selling&page=1`;
}

export function renderRankingGroupCard(group: RankingCategoryGroup): string {
  const safeName = escapeHtml(group.name);
  const headerHref = categoryHref(group);

  const productsHtml = group.products
    .map((product) => {
      // Çipsiz rozet: defne dalları madalya rengi taşır (altın/gümüş/bronz)
      const laurelClass =
        product.rank === 1
          ? "text-[#d97706]"
          : product.rank === 2
            ? "text-[#94a3b8]"
            : "text-[#b45309]";

      // Dar iç kolonlarda (sm..xl arası 2-3 kolonlu grid) tam aralık sığmaz;
      // "₺130,99-146,40" yerine "₺130,99+" gösterilir, tam değer title'da kalır.
      const fullPrice = escapeHtml(formatPrice(product.price));
      const dashIdx = fullPrice.indexOf("-");
      const shortPrice = dashIdx > 0 ? `${fullPrice.slice(0, dashIdx)}+` : fullPrice;

      const safeProductName = escapeHtml(product.name);
      const safeImg = escapeHtml(sanitizeUrl(product.imageSrc || ""));
      const safeHref = escapeHtml(sanitizeUrl(product.href || "#"));

      return `
      <a href="${safeHref}" class="relative z-10 min-w-0 group/product" aria-label="${safeProductName}">
        <div class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-raised">
          <img
            src="${safeImg}"
            alt="${safeProductName}"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-300 group-hover/product:scale-105 motion-reduce:transition-none motion-reduce:group-hover/product:scale-100"
          />
          <!-- Rank badge -->
          <span
            class="absolute top-1.5 start-1.5 h-5 sm:h-6 inline-flex items-center justify-center gap-0.5 text-[10px] sm:text-xs font-bold ${laurelClass}"
          >${laurelBranch()}<span class="text-text-primary">#${product.rank}</span>${laurelBranch(true)}</span>
          <!-- Filigran sıra numarası -->
          <span
            aria-hidden="true"
            class="absolute -bottom-1 end-1 text-[2rem] sm:text-[2.75rem] leading-none font-extrabold text-black/[0.07] pointer-events-none select-none"
          >${product.rank}</span>
        </div>
        <div class="mt-1.5">
          <p
            class="text-[11px] sm:text-xs xl:text-sm font-semibold text-text-primary truncate"
            title="${fullPrice}"
          ><span class="sm:hidden xl:inline">${fullPrice}</span><span class="hidden sm:inline xl:hidden">${shortPrice}</span></p>
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
    <div class="relative bg-surface border border-border-default rounded-md p-4 hover:-translate-y-0.5 hover:shadow-md transition-[transform,box-shadow] duration-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <a href="${headerHref}" class="block group/header before:absolute before:inset-0 before:content-['']" aria-label="${safeName}">
        <h3 class="text-sm xl:text-base font-bold text-text-primary mb-3 truncate group-hover/header:underline" title="${safeName}">${safeName}</h3>
      </a>
      <div class="grid grid-cols-3 gap-3">
        ${productsHtml}
      </div>
    </div>
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
        </div>
        <div>
          <div class="aspect-square w-full rounded-md bg-gray-200"></div>
          <div class="mt-1.5 h-3 w-2/3 rounded bg-gray-200"></div>
        </div>
        <div>
          <div class="aspect-square w-full rounded-md bg-gray-200"></div>
          <div class="mt-1.5 h-3 w-2/3 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  `;
}

export function TopRankingGrid(): string {
  return `
    <section class="mt-4" aria-label="Top ranking products">
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

      <!-- Inline loader for "load more" requests (when there is already data) -->
      <div class="flex items-center justify-center py-4" x-show="loading && allGroups.length > 0" x-cloak>
        <div class="h-6 w-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
      </div>

      <!-- Empty state -->
      <div
        class="flex items-center justify-center py-16"
        x-show="!loading && allGroups.length === 0"
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

      <!-- Load more button -->
      <div class="flex justify-center mt-8" x-show="hasMore && allGroups.length > 0" x-cloak>
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
