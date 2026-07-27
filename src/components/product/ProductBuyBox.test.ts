/**
 * ProductBuyBox — KYB satın alma kapısının KISITLAYICI dalı.
 *
 * Repodaki diğer testler `kybVerified` alanını hep `true` bırakıyordu; yani
 * güvenlik karakteri taşıyan tek davranış (KYB doğrulanmamış satıcıda fiyat
 * göstermeme) hiç çalıştırılmıyordu. Buradaki testler doğru olan mevcut
 * davranışı KİLİTLER — regresyonu yakalamak için.
 *
 * Sınıf adı regex'i KULLANMA: Tailwind arbitrary-variant sınıfları
 * (`[&.active]:…`) literal alt dize barındırdığı için naif regex'ler sessizce
 * boşa düşer. Attribute / id / DOM sorgusu ile doğruluyoruz.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail } from "../../types/product";

const { getCurrentProduct } = vi.hoisted(() => ({ getCurrentProduct: vi.fn() }));
vi.mock("../../alpine/product", () => ({ getCurrentProduct }));

// localStorage/IndexedDB'ye ve ağ isteğine inen gerçek servisleri devre dışı
// bırak — bu testin konusu fiyat biçimlendirme değil, kapı davranışı.
vi.mock("../../services/currencyService", () => ({
  formatCurrency: (v: number) => `$${v}`,
  getSelectedCurrency: () => "USD",
}));
vi.mock("./CartDrawer", () => ({ openCartDrawer: vi.fn() }));
vi.mock("./ProductReviews", () => ({
  renderStars: () => "<span></span>",
  formatScore: (v: number) => String(v),
}));

import { ProductBuyBox } from "./ProductBuyBox";

function makeProduct(overrides: Record<string, unknown> = {}): ProductDetail {
  return {
    id: "LST-1",
    title: "Test Ürün",
    rating: 4.5,
    reviewCount: 12,
    orderCount: 30,
    images: [{ id: "1", src: "https://example.com/a.jpg", alt: "a" }],
    priceTiers: [
      { minQty: 1, maxQty: 9, price: 10, currency: "USD" },
      { minQty: 10, maxQty: null, price: 8, currency: "USD" },
    ],
    samplePrice: 12,
    moq: 1,
    unit: "adet",
    variants: [],
    sellerKybVerified: true,
    supplier: { id: "SEL-1", name: "Test Tedarikçi" },
    ...overrides,
  } as unknown as ProductDetail;
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("ProductBuyBox — KYB kapısı", () => {
  beforeEach(() => vi.clearAllMocks());

  it("satıcı KYB doğrulanmamışsa fiyat kademelerini basmaz", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: false }));
    const doc = parse(ProductBuyBox());

    expect(doc.querySelector("#pd-price-tiers")).toBeNull();
    expect(doc.querySelectorAll("[data-tier-index]").length).toBe(0);
    // Numune fiyatı da fiyat bloğunun içinde — o da düşmeli.
    expect(doc.querySelector("#pd-sample-price")).toBeNull();
    expect(doc.querySelector("[data-order-sample]")).toBeNull();
  });

  it("satıcı KYB doğrulanmamışsa uyarı banner'ını basar", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: false }));
    const doc = parse(ProductBuyBox());

    const banner = doc.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.classList.contains("pd-kyb-banner-large")).toBe(true);
    expect(banner?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("satıcı KYB doğrulanmışsa fiyat kademeleri basılır, banner basılmaz", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: true }));
    const doc = parse(ProductBuyBox());

    expect(doc.querySelector("#pd-price-tiers")).not.toBeNull();
    expect(doc.querySelectorAll("[data-tier-index]").length).toBe(2);
    expect(doc.querySelector(".pd-kyb-banner-large")).toBeNull();
    expect(doc.querySelector('[role="alert"]')).toBeNull();
  });
});
