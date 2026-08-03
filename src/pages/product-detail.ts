/**
 * Product Detail Page — Entry Point
 * Assembles header, product detail sections, and footer.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'

// Header components (reuse from main page)
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'

// Footer components
import { FooterLinks } from '../components/footer'

// Browsing history
import { saveToBrowsingHistory } from '../services/browsingHistoryService'
import { saveRecentProduct } from '../services/recentHistoryService'

// Social proof — view tracking
import { recordListingView } from '../services/socialProofService'

// Floating components
import { FloatingPanel, BottomNav, initBottomNav } from '../components/floating'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { chatTriggerAttrs } from '../components/chat-popup/chatTriggerAttrs'

// Alpine.js
import { startAlpine } from '../alpine'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Product detail components
import {
  ProductBuyBox,
  ProductSellerPanel,
  initProductBuyBox,
  ProductImageGallery,
  ProductOrderPanel,
  initProductOrderPanel,
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
// B-2: loginModal ayrı modül (product.ts'ten bölündü) — product-detail'de de kullanılıyor.
import '../alpine/loginModal'
import { initCurrency, getSelectedCurrency, formatPriceRange } from '../services/currencyService'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'
import { t } from '../i18n'
import { isLoggedIn } from '../utils/auth'
import { getListingUrl } from '../utils/listingUrl'
import { escapeHtml, sanitizeUrl } from '../utils/sanitize'
import { applyServerSeo } from '../seo/setPageMeta'

// Favorites
import { openFavoritesDropdown, updateFavoriteButtons } from '../components/favorites/FavoritesDropdown'
import { initVerificationHelpers } from '../components/seller'
import { getSellerUrl } from '../utils/sellerUrl'

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

function renderMobileProductBar(product: ReturnType<typeof getCurrentProduct>): string {
  const sellerUrl = escapeHtml(sanitizeUrl(getSellerUrl({ id: product.supplier?.id })));
  const cartButton =
    product.sellerKybVerified === false
      ? `<button type="button" id="pdm-bar-cart" disabled aria-disabled="true" class="pdm-bar-cart-btn th-btn-dark h-10 text-[12px] sm:text-sm opacity-50 !cursor-not-allowed pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis min-w-0" title="${t('common.addToCartDisabledKyb')}">${t('product.addToCart')}</button>`
      : `<button type="button" id="pdm-bar-cart" data-pdm-sheet="pdm-sheet-options" class="pdm-bar-cart-btn th-btn-dark h-10 text-[12px] sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis min-w-0">${t('product.addToCart')}</button>`;

  return `
    <div id="pd-mobile-bar" x-data :class="$store.chatPopup.isOpen && 'hidden'" class="xl:hidden grid grid-cols-[44px_44px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 px-3 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] fixed bottom-0 left-0 right-0 z-100 bg-surface border-t border-border-default shadow-[0_-2px_10px_rgba(0,0,0,0.08)] overflow-hidden box-border">
      <a href="${sellerUrl}" class="th-no-press appearance-none flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-text-body no-underline focus:outline-none active:opacity-70 transition-opacity duration-150">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M17.774 10.31a1.12 1.12 0 0 1-1.549 0 2.5 2.5 0 0 0-3.451 0 1.12 1.12 0 0 1-1.548 0 2.5 2.5 0 0 0-3.452 0 1.12 1.12 0 0 1-1.549 0 2.5 2.5 0 0 0-3.77 3.248A2.5 2.5 0 0 0 4 14.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5.5a2.5 2.5 0 0 0 1.549-4.442 2.5 2.5 0 0 0-3.775-3.248"/><path d="M4 10.6V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7.6"/></svg>
        ${t('product.storeLabel')}
      </a>
      <button type="button" id="pdm-bar-chat" ${chatTriggerAttrs(product)} class="th-no-press appearance-none flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-text-body bg-transparent border-0 p-0 cursor-pointer focus:outline-none active:opacity-70 transition-opacity duration-150" aria-label="${t('prodUi.chat')}">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>
        ${t('prodUi.chat')}
      </button>
      <button type="button" id="pdm-bar-ask" class="th-btn-outline h-10 text-[12px] sm:text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis min-w-0">${t('product.sendQuestion')}</button>
      ${cartButton}
    </div>
  `;
}

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
    initLanguageSelector();
    startAlpine();
    return;
  }

  // Build breadcrumb — slug varsa kategori listelemesine (?cat=), yoksa aramaya (?q=).
  // Mutlak URL zorunlu: sayfa /urun/<slug> altında yaşadığı için göreli link
  // /urun/products.html'e çözülür ve router onu ürün slug'ı sanır.
  const pdPath = product.categoryPath?.length
    ? product.categoryPath
    : product.category.map((name) => ({ name, slug: '' }));
  // Referans davranış: SON kırıntı dahil hepsi tıklanabilir kategori linki.
  const pdCrumbs = pdPath.slice(1).map(({ name, slug }) => ({
    label: name,
    href: slug
      ? `/pages/products.html?cat=${encodeURIComponent(slug)}`
      : `/pages/products.html?q=${encodeURIComponent(name)}`,
  }));

  // Faz 4d: admin'in girdiği SEO meta'larını (title, description, OG,
  // canonical, hreflang, robots) DOM head'ine uygula. Backend zaten
  // server-side render ediyor ama Vite client storefront'u yeniden
  // render ettiğinden bu adım canonical formatı garanti eder.
  if (product.seo) {
    applyServerSeo(product.seo);
  } else {
    // Backend seo payload döndürmediyse en azından title'ı düzgün kur.
    document.title = product.title ? `${product.title} | iStoc` : 'iStoc';
  }

  const renderDesktopLayout = () => `
    <div id="pd-desktop-layout">
      <section style="background: var(--pd-bg, #ffffff);">
        <div class="mx-auto w-full max-w-[1736px] px-4 min-[1280px]:px-10">
          ${Breadcrumb(pdCrumbs)}
          <!-- Dış ızgara: akan İÇERİK | sabit SATIN ALMA paneli.
               Panelin sayfa boyunca sağda kalabilmesi için sekmeler ve ilgili
               ürünler de içerik sütununun İÇİNDE durur — sticky bir öğe ancak
               kapsayıcısı kadar yaşar, bu yüzden kapsayıcı tüm sayfadır. -->
          <!-- 1024-1279 bandında (küçük laptop/tablet-yatay) sağ sipariş rayı
               KAYBOLMAZ — referans düzendeki gibi 300px'e daralır; 1280+'da 394px. -->
          <div id="pd-hero-grid" class="grid gap-4 pt-3 items-start grid-cols-[minmax(0,1fr)_300px] min-[1280px]:grid-cols-[minmax(0,1fr)_394px]">
            <div id="pd-content-col" class="w-full min-w-0">
              <div class="grid grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-4 items-start min-[1280px]:grid-cols-[minmax(0,465px)_minmax(0,1fr)] min-[1536px]:grid-cols-[minmax(0,590px)_minmax(0,1fr)]">
                <div id="pd-hero-left" class="w-full min-w-0">
                  <div id="pd-hero-gallery" class="w-full">${ProductImageGallery()}</div>
                  ${ProductSellerPanel()}
                </div>
                <div id="pd-hero-center" class="w-full min-w-0">
                  ${ProductBuyBox()}
                </div>
              </div>
              <div id="pd-below-hero" class="mt-6">
                ${ProductTabs()}
                ${RelatedProducts()}
              </div>
            </div>
            <div id="pd-hero-info" class="w-full min-w-0 flex flex-col [&.pd-sticky]:sticky [&.pd-sticky]:top-[165px] [&.pd-sticky]:max-h-[calc(100vh-180px)]">${ProductOrderPanel()}</div>
          </div>
        </div>
      </section>
    </div>
  `;

  const renderMobileLayout = () => `
    <div id="pd-mobile-layout" class="pb-20">
      ${MobileProductLayout()}
    </div>
    ${renderMobileProductBar(product)}
  `;

  // Bu projedeki `xl:` CSS kırılımı 1024px'tir; JS mount koşulu aynı
  // eşiği kullanmalı ki görünür düzen ile etkileşimli düzen ayrışmasın.
  const detailMediaQuery = window.matchMedia('(min-width: 1024px)');
  let detailLayoutLifecycle: AbortController | null = null;
  const mountDetailLayout = () => {
    const host = document.getElementById('pd-detail-layout-host');
    if (!host) return;
    const desktop = detailMediaQuery.matches;
    const nextMode = desktop ? 'desktop' : 'mobile';
    if (host.dataset.pdLayout === nextMode) return;

    detailLayoutLifecycle?.abort();
    const lifecycle = new AbortController();
    detailLayoutLifecycle = lifecycle;
    host.innerHTML = desktop ? renderDesktopLayout() : renderMobileLayout();
    host.dataset.pdLayout = nextMode;

    if (desktop) {
      initProductBuyBox({ signal: lifecycle.signal });
      initProductOrderPanel({ signal: lifecycle.signal });
      initProductTabs({ signal: lifecycle.signal });
      initAttributesTab();
    } else {
      initMobileLayout({ signal: lifecycle.signal });
    }

    // Reviews and related products belong to the currently mounted layout only.
    initReviews({ signal: lifecycle.signal });
    initRelatedProducts();
    initFavorites(product);

    // İlk mount'ta startAlpine() biraz aşağıda çağrılır. Viewport sonradan
    // değişirse yeni layout ağacı için Alpine'in dinamik tree init'ini çağır.
    const Alpine = (window as unknown as { Alpine?: { initTree?: (root: HTMLElement) => void } })
      .Alpine;
    Alpine?.initTree?.(host);
  };

  // Render full product page
  appEl.innerHTML = `
    <!-- Sticky Header -->
    <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
      ${TopBar()}
      ${SubHeader()}
    </div>

    ${MegaMenu()}

    <!-- Main Content: yalnız etkin viewport bileşimi burada mount edilir. -->
    <main><div id="pd-detail-layout-host" data-pd-layout="pending"></div></main>

    <!-- Footer -->
    <footer>${FooterLinks()}</footer>

    <!-- Floating Panel -->
    ${FloatingPanel()}

    <!-- Bottom Navigation (mobile/tablet) -->
    ${BottomNav()}

    <!-- Modals / Drawers -->
    ${ReviewsModal()}
    ${QAModal()}
    ${LoginModal()}
    ${WriteReviewModal()}
    ${EditReviewModal()}
    ${ReportAbuseModal()}
    ${CartDrawer()}
    ${ShippingModal()}

  `;

  // Re-initialize all behaviors after render
  initMegaMenu();
  initFlowbite();
  initHeaderCart();
  initLanguageSelector();
  initAnimatedPlaceholder('#topbar-compact-search-input');

  // Sayfa-geneli product init'leri; responsive layout kendi mount'unda init edilir.
  initVerificationHelpers(); // window.__verifiedByText / __downloadReportText (before startAlpine)
  initCartDrawer();
  initShippingModal();
  mountDetailLayout();
  detailMediaQuery.addEventListener('change', mountDetailLayout);

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
      document.title = `${title} | iStoc`;
    } else if (isDefault) {
      const h1 = document.getElementById('pd-product-title');
      if (h1) h1.textContent = originalTitle;
      document.title = `${originalTitle} | iStoc`;
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

  mountChatPopup();
  initChatTriggers();

  // Start Alpine LAST
  startAlpine();
  initBottomNav();

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
