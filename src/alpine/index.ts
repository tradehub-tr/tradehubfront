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
import "./orders";
import "./orderItemsDrawer";
import "./remittance";
import "./product";
import "./socialProofBadge";
import "./cart";
// checkout — page-specific (yalnız cart + checkout sayfaları). B-2: core'dan çıkarıldı,
// o sayfaların entry'lerinde import ediliyor (src/pages/cart.ts, checkout.ts) →
// diğer sayfalar 45 KB'lık checkout modülünü yüklemez. vite manualChunks'ta 'alpine'
// chunk'ından hariç tutuldu ki per-page chunk'a düşsün.
import "./auth";
import "./settings";
import "./payment";
import "./dashboard";
import "./messages";
import "./chatPopup";
import "./reservationModal";
import "./sidebar";
import "./products-filter";
import "./shared";
import "./help";
import "./legal";
import "./seller";
import "./sellerShop";
import "./addresses";
import "./notifications";
import "./kyb";

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
