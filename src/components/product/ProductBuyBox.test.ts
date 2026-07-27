/**
 * ProductBuyBox — orta sütun ürünün KİMLİĞİNİ basar: başlık, meta satırı,
 * satıcı sertifikaları, stok uyarısı, Teknik Özellikler.
 *
 * Satın almaya ait hiçbir şey (fiyat, numune, varyant, CTA) burada
 * OLMAMALI — hepsi sağ paneldeki ProductOrderPanel'de toplanır. Aşağıdaki
 * testler hem basılanı hem basılmaması gerekeni kilitler.
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

describe("ProductBuyBox — bilgi sütunu sınırı", () => {
  beforeEach(() => vi.clearAllMocks());

  it("satın alma öğelerinin hiçbirini basmaz", () => {
    // KYB durumundan bağımsız: fiyat/numune/varyant/CTA sağ panele ait.
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: true }));
    const doc = parse(ProductBuyBox());

    expect(doc.querySelector("#pd-price-tiers")).toBeNull();
    expect(doc.querySelectorAll("[data-tier-index]").length).toBe(0);
    expect(doc.querySelector("#pd-sample-price")).toBeNull();
    expect(doc.querySelector("[data-order-sample]")).toBeNull();
    expect(doc.querySelector("#pd-variations-section")).toBeNull();
    expect(doc.querySelector("#pd-card-tabs")).toBeNull();
    expect(doc.querySelector("#pd-add-to-cart")).toBeNull();
  });

  it("başlığı ve yorum/sipariş meta satırını basar", () => {
    getCurrentProduct.mockReturnValue(makeProduct());
    const doc = parse(ProductBuyBox());

    expect(doc.querySelector("#pd-product-title")?.textContent).toContain("Test Ürün");
    // Yorum sayısı 12 → link metni yorum sayısını taşır, "henüz yorum yok" değil.
    expect(doc.querySelector("#pd-review-count-link")).not.toBeNull();
    expect(doc.querySelector("#pd-rating-line")?.textContent).toContain("12");
  });

  it("satıcı sertifikalarını rozet olarak basar, yoksa bölümü hiç açmaz", () => {
    getCurrentProduct.mockReturnValue(
      makeProduct({ supplier: { id: "SEL-1", name: "T", certifications: ["ISO 9001"] } })
    );
    let doc = parse(ProductBuyBox());
    expect(doc.querySelector("#pd-certifications")?.textContent).toContain("ISO 9001");

    getCurrentProduct.mockReturnValue(
      makeProduct({ supplier: { id: "SEL-1", name: "T", certifications: [] } })
    );
    doc = parse(ProductBuyBox());
    expect(doc.querySelector("#pd-certifications")).toBeNull();
  });

  it("stok rozeti yalnız outOfStock durumunda görünür durumda basılır", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ outOfStock: false }));
    let badge = parse(ProductBuyBox()).querySelector("#pd-ready-badge");
    expect(badge).not.toBeNull();
    expect(badge?.classList.contains("hidden")).toBe(true);

    getCurrentProduct.mockReturnValue(makeProduct({ outOfStock: true }));
    badge = parse(ProductBuyBox()).querySelector("#pd-ready-badge");
    expect(badge?.classList.contains("hidden")).toBe(false);
    expect(badge?.classList.contains("inline-flex")).toBe(true);
  });

  it("Teknik Özellikler ızgarasını ilk 6 özellikle basar", () => {
    const specs = Array.from({ length: 8 }, (_, i) => ({ key: `K${i}`, value: `V${i}` }));
    getCurrentProduct.mockReturnValue(makeProduct({ specs }));
    const grid = parse(ProductBuyBox()).querySelector("#pd-key-attributes");

    expect(grid).not.toBeNull();
    expect(grid?.children.length).toBe(6);
    expect(grid?.textContent).toContain("K0");
    expect(grid?.textContent).not.toContain("K6");
  });
});
