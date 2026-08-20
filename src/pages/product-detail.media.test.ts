/**
 * Ürün detay sayfası — medya manifesti ÇİZİMİ BEKLETMEZ (F-2).
 *
 * Manifest bir iyileştirmedir: ürünün kendisi çizilmeden ona bağlanmak yanlış
 * yönde bir bağımlılıktır (uç yavaşsa sayfa istemcideki 4 sn zaman aşımı
 * boyunca boş kalırdı). Bu dosya iki şeyi kanıtlar:
 *
 *   1. Manifest promise'i HİÇ çözülmese bile sayfa çizilir.
 *   2. Manifest çizimden SONRA gelirse görseller yine yükseltilir — yani
 *      beklenmeyen promise sessizce yutulan ölü bir yola dönüşmez.
 *
 * Sayfa bir MPA giriş noktasıdır ve içe aktarıldığı anda kendini çizer; ağır
 * bağımlılıkları (header/footer/product barrel'ları, Alpine, Flowbite) burada
 * yerine konur. Test edilen şey sayfanın SIRALAMASI, o bileşenler değil.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const casus = vi.hoisted(() => ({
  prime: vi.fn<(listings: readonly string[]) => Promise<void>>(),
  upgrade: vi.fn<() => number>(),
  loadProduct: vi.fn<(id: string) => Promise<void>>(),
}));

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
vi.mock("../components/product", () => ({
  ProductBuyBox: () => "",
  ProductSellerPanel: () => "",
  initProductBuyBox: () => {},
  ProductImageGallery: () => '<div id="pd-gallery-stub"></div>',
  upgradeGalleryMedia: casus.upgrade,
  ProductVideoSection: () => "",
  initProductVideoSection: () => {},
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
}));
vi.mock("../alpine", () => ({ startAlpine: () => {} }));
vi.mock("../alpine/loginModal", () => ({}));
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

/** Sayfayı taze yükle — MPA girişi olduğu için içe aktarım = çizim. */
async function sayfayiYukle(): Promise<void> {
  window.history.replaceState({}, "", "/pages/product-detail.html?id=LST-0001");
  document.body.innerHTML = '<div id="app"></div>';
  vi.resetModules();
  await import("./product-detail");
}

describe("ürün detay — manifest çizimi BEKLETMEZ", () => {
  beforeEach(() => {
    casus.prime.mockReset();
    casus.upgrade.mockReset();
    casus.loadProduct.mockReset();
    casus.loadProduct.mockResolvedValue(undefined);
    casus.upgrade.mockReturnValue(0);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("manifest promise'i HİÇ çözülmese bile ürün çizilir", async () => {
    // Asla çözülmeyen (ve asla reddedilmeyen) manifest — yavaş uç benzetimi.
    casus.prime.mockReturnValue(new Promise<void>(() => {}));

    await sayfayiYukle();

    await vi.waitFor(() => {
      expect(document.getElementById("pd-detail-layout-host")).not.toBeNull();
    });
    // Galeri gerçekten basıldı; yükleme dönencesi ekranda kalmadı.
    expect(document.getElementById("pd-gallery-stub")).not.toBeNull();
    expect(casus.prime).toHaveBeenCalledWith(["LST-0001"]);
    expect(casus.loadProduct).toHaveBeenCalledWith("LST-0001");
    // Manifest daha gelmediği için yükseltme de çalışmadı.
    expect(casus.upgrade).not.toHaveBeenCalled();
  });

  it("manifest çizimden SONRA gelirse görseller yükseltilir", async () => {
    let cozumle: () => void = () => {};
    casus.prime.mockReturnValue(
      new Promise<void>((res) => {
        cozumle = () => res();
      })
    );

    await sayfayiYukle();
    await vi.waitFor(() => {
      expect(document.getElementById("pd-detail-layout-host")).not.toBeNull();
    });
    expect(casus.upgrade).not.toHaveBeenCalled();

    // Manifest geç geldi: sessizce yutulmamalı, görseller yükseltilmeli.
    cozumle();
    await vi.waitFor(() => {
      expect(casus.upgrade).toHaveBeenCalledTimes(1);
    });
  });

  it("manifest REDDEDİLİRSE sayfa çizilir ve işlenmemiş promise hatası kalmaz", async () => {
    const isleneymemisler: unknown[] = [];
    const dinleyici = (olay: PromiseRejectionEvent): void => {
      isleneymemisler.push(olay.reason);
    };
    window.addEventListener("unhandledrejection", dinleyici as EventListener);
    casus.prime.mockReturnValue(Promise.reject(new Error("manifest ucu öldü")));

    await sayfayiYukle();
    await vi.waitFor(() => {
      expect(document.getElementById("pd-detail-layout-host")).not.toBeNull();
    });
    await new Promise((res) => setTimeout(res, 0));

    window.removeEventListener("unhandledrejection", dinleyici as EventListener);
    expect(isleneymemisler).toEqual([]);
    // Reddedilen manifest de yükseltme adımını çalıştırır (önbellek soğuksa
    // `upgradeGalleryMedia` hiçbir şey yapmaz — pahalı değil).
    expect(casus.upgrade).toHaveBeenCalledTimes(1);
  });
});
