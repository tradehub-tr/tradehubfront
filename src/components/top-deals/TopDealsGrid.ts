/**
 * TopDealsGrid Component
 *
 * Alibaba-style flat product grid for the Top Deals page. The active tab
 * (Tümü or any specific category) only changes which products are shown —
 * the layout stays a flat grid throughout. The Alpine container in
 * top-deals.ts owns `products`, `loading`, `hasMore` and `loadMore()`.
 */

import { t } from '../../i18n';
import { formatPrice } from '../../utils/currency';
import type { TopDealsProduct } from '../../types/topDeals';

/* ── Renderers ───────────────────────────────────────────────────────── */

function renderProductImage(imgSrc: string, name: string): string {
  if (!imgSrc) {
    return `
      <div class="w-full h-full flex items-center justify-center bg-gray-100">
        <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/>
        </svg>
      </div>
    `;
  }
  return `
    <img
      src="${imgSrc}"
      alt="${name}"
      loading="lazy"
      class="w-full h-full object-cover transition-transform duration-300 group-hover/product:scale-105"
    />
  `;
}

/** Single product card used by both All and per-category tabs. */
export function renderTopDealsFlatCard(product: TopDealsProduct): string {
  return `
    <a href="${product.href}" class="group/product flex flex-col bg-surface border border-border-default rounded-md p-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-raised mb-2">
        ${renderProductImage(product.imageSrc || '', product.name)}
      </div>
      <p class="text-sm font-semibold text-text-primary">${formatPrice(product.price)}</p>
      <p class="text-xs text-text-tertiary mt-0.5 truncate">MOQ: ${product.moq}</p>
      <p class="text-xs text-text-secondary mt-1 line-clamp-2 min-h-[2.4em]">${product.name}</p>
    </a>
  `;
}

/** Skeleton placeholder used while a fetch is in flight (initial load only). */
function renderSkeletonCard(): string {
  return `
    <div class="bg-surface border border-border-default rounded-md p-3 animate-pulse">
      <div class="aspect-square bg-gray-200 rounded-md mb-2"></div>
      <div class="h-4 w-16 bg-gray-200 rounded mb-1"></div>
      <div class="h-3 w-12 bg-gray-200 rounded"></div>
    </div>
  `;
}

/* ── Section template ─────────────────────────────────────────────────── */

export function TopDealsGrid(): string {
  return `
    <section class="mt-4" aria-label="Top deals products">
      <!-- Initial load skeleton -->
      <template x-if="loading && products.length === 0">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
          ${Array.from({ length: 12 }).map(renderSkeletonCard).join('')}
        </div>
      </template>

      <!-- Flat product grid (Alibaba style — no category headers) -->
      <template x-if="!(loading && products.length === 0)">
        <div>
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4"
            role="list"
            aria-label="Deal products"
          >
            <template x-for="product in products" :key="product.id">
              <div role="listitem" x-html="renderFlatCard(product)"></div>
            </template>
          </div>
          <!-- Empty state -->
          <div class="flex items-center justify-center py-12" x-show="products.length === 0 && !loading">
            <p class="text-sm text-gray-400" data-i18n="topDealsPage.noResults">${t('topDealsPage.noResults')}</p>
          </div>
        </div>
      </template>

      <!-- Inline loader for "load more" requests -->
      <div class="flex items-center justify-center py-4" x-show="loading && products.length > 0">
        <div class="h-6 w-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
      </div>

      <!-- Load more button -->
      <div class="flex justify-center mt-8" x-show="hasMore && !loading">
        <button
          type="button"
          class="th-btn-outline px-8 py-2.5 text-sm font-semibold"
          @click="loadMore()"
          data-i18n="topDealsPage.loadMore"
        >${t('topDealsPage.loadMore')}</button>
      </div>
    </section>
  `;
}

// Legacy single-card renderer (kept for backwards compatibility)
export function renderTopDealCard(product: TopDealsProduct): string {
  return renderTopDealsFlatCard(product);
}

// ── Legacy grouped-mode shims ─────────────────────────────────────────
// The grouped layout was retired in favour of the flat grid above, but
// pages/top-deals.ts still imports the type and renderer from here. The
// shims below preserve the public surface without re-introducing the
// removed UI: the renderer just emits a flat product grid wrapped under
// the category name, which matches the structure top-deals.ts expects.
// Once top-deals.ts is rewritten to use the flat path exclusively, both
// of these can be deleted.

export interface TopDealsGroup {
  id: string;
  name: string;
  slug: string;
  totalInCategory: number;
  products: TopDealsProduct[];
}

export function renderTopDealsGroupCard(group: TopDealsGroup): string {
  const productsHtml = group.products
    .map(p => renderTopDealsFlatCard(p))
    .join('');
  return `
    <div class="bg-surface border border-border-default rounded-md p-4">
      <h3 class="text-sm font-bold text-text-primary mb-3 truncate" title="${group.name}">${group.name}</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${productsHtml}
      </div>
    </div>
  `;
}
