/**
 * Product Detail Page — Entry Point
 * Assembles header, product detail sections, and footer.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'

// Header components (reuse from main page)
import { TopBar, initMobileDrawer, SubHeader, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'

// Footer components
import { FooterLinks } from '../components/footer'

// Browsing history
import { saveToBrowsingHistory } from '../services/browsingHistoryService'
import { saveRecentProduct } from '../services/recentHistoryService'

// Social proof — view tracking
import { recordListingView } from '../services/socialProofService'

// Floating components
import { FloatingPanel } from '../components/floating'
import { ChatPopup, initChatTriggers } from '../components/chat-popup'

// Alpine.js
import { startAlpine } from '../alpine'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Product detail components
import {
  ProductTitleBar,
  initProductTitleBar,
  ProductImageGallery,
  ProductInfo,
  initProductInfo,
  ProductTabs,
  initProductTabs,
  initReviews,
  RelatedProducts,
  initRelatedProducts,
  initAttributesTab,
  ReviewsModal,
  LoginModal, showLoginModal,
  ShippingModal,
  initShippingModal,
  MobileProductLayout,
  initMobileLayout,
  CartDrawer,
  initCartDrawer,
  WriteReviewModal,
  EditReviewModal,
  ReportAbuseModal,
  QAModal,
} from '../components/product'
// Product data
import { getCurrentProduct, loadProduct } from '../alpine/product'
import { initCurrency, formatCurrency, getSelectedCurrency, formatPriceRange } from '../services/currencyService'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'
import { t } from '../i18n'
import { isLoggedIn } from '../utils/auth'
import { getListingUrl } from '../utils/listingUrl'
import { applyServerSeo } from '../seo/setPageMeta'

// Favorites
import { openFavoritesDropdown, updateFavoriteButtons } from '../components/favorites/FavoritesDropdown'
import { initVerificationHelpers } from '../components/seller'

// Read listing ID from URL — pretty URL (/urun/<slug>) öncelikli
// Backend get_listing_detail hem listing.name hem listing_code hem slug ile
// arama yapar (Faz 4d).
function _resolveListingIdFromUrl(): string | null {
  // Pretty URL: /urun/<slug>
  const prettyMatch = window.location.pathname.match(/^\/(?:en\/)?urun\/([^/]+)/);
  if (prettyMatch) return prettyMatch[1];
  // Legacy URL: /pages/product-detail.html?id=<id>
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}
const listingId = _resolveListingIdFromUrl();

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');

// Show loading state immediately
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}
  <main>
    <div class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm text-text-muted">${t('prodUi.productLoading')}</span>
      </div>
    </div>
  </main>
  <footer>${FooterLinks()}</footer>
`;

// Initialize header immediately
initMegaMenu();
initFlowbite();
initHeaderCart();
initMobileDrawer();
initLanguageSelector();
initAnimatedPlaceholder('#topbar-compact-search-input');

// Load product from API, then render the full page
async function renderProductPage() {
  // Initialize currency settings first
  await initCurrency();

  // Load real data from API
  if (listingId) {
    await loadProduct(listingId);
  }

  const product = getCurrentProduct();

  // Faz 4d: Legacy URL ile (?id=LST-XX) gelen kullanıcıyı pretty URL'e taşı.
  // Backend page_resolver SEO meta'yı sadece /urun/<slug> rotasında inject
  // ediyor; eski URL'i ziyaret edenler yine bu sayfayı görsün ama URL
  // çubuğu canonical formata replace edilsin (back history kirletmeden).
  if (product.id && product.slug) {
    const slug = product.slug;
    const currentPath = window.location.pathname;
    if (currentPath !== `/urun/${slug}` && currentPath.includes('product-detail.html')) {
      const newUrl = `/urun/${slug}${window.location.hash || ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }

  // Save to browsing history
  if (product.id && product.images.length > 0) {
    saveToBrowsingHistory({
      id: product.id,
      image: product.images[0].src,
      title: product.title,
      href: getListingUrl({ id: product.id }),
      price: product.priceMin ?? 0,
      // currency = fiyatın O AN bulunduğu para birimi kodu (priceMin seçili
      // para birimine çevrili gelir). Display'de convertPrice(price, currency)
      // ile güncel kura çevrilir. Eski hardcoded '$' kaldırıldı.
      currency: getSelectedCurrency(),
      minOrder: product.moq ? `Min. order: ${product.moq} ${product.unit || 'Pcs'}` : '',
      priceRange:
        typeof product.priceMin === 'number'
          ? formatPriceRange(product.priceMin, product.priceMax ?? product.priceMin, getSelectedCurrency())
          : '',
    });
    // Search dropdown "son gezdiklerin" listesi için
    saveRecentProduct({
      id: product.id,
      name: product.title,
      image: product.images[0]?.src,
    });
  }

  // If no product loaded (no ID or API failed), show empty state
  if (!product.id) {
    appEl.innerHTML = `
      <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
        ${TopBar()}
        ${SubHeader()}
      </div>
      ${MegaMenu()}
      <main>
        <div class="flex items-center justify-center py-32">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <h2 class="text-xl font-semibold text-gray-600 mb-2">${t('prodUi.productNotFound')}</h2>
            <p class="text-gray-400 mb-4">${t('prodUi.productNotFoundDesc')}</p>
            <a href="/urunler" class="text-primary hover:underline font-medium">${t('prodUi.browseProducts')}</a>
          </div>
        </div>
      </main>
      <footer>${FooterLinks()}</footer>
    `;
    initMegaMenu();
    initFlowbite();
    initHeaderCart();
    initMobileDrawer();
    initLanguageSelector();
    startAlpine();
    return;
  }

  // Build breadcrumb
  const pdCrumbs = product.category.slice(1).map((label: string, i: number, arr: string[]) => ({
    label,
    ...(i < arr.length - 1 ? { href: `products.html?q=${encodeURIComponent(label)}` } : {}),
  }));

  // Faz 4d: admin'in girdiği SEO meta'larını (title, description, OG,
  // canonical, hreflang, robots) DOM head'ine uygula. Backend zaten
  // server-side render ediyor ama Vite client storefront'u yeniden
  // render ettiğinden bu adım canonical formatı garanti eder.
  if (product.seo) {
    applyServerSeo(product.seo);
  } else {
    // Backend seo payload döndürmediyse en azından title'ı düzgün kur.
    document.title = product.title || 'iSTOC';
  }

  // Render full product page
  appEl.innerHTML = `
    <!-- Sticky Header -->
    <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
      ${TopBar()}
      ${SubHeader()}
    </div>

    ${MegaMenu()}

    <!-- Main Content -->
    <main>
      <!-- DESKTOP LAYOUT -->
      <div id="pd-desktop-layout" class="hidden xl:block">
        <section style="background: var(--pd-bg, #ffffff);">
          <div class="mx-auto w-full max-w-[1600px] px-4 2xl:px-8">
            <div id="pd-hero-grid" class="flex flex-col gap-5 pt-3 xl:grid xl:grid-cols-[1fr_380px] xl:gap-10 xl:items-start 2xl:grid-cols-[1fr_460px] 2xl:gap-12">
              <div id="pd-hero-left" class="w-full min-w-0">
                ${Breadcrumb(pdCrumbs)}
                ${ProductTitleBar()}
                <div id="pd-hero-gallery" class="w-full text-center">
                  ${ProductImageGallery()}
                </div>
                ${ProductTabs()}
                ${RelatedProducts()}
              </div>
              <div id="pd-hero-info" class="w-full xl:flex xl:flex-col xl:[&.pd-sticky]:sticky xl:[&.pd-sticky]:top-[165px] xl:[&.pd-sticky]:max-h-[calc(100vh-180px)] xl:[&.pd-sticky]:flex xl:[&.pd-sticky]:flex-col">
                ${ProductInfo()}
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- MOBILE LAYOUT -->
      <div id="pd-mobile-layout" class="xl:hidden pb-20">
        ${MobileProductLayout()}
      </div>
    </main>

    <!-- Footer -->
    <footer>${FooterLinks()}</footer>

    <!-- Floating Panel -->
    ${FloatingPanel()}
    ${ChatPopup()}

    <!-- Modals / Drawers -->
    ${ReviewsModal()}
    ${QAModal()}
    ${LoginModal()}
    ${WriteReviewModal()}
    ${EditReviewModal()}
    ${ReportAbuseModal()}
    ${CartDrawer()}
    ${ShippingModal()}

    <!-- Mobile Sticky Bottom Bar -->
    <div id="pd-mobile-bar" x-data :class="$store.chatPopup.isOpen && 'hidden'" class="xl:hidden grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 px-3 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] fixed bottom-0 left-0 right-0 z-100 bg-surface border-t border-border-default shadow-[0_-2px_10px_rgba(0,0,0,0.08)] overflow-hidden box-border">
      <button type="button" id="pdm-bar-chat"
              data-chat-trigger
              data-product-id="${product.id}"
              data-product-title="${(product.title || '').replace(/"/g, '&quot;')}"
              data-product-price="${(product.priceTiers[0] ? formatCurrency(product.priceTiers[0].price, getSelectedCurrency()) : '').replace(/"/g, '&quot;')}"
              data-product-thumb="${product.images?.[0]?.src || ''}"
              data-product-min-order="${product.moq ? String(product.moq) : '1'}"
              data-seller-id="${product.supplier?.id || ''}"
              class="pdm-bar-chat-btn w-10 h-10 border border-border-medium rounded-md bg-surface flex items-center justify-center cursor-pointer text-text-body p-0 active:bg-[var(--color-surface-raised,#f5f5f5)]" aria-label="${t('prodUi.chat')}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>
      ${
        product.sellerKybVerified === false
          ? `
      <button type="button" id="pdm-bar-cart" disabled aria-disabled="true" class="pdm-bar-cart-btn th-btn-outline h-10 text-[12px] sm:text-sm font-semibold opacity-50 !cursor-not-allowed pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis min-w-0" title="${t('common.addToCartDisabledKyb')}">${t('product.addToCart')}</button>
      <button type="button" id="pdm-bar-order" disabled aria-disabled="true" class="pdm-bar-order-btn th-btn-dark h-10 text-[12px] sm:text-sm opacity-50 !cursor-not-allowed pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis min-w-0" title="${t('common.addToCartDisabledKyb')}">${t('product.startOrder')}</button>
          `
          : `
      <button type="button" id="pdm-bar-cart" data-add-to-cart="${product.id}" class="pdm-bar-cart-btn th-btn-outline h-10 text-[12px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis min-w-0 transition-[background] duration-150 active:bg-[var(--btn-outline-hover-bg,var(--color-surface-raised,#f5f5f5))]">${t('product.addToCart')}</button>
      <button type="button" id="pdm-bar-order" class="pdm-bar-order-btn th-btn-dark h-10 text-[12px] sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis min-w-0 transition-[background] duration-150 active:bg-[var(--btn-hover-bg,var(--btn-bg))]">${t('product.startOrder')}</button>
          `
      }
    </div>
  `;

  // Re-initialize all behaviors after render
  initMegaMenu();
  initFlowbite();
  initHeaderCart();
  initMobileDrawer();
  initLanguageSelector();
  initAnimatedPlaceholder('#topbar-compact-search-input');

  // Product-specific inits
  initVerificationHelpers(); // window.__verifiedByText / __downloadReportText (before startAlpine)
  initCartDrawer();
  initProductTitleBar();
  initProductInfo();
  initProductTabs();
  initAttributesTab();
  initReviews();
  initShippingModal();
  initRelatedProducts();
  initMobileLayout();

  // Favorites
  initFavorites(product);

  // ── Original images + title (for "back to default" fallback) ──
  const originalTitle = product.title || '';
  // Store original listing images on window for Alpine gallery to access
  window.__originalListingImages = product.images.map((img) => ({
    ...img,
  }));

  // Variant change → swap document.title + page H1
  // SKIP title change if the selected variant is the default (listing title stays)
  document.addEventListener('product-variant-change', ((e: CustomEvent) => {
    const title = e.detail?.title as string | undefined;
    const isDefault = e.detail?.isDefault as boolean | undefined;
    if (!isDefault && title && title.trim()) {
      const h1 = document.getElementById('pd-product-title');
      if (h1) h1.textContent = title;
      document.title = `${title} - iSTOC`;
    } else if (isDefault) {
      const h1 = document.getElementById('pd-product-title');
      if (h1) h1.textContent = originalTitle;
      document.title = `${originalTitle} - iSTOC`;
    }
  }) as EventListener);

  // If URL has ?variant=VAR-XXX, auto-click that variant after render
  const preselectVariant = new URLSearchParams(window.location.search).get('variant');
  if (preselectVariant) {
    requestAnimationFrame(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        `.variant-option[data-variant-id="${preselectVariant}"]`
      );
      if (btn) btn.click();
    });
  } else {
    // No URL variant — auto-select default variants (is_default=1)
    // Use a special attribute to prevent drawer from opening on auto-selection
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLButtonElement>(
        '.variant-option[data-is-default="1"]:not([disabled])'
      ).forEach(btn => {
        btn.setAttribute('data-auto-select', '1');
        btn.click();
        btn.removeAttribute('data-auto-select');
      });
    });
  }

  initChatTriggers();

  // Start Alpine LAST
  startAlpine();

  // View tracking — idle'da fire-and-forget POST
  if (product.id) {
    recordListingView(product.id);
  }
}

// Execute render
renderProductPage();

/* ── Favorites logic ── */
function initFavorites(product = getCurrentProduct()): void {
  const productId = product.id;
  const productData = {
    id: productId,
    image: product.images[0]?.src || '',
    title: product.title,
    priceRange: `$${product.priceTiers[0]?.price || 0}`,
    // Native fiyat + native currency — favori gösterimi güncel kura çevirir
    // (donmuş priceRange yerine). basePrice ham (çevrilmemiş) tier fiyatı.
    price: product.priceTiers[0]?.basePrice ?? 0,
    currency: product.baseCurrency,
    minOrder: `Min. order: ${product.moq} ${product.unit}`,
  };

  updateFavoriteButtons(productId);

  document.querySelectorAll<HTMLButtonElement>('[data-favorite-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isLoggedIn()) {
        showLoginModal();
        return;
      }

      openFavoritesDropdown(btn, productData);
    });
  });

  window.addEventListener('favorites-changed', () => {
    updateFavoriteButtons(productId);
  });
}
