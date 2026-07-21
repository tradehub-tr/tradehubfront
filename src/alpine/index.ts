import Alpine from "alpinejs";
import collapse from "@alpinejs/collapse";
import { initLinkRewriter } from "../utils/url";
import { initMediaRewriter } from "../utils/mediaUrl";
import { initTracking } from "../utils/trackingManager";
import { sanitizeHtml } from "../utils/sanitize";
import { initSelectMenus } from "../components/shared/SelectMenu";

// Alpine magic: $safeHtml(value) → DOMPurify-sanitized output. Use this in
// `x-html` bindings whenever the source is user-controlled (review body,
// seller description, ticket body etc.). Never bind `x-html` to a raw value.
Alpine.magic("safeHtml", () => (value: unknown) => sanitizeHtml(String(value ?? "")));

// Import all Alpine.data() module registrations (side-effect imports)
// orders — page-specific (orders sayfası: ordersListComponent/refundsComponent/
// reviewsSectionComponent; buyer-dashboard sayfası: ordersSection). B-2: core'dan
// çıkarıldı, pages/orders.ts + pages/buyer-dashboard.ts'te import ediliyor.
// orderItemsDrawer — page-specific (yalnız orders sayfası, OrdersPageLayout). B-2:
// core'dan çıkarıldı, pages/orders.ts'te import ediliyor. vite'ta 'alpine'dan hariç.
// remittance — page-specific (yalnız orders sayfası, OrdersPageLayout). B-2: core'dan
// çıkarıldı, pages/orders.ts'te import ediliyor. vite manualChunks'ta 'alpine'dan hariç.
import "./product";
import "./socialProofBadge";
import "./cart";
// checkout — page-specific (yalnız cart + checkout sayfaları). B-2: core'dan çıkarıldı,
// o sayfaların entry'lerinde import ediliyor (src/pages/cart.ts, checkout.ts) →
// diğer sayfalar 45 KB'lık checkout modülünü yüklemez. vite manualChunks'ta 'alpine'
// chunk'ından hariç tutuldu ki per-page chunk'a düşsün.
// auth — page-specific (registerPage→register, forgotPasswordPage/authLangSwitcher→
// forgot-password, resetPasswordPage/authLangSwitcher→reset-password, acceptInvitePage→
// accept-invite). login sayfası auth modülü kullanmaz (LoginPage'de x-data yok). B-2:
// core'dan çıkarıldı, ilgili 4 sayfada import ediliyor. vite'ta 'alpine'dan hariç.
// settings — page-specific (yalnız settings sayfası). B-2: core'dan çıkarıldı,
// pages/settings.ts'te import ediliyor. vite manualChunks'ta 'alpine'dan hariç.
// payment — page-specific (yalnız payment sayfası, PaymentLayout). B-2: core'dan
// çıkarıldı, pages/payment.ts'te import ediliyor. vite'ta 'alpine'dan hariç.
// dashboard — page-specific (yalnız buyer-dashboard sayfası: buyerUserInfo,
// dashboardBanners). B-2: core'dan çıkarıldı, pages/buyer-dashboard.ts'te import
// ediliyor. vite manualChunks'ta 'alpine'dan hariç.
// messages — page-specific (yalnız messages sayfası). B-2: core'dan çıkarıldı,
// pages/messages.ts'te import ediliyor. vite manualChunks'ta 'alpine'dan hariç.
import "./chatPopup";
import "./reservationModal";
import "./sidebar";
// products-filter — page-specific (filterSidebar + filterChips → products, searchHeader
// → manufacturers via products/SubHeader). categories CategoryFilterSidebar kullanır
// (bu modül DEĞİL). B-2: core'dan çıkarıldı, products + manufacturers'ta import ediliyor.
// vite manualChunks'ta 'alpine'dan hariç.
import "./shared";
import "./help";
import "./legal";
// seller — page-specific (sellPricing→sell-pricing, applicationPendingPage→
// application-pending, sellerStorefront→seller-storefront, sellerDashboard→
// seller-dashboard). sellPage x-data olarak kullanılmıyor (ölü). B-2: core'dan
// çıkarıldı, ilgili 4 sayfada import ediliyor. vite'ta 'alpine'dan hariç.
// sellerShop — page-specific (yalnız seller-shop sayfası). B-2: core'dan çıkarıldı,
// pages/seller-shop.ts zaten import ediyor. vite manualChunks'ta 'alpine'dan hariç.
// addresses — page-specific (yalnız addresses sayfası). B-2: core'dan çıkarıldı,
// pages/addresses.ts'te import ediliyor. vite manualChunks'ta 'alpine'dan hariç.
import "./notifications";
// kyb — page-specific (yalnız kyb sayfası). B-2: core'dan çıkarıldı, pages/kyb.ts'te
// import ediliyor → diğer sayfalar kyb modülünü yüklemez. vite manualChunks'ta 'alpine'
// chunk'ından hariç tutuldu ki per-page chunk'a düşsün.

// Augment Window interface for Alpine global access (debugging)
declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}

window.Alpine = Alpine;

/**
 * Start Alpine.js. MUST be called AFTER:
 * 1. All Alpine.data() registrations above
 * 2. The page HTML has been injected into #app via innerHTML
 *
 * Do NOT call at module import time — Alpine won't find directives in
 * elements that don't exist in the DOM yet.
 */
export function startAlpine(): void {
  initLinkRewriter();
  initMediaRewriter();
  // x-collapse direktifi (StoreNav, PricingPageLayout akordeonları) için zorunlu.
  // Kurulu değilken Alpine "you can't use [x-collapse]..." uyarısı veriyordu.
  Alpine.plugin(collapse);
  Alpine.start();
  // Load tracking scripts based on saved cookie consent preferences
  initTracking();
  // Progressive-enhances native <select> elements; idempotent + MutationObserver'lı
  // olduğu için her sayfa bootstrap'ında ayrı ayrı çağırmak yerine burada merkezi.
  initSelectMenus();
}
