/**
 * Tailored Selections Page — Entry Point
 * Assembles header, hero carousel, product grid, and footer for the
 * Tailored Selections landing page (opened from homepage "View more" link).
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { renderListingCard, initProductSliders } from '../components/shared/ListingCard'
import { renderPagination } from '../components/shared/Pagination'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Tailored Selections components
import { TailoredSelectionsHero, initTailoredSelectionsHero, renderTailoredHero, setTailoredHeroActive, TailoredProductGrid } from '../components/tailored-selections'

// Product/cart/favorite/login components (paylaşılan zengin kart altyapısı — top-deals ile aynı)
import { ListingCartDrawer, initListingCartDrawer } from '../components/products'
import { applyListingSocialProof } from '../components/products/initListingSocialProof'
import { initListingFavoriteTriggers, syncListingFavoriteHearts } from '../components/products/initListingFavorites'
import { LoginModal } from '../components/product'

// Services
import { searchListings, getTailoredGroupDetail, getTailoredSelections } from '../services/listingService'
import { initCurrency } from '../services/currencyService'

// Types
import type { ProductListingCard } from '../types/productListing'
import type { TailoredCategory } from '../types/tailoredSelections'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Data ── */

// ?mock_ts=1 — backend sipariş serisi/trend yüzdesi sağlayana kadar sparkline'ı
// demo etmek için slug'dan deterministik seri üretir (sosyal kanıt ?mock_sp=1 deseni).
function mockSeriesForSlug(slug: string): { series: number[]; trendPct: number } {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  const series: number[] = [];
  let v = 40 + (Math.abs(hash) % 30);
  for (let i = 0; i < 12; i++) {
    hash = (hash * 31 + i) | 0;
    v = Math.max(5, v + ((Math.abs(hash) % 15) - 6));
    series.push(v);
  }
  const trendPct = Math.round(((series[series.length - 1] - series[0]) / series[0]) * 100);
  return { series, trendPct };
}

/* ── Breadcrumb ── */

const breadcrumbItems = [
  { label: t('tailoredPage.breadcrumb') },
];

/* ── Page Assembly ── */

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Scoped CSS for mobile header scroll states -->
  <style>
    /* Default: transparent header with white text/icons */
    #ts-mobile-header {
      background-color: transparent;
      border-bottom: 1px solid transparent;
    }
    #ts-mobile-header .ts-hdr-title { color: #fff; }
    #ts-mobile-header .ts-hdr-icon { color: #fff; }

    /* Scrolled: white header with dark text/icons */
    #ts-mobile-header.is-scrolled {
      background-color: #fff !important;
      border-bottom: 1px solid #e5e7eb !important;
    }
    #ts-mobile-header.is-scrolled .ts-hdr-title { color: #111827 !important; }
    #ts-mobile-header.is-scrolled .ts-hdr-icon { color: #374151 !important; }
  </style>

  <!-- Mobile Sticky Container (visible below xl:1280px) -->
  <div id="ts-mobile-sticky" class="sticky top-0 z-[30] xl:hidden">
    <!-- Mobile Header Bar -->
    <div id="ts-mobile-header" class="flex items-center justify-between px-3 py-2.5 lg:px-5 lg:py-3 transition-colors duration-300">
      <a href="/" class="flex items-center justify-center w-9 h-9 lg:w-11 lg:h-11 rounded-full transition-colors" aria-label="Back">
        <svg class="ts-hdr-icon w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </a>
      <h1 id="ts-hdr-title" class="ts-hdr-title text-base lg:text-xl font-semibold transition-colors duration-200" data-i18n="tailoredPage.title">${t('tailoredPage.title')}</h1>
      <form id="ts-hdr-search-form" class="hidden flex-1 mx-2">
        <input
          id="ts-hdr-search-input" name="q" type="search" autocomplete="off"
          placeholder="${t('common.search') || 'Ara'}"
          class="w-full h-9 rounded-full border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-[#737373] focus:outline-none focus:border-[#f5b800]"
        />
      </form>
      <button id="ts-hdr-search-btn" class="th-no-press flex items-center justify-center w-9 h-9 lg:w-11 lg:h-11 rounded-full transition-colors" aria-label="${t('common.search') || 'Ara'}">
        <svg class="ts-hdr-icon w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </button>
    </div>

    <!-- Category Pills (hidden initially, revealed on scroll past hero; renderSubCategoryPills doldurur) -->
    <div id="ts-category-pills" class="bg-white border-b border-gray-200" style="display:none;"></div>
  </div>

  <!-- Desktop Header (visible at xl:1280px+) -->
  <div id="sticky-header" class="sticky top-0 z-[30] hidden xl:block border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>

  ${MegaMenu()}

  <!-- Main Content -->
  <main>
    <!-- Hero Section with Category Carousel -->
    ${TailoredSelectionsHero()}

    <!-- Products area: rounded top corners, overlaps hero bottom -->
    <div class="relative z-10 -mt-3 rounded-t-md" style="background: var(--products-bg, #f5f5f5);">
      <!-- Breadcrumb (desktop only) -->
      <div class="container-boxed pt-5 pb-2 hidden xl:block">
        ${Breadcrumb(breadcrumbItems)}
      </div>

      <!-- Product Grid -->
      ${TailoredProductGrid()}
    </div>
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  ${LoginModal()}
  ${ListingCartDrawer()}

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

/* ── Initialization ── */

initMegaMenu();
initFlowbite();
mountChatPopup();
initChatTriggers();
startAlpine();
initHeaderCart();
initLanguageSelector();
initListingFavoriteTriggers();
// initTailoredSelectionsHero() — API yanıtı geldikten sonra çağırılır (loadHeroAndInit içinde)
initAnimatedPlaceholder('#topbar-compact-search-input');
initTailoredScrollBehavior();
initPaginationTriggers();
initMobileHeaderSearch();

/* ── Mobil header arama: ikon → başlığın yerine açılan input,
      yazdıkça alttaki grid'i canlı filtreler (sunucu taraflı, aktif kategoriye kısıtlı) ── */

function initMobileHeaderSearch(): void {
  const btn = document.getElementById('ts-hdr-search-btn');
  const form = document.getElementById('ts-hdr-search-form') as HTMLFormElement | null;
  const input = document.getElementById('ts-hdr-search-input') as HTMLInputElement | null;
  const title = document.getElementById('ts-hdr-title');
  if (!btn || !form || !input || !title) return;

  const setOpen = (open: boolean): void => {
    form.classList.toggle('hidden', !open);
    title.classList.toggle('hidden', open);
    if (open) input.focus();
  };

  let debounceTimer = 0;
  const applyQuery = (raw: string): void => {
    window.clearTimeout(debounceTimer);
    // 1 karakterlik sorgu gürültü üretir; 0 = aramayı bırak, normal grid'e dön
    const q = raw.trim().length >= 2 ? raw.trim() : '';
    if (q === searchQuery) return;
    searchQuery = q;
    // Arama tüm kategoriyi tarar — alt-kategori seçimi sonuçlara uygulanamıyor
    // (searchListings subcategory almıyor); tutarlılık için sıfırla.
    if (q) activeSubCategory = undefined;
    loadPage(1);
  };

  input.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => applyQuery(input.value), 300);
  });

  btn.addEventListener('click', () => {
    if (form.classList.contains('hidden')) setOpen(true);
    else if (!input.value.trim()) setOpen(false);
    else input.focus();
  });

  // Boş bırakıp dışarı tıklanınca başlığa geri dön; Escape aramayı temizleyip kapatır
  input.addEventListener('blur', () => {
    if (!input.value.trim()) setOpen(false);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      applyQuery('');
      input.blur();
    }
  });

  // Enter: sayfadan ayrılma — debounce'u beklemeden hemen filtrele
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    applyQuery(input.value);
  });
}

/* ── Product loading + pagination ── */

// URL parametreleri: ?category=SLUG&subcategory=SLUG
const urlParams = new URLSearchParams(window.location.search);
const initialCategorySlug = urlParams.get('category');
const subCategorySlug = urlParams.get('subcategory') || undefined;

// Pagination + aktif seçim state'i
let activeCategorySlug: string | null = initialCategorySlug;
let activeSubCategory: string | undefined = subCategorySlug;
let searchQuery = '';
let currentPage = 1;
let totalPages = 1;
const PAGE_SIZE = 40;

function toggleEmptyState(hide: boolean): void {
  const emptyState = document.getElementById('ts-product-grid-empty');
  if (emptyState) emptyState.style.display = hide ? 'none' : '';
}

/** Zengin kartı REPLACE eder (append yasak — scale-resilience) + kart etkileşim altyapısını tazeler. */
function renderProducts(products: ProductListingCard[]): void {
  const grid = document.getElementById('ts-product-grid');
  if (!grid) return;
  grid.classList.toggle('hidden', products.length === 0);
  toggleEmptyState(products.length > 0);
  grid.innerHTML = products
    .map((card) => `<div role="listitem" class="flex">${renderListingCard(card, { showDiscount: true })}</div>`)
    .join('');
  initListingCartDrawer(products);
  initProductSliders();
  applyListingSocialProof(products);
  syncListingFavoriteHearts();
}

function renderPaginationBar(): void {
  const el = document.getElementById('ts-pagination');
  if (!el) return;
  el.innerHTML = renderPagination(currentPage, totalPages, currentPage < totalPages, currentPage > 1);
}

/** #ts-pagination üzerine tek tıklama delegasyonu (data-page butonları). */
function initPaginationTriggers(): void {
  const el = document.getElementById('ts-pagination');
  if (!el) return;
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-page]');
    if (!btn || btn.disabled) return;
    const target = parseInt(btn.dataset.page ?? '', 10);
    if (target >= 1 && target <= totalPages && target !== currentPage) loadPage(target);
  });
}

// Alt-kategori sekmeleri — top-deals/top-ranking sekme çubuğuyla aynı görsel dil
// (altı çizgili, kompakt, yatay kayan). ts-sub-pill yalnız JS hook'u.
const SUB_TAB_ACTIVE = ['!border-secondary-800', '!text-text-primary', 'font-semibold'];
const SUB_TAB_INACTIVE = ['text-text-tertiary', 'hover:text-text-primary'];

function subTabHtml(slug: string, label: string, isActive: boolean): string {
  const stateCls = (isActive ? SUB_TAB_ACTIVE : SUB_TAB_INACTIVE).join(' ');
  return `<button type="button" class="ts-sub-pill flex-shrink-0 whitespace-nowrap px-[10px] sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm transition-colors border-b-[3px] border-transparent ${stateCls}" data-sub="${slug}">${label}</button>`;
}

function renderSubCategoryPills(subs: Array<{ slug: string; name: string }>): void {
  if (!subs || subs.length === 0) return;
  const container = document.getElementById('ts-category-pills');
  if (!container) return;
  const allLabel = t('common.all') || 'Tümü';
  const pillsHtml = [
    subTabHtml('', allLabel, !activeSubCategory),
    ...subs.map(s => subTabHtml(s.slug, s.name, activeSubCategory === s.slug)),
  ].join('');
  container.innerHTML = `
    <div class="flex overflow-x-auto scrollbar-hide">${pillsHtml}</div>
  `;
  // Görünürlüğü initTailoredScrollBehavior yönetir: çubuk yalnız hero header'ın
  // arkasına girince açılır. Burada zorla açmak sayfa başında hero'yu aşağı itip
  // şeffaf header'ın arkasını beyaz bırakıyordu.
  container.querySelectorAll<HTMLButtonElement>('.ts-sub-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.sub || undefined;
      if (sub === activeSubCategory && !searchQuery) return;
      // Alt-kategori seçimi aramayı sonlandırır — searchListings subcategory
      // desteklemediği için ikisi aynı anda uygulanamaz.
      if (searchQuery) {
        searchQuery = '';
        const inp = document.getElementById('ts-hdr-search-input');
        if (inp instanceof HTMLInputElement) inp.value = '';
      }
      activeSubCategory = sub;
      container.querySelectorAll('.ts-sub-pill').forEach(b => {
        b.classList.remove(...SUB_TAB_ACTIVE, ...SUB_TAB_INACTIVE);
        b.classList.add(...(b === btn ? SUB_TAB_ACTIVE : SUB_TAB_INACTIVE));
      });
      loadPage(1);
    });
  });
}

async function loadPage(page: number): Promise<void> {
  try {
    if (activeCategorySlug && !searchQuery) {
      const result = await getTailoredGroupDetail(activeCategorySlug, {
        subcategory: activeSubCategory,
        page,
        pageSize: PAGE_SIZE,
      });
      currentPage = page;
      totalPages = result.totalPages;
      renderProducts(result.products);
      renderPaginationBar();
      // Alt-kategori pill'leri yalnız sayfa 1 yüklemesinde yenilenir (mevcut davranış).
      if (page === 1) renderSubCategoryPills(result.subCategories);
    } else {
      // Arama aktifken sunucu taraflı, aktif kategoriye kısıtlı arama;
      // kategori yoksa (cold-start edge) genel popüler ürünler.
      const result = await searchListings({
        query: searchQuery || undefined,
        category: searchQuery ? activeCategorySlug || undefined : undefined,
        page,
        page_size: PAGE_SIZE,
      });
      currentPage = page;
      totalPages = result.searchHeader.totalPages;
      renderProducts(result.products);
      renderPaginationBar();
    }
    if (page > 1) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }
  } catch (err) {
    console.warn('[TailoredSelections Page] load failed:', err);
  }
}

/* ── Hero yükleme + aktif kategori yönetimi (SPA davranışı) ── */

function setActiveCategory(slug: string, pushUrl: boolean): void {
  if (slug === activeCategorySlug) return;
  activeCategorySlug = slug;
  activeSubCategory = undefined;
  currentPage = 1;
  if (pushUrl) {
    const newUrl = `${window.location.pathname}?category=${encodeURIComponent(slug)}`;
    history.pushState({ category: slug }, '', newUrl);
  }
  loadPage(1);
}

async function loadHeroAndInit(): Promise<void> {
  try {
    const result = await getTailoredSelections(9);
    const mockTs = urlParams.has('mock_ts');
    const cats: TailoredCategory[] = (result.groups || []).map(g => ({
      id: g.categoryId,
      slug: g.slug,
      title: g.name,
      description: g.editorialText || '',
      imageSrc: g.image || '',
      badge: g.badge,
      viewsCount: g.viewsCount || 0,
      ...(mockTs ? mockSeriesForSlug(g.slug) : {}),
    }));

    if (cats.length === 0) {
      // Hero verisi yoksa — fallback genel grid
      loadPage(1);
      return;
    }

    // URL'de kategori yoksa listedeki ilk kategoriyi aktif yap
    if (!activeCategorySlug) {
      activeCategorySlug = cats[0].slug || null;
    }

    // Sahne + kanal şeridini doldur; kanal tıklaması → setActiveCategory
    renderTailoredHero(cats, activeCategorySlug || undefined);
    initTailoredSelectionsHero({
      onCategoryChange: (slug) => setActiveCategory(slug, true),
    });

    // İlk grid yüklemesi
    loadPage(1);
  } catch (err) {
    console.warn('[TailoredSelections] hero load failed:', err);
    loadPage(1);
  }
}

// Tarayıcı back/forward tuşu — popstate dinleyicisi
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('category');
  if (slug && slug !== activeCategorySlug) {
    setActiveCategory(slug, false);
    setTailoredHeroActive(slug);
  }
});

initCurrency().then(() => loadHeroAndInit());

/* ── Scroll-based header & category pills behavior ── */

function initTailoredScrollBehavior(): void {
  const mobileHeader = document.getElementById('ts-mobile-header');
  const categoryPills = document.getElementById('ts-category-pills');
  const heroSection = document.getElementById('ts-hero-section');

  if (!mobileHeader || !categoryPills || !heroSection) return;

  // Pull hero section behind the transparent header so dark bg shows through
  const applyHeroOverlap = () => {
    if (window.innerWidth < 1280) {
      const headerH = mobileHeader.offsetHeight;
      heroSection.style.marginTop = `-${headerH}px`;
    } else {
      heroSection.style.marginTop = '0';
    }
  };

  applyHeroOverlap();
  window.addEventListener('resize', applyHeroOverlap);

  // Track states to avoid redundant DOM updates
  let wasScrolled = false;
  let werePillsVisible = false;

  const applyScrollState = () => {
    // Use getBoundingClientRect for reliable scroll detection
    const heroRect = heroSection.getBoundingClientRect();
    const headerH = mobileHeader.offsetHeight;

    // Header turns white as soon as hero starts scrolling up
    const isScrolled = heroRect.top < -10;
    // Category pills appear when hero is fully behind the header
    const showPills = heroRect.bottom <= headerH + 5;

    if (isScrolled !== wasScrolled) {
      wasScrolled = isScrolled;
      mobileHeader.classList.toggle('is-scrolled', isScrolled);
    }

    if (showPills !== werePillsVisible) {
      werePillsVisible = showPills;
      categoryPills.style.display = showPills ? '' : 'none';
    }
  };

  window.addEventListener('scroll', applyScrollState, { passive: true });
  applyScrollState(); // Initial check
}
