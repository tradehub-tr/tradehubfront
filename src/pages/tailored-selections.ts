/**
 * Tailored Selections Page — Entry Point
 * Assembles header, hero carousel, product grid, and footer for the
 * Tailored Selections landing page (opened from homepage "View more" link).
 */

import '../style.css'
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

// Tailored Selections components
import { TailoredSelectionsHero, initTailoredSelectionsHero, renderTailoredHeroCategories, TailoredProductGrid, renderTailoredProductCard } from '../components/tailored-selections'

// Services
import { searchListings, getTailoredGroupDetail, getTailoredSelections } from '../services/listingService'
import { initCurrency } from '../services/currencyService'

// Data
import type { TailoredProduct, TailoredCategory } from '../types/tailoredSelections'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Data ── */

// Hero kategorileri API'den async yüklenir. İlk render'da boş başlatılır,
// loadHero() çağrısı sonrası swiper slide'larına inject edilir.
const categories: TailoredCategory[] = [];
const products: TailoredProduct[] = [];

// Kategori slug'ına göre deterministik hero background color seçer.
// Mock data'daki bgColor alanının yerini alır.
const BG_COLORS = ['#373224', '#1e3a2e', '#3b2e1a', '#2a1f3b', '#1a2e3b', '#3b1a2a', '#2a3b1a', '#1a3b2a', '#3b1a3a'];
function colorForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

/* ── Category Pills HTML ──
   Mobile sticky header'daki küçük pill çubuğu. API sonrası doldurulur. */
const categoryPillsHtml = '';

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
    <div id="ts-mobile-header" class="flex items-center justify-between px-3 py-2.5 lg:px-5 lg:py-3 transition-all duration-300">
      <a href="/" class="flex items-center justify-center w-9 h-9 lg:w-11 lg:h-11 rounded-full transition-colors" aria-label="Back">
        <svg class="ts-hdr-icon w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </a>
      <h1 class="ts-hdr-title text-base lg:text-xl font-semibold transition-colors duration-300" data-i18n="tailoredPage.title">${t('tailoredPage.title')}</h1>
      <button class="flex items-center justify-center w-9 h-9 lg:w-11 lg:h-11 rounded-full transition-colors" aria-label="Search">
        <svg class="ts-hdr-icon w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </button>
    </div>

    <!-- Category Pills (hidden initially, revealed on scroll past hero) -->
    <div id="ts-category-pills" class="overflow-x-auto bg-white border-b border-gray-200 scrollbar-hide" style="display:none;">
      <div class="flex gap-2 px-3 py-2">
        ${categoryPillsHtml}
      </div>
    </div>
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
    ${TailoredSelectionsHero(categories)}

    <!-- Products area: rounded top corners, overlaps hero bottom -->
    <div class="relative z-10 -mt-3 rounded-t-md" style="background: var(--products-bg, #f5f5f5);">
      <!-- Breadcrumb (desktop only) -->
      <div class="container-boxed pt-5 pb-2 hidden xl:block">
        ${Breadcrumb(breadcrumbItems)}
      </div>

      <!-- Product Grid -->
      ${TailoredProductGrid(products)}
    </div>
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

/* ── Initialization ── */

initMegaMenu();
initFlowbite();
startAlpine();
initHeaderCart();
initMobileDrawer();
initLanguageSelector();
// initTailoredSelectionsHero() — API yanıtı geldikten sonra çağırılır (loadHeroAndInit içinde)
initAnimatedPlaceholder('#topbar-compact-search-input');
initTailoredScrollBehavior();

/* ── Product loading + pagination ── */

// URL parametreleri: ?category=SLUG&subcategory=SLUG
const urlParams = new URLSearchParams(window.location.search);
const initialCategorySlug = urlParams.get('category');
const subCategorySlug = urlParams.get('subcategory') || undefined;

// Pagination + aktif seçim state'i
let activeCategorySlug: string | null = initialCategorySlug;
let activeSubCategory: string | undefined = subCategorySlug;
let currentPage = 1;
let hasNextPage = false;
const PAGE_SIZE = 20;

function toTailoredProduct(p: any): TailoredProduct {
  return {
    id: p.id || '',
    name: p.name,
    href: p.href || `/pages/product-detail.html?id=${p.id}`,
    price: p.price,
    originalPrice: p.originalPrice || undefined,
    discountPercent: p.discount ? parseInt(p.discount) : undefined,
    moqCount: parseInt(p.moq) || 1,
    moqUnit: 'pcs',
    imageSrc: p.imageSrc || '',
    soldCount: p.stats?.replace(/[^\d.+K]/gi, '') || undefined,
    verifiedBadge: p.verified,
  };
}

function appendProducts(items: TailoredProduct[], reset = false): void {
  const grid = document.getElementById('ts-product-grid');
  if (!grid) return;
  grid.classList.remove('hidden');
  const html = items.map((p, i) => renderTailoredProductCard(p, i)).join('');
  if (reset) {
    grid.innerHTML = html;
  } else {
    grid.insertAdjacentHTML('beforeend', html);
  }
}

function toggleEmptyState(hide: boolean): void {
  const emptyState = document.getElementById('ts-product-grid-empty');
  if (emptyState) emptyState.style.display = hide ? 'none' : '';
}

function renderLoadMoreButton(): void {
  const existing = document.getElementById('ts-load-more-wrapper');
  if (existing) existing.remove();
  if (!hasNextPage) return;
  const grid = document.getElementById('ts-product-grid');
  if (!grid || !grid.parentElement) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'ts-load-more-wrapper';
  wrapper.className = 'flex justify-center py-6';
  wrapper.innerHTML = `
    <button id="ts-load-more-btn"
      class="th-btn-outline px-6 py-2.5 text-sm font-semibold rounded-full"
      data-i18n="common.loadMore">${t('common.loadMore') || 'Daha fazla yükle'}</button>
  `;
  grid.parentElement.appendChild(wrapper);
  const btn = wrapper.querySelector<HTMLButtonElement>('#ts-load-more-btn');
  btn?.addEventListener('click', () => loadPage(currentPage + 1, false));
}

function renderSubCategoryPills(subs: Array<{ slug: string; name: string }>): void {
  if (!subs || subs.length === 0) return;
  const container = document.getElementById('ts-category-pills');
  if (!container) return;
  const allLabel = t('common.all') || 'Tümü';
  const pillsHtml = [
    `<button class="ts-sub-pill ${!activeSubCategory ? 'is-active' : ''}" data-sub="">${allLabel}</button>`,
    ...subs.map(s => `<button class="ts-sub-pill ${activeSubCategory === s.slug ? 'is-active' : ''}" data-sub="${s.slug}">${s.name}</button>`),
  ].join('');
  container.innerHTML = `
    <div class="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">${pillsHtml}</div>
  `;
  container.style.display = '';
  container.querySelectorAll<HTMLButtonElement>('.ts-sub-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.sub || undefined;
      if (sub === activeSubCategory) return;
      activeSubCategory = sub;
      container.querySelectorAll('.ts-sub-pill').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      loadPage(1, true);
    });
  });
}

async function loadPage(page: number, reset: boolean): Promise<void> {
  try {
    if (activeCategorySlug) {
      const result = await getTailoredGroupDetail(activeCategorySlug, {
        subcategory: activeSubCategory,
        page,
        pageSize: PAGE_SIZE,
      });
      currentPage = page;
      hasNextPage = result.hasNext;
      const items = result.products.map(toTailoredProduct);
      if (reset) {
        appendProducts(items, true);
        if (items.length > 0) toggleEmptyState(true);
        renderSubCategoryPills(result.subCategories);
      } else {
        appendProducts(items, false);
      }
      renderLoadMoreButton();
    } else {
      // Fallback: hiç kategori yoksa (cold-start edge) genel popüler ürünler
      const result = await searchListings({ page, page_size: PAGE_SIZE });
      currentPage = page;
      hasNextPage = result.hasNext;
      const items = result.products.map(toTailoredProduct);
      if (reset) appendProducts(items, true);
      else appendProducts(items, false);
      if (items.length > 0) toggleEmptyState(true);
      renderLoadMoreButton();
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
  loadPage(1, true);
}

async function loadHeroAndInit(): Promise<void> {
  try {
    const result = await getTailoredSelections(9);
    const cats: TailoredCategory[] = (result.groups || []).map(g => ({
      id: g.categoryId,
      slug: g.slug,
      title: g.name,
      titleKey: '',
      description: g.editorialText || '',
      descriptionKey: '',
      imageSrc: g.image || '',
      bgColor: colorForSlug(g.slug),
      badge: g.badge,
    }));

    if (cats.length === 0) {
      // Hero verisi yoksa — fallback genel grid
      loadPage(1, true);
      return;
    }

    // URL'de kategori yoksa listedeki ilk kategoriyi aktif yap
    if (!activeCategorySlug) {
      activeCategorySlug = cats[0].slug || null;
    }

    // Hero slide'larını swiper-wrapper'a inject et
    const wrapper = document.querySelector('.ts-hero-swiper .swiper-wrapper');
    if (wrapper) {
      wrapper.innerHTML = renderTailoredHeroCategories(cats);
    }

    // Swiper init — slide değişimi / tıklama → setActiveCategory
    initTailoredSelectionsHero({
      onCategoryChange: (slug) => setActiveCategory(slug, true),
    });

    // İlk grid yüklemesi
    loadPage(1, true);

    // Mobile/desktop categories ref — sticky pills vb. için de veri tutalım (şimdilik kullanılmıyor)
    categories.push(...cats);
  } catch (err) {
    console.warn('[TailoredSelections] hero load failed:', err);
    loadPage(1, true);
  }
}

// Tarayıcı back/forward tuşu — popstate dinleyicisi
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('category');
  if (slug && slug !== activeCategorySlug) {
    setActiveCategory(slug, false);
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
