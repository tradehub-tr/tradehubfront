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
import { renderRankingGroupCard } from '../components/top-ranking/TopRankingGrid'

// Services
import { searchListings } from '../services/listingService'
import { initCurrency } from '../services/currencyService'
import { loadCategories } from '../services/categoryService'
import type { ApiCategory } from '../services/categoryService'

// Data (types only)
import type { RankingCategoryGroup } from '../types/topRanking'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Alpine Data Registration ── */

const allGroups: RankingCategoryGroup[] = [];
const GROUPS_PER_PAGE = 12;

Alpine.data('topRankingPage', () => ({
  init() {
    // Load categories then products after Alpine is ready
    loadCategories().then(cats => {
      this.apiCategories = cats;
    }).catch(err => console.warn('[TopRanking] Category load failed:', err));

    initCurrency().then(() => {
      this.fetchProducts();
    }).catch(err => console.warn('[TopRanking] Init failed:', err));
  },

  // Filter state
  activeTab: 'all',
  activeSort: 'hot-selling',

  // Dropdown state (desktop)
  categoryDropdownOpen: false,

  // Category dropdown navigation
  categoryDropdownLevel: 1 as 1 | 2,
  selectedMainCategory: null as string | null,
  pendingSubCategory: null as string | null,

  // Mobile bottom sheet state
  showCategorySheet: false,
  showTabSheet: false,

  // Tab scroll state
  canScrollLeft: false,
  canScrollRight: true,

  // Pagination
  visibleGroupCount: GROUPS_PER_PAGE,

  // Loading state
  loading: false,

  // Dynamic data from API
  apiCategories: [] as ApiCategory[],
  allGroups: allGroups,

  get visibleGroups(): RankingCategoryGroup[] {
    return this.allGroups.slice(0, this.visibleGroupCount);
  },

  async fetchProducts(category?: string) {
    this.loading = true;
    try {
      const params: Record<string, unknown> = { page_size: 60 };
      if (category && category !== 'all') {
        params.category = category;
      }
      const result = await searchListings(params as any);
      // Group products by category name
      const categoryMap = new Map<string, typeof result.products>();
      for (const p of result.products) {
        const cat = (p as any).category || 'Diğer';
        if (!categoryMap.has(cat)) categoryMap.set(cat, []);
        categoryMap.get(cat)!.push(p);
      }
      const groups: RankingCategoryGroup[] = [];
      let idx = 0;
      for (const [catName, products] of categoryMap) {
        // Split into groups of up to 3
        for (let i = 0; i < products.length; i += 3) {
          const chunk = products.slice(i, i + 3);
          groups.push({
            id: `rg-api-${idx++}`,
            name: catName,
            nameKey: '',
            categoryId: category || 'all',
            products: chunk.map((p, ri) => ({
              id: p.id || `rp-${idx}-${ri}`,
              name: p.name,
              href: p.href || `/pages/product-detail.html?id=${p.id}`,
              price: p.price,
              imageSrc: p.imageSrc || '',
              moq: p.moq || '1 adet',
              rank: (ri + 1) as 1 | 2 | 3,
            })),
          });
        }
      }
      this.allGroups = groups;
    } catch (err) {
      console.warn('[TopRanking] fetchProducts failed:', err);
    } finally {
      this.loading = false;
    }
  },

  setTab(tabId: string) {
    this.activeTab = tabId;
    this.selectedMainCategory = tabId === 'all' ? null : tabId;
    this.pendingSubCategory = null;
    this.visibleGroupCount = GROUPS_PER_PAGE;
    this.fetchProducts(tabId);
  },

  setSort(sortMode: string) {
    this.activeSort = sortMode;
  },

  loadMore() {
    this.visibleGroupCount += GROUPS_PER_PAGE;
  },

  renderGroupCard(group: RankingCategoryGroup): string {
    return renderRankingGroupCard(group);
  },

  scrollTabs(direction: 'left' | 'right') {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
  },

  updateScrollState() {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll;
    if (!el) return;
    this.canScrollLeft = el.scrollLeft > 0;
    this.canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
  },

  // Category dropdown
  openCategoryLevel2(mainCatId: string) {
    this.selectedMainCategory = mainCatId;
    this.pendingSubCategory = null;
    this.categoryDropdownLevel = 2;
  },

  goBackToLevel1() {
    this.categoryDropdownLevel = 1;
  },

  applyCategoryFilter() {
    const category = this.pendingSubCategory || this.selectedMainCategory || 'all';
    this.activeTab = this.selectedMainCategory || 'all';
    this.categoryDropdownOpen = false;
    this.categoryDropdownLevel = 1;
    this.visibleGroupCount = GROUPS_PER_PAGE;
    this.fetchProducts(category);
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
  <div id="sticky-header" class="hidden lg:block z-[30]" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
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
