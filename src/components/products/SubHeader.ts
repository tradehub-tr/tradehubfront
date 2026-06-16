/**
 * SubHeader Component
 * Unified header for products & manufacturers listing pages.
 *
 * Reference: docs/checkout (5)/products-app.jsx → SubHeader ("E variant" — toggle inline in title).
 *
 * Layout:
 *  - Breadcrumb
 *  - Title row:
 *      "Görüntüleniyor: [Ürünler|Üreticiler] için küresel tedarikçilerden \"{keyword}\""
 *      Right side: yellow sort dropdown + black-active view toggle (only when showSortView)
 *  - Meta line: "{count} ürün/üretici bulundu"
 *
 * The Ürünler/Üreticiler toggle is rendered as inline pill `<a>` links that navigate between
 * `/pages/products.html` and `/pages/manufacturers.html`, preserving `?cat=` and `?q=` params.
 */

import type { BreadcrumbItem } from "../shared/Breadcrumb";
import { Breadcrumb } from "../shared/Breadcrumb";
import type { SortOption, ViewMode } from "../../types/productListing";
import { t, getCurrentLang } from "../../i18n";

export interface SubHeaderProps {
  activeTab: "products" | "manufacturers";
  breadcrumb: BreadcrumbItem[];
  /** Preserved when navigating between Ürünler ↔ Üreticiler tabs. */
  categoryParam?: string;
  /** Preserved for search-driven entries (only relevant for the Ürünler tab URL). */
  queryParam?: string;
  /** Keyword/category name rendered inside the title in the brand color. */
  keyword?: string;
  /** Count for the meta line ("{n} ürün bulundu" / "{n} üretici bulundu"). */
  totalCount?: number;
  /** Show the meta line (count + unit). Default: true. Set false when no count is available. */
  showMeta?: boolean;
  /** Show the sort dropdown + view toggle. Default: true (set false on manufacturers). */
  showSortView?: boolean;
  /** Initial sort value. Default: "best-match". */
  selectedSort?: string;
  /** Initial view mode. Default: "grid". */
  viewMode?: ViewMode;
  /** Sort options. Defaults to the standard product listing set. */
  sortOptions?: SortOption[];
}

function getDefaultSortOptions(): SortOption[] {
  return [
    { id: "best-match", label: t("products.sortBestMatch"), value: "best-match" },
    { id: "orders", label: t("products.sortOrders"), value: "orders" },
    { id: "newest", label: t("products.sortNewest"), value: "newest" },
    { id: "price-asc", label: t("products.sortPriceLowHigh"), value: "price-asc" },
    { id: "price-desc", label: t("products.sortPriceHighLow"), value: "price-desc" },
    { id: "min-order", label: t("products.sortMinOrder"), value: "min-order" },
    { id: "supplier-rating", label: t("products.sortSupplierRating"), value: "supplier-rating" },
  ];
}

function formatNumber(num: number): string {
  const lang = getCurrentLang();
  const locale = lang === "tr" ? "tr-TR" : "en-US";
  return num.toLocaleString(locale);
}

function buildTabUrl(
  target: "products" | "manufacturers",
  categoryParam?: string,
  queryParam?: string
): string {
  const base = target === "products" ? "/urunler" : "/ureticiler";
  const params = new URLSearchParams();
  if (categoryParam) params.set("cat", categoryParam);
  if (queryParam && target === "products") params.set("q", queryParam);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Inline pill toggle rendered inside the H1 — mirrors `.title-toggle` from the reference CSS.
 * Active link uses the dark "th-btn-dark" look (black bg, white text). Inactive is a transparent
 * pill that gets a darker text on hover.
 */
function renderInlineToggle(
  activeTab: "products" | "manufacturers",
  categoryParam?: string,
  queryParam?: string
): string {
  const productsUrl = buildTabUrl("products", categoryParam, queryParam);
  const manufacturersUrl = buildTabUrl("manufacturers", categoryParam);

  const basePill =
    "inline-flex items-center px-3 sm:px-4 py-1.5 text-[13px] sm:text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/50";
  const activeCls = `${basePill} bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900`;
  const inactiveCls = `${basePill} bg-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white`;

  return `
    <span
      role="tablist"
      aria-label="${t("search.products")} / ${t("search.manufacturers")}"
      class="inline-flex items-center gap-0.5 align-middle bg-gray-100 border border-gray-200 rounded-full p-[3px] -translate-y-px shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-gray-800 dark:border-gray-700"
    >
      <a
        href="${productsUrl}"
        role="tab"
        aria-selected="${activeTab === "products"}"
        data-subheader-tab="products"
        class="${activeTab === "products" ? activeCls : inactiveCls}"
      >${t("search.products")}</a>
      <a
        href="${manufacturersUrl}"
        role="tab"
        aria-selected="${activeTab === "manufacturers"}"
        data-subheader-tab="manufacturers"
        class="${activeTab === "manufacturers" ? activeCls : inactiveCls}"
      >${t("search.manufacturers")}</a>
    </span>
  `;
}

/**
 * Title reads naturally per active tab:
 *  - products:      "Görüntüleniyor: [toggle] \"{keyword}\" kategorisinde"
 *  - manufacturers: "Görüntüleniyor: [toggle] \"{keyword}\" için küresel tedarikçiler"
 * `keyword` is shown in the brand color; wrapper is hidden when empty so the title still reads
 * naturally on the landing case.
 */
function renderTitle(
  activeTab: "products" | "manufacturers",
  categoryParam: string | undefined,
  queryParam: string | undefined,
  keyword: string
): string {
  const descriptorKey =
    activeTab === "products" ? "products.resultsForProducts" : "products.resultsForManufacturers";

  return `
    <h1 class="text-sm min-[400px]:text-base sm:text-xl font-medium text-gray-900 dark:text-white min-w-0 break-words leading-snug tracking-tight m-0 max-w-[72ch]">
      <span class="text-gray-900 dark:text-white" data-i18n="products.viewingLead">${t("products.viewingLead")}</span>
      ${renderInlineToggle(activeTab, categoryParam, queryParam)}
      <span id="sub-header-keyword-wrapper" ${keyword ? "" : 'style="display:none"'}>
        <span id="sub-header-keyword" class="text-primary-600 dark:text-primary-400 font-bold">"${keyword || ""}"</span>
        <span class="font-normal text-gray-500 dark:text-gray-400">${t(descriptorKey)}</span>
      </span>
    </h1>
  `;
}

/**
 * Yellow pill sort button + Alpine-driven dropdown. Uses the existing `searchHeader` Alpine data
 * (`sortOpen`, `selectedSort`, `sortLabel`) so `filterEngine` keeps receiving `sort-change`
 * events without changes.
 */
function renderSortDropdown(options: SortOption[], selectedValue: string): string {
  const selected = options.find((o) => o.value === selectedValue) || options[0];

  return `
    <div class="relative shrink-0">
      <button
        id="sub-header-sort-btn"
        type="button"
        @click="sortOpen = !sortOpen"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-[13px] sm:text-sm font-medium rounded-full bg-primary-500 border border-primary-600 text-gray-900 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:text-gray-900"
        aria-haspopup="listbox"
        :aria-expanded="sortOpen"
      >
        <span class="opacity-70 hidden sm:inline">${t("products.sortByLabel")}</span>
        <span x-text="sortLabel" class="font-semibold whitespace-nowrap">${selected.label}</span>
        <svg class="w-3.5 h-3.5 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div
        x-show="sortOpen"
        x-cloak
        x-transition:enter="transition ease-out duration-150 motion-reduce:transition-none"
        x-transition:enter-start="opacity-0 scale-95 -translate-y-1 motion-reduce:scale-100 motion-reduce:translate-y-0"
        x-transition:enter-end="opacity-100 scale-100 translate-y-0"
        x-transition:leave="transition ease-out duration-100 motion-reduce:transition-none"
        x-transition:leave-start="opacity-100 scale-100"
        x-transition:leave-end="opacity-0 scale-95 motion-reduce:scale-100"
        @click.outside="sortOpen = false"
        class="absolute left-0 lg:left-auto lg:right-0 z-30 mt-2 w-[230px] max-w-[calc(100vw-2rem)] origin-top bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 dark:bg-gray-800 dark:border-gray-700"
        role="listbox"
        aria-labelledby="sub-header-sort-btn"
      >
        ${options
          .map((option) => {
            const safeLabel = option.label.replace(/'/g, "\\'");
            return `
              <button
                type="button"
                @click="selectSort('${option.value}', '${safeLabel}')"
                :class="selectedSort === '${option.value}'
                  ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700'"
                class="flex items-center justify-between w-full px-3 py-2 text-sm text-start rounded-md transition-colors"
                role="option"
                :aria-selected="selectedSort === '${option.value}'"
              >
                <span class="truncate">${option.label}</span>
                <svg
                  x-show="selectedSort === '${option.value}'"
                  x-cloak
                  class="w-3.5 h-3.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.6"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5"/>
                </svg>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

/**
 * Pill view toggle — black active state matches the reference (`view-toggle button.is-on`).
 */
function renderViewModeToggle(): string {
  const baseBtn =
    "w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/40";
  const activeCls = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
  const inactiveCls =
    "bg-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200";

  return `
    <div class="shrink-0 inline-flex items-center bg-white border border-gray-200 rounded-full p-[3px] dark:bg-gray-800 dark:border-gray-700" role="group" aria-label="${t("products.viewMode")}">
      <button
        type="button"
        @click="setViewMode('grid')"
        :class="viewMode === 'grid' ? '${activeCls}' : '${inactiveCls}'"
        class="${baseBtn}"
        aria-label="${t("products.viewGrid")}"
        :aria-pressed="viewMode === 'grid'"
      >
        <svg class="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      </button>
      <button
        type="button"
        @click="setViewMode('list')"
        :class="viewMode === 'list' ? '${activeCls}' : '${inactiveCls}'"
        class="${baseBtn}"
        aria-label="${t("products.viewList")}"
        :aria-pressed="viewMode === 'list'"
      >
        <svg class="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
      </button>
    </div>
  `;
}

function renderMobileFilterToggle(): string {
  return `
    <button
      type="button"
      id="mobile-filter-toggle"
      data-drawer-target="filter-sidebar-drawer"
      data-drawer-toggle="filter-sidebar-drawer"
      class="th-btn-outline shrink-0 lg:hidden inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      aria-label="${t("products.filters")}"
    >
      <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/>
      </svg>
      <span class="hidden min-[400px]:inline">${t("products.filters")}</span>
    </button>
  `;
}

/**
 * Meta line: "{count} ürün bulundu" or "{count} üretici bulundu".
 * Word swaps via the `activeTab` so the same Alpine update path covers both pages.
 */
function renderMetaLine(activeTab: "products" | "manufacturers", count: number): string {
  const unitKey =
    activeTab === "products" ? "products.unitFound" : "products.unitFoundManufacturer";
  return `
    <div id="sub-header-meta" class="mt-3 text-sm text-gray-500 dark:text-gray-400">
      <strong id="sub-header-count" class="text-gray-900 dark:text-white font-bold tabular-nums me-1">${formatNumber(count)}</strong><span id="sub-header-unit">${t(unitKey)}</span>
    </div>
  `;
}

/**
 * SubHeader Component
 */
export function SubHeader(props: SubHeaderProps): string {
  const {
    activeTab,
    breadcrumb,
    categoryParam,
    queryParam,
    keyword = "",
    totalCount = 0,
    showMeta = true,
    showSortView = true,
    selectedSort = "best-match",
    viewMode = "grid",
    sortOptions = getDefaultSortOptions(),
  } = props;

  const selected = sortOptions.find((o) => o.value === selectedSort) || sortOptions[0];
  const safeLabel = selected.label.replace(/'/g, "\\'");

  const actionsBlock = showSortView
    ? `
      <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        ${renderMobileFilterToggle()}
        ${renderSortDropdown(sortOptions, selectedSort)}
        ${renderViewModeToggle()}
      </div>
    `
    : "";

  return `
    <div id="sub-header" x-data="searchHeader({ selectedSort: '${selectedSort}', viewMode: '${viewMode}', sortLabel: '${safeLabel}' })" data-active-tab="${activeTab}" class="mb-4 lg:mb-6">
      ${Breadcrumb(breadcrumb)}

      <div class="flex items-start justify-between gap-5 flex-wrap pt-2">
        ${renderTitle(activeTab, categoryParam, queryParam, keyword)}
        ${actionsBlock}
      </div>

      ${showMeta ? renderMetaLine(activeTab, totalCount) : ""}
    </div>
  `;
}

/**
 * Updates the SubHeader meta count + keyword after an async filter/category resolution.
 * - `totalCount` updates the bold number in the meta line ("5 ürün bulundu").
 * - `keyword` updates the brand-colored phrase inside the title.
 */
export function updateSubHeader(info: { totalCount?: number; keyword?: string }): void {
  if (info.totalCount !== undefined) {
    const countEl = document.getElementById("sub-header-count");
    if (countEl) countEl.textContent = formatNumber(info.totalCount);
  }

  if (info.keyword !== undefined) {
    const wrapperEl = document.getElementById("sub-header-keyword-wrapper");
    const keywordEl = document.getElementById("sub-header-keyword");
    if (wrapperEl && keywordEl) {
      if (info.keyword) {
        keywordEl.textContent = `"${info.keyword}"`;
        wrapperEl.style.display = "";
      } else {
        wrapperEl.style.display = "none";
      }
    }
  }
}

/**
 * Breadcrumb'ı yeni öğelerle yeniden render eder. Kategoriler async yüklendikten
 * sonra tam ata zincirini (Sektör › Grup › Yaprak) basmak için kullanılır.
 * `items` "Ana Sayfa"yı İÇERMEZ — Breadcrumb() onu otomatik ekler.
 */
export function updateBreadcrumb(items: BreadcrumbItem[]): void {
  const nav = document.querySelector('nav[aria-label="Breadcrumb"]');
  if (!nav) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = Breadcrumb(items);
  const fresh = tmp.firstElementChild;
  if (fresh) nav.replaceWith(fresh);
}
