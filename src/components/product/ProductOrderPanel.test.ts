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
vi.mock("./CartDrawer", () => ({ openShippingModal: vi.fn() }));

import { ProductOrderPanel } from "./ProductOrderPanel";

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
});
