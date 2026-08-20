/**
 * Ürün detay sayfası — önizleme klip kancası CANLI MI (D1).
 *
 * K3 raporu (101) ölçtü: `ProductVideoSection` + `bindVideoPreview` YAZILDI ve
 * test edildi ama hiçbir sayfada MOUNT edilmiyordu — ölü kod, build çıktısında
 * `product-video-section` string'i yoktu. Bu test o boşluğu kapatır: gerçek
 * `product-detail.ts` mount akışında (gerçek `ProductVideoSection`, sahte
 * kabuk DEĞİL) videolu bir ilanda
 *
 *   1. `#product-video-section` DOM'a basılır (render kanıtı),
 *   2. `data-listing-preview` klip kaynağını taşır + `[data-listing-preview-clip]`
 *      overlay'i basılır (kanca hazır),
 *   3. `initProductVideoSection` çerçeveyi bağlar (`data-preview-bound="1"`),
 *      yani hover/odak önizlemesi CANLI (init kanıtı).
 *
 * VACUITY: `${ProductVideoSection()}` mount'u product-detail.ts'ten çıkarılırsa
 * `#product-video-section` hiç basılmaz → 1-3 kırmızıya döner. `initProduct-
 * VideoSection(...)` çağrısı çıkarılırsa `data-preview-bound` gelmez → 3 kırmızı.
 *
 * Sayfa bir MPA girişi olduğu için içe aktarım = çizim; ağır bağımlılıklar
 * (product-detail.media.test.ts ile aynı) sahtelenir, YALNIZ video bileşeni
 * gerçek bırakılır.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const casus = vi.hoisted(() => ({
  prime: vi.fn<(listings: readonly string[]) => Promise<void>>(),
  upgrade: vi.fn<() => number>(),
  loadProduct: vi.fn<(id: string) => Promise<void>>(),
}));

// Videolu ilan: mp4 promo + poster + hareketli önizleme klibi.
const URUN = {
  id: "LST-0001",
  slug: "",
  title: "Test ürünü",
  images: [{ src: "/files/urun.jpg", alt: "Ürün" }],
  category: ["Kök", "Alt"],
  categoryPath: [] as Array<{ name: string; slug: string }>,
  supplier: { id: "SUP-1" },
  sellerKybVerified: true,
  priceMin: 10,
  priceMax: 20,
  priceTiers: [{ price: 10, basePrice: 10 }],
  baseCurrency: "USD",
  moq: 5,
  unit: "Pcs",
  seo: null,
  videoUrl: "/files/tanitim.mp4",
  videoPoster: "/files/kapak.webp",
  videoPreviewSrc: "/files/onizleme.mp4",
};

vi.mock("flowbite", () => ({ initFlowbite: () => {} }));
vi.mock("../components/header", () => ({
  TopBar: () => "",
  SubHeader: () => "",
  MegaMenu: () => "",
  initMegaMenu: () => {},
  initHeaderCart: () => {},
}));
vi.mock("../components/header/TopBar", () => ({ initLanguageSelector: () => {} }));
vi.mock("../components/footer", () => ({ FooterLinks: () => "" }));
vi.mock("../components/shared/Breadcrumb", () => ({ Breadcrumb: () => "" }));
vi.mock("../components/floating", () => ({
  FloatingPanel: () => "",
  BottomNav: () => "",
  initBottomNav: () => {},
}));
vi.mock("../components/chat-popup", () => ({
  mountChatPopup: () => {},
  initChatTriggers: () => {},
}));
vi.mock("../components/chat-popup/chatTriggerAttrs", () => ({ chatTriggerAttrs: () => "" }));
vi.mock("../components/seller", () => ({ initVerificationHelpers: () => {} }));
vi.mock("../components/favorites/FavoritesDropdown", () => ({
  openFavoritesDropdown: () => {},
  updateFavoriteButtons: () => {},
}));

// Product barrel: YALNIZ video bileşeni GERÇEK; gerisi kabuk. Gerçek bileşeni
// tek dosyasından çekmek barrel'ın ağır bağımlılıklarını (Alpine, Flowbite …)
// getirmeden yalnız ProductVideoSection zincirini (i18n + alpine/product mock'lu)
// yükler.
vi.mock("../components/product", async () => {
  const video = await vi.importActual<typeof import("../components/product/ProductVideoSection")>(
    "../components/product/ProductVideoSection"
  );
  return {
    ProductBuyBox: () => "",
    ProductSellerPanel: () => "",
    initProductBuyBox: () => {},
    ProductImageGallery: () => '<div id="pd-gallery-stub"></div>',
    upgradeGalleryMedia: casus.upgrade,
    ProductVideoSection: video.ProductVideoSection,
    initProductVideoSection: video.initProductVideoSection,
    ProductOrderPanel: () => "",
    initProductOrderPanel: () => {},
    ProductTabs: () => "",
    initProductTabs: () => {},
    initReviews: () => {},
    RelatedProducts: () => "",
    initRelatedProducts: () => {},
    initAttributesTab: () => {},
    ReviewsModal: () => "",
    LoginModal: () => "",
    showLoginModal: () => {},
    ShippingModal: () => "",
    initShippingModal: () => {},
    MobileProductLayout: () => '<div id="pd-gallery-stub"></div>',
    initMobileLayout: () => {},
    CartDrawer: () => "",
    initCartDrawer: () => {},
    WriteReviewModal: () => "",
    EditReviewModal: () => "",
    ReportAbuseModal: () => "",
    QAModal: () => "",
  };
});
vi.mock("../alpine", () => ({ startAlpine: () => {} }));
vi.mock("../alpine/loginModal", () => ({}));
// ProductVideoSection getCurrentProduct'ı buradan okur.
vi.mock("../alpine/product", () => ({
  getCurrentProduct: () => URUN,
  loadProduct: casus.loadProduct,
}));
vi.mock("../lib/media/manifest", () => ({ primeMediaManifests: casus.prime }));
vi.mock("../services/browsingHistoryService", () => ({ saveToBrowsingHistory: () => {} }));
vi.mock("../services/recentHistoryService", () => ({ saveRecentProduct: () => {} }));
vi.mock("../services/socialProofService", () => ({ recordListingView: () => {} }));
vi.mock("../services/currencyService", () => ({
  initCurrency: async () => {},
  getSelectedCurrency: () => "USD",
  formatPriceRange: () => "",
}));
vi.mock("../utils/animatedPlaceholder", () => ({ initAnimatedPlaceholder: () => {} }));
vi.mock("../utils/auth", () => ({ isLoggedIn: () => false }));
vi.mock("../utils/listingUrl", () => ({ getListingUrl: () => "/urun/test" }));
vi.mock("../utils/sellerUrl", () => ({ getSellerUrl: () => "/satici/test" }));
vi.mock("../seo/setPageMeta", () => ({ applyServerSeo: () => {} }));
vi.mock("../i18n", () => ({ t: (anahtar: string) => anahtar }));

/** matchMedia'yı masaüstü (min-width:1024px) + hareket-azaltma KAPALI kur. */
function matchMediaKur(): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      // Masaüstü layout mount edilsin ki ProductVideoSection basılsın.
      matches: /min-width:\s*1024px|hover: hover|pointer: fine/.test(query),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }))
  );
}

/** Sayfayı taze yükle — MPA girişi olduğu için içe aktarım = çizim. */
async function sayfayiYukle(): Promise<void> {
  window.history.replaceState({}, "", "/pages/product-detail.html?id=LST-0001");
  document.body.innerHTML = '<div id="app"></div>';
  vi.resetModules();
  await import("./product-detail");
}

describe("ürün detay — önizleme klip kancası CANLI mount", () => {
  beforeEach(() => {
    matchMediaKur();
    casus.prime.mockReset();
    casus.upgrade.mockReset();
    casus.loadProduct.mockReset();
    casus.loadProduct.mockResolvedValue(undefined);
    casus.upgrade.mockReturnValue(0);
    casus.prime.mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("videolu ilanda ProductVideoSection basılır + önizleme klibi bağlı", async () => {
    await sayfayiYukle();

    // Masaüstü layout mount edildi mi?
    await vi.waitFor(() => {
      expect(document.getElementById("pd-detail-layout-host")).not.toBeNull();
    });

    // 1) Render kanıtı: bölüm DOM'da (K3'te YOKTU — tree-shake ölü koddu).
    const section = await vi.waitFor(() => {
      const el = document.getElementById("product-video-section");
      expect(el).not.toBeNull();
      return el!;
    });

    // Videolu ilan → gizlenmemiş.
    expect(section.classList.contains("hidden")).toBe(false);

    // 2) Klip kaynağı bağlı: taşıyıcı attribute + gerçek overlay <video>.
    expect(section.getAttribute("data-listing-preview")).toBe("/files/onizleme.mp4");
    const clip = section.querySelector<HTMLVideoElement>("[data-listing-preview-clip]");
    expect(clip).not.toBeNull();
    expect(clip!.getAttribute("src")).toBe("/files/onizleme.mp4");
    // Kademe sözleşmesi: poster ana <video>'da, klip sessiz+preload=none.
    expect(section.querySelector("video[poster='/files/kapak.webp']")).not.toBeNull();
    expect(clip!.getAttribute("preload")).toBe("none");

    // 3) Init kanıtı: initProductVideoSection çerçeveyi bağladı → hover/odak canlı.
    const frame = section.querySelector<HTMLElement>("[data-video-frame]");
    expect(frame).not.toBeNull();
    expect(frame!.dataset.previewBound).toBe("1");
  });
});
