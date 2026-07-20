import { t } from "../../i18n";
import { renderListingCard } from "../shared/ListingCard";
/**
 * ProductListingGrid Component
 * iSTOC-style product listing grid for products page.
 * Responsive grid with hover zoom effect on product images.
 * Uses CSS transitions for smooth 500ms zoom animation.
 */

import type { ProductListingCard, ViewMode } from "../../types/productListing";
// Mock data import removed — grid is now API-driven

// Placeholder images removed — all images come from API now

/**
 * No results component for empty state
 */
function renderNoResults(): string {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <!-- Search illustration -->
      <div class="relative mb-6">
        <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <!-- Small X badge -->
        <div class="absolute -top-1 -end-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg class="h-4 w-4 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${t("products.noResults")}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        ${t("products.noResultsDesc")}
      </p>
      <button
        type="button"
        class="th-btn inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-colors"
        data-filter-action="clear-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        ${t("products.clearFilters")}
      </button>
    </div>
  `;
}

/** No-op — ProductListingGrid uses CSS grid, no JS initialization needed. */
export function initProductListingGrid(): void {}

/**
 * ProductListingGrid Component
 * Renders a responsive grid of product cards with hover zoom effect.
 *
 * @param products - Array of products to display (defaults to empty; grid is API-driven)
 * @returns HTML string for the product grid
 *
 * Grid Configuration (per spec):
 * - Mobile (< 768px): 2 columns
 * - Tablet (768px - 1023px): 3 columns
 * - Desktop (1024px+): 4 columns
 * See src/style.css .product-grid for CSS implementation
 *
 * Hover Zoom Effect:
 * - transition-transform duration-500 ease-out
 * - group-hover/product:scale-110 (10% zoom)
 */
export function ProductListingGrid(products: ProductListingCard[] = []): string {
  if (products.length === 0) {
    return `
      <section aria-label="${t("products.productList")}" class="flex-1">
        <div
          class="group/grid grid grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4 data-[list-mode=list]:!grid-cols-1 data-[list-mode=list]:!gap-3 product-grid"
          style="gap: var(--product-grid-gap, 12px);"
          data-list-mode="grid"
          role="list"
          aria-label="${t("products.productListLabel")}"
        >
          ${renderNoResults()}
        </div>
      </section>
    `;
  }

  return `
    <section aria-label="${t("products.productList")}" class="flex-1">
      <div
        class="group/grid grid grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4 data-[list-mode=list]:!grid-cols-1 data-[list-mode=list]:!gap-3 product-grid"
        style="gap: var(--product-grid-gap, 12px);"
        data-list-mode="grid"
        role="list"
        aria-label="${t("products.productListLabel")}"
      >
        ${products.map((card) => `<div role="listitem" class="flex">${renderListingCard(card)}</div>`).join("")}
      </div>
    </section>
  `;
}

/**
 * Re-render the product grid in-place with a new set of products.
 * Called by the filter engine when filters/sort change.
 */
export function rerenderProductGrid(products: ProductListingCard[]): void {
  const grid = document.querySelector<HTMLElement>(".product-grid");
  if (!grid) return;

  // Preserve the current view mode
  const isListView = grid.dataset.listMode === "list";

  if (products.length === 0) {
    grid.innerHTML = renderNoResults();
  } else {
    grid.innerHTML = products
      .map((card) => `<div role="listitem" class="flex">${renderListingCard(card)}</div>`)
      .join("");
  }

  // Re-apply list view classes if it was in list mode
  if (isListView) {
    setGridViewMode("list");
  } else {
    // Ensure all grid classes are correct just in case
    setGridViewMode("grid");
  }
}

/**
 * Export helper to render grid with custom products
 */
export { renderNoResults };

/**
 * Toggle grid between 'grid' and 'list' view modes using Tailwind classes.
 */
export function setGridViewMode(mode: ViewMode): void {
  const grid = document.querySelector<HTMLElement>(".product-grid");
  if (!grid) return;

  // data-list-mode attribute controls layout via Tailwind group-data variants
  grid.dataset.listMode = mode === "list" ? "list" : "grid";
}
