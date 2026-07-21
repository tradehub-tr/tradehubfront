/**
 * Products Listing Page — Entry Point
 * Assembles header, filter sidebar, search header, product grid, and footer.
 * iSTOC-style product listing with left filter panel and responsive product grid.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components (reuse from main page)
import { TopBar, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel, BottomNav, initBottomNav } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'
// B-2: products-filter Alpine modülü page-specific (filterSidebar + filterChips bu sayfada).
import '../alpine/products-filter'
// B-2: loginModal ayrı modül (misafir login modalı bu sayfada).
import '../alpine/loginModal'

// Products listing components
import {
  FilterSidebar,
  initFilterSidebar,
  ProductListingGrid,
  ListingCartDrawer,
  initListingCartDrawer,
  SubHeader,
  updateSubHeader,
  updateBreadcrumb,
  rerenderProductGrid,
  initFilterEngine,
  updateFilterChips,
  setGridViewMode,
} from '../components/products'
import { initProductSliders } from '../components/shared/ListingCard'
import { renderPagination } from '../components/shared/Pagination'
import { applyListingSocialProof } from '../components/products/initListingSocialProof'
import { initListingFavoriteTriggers, syncListingFavoriteHearts } from '../components/products/initListingFavorites'
import { ShippingModal, initShippingModal, LoginModal } from '../components/product'

import { initCurrency } from '../services/currencyService'

// Category data for slug/ID → name mapping (dynamic, API-based)
import { findCategoryBySlug, findCategoryById, findCategoryPath, onCategoriesLoaded } from '../services/categoryService'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'
import { pushRecentCategory } from '../utils/recentCategories'
import { saveRecentCategory } from '../services/recentHistoryService'
import { escapeHtml } from "../utils/sanitize";

/* ── Helpers ── */

/** HTML-encode user input to prevent XSS when inserted via innerHTML */
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

// "Sizin için kategoriler" panelinin beslediği localStorage geçmişi.
// Kategoriler yüklendikten sonra slug/ID match ile name+image alıp push ediyoruz;
// bulunamazsa slug'ı name olarak fallback kullanıp yine push ediyoruz (boş bırakma).
if (categoryParam) {
  onCategoriesLoaded(() => {
    const cat = findCategoryBySlug(categoryParam) || findCategoryById(categoryParam);
    if (cat) {
      pushRecentCategory({ slug: cat.slug, name: cat.name, image: cat.image });
      saveRecentCategory({ slug: cat.slug, name: cat.name });
    } else {
      pushRecentCategory({ slug: categoryParam, name: categoryParam });
      saveRecentCategory({ slug: categoryParam, name: categoryParam });
    }
  });
}

// Backend'in ?cat= slug'ından çözdüğü görünen ad (get_listings.categoryName).
// Mega menü ağacı client'ta 3 seviye — derin kategorilerde tek kaynak budur.
let apiCategoryName = '';

/**
 * Resolve display keyword from URL params.
 * categoryParam önce slug olarak, yoksa ID olarak aranır; ağaçta yoksa
 * backend'in çözdüğü ada, o da yoksa ham slug'a düşülür.
 */
function resolveKeyword(): string {
  if (categoryParam) {
    const cat = findCategoryBySlug(categoryParam) || findCategoryById(categoryParam);
    return cat ? cat.name : escapeHtml(apiCategoryName || categoryParam);
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
    // Mutlak yol: sayfa /urunler pretty URL'inden de açılabiliyor; göreli
    // 'products.html' orada kök dizine çözülür ve 404 olur.
    { label: t('search.products'), href: '/pages/products.html' },
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
  <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
    ${TopBar()}
  </div>

  ${MegaMenu()}

  <!-- Main Content -->
  <main>
    <section class="pt-6 pb-4 lg:pt-8 lg:pb-6" style="background: var(--products-bg, #ffffff);">
      <div class="container-boxed">
        <!-- Sub Header: tabs (Ürünler/Üreticiler) + breadcrumb + results title + sort/view -->
        ${SubHeader({
          activeTab: 'products',
          breadcrumb: productsBreadcrumb,
          categoryParam: categoryParam ?? undefined,
          queryParam: queryParam ?? undefined,
          keyword: initialKeyword,
          totalCount: 0,
        })}

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
  <footer class="pb-14 xl:pb-0">
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}

  <!-- Login Modal (favori kalbi guest akışı: login-modal-show event'i ile açılır) -->
  ${LoginModal()}

  <!-- Bottom Navigation (mobile/tablet) -->
  ${BottomNav()}

  <!-- Mobile Filter Drawer (off-canvas for mobile) -->
  <div
    id="filter-sidebar-drawer"
    class="fixed top-0 left-0 z-50 h-screen w-full overflow-y-auto transition-transform -translate-x-full bg-white dark:bg-gray-800 lg:hidden"
    tabindex="-1"
    aria-labelledby="filter-sidebar-drawer-label"
  >
    <div class="sticky top-0 z-10 flex items-center justify-between h-12 px-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
      <h5
        id="filter-sidebar-drawer-label"
        class="text-base font-bold text-gray-900 dark:text-white"
      >${t('products.filters')}</h5>
      <button
        type="button"
        data-drawer-hide="filter-sidebar-drawer"
        aria-controls="filter-sidebar-drawer"
        class="absolute top-3 end-3 inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-md text-sm dark:hover:bg-gray-600 dark:hover:text-white"
      >
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        <span class="sr-only">${t('common.close')}</span>
      </button>
    </div>
    <div>
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
mountChatPopup();
initChatTriggers();
startAlpine();

// Initialize header behaviors (non-Alpine: cart store load, mobile drawer DOM move)
initHeaderCart();
initBottomNav();
initLanguageSelector();
initAnimatedPlaceholder('#topbar-compact-search-input');

// Initialize product card image sliders (event delegation, not yet migrated)
initProductSliders();

// Listen for view-mode-change events from SubHeader toggle buttons
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

// Favori kalbi tıklamaları (body delegation — grid re-render'larından etkilenmez)
initListingFavoriteTriggers();

// Show loading state in grid
function showGridLoading(): void {
  const grid = document.querySelector<HTMLElement>('.product-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-full flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm text-text-muted">${t('infoMisc.productsLoading')}</span>
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
          <p class="text-text-muted mb-2">${t('infoMisc.productsLoadFailed')}</p>
          <button onclick="window.location.reload()" class="text-sm text-primary hover:underline">${t('infoMisc.tryAgain')}</button>
        </div>
      </div>
    `;
  }
}

// Show initial loading
showGridLoading();

// Kategoriler async yüklenince keyword + breadcrumb'ı gerçek veriyle güncelle
if (categoryParam) {
  onCategoriesLoaded(() => {
    const resolvedKeyword = resolveKeyword();
    if (resolvedKeyword && resolvedKeyword !== categoryParam) {
      updateSubHeader({ keyword: resolvedKeyword });
    }
    // Breadcrumb'ı tam kategori zinciriyle (Sektör › Grup › Yaprak) yeniden kur.
    // Son öğe mevcut sayfa (linksiz); üst seviyeler ilgili listeye linklenir.
    const path = findCategoryPath(categoryParam);
    if (path.length > 0) {
      updateBreadcrumb(
        path.map((c, i) => ({
          label: c.name,
          href:
            i === path.length - 1
              ? undefined
              : `/pages/products.html?cat=${encodeURIComponent(c.slug)}`,
        }))
      );
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
    onUpdate: (products, total, page, totalPages, hasNext, hasPrev, categoryName) => {
      rerenderProductGrid(products);
      if (categoryName) apiCategoryName = categoryName;
      const resolvedKeyword = resolveKeyword() || undefined;
      updateSubHeader({
        totalCount: total,
        keyword: resolvedKeyword,
      });
      if (engine) updateFilterChips(engine.getState());

      // Breadcrumb tam kategori zinciriyle onCategoriesLoaded içinde kuruluyor
      // (updateBreadcrumb); ağaçta olmayan derin kategorilerde o yol boş kalır —
      // yaprak etiketini backend'in çözdüğü adla düzelt.
      if (categoryName && categoryParam && findCategoryPath(categoryParam).length === 0) {
        updateBreadcrumb([
          { label: t('search.products'), href: '/pages/products.html' },
          // Breadcrumb render'ı label'ı zaten escape ediyor — burada escape çift olur.
          { label: categoryName },
        ]);
      }

      // Update pagination UI
      const paginationEl = document.getElementById('pagination-controls');
      if (paginationEl) {
        paginationEl.innerHTML = renderPagination(page, totalPages, hasNext, hasPrev);
      }

      // Initialize listing cart drawer with current products
      initListingCartDrawer(products);
      initProductSliders();

      // Sosyal kanıt: sinyali olan kartların rozetini dinamik (dönen) etiketle değiştir
      applyListingSocialProof(products);

      // Favori kalplerini ürün bazında boya (grid her render'da sıfırdan kurulur)
      syncListingFavoriteHearts();
    },
    onLoading: showGridLoading,
    onError: (err) => {
      console.error('[products] API error:', err);
      showGridError();
    },
  });

  // Trigger initial load
  engine.refresh();
}).catch(err => {
  console.error('[products] Init failed:', err);
  showGridError();
});

// Pagination click handler
document.addEventListener('click', (e: Event) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-page]');
  if (!btn || btn.disabled || !engine) return;
  const page = parseInt(btn.dataset.page!, 10);
  if (page > 0) {
    engine.goToPage(page);
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }
});
