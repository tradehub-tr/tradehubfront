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
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
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
} from '../components/top-ranking/TopRankingGrid'

// Services
import {
  getTopRankingGrouped,
  type TopRankingGroup,
} from '../services/listingService'
import { initCurrency } from '../services/currencyService'
import { loadCategories } from '../services/categoryService'
import type { ApiCategory } from '../services/categoryService'

// Data (types only)
import type { RankingCategoryGroup } from '../types/topRanking'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Constants ── */

/** Number of category cards loaded per "Daha fazla yükle" click in grouped (Tümü) mode. Bounded server-side at 30. */
const GROUPS_PER_PAGE = 12;

/** Frontend "rank badge" only fits #1/#2/#3, so the page always asks the API for 3 previews per card. */
const PRODUCTS_PER_GROUP = 3;

/** Allowed sort metric ids — must match _TOP_RANKING_SORTS in tradehub_core.api.listing */
type SortKey = 'hot-selling' | 'most-popular' | 'best-reviewed';

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
    })),
  };
}

/* ── Alpine Data Registration ── */

Alpine.data('topRankingPage', () => ({
  init() {
    loadCategories().then(cats => { this.apiCategories = cats; })
      .catch(err => console.warn('[TopRanking] Category load failed:', err));
    initCurrency()
      .then(() => this.fetchGroupedPage(true))
      .catch(err => console.warn('[TopRanking] Init failed:', err));
  },

  activeTab: 'all' as string,
  activeCategory: 'all' as string,
  activeSort: 'hot-selling' as SortKey,

  categoryDropdownOpen: false,
  categoryDropdownLevel: 1 as 1 | 2,
  selectedMainCategory: null as string | null,
  pendingSubCategory: null as string | null,
  showCategorySheet: false,
  showTabSheet: false,

  canScrollLeft: false,
  canScrollRight: true,

  nextPage: 1,
  loading: false,
  hasMore: true,
  totalCategories: 0,

  apiCategories: [] as ApiCategory[],
  allGroups: [] as RankingCategoryGroup[],

  get visibleGroups(): RankingCategoryGroup[] { return this.allGroups; },
  get visibleGroupCount(): number { return this.allGroups.length; },

  async fetchGroupedPage(reset = false): Promise<void> {
    if (this.loading) return;
    if (!reset && !this.hasMore) return;
    this.loading = true;
    if (reset) {
      this.nextPage = 1;
      this.hasMore = true;
      this.allGroups = [];
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

  setSort(sortMode: string): void {
    if (this.activeSort === sortMode) return;
    this.activeSort = sortMode as SortKey;
    this.fetchGroupedPage(true);
  },

  loadMore(): void { this.fetchGroupedPage(false); },

  renderGroupCard(group: RankingCategoryGroup): string {
    return renderRankingGroupCard(group);
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

  openCategoryLevel2(mainCatId: string): void {
    this.selectedMainCategory = mainCatId;
    this.pendingSubCategory = null;
    this.categoryDropdownLevel = 2;
  },

  goBackToLevel1(): void { this.categoryDropdownLevel = 1; },

  /**
   * "Tümü" seçildiğinde aynı sayfada grouped'a dön; bir kategori seçildiğinde
   * yeni adanmış sayfaya yönlendir.
   */
  applyCategoryFilter(): void {
    this.categoryDropdownOpen = false;
    const mainCat = this.selectedMainCategory;
    const finalCat = this.pendingSubCategory || mainCat;
    if (!finalCat) {
      this.activeTab = 'all';
      this.activeCategory = 'all';
      this.fetchGroupedPage(true);
      return;
    }
    const sp = new URLSearchParams();
    sp.set('cat', finalCat);
    sp.set('sort', this.activeSort);
    sp.set('page', '1');
    window.location.href = `/pages/top-ranking-category.html?${sp.toString()}`;
  },

  openCategoryDropdown(): void {
    const isDesktop = window.innerWidth >= 1024;
    const opening = isDesktop ? !this.categoryDropdownOpen : true;
    if (opening) {
      this.selectedMainCategory = null;
      this.pendingSubCategory = null;
      this.categoryDropdownLevel = 1;
    }
    if (isDesktop) {
      this.categoryDropdownOpen = opening;
    } else {
      this.showCategorySheet = true;
    }
  },

  get selectedCategoryLabel(): string {
    return t('topRankingPage.allCategories');
  },

  $t(key: string): string { return t(key); },
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
mountChatPopup();
initChatTriggers();
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
