/**
 * Products Listing Page — Entry Point
 * Assembles header, filter sidebar, search header, product grid, and footer.
 * iSTOC-style product listing with left filter panel and responsive product grid.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components (reuse from main page)
import { TopBar, initMobileDrawer, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Products listing components
import {
  FilterSidebar,
  initFilterSidebar,
  ProductListingGrid,
  initProductSliders,
  ListingCartDrawer,
  initListingCartDrawer,
  SearchHeader,
  updateSearchHeader,
  rerenderProductGrid,
  initFilterEngine,
  updateFilterChips,
  setGridViewMode,
} from '../components/products'
import { ShippingModal, initShippingModal } from '../components/product'

import { initCurrency } from '../services/currencyService'

// Category data for slug/ID → name mapping (dynamic, API-based)
import { findCategoryBySlug, findCategoryById, onCategoriesLoaded } from '../services/categoryService'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Helpers ── */

/** HTML-encode user input to prevent XSS when inserted via innerHTML */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Read URL parameters ── */
const urlParams = new URLSearchParams(window.location.search);
// Both ?category= (MegaMenu ID) and ?cat= (URL slug) are supported
const categoryParam = urlParams.get('category') || urlParams.get('cat');
const queryParam = urlParams.get('q');

// Log search/category visit for personalization (dedup handled by backend)
if (categoryParam || queryParam) {
  fetch('/api/method/tradehub_core.api.listing.log_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query: categoryParam || queryParam, category: categoryParam || '' }),
  }).catch(() => {});
}

/**
 * Resolve display keyword from URL params.
 * categoryParam önce slug olarak, yoksa ID olarak aranır.
 */
function resolveKeyword(): string {
  if (categoryParam) {
    const cat = findCategoryBySlug(categoryParam) || findCategoryById(categoryParam);
    return cat ? cat.name : escapeHtml(categoryParam);
  }
  if (queryParam) {
    return escapeHtml(queryParam.replace(/\+/g, ' '));
  }
  return '';
}

// Başlangıçta query param'dan keyword (kategoriler henüz yüklenmedi)
const initialKeyword = queryParam ? escapeHtml(queryParam.replace(/\+/g, ' ')) : escapeHtml(categoryParam || '');

// Build initial breadcrumb (category name henüz bilinmiyor, güncellenir)
const productsBreadcrumb = (() => {
  const crumbs: { label: string; href?: string }[] = [
    { label: t('search.products'), href: 'products.html' },
  ];
  if (categoryParam || queryParam) {
    crumbs.push({ label: initialKeyword });
  }
  return crumbs;
})();

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Sticky Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header)" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
  </div>

  ${MegaMenu()}

  <!-- Main Content -->
  <main>
    <section class="pt-6 pb-4 lg:pt-8 lg:pb-6" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        ${Breadcrumb(productsBreadcrumb)}
        <!-- Search Header (keyword, product count, sorting, view toggle) -->
        ${SearchHeader({ keyword: initialKeyword, totalProducts: 0 })}

        <!-- Active Filter Chips -->
        <div id="active-filter-chips" x-data="filterChips" class="flex flex-wrap gap-2 mb-3 empty:hidden"></div>

        <!-- Main layout: Filter Sidebar + Product Grid -->
        <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <!-- Filter Sidebar (hidden on mobile, shown via drawer) -->
          <div class="hidden lg:block">
            ${FilterSidebar()}
          </div>

          <!-- Product Grid (starts empty, filled by API) -->
          <div class="flex-1 min-w-0">
            ${ProductListingGrid([])}
            <div id="pagination-controls"></div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}

  <!-- Mobile Filter Drawer (off-canvas for mobile) -->
  <div
    id="filter-sidebar-drawer"
    class="fixed top-0 left-0 z-50 h-screen overflow-y-auto transition-transform -translate-x-full bg-white w-72 dark:bg-gray-800 lg:hidden"
    tabindex="-1"
    aria-labelledby="filter-sidebar-drawer-label"
  >
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h5
        id="filter-sidebar-drawer-label"
        class="text-base font-semibold text-gray-900 dark:text-white"
      >
        Filters
      </h5>
      <button
        type="button"
        data-drawer-hide="filter-sidebar-drawer"
        aria-controls="filter-sidebar-drawer"
        class="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-md text-sm dark:hover:bg-gray-600 dark:hover:text-white"
      >
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        <span class="sr-only">Close menu</span>
      </button>
    </div>
    <div class="p-4">
      ${FilterSidebar(undefined, 'mobile')}
    </div>
  </div>

  <!-- Drawer backdrop -->
  <div
    data-drawer-backdrop="filter-sidebar-drawer"
    class="hidden bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40"
  ></div>

  <!-- Listing Cart Drawer -->
  ${ListingCartDrawer()}
  ${ShippingModal()}
`;

// Initialize custom component behaviors FIRST (before Flowbite can interfere)
initMegaMenu();

// Initialize Flowbite for interactive components (dropdowns, drawers, etc.)
initFlowbite();

// Start Alpine.js (must be after innerHTML and Flowbite)
startAlpine();

// Initialize header behaviors (non-Alpine: cart store load, mobile drawer DOM move)
initHeaderCart();
initMobileDrawer();
initLanguageSelector();
initAnimatedPlaceholder('#topbar-compact-search-input');

// Initialize product card image sliders (event delegation, not yet migrated)
initProductSliders();

// Listen for view-mode-change events from SearchHeader toggle buttons
document.addEventListener('view-mode-change', (e: Event) => {
  setGridViewMode((e as CustomEvent).detail.mode);
});

// Close mobile filter drawer when user presses the global "Ara" (Apply) button
document.addEventListener('filter-apply', (e: Event) => {
  const source = (e.target as HTMLElement | null)?.closest('[data-filter-prefix-root]');
  if (!source || source.getAttribute('data-filter-prefix-root') !== 'mobile') return;
  const hideBtn = document.querySelector<HTMLElement>(
    '[data-drawer-hide="filter-sidebar-drawer"]'
  );
  hideBtn?.click();
});

// Initialize shipping modal
initShippingModal();

// Show loading state in grid
function showGridLoading(): void {
  const grid = document.querySelector<HTMLElement>('.product-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-full flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm text-text-muted">Ürünler yükleniyor...</span>
        </div>
      </div>
    `;
  }
}

function showGridError(): void {
  const grid = document.querySelector<HTMLElement>('.product-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-full flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-text-muted mb-2">Ürünler yüklenemedi</p>
          <button onclick="window.location.reload()" class="text-sm text-primary hover:underline">Tekrar dene</button>
        </div>
      </div>
    `;
  }
}

// Show initial loading
showGridLoading();

// Kategoriler async yüklenince keyword'u gerçek kategori adıyla güncelle
if (categoryParam) {
  onCategoriesLoaded(() => {
    const resolvedKeyword = resolveKeyword();
    if (resolvedKeyword && resolvedKeyword !== categoryParam) {
      updateSearchHeader({ keyword: resolvedKeyword });
      // Breadcrumb'u da güncelle
      const breadcrumbNav = document.querySelector('nav[aria-label="Breadcrumb"]');
      if (breadcrumbNav) {
        const lastItem = breadcrumbNav.querySelector('li:last-child span');
        if (lastItem && lastItem.textContent?.trim() !== resolvedKeyword) {
          lastItem.textContent = resolvedKeyword;
        }
      }
    }
  });
}

// Base search parameters from URL (these don't change with filters)
const baseParams = {
  query: queryParam || undefined,
  category: categoryParam || undefined,
};

// Filter engine reference
let engine: ReturnType<typeof initFilterEngine> | null = null;

// Initialize currency, then set up filter engine
// Load dynamic sidebar facets (categories, countries)
initFilterSidebar(queryParam || undefined, categoryParam || undefined);

initCurrency().then(() => {
  engine = initFilterEngine({
    baseParams,
    pageSize: 40,
    onUpdate: (products, total, page, totalPages, hasNext, hasPrev) => {
      rerenderProductGrid(products);
      const resolvedKeyword = resolveKeyword() || undefined;
      updateSearchHeader({
        totalProducts: total,
        keyword: resolvedKeyword,
      });
      if (engine) updateFilterChips(engine.getState());

      // Update breadcrumb with resolved category name (async categories may now be loaded)
      if (resolvedKeyword && categoryParam) {
        const breadcrumbNav = document.querySelector('nav[aria-label="Breadcrumb"]');
        if (breadcrumbNav) {
          const lastItem = breadcrumbNav.querySelector('li:last-child span');
          if (lastItem && lastItem.textContent?.trim() !== resolvedKeyword) {
            lastItem.textContent = resolvedKeyword;
          }
        }
      }

      // Update pagination UI
      const paginationEl = document.getElementById('pagination-controls');
      if (paginationEl) {
        paginationEl.innerHTML = renderPagination(page, totalPages, hasNext, hasPrev);
      }

      // Initialize listing cart drawer with current products
      initListingCartDrawer(products);
      initProductSliders();
    },
    onLoading: showGridLoading,
    onError: (err) => {
      console.error('[products] API error:', err);
      showGridError();
    },
  });

  // Trigger initial load
  engine.refresh();

  console.info('[products] Filter engine initialized');
}).catch(err => {
  console.error('[products] Init failed:', err);
  showGridError();
});

/* ── Pagination ── */

function renderPagination(page: number, totalPages: number, hasNext: boolean, hasPrev: boolean): string {
  if (totalPages <= 1) return '';

  const pages: string[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const baseBtn = 'inline-flex items-center justify-center w-9 h-9 text-sm rounded-md border transition-colors duration-150 select-none';
  const idleBtn = `${baseBtn} border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer`;
  const activeBtn = `${baseBtn} border-primary-500 bg-primary-500 text-white font-semibold cursor-default shadow-sm`;
  const disabledBtn = `${baseBtn} border-gray-100 bg-white text-gray-300 cursor-not-allowed`;

  pages.push(`<button data-page="${page - 1}" ${!hasPrev ? 'disabled' : ''} aria-label="Önceki sayfa" class="${hasPrev ? idleBtn : disabledBtn}">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`);

  if (startPage > 1) {
    pages.push(`<button data-page="1" class="${idleBtn}">1</button>`);
    if (startPage > 2) pages.push(`<span class="inline-flex items-center justify-center w-9 h-9 text-gray-400 select-none">…</span>`);
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === page;
    pages.push(`<button data-page="${i}" ${isActive ? 'aria-current="page"' : ''} class="${isActive ? activeBtn : idleBtn}">${i}</button>`);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push(`<span class="inline-flex items-center justify-center w-9 h-9 text-gray-400 select-none">…</span>`);
    pages.push(`<button data-page="${totalPages}" class="${idleBtn}">${totalPages}</button>`);
  }

  pages.push(`<button data-page="${page + 1}" ${!hasNext ? 'disabled' : ''} aria-label="Sonraki sayfa" class="${hasNext ? idleBtn : disabledBtn}">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`);

  return `<nav aria-label="Sayfalama" class="flex items-center justify-center gap-1.5 mt-6">${pages.join('')}</nav>`;
}

// Pagination click handler
document.addEventListener('click', (e: Event) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-page]');
  if (!btn || btn.disabled || !engine) return;
  const page = parseInt(btn.dataset.page!, 10);
  if (page > 0) {
    engine.goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
