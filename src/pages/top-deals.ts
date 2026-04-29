/**
 * Top Deals Page — Entry Point
 *
 * Alibaba-style flat product grid driven entirely by the active category tab.
 *   - "Tümü" tab: get_listings({ is_deal:1, sort_by:'discount' }) — no
 *     category filter, so deal products from every category appear mixed.
 *   - Specific category tab: get_listings({ is_deal:1, category, sort_by:'discount' })
 *
 * "Daha fazla yükle" pages the active query (page=2, 3, …) and appends rows.
 * Backend pagination keeps the page production-friendly: thousands of
 * products never load at once.
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

// Top Deals components
import {
  TopDealsHero,
  TopDealsMobileHeader,
  TopDealsStickyMobileHeader,
  TopDealsCategoryTabs,
  TopDealsSubFilters,
  TopDealsGrid,
  initCategoryTabs,
} from '../components/top-deals'
import { renderTopDealsFlatCard } from '../components/top-deals/TopDealsGrid'

// Services
import { searchListings } from '../services/listingService'
import { initCurrency } from '../services/currencyService'

// Types
import type { TopDealsProduct } from '../types/topDeals'
import type { ProductListingCard } from '../types/productListing'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Page constants ──────────────────────────────────────────────────── */

const PAGE_SIZE = 24  // products per page in both All and per-category tabs

/* ── Mappers ─────────────────────────────────────────────────────────── */

function cardToTopDealsProduct(card: ProductListingCard): TopDealsProduct {
  // card.discount formatı: "%20 indirim" veya "%X off" → sayıyı ayır
  let discountPercent: number | undefined = undefined
  if (typeof card.discount === 'string') {
    const m = card.discount.match(/(\d+)/)
    if (m) discountPercent = parseInt(m[1], 10) || undefined
  }
  return {
    id: card.id || '',
    name: card.name,
    href: card.href || `/pages/product-detail.html?id=${card.id}`,
    price: card.price,
    originalPrice: card.originalPrice,
    imageKind: 'jewelry' as const,
    imageSrc: card.imageSrc || undefined,
    moq: card.moq || '1 adet',
    discountPercent,
    category: card.category || '',
  }
}

/* ── Alpine Data Registration ────────────────────────────────────────── */

Alpine.data('topDealsPage', () => ({
  /* Tab state */
  activeCategory: 'all' as string,    // 'all' = no category filter
  activeSubFilter: 'all' as string,
  showCategorySheet: false,

  /* Tab scroll state */
  canScrollLeft: false,
  canScrollRight: true,

  /* Data + pagination */
  products: [] as TopDealsProduct[],
  page: 1,
  hasMore: false,
  loading: false,

  /* Subfilters slot — kept for future use */
  get subFilters(): { id: string; labelKey: string }[] {
    return []
  },

  /* ── Lifecycle ── */
  init() {
    this.loadProducts(/* reset */ true)
  },

  /* ── Tab interactions ── */
  setCategory(categoryId: string) {
    if (categoryId === this.activeCategory) return
    this.activeCategory = categoryId
    this.activeSubFilter = 'all'
    this.loadProducts(/* reset */ true)
  },

  setSubFilter(filterId: string) {
    this.activeSubFilter = filterId
  },

  /* ── Pagination ── */
  loadMore() {
    if (this.loading || !this.hasMore) return
    this.loadProducts(/* reset */ false)
  },

  /* ── Single load function (drives both All and per-category tabs) ── */
  loadProducts(reset: boolean) {
    if (reset) {
      this.products = []
      this.page = 1
      this.hasMore = false
    } else {
      this.page += 1
    }
    this.loading = true

    const params: Record<string, unknown> = {
      is_deal: true,
      page: this.page,
      page_size: PAGE_SIZE,
      sort_by: 'discount',
    }
    if (this.activeCategory && this.activeCategory !== 'all') {
      params.category = this.activeCategory
    }

    searchListings(params)
      .then(result => {
        const mapped = result.products.map(cardToTopDealsProduct)
        this.products = reset ? mapped : [...this.products, ...mapped]
        this.hasMore = result.hasNext
        this.loading = false
      })
      .catch(err => {
        console.warn('[TopDeals] load failed:', err)
        this.hasMore = false
        this.loading = false
      })
  },

  /* ── Renderer exposed to x-html templates ── */
  renderFlatCard(product: TopDealsProduct): string {
    return renderTopDealsFlatCard(product)
  },

  /* ── Tab scroll helpers ── */
  scrollTabs(direction: 'left' | 'right') {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll
    if (!el) return
    const scrollAmount = 200
    el.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount
  },

  updateScrollState() {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll
    if (!el) return
    this.canScrollLeft = el.scrollLeft > 0
    this.canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
  },

  /* i18n helper for inline templates */
  $t(key: string): string {
    return t(key)
  },
}))

/* ── Page Assembly ───────────────────────────────────────────────────── */

const breadcrumbItems = [
  { label: t('topDealsPage.breadcrumb') },
]

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.classList.add('relative')
appEl.innerHTML = `
  <!-- Header (desktop only on this page — mobile uses compact hero header) -->
  <div id="sticky-header" class="hidden md:block z-[30] border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>

  ${MegaMenu()}

  <!-- Sticky compact mobile header (appears on scroll) -->
  ${TopDealsStickyMobileHeader()}

  <!-- Main Content -->
  <main x-data="topDealsPage" x-init="init()">
    <!-- Mobile compact hero header (full-width, orange gradient) -->
    <div id="td-mobile-hero-sentinel">
      ${TopDealsMobileHeader()}
    </div>

    <!-- Hero + Promo (non-sticky, scrolls away) -->
    <section class="md:pt-6 lg:pt-8" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        <div class="hidden md:block">
          ${Breadcrumb(breadcrumbItems)}
        </div>
        ${TopDealsHero()}
      </div>
    </section>

    <!-- Sticky tabs + sub-filters bar (full-width, sticks below header) -->
    <div id="sticky-tabs" class="sticky top-0 z-20 bg-white transition-shadow duration-200">
      <div class="container-boxed">
        ${TopDealsCategoryTabs()}
        ${TopDealsSubFilters()}
      </div>
    </div>

    <!-- Product Grid -->
    <section class="pb-8 lg:pb-12" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        ${TopDealsGrid()}
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`

// Initialize
initMegaMenu()
initFlowbite()
startAlpine()
initHeaderCart()
initMobileDrawer()
initLanguageSelector()
initCategoryTabs()
initAnimatedPlaceholder('#topbar-compact-search-input')

// Initial currency load — Alpine init() drives the data fetch itself.
initCurrency().catch(err => console.warn('[TopDeals Page] currency init failed:', err))

// Show/hide sticky compact mobile header based on hero visibility
const mobileHeroSentinel = document.getElementById('td-mobile-hero-sentinel')
const stickyMobileHeader = document.getElementById('td-sticky-mobile-header')
if (mobileHeroSentinel && stickyMobileHeader) {
  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        // Hero is visible — hide sticky header
        stickyMobileHeader.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none')
        stickyMobileHeader.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto')
      } else {
        // Hero scrolled away — show sticky header
        stickyMobileHeader.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none')
        stickyMobileHeader.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto')
      }
    },
    { threshold: 0 }
  )
  heroObserver.observe(mobileHeroSentinel)
}

// Add bottom border to sticky tabs when they become stuck
const stickyTabs = document.getElementById('sticky-tabs')
if (stickyTabs) {
  const sentinel = document.createElement('div')
  sentinel.style.height = '1px'
  sentinel.style.width = '100%'
  sentinel.style.pointerEvents = 'none'
  stickyTabs.parentElement?.insertBefore(sentinel, stickyTabs)

  const observer = new IntersectionObserver(
    ([entry]) => {
      const isStuck = !entry.isIntersecting
      stickyTabs.classList.toggle('shadow-sm', isStuck)
      stickyTabs.classList.toggle('border-b', isStuck)
      stickyTabs.classList.toggle('border-gray-200', isStuck)
    },
    { threshold: 0 }
  )
  observer.observe(sentinel)
}
