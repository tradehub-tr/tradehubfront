/**
 * Top Deals Page — Entry Point
 *
 * Alibaba-style flat product grid driven entirely by the active category tab.
 *   - "Tümü" tab: get_listings({ is_deal:1, sort_by:'discount' }) — no
 *     category filter, so deal products from every category appear mixed.
 *   - Specific category tab: get_listings({ is_deal:1, category, sort_by:'discount' })
 *
 * Numaralı sayfalama query'yi sayfalar (page=2, 3, …) ve grid'i DEĞİŞTİRİR
 * (append değil) — DOM'da her an tek sayfalık kart bulunur (scale-resilience).
 */

import '../style.css'
import Alpine from 'alpinejs'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
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
import { renderListingCard, initProductSliders } from '../components/shared/ListingCard'
import { renderPagination } from '../components/shared/Pagination'
import { ListingCartDrawer, initListingCartDrawer } from '../components/products'
import { applyListingSocialProof } from '../components/products/initListingSocialProof'
import { initListingFavoriteTriggers, syncListingFavoriteHearts } from '../components/products/initListingFavorites'
import { LoginModal } from '../components/product'

// Services
import { searchListings } from '../services/listingService'
import { initCurrency } from '../services/currencyService'

// Types
import type { ProductListingCard } from '../types/productListing'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Page constants ──────────────────────────────────────────────────── */

const PAGE_SIZE = 40  // products per page in both All and per-category tabs (5 columns × 8 rows)

/* ── Alpine Data Registration ────────────────────────────────────────── */

Alpine.data('topDealsPage', () => ({
  /* Tab state */
  activeCategory: 'all' as string,    // 'all' = no category filter
  activeSubFilter: 'all' as string,

  /* Mobile in-hero search — scoped to deals only */
  showSearch: false,
  searchQuery: '',

  /* Tab scroll state */
  canScrollLeft: false,
  canScrollRight: true,

  /* Data + pagination */
  products: [] as ProductListingCard[],
  page: 1,
  totalPages: 1,
  loading: false,
  /* Monotonic request id — drops stale responses when the category changes
     mid-flight (otherwise an older fetch could overwrite the new grid). */
  reqId: 0,

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

  /* ── Mobile in-hero search (deals only) ── */
  openSearch() {
    this.showSearch = true
    this.$nextTick(() => {
      const input = (this.$refs as Record<string, HTMLElement>).dealSearchInput as
        | HTMLInputElement
        | undefined
      input?.focus()
    })
  },

  closeSearch() {
    this.showSearch = false
    // Reset the grid only if a query was actually applied.
    if (this.searchQuery) {
      this.searchQuery = ''
      this.loadProducts(/* reset */ true)
    }
  },

  clearSearch() {
    this.searchQuery = ''
    this.loadProducts(/* reset */ true)
    this.$nextTick(() => {
      const input = (this.$refs as Record<string, HTMLElement>).dealSearchInput as
        | HTMLInputElement
        | undefined
      input?.focus()
    })
  },

  submitSearch() {
    this.loadProducts(/* reset */ true)
  },

  /* ── Pagination ── */
  get paginationHtml(): string {
    return renderPagination(this.page, this.totalPages, this.page < this.totalPages, this.page > 1)
  },

  onPageClick(e: Event) {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-page]')
    if (!btn || btn.disabled) return
    const target = parseInt(btn.dataset.page ?? '', 10)
    if (target >= 1 && target <= this.totalPages && target !== this.page) this.goToPage(target)
  },

  goToPage(page: number) {
    this.page = page
    this.loadProducts(/* resetPage */ false)
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  },

  /* ── Single load function (drives both All and per-category tabs) ── */
  loadProducts(resetPage: boolean) {
    if (resetPage) this.page = 1
    this.loading = true
    const myReq = ++this.reqId

    const params: Record<string, unknown> = {
      is_deal: true,
      page: this.page,
      page_size: PAGE_SIZE,
      sort_by: 'discount',
    }
    if (this.activeCategory && this.activeCategory !== 'all') {
      params.category = this.activeCategory
    }
    // Deal-scoped search: is_deal stays set, so results never leave Top Deals.
    const q = this.searchQuery.trim()
    if (q) params.query = q

    searchListings(params)
      .then(result => {
        if (myReq !== this.reqId) return
        this.products = result.products // REPLACE — append yasak (scale-resilience)
        this.totalPages = result.searchHeader.totalPages
        this.loading = false
        this.$nextTick(() => this.afterGridRender())
      })
      .catch(err => {
        if (myReq !== this.reqId) return
        console.warn('[TopDeals] load failed:', err)
        this.products = []
        this.totalPages = 1
        this.loading = false
      })
  },

  /* Kart etkileşim altyapısı her grid render'ından sonra tazelenir
     (products.ts onUpdate'iyle aynı sıra). */
  afterGridRender() {
    initListingCartDrawer(this.products)
    initProductSliders()
    applyListingSocialProof(this.products)
    syncListingFavoriteHearts()
  },

  /* ── Renderer exposed to x-html templates ── */
  renderCard(card: ProductListingCard): string {
    return renderListingCard(card, { showDiscount: true })
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
  <main x-data="topDealsPage">
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

    <!-- Product Grid — isolate: kart içi z-index'ler (favori z-30, rozet z-20)
         bu bölümde hapsolur, sticky tab barının (z-20) üstüne çıkamaz -->
    <section class="isolate pb-8 lg:pb-12" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        ${TopDealsGrid()}
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  ${LoginModal()}
  ${ListingCartDrawer()}

  <!-- Floating Panel -->
  ${FloatingPanel()}
`

// Initialize
initMegaMenu()
initFlowbite()
mountChatPopup();
initChatTriggers();
startAlpine()
initHeaderCart()
initLanguageSelector()
initCategoryTabs()
initListingFavoriteTriggers()
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
