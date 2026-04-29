/**
 * Top Ranking Page — Entry Point
 * Assembles header, hero banner, filter dropdowns, category tabs,
 * sort pills, ranking grid, and footer for the Top Ranking landing page.
 */

import '../style.css'
import Alpine from 'alpinejs'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, initMobileDrawer, SubHeader, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Top Ranking components
import {
  TopRankingHero,
  TopRankingMobileHeader,
  TopRankingStickyMobileHeader,
  TopRankingCategoryTabs,
  TopRankingSortPills,
  TopRankingGrid,
  initRankingCategoryTabs,
} from '../components/top-ranking'
import {
  renderRankingGroupCard,
  renderRankingFlatCard,
} from '../components/top-ranking/TopRankingGrid'

// Services
import {
  getTopRankingGrouped,
  searchListings,
  type TopRankingGroup,
} from '../services/listingService'
import { initCurrency } from '../services/currencyService'
import { loadCategories } from '../services/categoryService'
import type { ApiCategory } from '../services/categoryService'

// Data (types only)
import type { RankingCategoryGroup, RankedProduct } from '../types/topRanking'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Constants ── */

/** Number of category cards loaded per "Daha fazla yükle" click in grouped (Tümü) mode. Bounded server-side at 30. */
const GROUPS_PER_PAGE = 12;

/** Frontend "rank badge" only fits #1/#2/#3, so the page always asks the API for 3 previews per card. */
const PRODUCTS_PER_GROUP = 3;

/** Number of products loaded per "Daha fazla yükle" click in flat (single category) mode. 2 rows × 5 cols on desktop. */
const FLAT_PAGE_SIZE = 10;

/** Allowed sort metric ids — must match _TOP_RANKING_SORTS in tradehub_core.api.listing */
type SortKey = 'hot-selling' | 'most-popular' | 'best-reviewed';

/** Display mode the page is currently in. Determined by which tab is active. */
type RankingMode = 'grouped' | 'flat';

/** Map a frontend sort pill to the get_listings sort_by query param (used in flat mode). */
const SORT_KEY_TO_BACKEND: Record<SortKey, string> = {
  'hot-selling':   'orders',
  'most-popular':  'views',
  'best-reviewed': 'rating',
};

/* ── Helpers ── */

/**
 * Adapt the API's TopRankingGroup payload to the RankingCategoryGroup shape
 * the existing renderer expects. Keeps the renderer untouched.
 */
function toRankingGroup(g: TopRankingGroup): RankingCategoryGroup {
  return {
    id: g.id,
    name: g.name,
    nameKey: '',
    categoryId: g.categoryId || g.id,
    slug: g.slug,
    products: (g.products || []).slice(0, PRODUCTS_PER_GROUP).map((p, idx) => ({
      id: p.id || `rp-${g.id}-${idx}`,
      name: p.name,
      // Link each ranked thumbnail directly to the product detail page.
      href: p.href || `/pages/product-detail.html?id=${p.id}`,
      price: p.price,
      imageSrc: p.imageSrc || '',
      moq: p.moq || '1',
      rank: ((idx + 1) as 1 | 2 | 3),
    } satisfies RankedProduct)),
  };
}

/* ── Alpine Data Registration ── */

Alpine.data('topRankingPage', () => ({
  init() {
    // Load categories first (drives the tabs), then issue the first listings
    // request. The two are intentionally sequenced so the tab strip and the
    // grid render with consistent state.
    loadCategories().then(cats => {
      this.apiCategories = cats;
    }).catch(err => console.warn('[TopRanking] Category load failed:', err));

    initCurrency()
      .then(() => this.fetchActive(true))
      .catch(err => console.warn('[TopRanking] Init failed:', err));
  },

  // ── Filter state ──
  // activeTab → tab bar highlight (her zaman ana kategori slug'ı veya 'all')
  // activeCategory → fetch parametresi (ana VEYA alt kategori slug'ı, veya 'all')
  activeTab: 'all' as string,
  activeCategory: 'all' as string,
  activeSort: 'hot-selling' as SortKey,

  // Display mode — derived from activeCategory. 'all' → grouped, anything else → flat.
  mode: 'grouped' as RankingMode,

  // Dropdown state (desktop)
  categoryDropdownOpen: false,

  // Category dropdown navigation — edit state (uygulanmadan önceki UI seçimi)
  categoryDropdownLevel: 1 as 1 | 2,
  selectedMainCategory: null as string | null,
  pendingSubCategory: null as string | null,

  // Mobile bottom sheet state
  showCategorySheet: false,
  showTabSheet: false,

  // Tab scroll state
  canScrollLeft: false,
  canScrollRight: true,

  // ── Server pagination state ──
  /** Next grouped page to request (1-indexed). */
  nextPage: 1,
  /** Next flat page to request (1-indexed). */
  flatNextPage: 1,
  /** True while a fetch is in flight. Drives the load-more spinner. */
  loading: false,
  /** True after the last fetch indicated no further pages. */
  hasMore: true,
  /** Total number of category groups available for the current filter (from API). */
  totalCategories: 0,

  // ── Data ──
  apiCategories: [] as ApiCategory[],
  /** Already-rendered groups for grouped mode (Tümü tab). */
  allGroups: [] as RankingCategoryGroup[],
  /** Already-rendered products for flat mode (single category tab). */
  flatProducts: [] as RankedProduct[],

  /** Backwards-compatible alias for templates that read visibleGroups. */
  get visibleGroups(): RankingCategoryGroup[] {
    return this.allGroups;
  },

  get visibleGroupCount(): number {
    return this.allGroups.length;
  },

  /* ── Active-mode dispatcher ──
     Single entry point: figure out which mode is active and call the right
     fetcher. Keeps setTab/setSort/loadMore code paths uniform. */
  async fetchActive(reset = false): Promise<void> {
    if (this.mode === 'grouped') {
      await this.fetchGroupedPage(reset);
    } else {
      await this.fetchFlatPage(reset);
    }
  },

  /**
   * Grouped mode fetch — Tümü tab. Each card = a category with 3 ranked products.
   */
  async fetchGroupedPage(reset = false): Promise<void> {
    if (this.loading) return;
    if (!reset && !this.hasMore) return;

    this.loading = true;
    if (reset) {
      this.nextPage = 1;
      this.hasMore = true;
      this.allGroups = [];
      this.flatProducts = [];
      this.totalCategories = 0;
    }

    try {
      const result = await getTopRankingGrouped(
        this.nextPage,
        GROUPS_PER_PAGE,
        PRODUCTS_PER_GROUP,
        undefined,
        this.activeSort,
      );
      const incoming = (result.groups || []).map(toRankingGroup);
      this.allGroups = reset ? incoming : this.allGroups.concat(incoming);
      this.totalCategories = result.totalCategories || this.allGroups.length;
      this.hasMore = result.hasNext;
      this.nextPage = (result.page || this.nextPage) + 1;
    } catch (err) {
      console.warn('[TopRanking] fetchGroupedPage failed:', err);
      this.hasMore = false;
    } finally {
      this.loading = false;
    }
  },

  /**
   * Flat mode fetch — single category tab. Returns a flat list of products
   * (10 per page, 2 rows × 5 cols on desktop) sorted by the active metric.
   */
  async fetchFlatPage(reset = false): Promise<void> {
    if (this.loading) return;
    if (!reset && !this.hasMore) return;
    if (this.activeCategory === 'all') return; // safety: flat needs a real category

    this.loading = true;
    if (reset) {
      this.flatNextPage = 1;
      this.hasMore = true;
      this.flatProducts = [];
      this.allGroups = [];
    }

    try {
      const result = await searchListings({
        category: this.activeCategory,
        sort_by: SORT_KEY_TO_BACKEND[this.activeSort],
        page: this.flatNextPage,
        page_size: FLAT_PAGE_SIZE,
      });
      const incoming: RankedProduct[] = (result.products || []).map((p, idx) => ({
        id: p.id || `flat-${this.flatNextPage}-${idx}`,
        name: p.name,
        href: p.href || `/pages/product-detail.html?id=${p.id}`,
        price: p.price,
        imageSrc: p.imageSrc || '',
        moq: p.moq || '1',
        rank: 1, // unused in flat mode
      }));
      this.flatProducts = reset ? incoming : this.flatProducts.concat(incoming);
      this.hasMore = result.hasNext;
      this.flatNextPage += 1;
    } catch (err) {
      console.warn('[TopRanking] fetchFlatPage failed:', err);
      this.hasMore = false;
    } finally {
      this.loading = false;
    }
  },

  setTab(tabId: string): void {
    if (this.activeTab === tabId && this.activeCategory === tabId) return;
    this.activeTab = tabId;
    this.activeCategory = tabId;
    this.selectedMainCategory = tabId === 'all' ? null : tabId;
    this.pendingSubCategory = null;
    this.mode = tabId === 'all' ? 'grouped' : 'flat';
    this.fetchActive(true);
  },

  setSort(sortMode: string): void {
    if (this.activeSort === sortMode) return;
    this.activeSort = sortMode as SortKey;
    this.fetchActive(true);
  },

  loadMore(): void {
    this.fetchActive(false);
  },

  renderGroupCard(group: RankingCategoryGroup): string {
    return renderRankingGroupCard(group);
  },

  renderFlatCard(product: RankedProduct): string {
    return renderRankingFlatCard(product);
  },

  scrollTabs(direction: 'left' | 'right'): void {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
  },

  updateScrollState(): void {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll;
    if (!el) return;
    this.canScrollLeft = el.scrollLeft > 0;
    this.canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
  },

  // Category dropdown
  openCategoryLevel2(mainCatId: string): void {
    this.selectedMainCategory = mainCatId;
    this.pendingSubCategory = null;
    this.categoryDropdownLevel = 2;
  },

  goBackToLevel1(): void {
    this.categoryDropdownLevel = 1;
  },

  applyCategoryFilter(): void {
    this.categoryDropdownOpen = false;
    const mainCat = this.selectedMainCategory || 'all';
    const finalCat = this.pendingSubCategory || mainCat;
    // Tab bar her zaman ANA kategoriyi highlight eder (alt kategori seçilse bile)
    this.activeTab = mainCat;
    // Fetch son seçim üzerinden yapılır (ana veya alt)
    this.activeCategory = finalCat;
    this.mode = finalCat === 'all' ? 'grouped' : 'flat';
    this.fetchActive(true);
  },

  // Dropdown açılış — edit state'i applied state'ten senkronize eder,
  // böylece son seçim radio'sunda işaretli görünür ve seviye korunur.
  openCategoryDropdown(): void {
    const isDesktop = window.innerWidth >= 1024;
    const opening = isDesktop ? !this.categoryDropdownOpen : true;
    if (opening) {
      this.selectedMainCategory = this.activeTab === 'all' ? null : this.activeTab;
      this.pendingSubCategory = (this.activeCategory !== this.activeTab) ? this.activeCategory : null;
      // Level 2 sadece seçili ana kategorinin alt kategorisi varsa anlamlı — yoksa Level 1'de kal
      const mainCat = this.apiCategories.find(c => c.slug === this.selectedMainCategory);
      const hasChildren = !!(mainCat?.children && mainCat.children.length > 0);
      this.categoryDropdownLevel = hasChildren ? 2 : 1;
    }
    if (isDesktop) {
      this.categoryDropdownOpen = opening;
    } else {
      this.showCategorySheet = true;
    }
  },

  // Dropdown butonunda gösterilecek metin — son uygulanmış seçim (ana veya alt kategori)
  get selectedCategoryLabel(): string {
    if (this.activeCategory === 'all') return t('topRankingPage.allCategories');
    for (const main of this.apiCategories) {
      if (main.slug === this.activeCategory) return main.name;
      const sub = main.children?.find(c => c.slug === this.activeCategory);
      if (sub) return sub.name;
    }
    return t('topRankingPage.allCategories');
  },

  // i18n helper for Alpine templates
  $t(key: string): string {
    return t(key);
  },
}));

/* ── Page Assembly ── */

const breadcrumbItems = [
  { label: t('topRankingPage.breadcrumb') },
];

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Header (desktop only — mobile uses compact hero header) -->
  <div id="sticky-header" class="hidden lg:block z-[30] border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>

  ${MegaMenu()}

  <!-- Sticky compact mobile header (appears on scroll) -->
  ${TopRankingStickyMobileHeader()}

  <!-- Main Content -->
  <main x-data="topRankingPage">
    <!-- Mobile compact hero header (scrolls with content) -->
    <div id="tr-mobile-hero-sentinel">
      ${TopRankingMobileHeader()}
    </div>

    <!-- Hero (full-width background with breadcrumb inside) -->
    <section class="relative z-20" style="background: linear-gradient(0deg, var(--color-primary-100, #fdf0c3) 1%, var(--color-primary-50, #fef9e7) 100%);">
      <!-- Decorative circles (desktop only) -->
      <div class="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-10 left-[5%] w-48 h-48 rounded-full bg-primary-200/20"></div>
        <div class="absolute top-1/3 right-[3%] w-36 h-36 rounded-full bg-primary-200/15"></div>
      </div>
      <!-- Breadcrumb (desktop only) -->
      <div class="hidden lg:block relative z-10 container-boxed pt-2 lg:pt-3">
        ${Breadcrumb(breadcrumbItems)}
      </div>
      ${TopRankingHero()}
    </section>

    <!-- Category tabs (scrolls away on mobile, sticky on desktop) -->
    <div id="tr-category-tabs" class="bg-surface">
      <div class="container-boxed">
        ${TopRankingCategoryTabs()}
      </div>
    </div>

    <!-- Sort pills (always sticky) -->
    <div id="sticky-tabs" class="sticky top-0 z-10 bg-surface transition-shadow duration-200">
      <div class="container-boxed">
        ${TopRankingSortPills()}
      </div>
    </div>

    <!-- Ranking Grid -->
    <section class="pb-8 lg:pb-12" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        ${TopRankingGrid()}
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

// Initialize
initMegaMenu();
initFlowbite();
startAlpine();
initHeaderCart();
initMobileDrawer();
initLanguageSelector();
initRankingCategoryTabs();
initAnimatedPlaceholder('#topbar-compact-search-input');

// Categories and products are loaded via Alpine init() lifecycle hook

// Show/hide sticky compact mobile header based on hero visibility
// Also adjust sort pills sticky position when mobile header appears
const mobileHeroSentinel = document.getElementById('tr-mobile-hero-sentinel');
const stickyMobileHeader = document.getElementById('tr-sticky-mobile-header');
const stickyPills = document.getElementById('sticky-tabs');

if (mobileHeroSentinel && stickyMobileHeader) {
  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        // Hero is visible — hide sticky header
        stickyMobileHeader.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
        stickyMobileHeader.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        // Reset sort pills to top:0
        if (stickyPills && window.innerWidth < 1024) {
          stickyPills.style.top = '0px';
        }
      } else {
        // Hero scrolled away — show sticky header
        stickyMobileHeader.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
        stickyMobileHeader.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        // Push sort pills below sticky mobile header
        if (stickyPills && window.innerWidth < 1024) {
          const headerHeight = stickyMobileHeader.offsetHeight;
          stickyPills.style.top = headerHeight + 'px';
        }
      }
    },
    { threshold: 0 }
  );
  heroObserver.observe(mobileHeroSentinel);
}

// Add bottom border to sticky tabs when they become stuck
const stickyTabs = document.getElementById('sticky-tabs');
if (stickyTabs) {
  const sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  sentinel.style.width = '100%';
  sentinel.style.pointerEvents = 'none';
  stickyTabs.parentElement?.insertBefore(sentinel, stickyTabs);

  const observer = new IntersectionObserver(
    ([entry]) => {
      const isStuck = !entry.isIntersecting;
      stickyTabs.classList.toggle('shadow-sm', isStuck);
      stickyTabs.classList.toggle('border-b', isStuck);
      stickyTabs.classList.toggle('border-gray-200', isStuck);
    },
    { threshold: 0 }
  );
  observer.observe(sentinel);
}
