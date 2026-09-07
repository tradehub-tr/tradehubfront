/**
 * SkuRow — sepet sayfasındaki varyant satırı. Görsel yoksa görsel kutusu hiç
 * açılmaz (kırık resim / "SKU" yer tutucusu yok); varsa alt metni ürün adıdır.
 */
import { describe, expect, it, vi } from "vitest";
import type { CartSku } from "../../../types/cart";

vi.mock("../../../i18n", () => ({ t: (k: string) => k }));
vi.mock("../../../services/currencyService", () => ({
  convertPrice: (v: number) => v,
  getSelectedCurrency: () => "USD",
  formatCurrency: (v: number) => `$${v}`,
}));
vi.mock("../../../utils/moneyFlow", () => ({ moneyFlowHtml: () => "<span>$1</span>" }));
vi.mock("../atoms/PriceDisplay", () => ({ PriceDisplay: () => "<span>$1</span>" }));

import { SkuRow } from "./SkuRow";

function makeSku(overrides: Partial<CartSku> = {}): CartSku {
  return {
    id: "LST-1-Renk-Siyah",
    skuImage: "/files/siyah.jpg",
    variantText: "Renk: Siyah",
    unitPrice: 10,
    currency: "$",
    unit: "adet",
    quantity: 2,
    minQty: 1,
    maxQty: 99,
    selected: true,
    baseUnitPrice: 10,
    basePriceAddon: 0,
    baseCurrency: "USD",
    ...overrides,
  } as CartSku;
}

function parse(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("SkuRow — varyant görseli", () => {
  it("görsel varsa basar; alt metni SKU kodu değil ürün adıdır", () => {
    const root = parse(SkuRow({ sku: makeSku(), productTitle: "Slim Tabaklık" }));
    const img = root.querySelector("img[src='/files/siyah.jpg']");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("Slim Tabaklık");
  });

  it("görsel yoksa görsel kutusunu hiç basmaz, varyant metni kalır", () => {
    const root = parse(SkuRow({ sku: makeSku({ skuImage: "" }), productTitle: "Slim Tabaklık" }));
    expect(root.querySelector("[data-sku-image]")).toBeNull();
    // Satırdaki tek img çöp kutusu ikonu olmalı (ürün görseli yok).
    expect(root.querySelectorAll("img:not([alt='Sil'])").length).toBe(0);
    expect(root.textContent).toContain("Renk: Siyah");
  });
});
