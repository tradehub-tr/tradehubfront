// @vitest-environment happy-dom

/**
 * `formatStartingPrice` — 21 Eyl 2026'ya kadar HİÇ birim testi yoktu.
 *
 * Üç hero bileşeninde ürün fiyatı basıyor (TopDeals, RecommendationSlider,
 * HeroSidePanel) ama davranışı hiçbir test sabitlemiyordu. D1 kararıyla çıktı
 * biçimi değiştirildiği için önce test yazıldı: değişikliğin ne kırdığı ancak
 * kırılabilecek bir şey varsa görülür.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const aktifDil = vi.hoisted(() => ({ deger: "tr" as string }));
const aktifPara = vi.hoisted(() => ({ kod: "TRY", sembol: "₺" }));

vi.mock("../i18n", () => ({ getCurrentLang: () => aktifDil.deger }));
vi.mock("../services/currencyService", () => ({
  getSupportedCurrencies: () => [
    { code: "TRY", symbol: "₺" },
    { code: "USD", symbol: "$" },
  ],
  getSelectedCurrency: () => aktifPara.kod,
  setSelectedCurrency: vi.fn(),
}));

const { formatStartingPrice } = await import("./currency");

beforeEach(() => {
  aktifDil.deger = "tr";
  aktifPara.kod = "TRY";
  aktifPara.sembol = "₺";
});

describe("formatStartingPrice — çıktı biçimi arayüz diline bağlı (D1)", () => {
  it("TL aralığından en yüksek tutarı alır ve dilin biçiminde yazar", () => {
    // Backend TL'de `1.234,56` deseniyle gönderiyor; GİRDİ ayrıştırması
    // para birimine bağlı kalmalı (dile değil) — bu iddia onu kilitliyor.
    expect(formatStartingPrice("₺1.234,56 - ₺2.000,00")).toBe("₺2.000");
  });

  it("aynı TL girdisi İngilizce arayüzde İngilizce biçimde çıkar", () => {
    aktifDil.deger = "en";
    expect(formatStartingPrice("₺1.234,56 - ₺2.000,00")).toBe("₺2,000");
  });

  it("kesirli tutarda kesir korunur", () => {
    expect(formatStartingPrice("₺1.000,00 - ₺2.345,60")).toBe("₺2.345,60");
  });

  it("Rusça arayüzde binlik ayıracı boşluk olur", () => {
    aktifDil.deger = "ru";
    expect(formatStartingPrice("₺1.234,56 - ₺2.000,00").replace(/\s/g, " ")).toBe("₺2 000");
  });

  it("aralık yoksa dizeyi bozmadan sembol/kod çevirir", () => {
    expect(formatStartingPrice("$49.90")).toBe("₺49.90");
  });
});
