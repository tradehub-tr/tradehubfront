/**
 * ProductOrderPanel — KYB satın alma kapısının KISITLAYICI dalı.
 *
 * Kritik nokta: KYB doğrulanmamış satıcıda "Sepete Ekle" butonu hem `disabled`
 * olmalı hem de `data-add-to-cart` attribute'unu TAŞIMAMALI — sepet servisi
 * dinleyicisini o attribute üzerinden bağladığı için asıl kapıyı o yokluk
 * kuruyor. Backend de bağımsız olarak zorluyor (api/cart.py), bu testler
 * frontend regresyonunu yakalamak için.
 *
 * Sınıf adı regex'i KULLANMA (Tailwind `[&.x]:` literalleri yüzünden boşa
 * düşer) — attribute / id sorgusu ile doğruluyoruz.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail } from "../../types/product";

const { getCurrentProduct } = vi.hoisted(() => ({ getCurrentProduct: vi.fn() }));
vi.mock("../../alpine/product", () => ({ getCurrentProduct }));

vi.mock("../../services/currencyService", () => ({
  formatCurrency: (v: number) => `$${v}`,
  getSelectedCurrency: () => "USD",
}));
vi.mock("./CartDrawer", () => ({ openShippingModal: vi.fn(), openCartDrawer: vi.fn() }));

import { ProductOrderPanel } from "./ProductOrderPanel";

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function makeProduct(overrides: Record<string, unknown> = {}): ProductDetail {
  return {
    id: "LST-1",
    title: "Test Ürün",
    images: [{ id: "1", src: "https://example.com/a.jpg", alt: "a" }],
    priceTiers: [{ minQty: 1, maxQty: null, price: 10, currency: "USD" }],
    moq: 1,
    unit: "adet",
    shipping: [{ method: "DHL Express", cost: "$12", estimatedDays: "3-5" }],
    sellerKybVerified: true,
    supplier: { id: "SEL-1", name: "Test Tedarikçi" },
    ...overrides,
  } as unknown as ProductDetail;
}

function addToCartBtn(html: string): Element | null {
  return new DOMParser().parseFromString(html, "text/html").querySelector("#pd-add-to-cart");
}

describe("ProductOrderPanel — KYB kapısı", () => {
  beforeEach(() => vi.clearAllMocks());

  it("satıcı KYB doğrulanmamışsa Sepete Ekle butonu disabled basılır", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: false }));
    const btn = addToCartBtn(ProductOrderPanel());

    expect(btn).not.toBeNull();
    expect(btn?.hasAttribute("disabled")).toBe(true);
    expect(btn?.getAttribute("aria-disabled")).toBe("true");
  });

  it("satıcı KYB doğrulanmamışsa data-add-to-cart attribute'u HİÇ basılmaz", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: false }));
    const html = ProductOrderPanel();
    const btn = addToCartBtn(html);

    // Sepet servisi bağlanmasını bu attribute üzerinden kuruyor — yokluğu kapı.
    expect(btn?.hasAttribute("data-add-to-cart")).toBe(false);
    expect(html).not.toContain("data-add-to-cart");
  });

  it("satıcı KYB doğrulanmamışsa KYB ipucu metni gösterilir", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: false }));
    const doc = new DOMParser().parseFromString(ProductOrderPanel(), "text/html");

    const hint = doc.querySelector(".pd-kyb-hint");
    expect(hint).not.toBeNull();
    expect(hint?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("satıcı KYB doğrulanmışsa buton aktif ve data-add-to-cart listing id'si taşır", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: true }));
    const doc = new DOMParser().parseFromString(ProductOrderPanel(), "text/html");
    const btn = doc.querySelector("#pd-add-to-cart");

    expect(btn?.hasAttribute("disabled")).toBe(false);
    expect(btn?.getAttribute("data-add-to-cart")).toBe("LST-1");
    expect(doc.querySelector(".pd-kyb-hint")).toBeNull();
  });

  it("satıcı KYB doğrulanmamışsa fiyat kademelerini ve numuneyi basmaz", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: false, samplePrice: 12 }));
    const doc = parse(ProductOrderPanel());

    expect(doc.querySelector("#pd-price-tiers")).toBeNull();
    expect(doc.querySelectorAll("[data-tier-index]").length).toBe(0);
    expect(doc.querySelector("#pd-sample-price")).toBeNull();
    expect(doc.querySelector("[data-order-sample]")).toBeNull();

    // KYB kapısı artık BANNER değil, CTA'nın kendisi: buton disabled ve
    // altında tek satırlık ipucu duruyor (`ProductOrderPanel.ts:73,102`).
    // Büyük banner `aa7ddfa` yeniden tasarımında orta sütuna taşındı.
    const cta = doc.querySelector("#pd-add-to-cart");
    expect(cta?.hasAttribute("disabled")).toBe(true);
    expect(doc.querySelector(".pd-kyb-hint")).not.toBeNull();
  });

  it("satıcı KYB doğrulanmışsa CTA etkin ve ipucu basılmaz", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: true }));
    const doc = parse(ProductOrderPanel());

    expect(doc.querySelector("#pd-add-to-cart")?.hasAttribute("disabled")).toBe(false);
    expect(doc.querySelector(".pd-kyb-hint")).toBeNull();
  });
});

/**
 * ── SORUMLULUK DEVRİ (2026-08-26'da fark edildi) ──
 *
 * Bu blok eskiden "satın alma bloğu sağ panelde toplanır" diyordu ve fiyat
 * kademelerini, varyant eksenlerini, indirim rozetini burada arıyordu
 * (`bf982cf` tasarımı).
 *
 * `aa7ddfa` (*"Alibaba referansına göre yeniden düzenlendi"*) o üçünü
 * `ProductBuyBox`'a taşıdı; testler güncellenmedi ve o günden beri kırmızıydı
 * (CI'da test kapısı olmadığı için kimse görmedi). Taşınan davranışın testi
 * artık `ProductBuyBox.test.ts`'te.
 *
 * Sağ panelde KALAN sorumluluk: kargo kartı ve satın alma eylemleri.
 */
describe("ProductOrderPanel — sağ panelde kalan sorumluluk", () => {
  beforeEach(() => vi.clearAllMocks());

  it("kargo kartını ve satın alma eylemlerini basar", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ sellerKybVerified: true }));
    const doc = parse(ProductOrderPanel());

    expect(doc.querySelector("#pd-shipping-card")).not.toBeNull();
    expect(doc.querySelector("#pd-add-to-cart")).not.toBeNull();
    expect(doc.querySelector("#pd-chat-with-seller")).not.toBeNull();
  });

  it("fiyat kademelerini ve varyantları artık BASMAZ — onlar orta sütunda", () => {
    getCurrentProduct.mockReturnValue(
      makeProduct({
        sellerKybVerified: true,
        priceTiers: [{ minQty: 1, maxQty: null, price: 10, currency: "USD" }],
        variants: [
          {
            type: "color",
            label: "Renk",
            options: [
              { id: "V1", label: "Kırmızı", value: "#f00", available: true, isDefault: true },
            ],
          },
        ],
      })
    );
    const doc = parse(ProductOrderPanel());

    expect(doc.querySelector("#pd-price-tiers")).toBeNull();
    expect(doc.querySelector("#pd-variations-section")).toBeNull();
    expect(doc.querySelector("#pd-card-tabs")).toBeNull();
  });
});
