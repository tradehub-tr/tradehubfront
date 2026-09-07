/**
 * Ödeme adımı sipariş özeti — sepet sayfasındaki özetle aynı ürün şeridi:
 * tüm ürünler, her biri kendi adet rozetiyle; ilk görsele iliştirilmiş toplam
 * sayısı YOK; "Tümünü Gör" ürün listesine kaydırır.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (k: string) => k }));
vi.mock("../../services/currencyService", () => ({
  formatCurrency: (v: number) => `₺${v}`,
  getSelectedCurrency: () => "TRY",
}));

import { OrderSummary } from "./OrderSummary";
import type { OrderSummary as OrderSummaryData } from "../../types/checkout";

const data: OrderSummaryData = {
  itemCount: 5,
  thumbnails: [
    { image: "/1.jpg", quantity: 20 },
    { image: "/2.jpg", quantity: 1 },
    { image: "/3.jpg", quantity: 20 },
    { image: "/4.jpg", quantity: 40 },
    { image: "/5.jpg", quantity: 242 },
  ],
  itemSubtotal: 100,
  shipping: 0,
  subtotal: 100,
  processingFee: 0,
  total: 100,
  currency: "TRY",
} as OrderSummaryData;

describe("OrderSummary — ürün şeridi", () => {
  it("5 ürünün 5'ini de adet rozetiyle basar, ilk görselde toplam rozeti yoktur", () => {
    const root = document.createElement("div");
    root.innerHTML = OrderSummary({ data });
    const cards = root.querySelectorAll(".checkout-item-card");
    expect(cards.length).toBe(5);
    expect([...cards].map((c) => c.querySelector("[data-qty-badge]")?.textContent?.trim())).toEqual(
      ["20", "1", "20", "40", "242"]
    );
    expect(root.querySelector(".checkout-items-wrapper")).not.toBeNull();
    // Eski davranış: ilk görselin köşesinde "5" — artık yok
    expect(root.querySelector(".checkout-item-card .-top-1\\.5")).toBeNull();
  });

  it("'Tümünü Gör' düğmesi ürün listesi bölümüne kaydırmak için hedef taşır", () => {
    const root = document.createElement("div");
    root.innerHTML = OrderSummary({ data });
    const btn = root.querySelector<HTMLButtonElement>("[data-scroll-to]");
    expect(btn?.getAttribute("data-scroll-to")).toBe("#checkout-items");
    expect(btn?.textContent).toContain("common.viewAll");
  });
});
