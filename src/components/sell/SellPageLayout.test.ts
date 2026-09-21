/**
 * Satıcı ol sayfası — fiyat tablosu aylık/yıllık davranışı.
 * Karar (2026-09-07): varsayılan YILLIK; aylık 12 ay, yıllık 10 ay üzerinden.
 * Yıllıkta 12 aylık tutar üstü çizili + "N ay bedava"; aylıkta yıllık toplam.
 */
import { describe, expect, it, vi } from "vitest";
import type { PricingPlan, PricingPlansResponse } from "../../services/pricingService";

vi.mock("../../i18n", () => ({
  // `numberLocale` i18n'den `getCurrentLang` okuyor; kısmi mock onu da
  // vermeli, yoksa biçimlendirme çağrısı "export tanımlı değil" ile patlar.
  t: (k: string, o?: Record<string, unknown>) => (o ? `${k}:${Object.values(o).join(",")}` : k),
  getCurrentLang: () => "tr",
}));
vi.mock("../../assets/images/liman.avif", () => ({ default: "/liman.avif" }));

import { SellPageLayout } from "./SellPageLayout";

function plan(overrides: Partial<PricingPlan>): PricingPlan {
  return {
    plan_code: "basic",
    plan_name: "Basic",
    description: null,
    badge_label: null,
    badge_color: "default",
    theme: "default",
    short_tagline: null,
    monthly_price: 0,
    yearly_price: 0,
    currency: "EUR",
    commission_rate: 0,
    max_active_listings: 250,
    cta_label: "Hemen başla",
    cta_action: "signup",
    price_override_label: null,
    highlighted: false,
    trial_days: 0,
    features: [],
    ...overrides,
  };
}

const data: PricingPlansResponse = {
  plans: [
    plan({ plan_code: "basic", plan_name: "Basic", monthly_price: 399, yearly_price: 3990 }),
    plan({
      plan_code: "platinium",
      plan_name: "Platinium",
      monthly_price: 599,
      yearly_price: 5990,
      highlighted: true,
    }),
    plan({ plan_code: "enterprise", plan_name: "Enterprise", price_override_label: "Teklif Alın" }),
  ],
  meta: { currency: "EUR", updated_at: "2026-09-07" },
};

function render(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = SellPageLayout(data);
  return root;
}

describe("Fiyat tablosu — aylık / yıllık", () => {
  it("varsayılan yıllık açılır; büyük rakam ay başına fiyattır (yıllık/12, aylıkta aylık)", () => {
    const root = render();
    const section = root.querySelector("#paketler");
    expect(section?.getAttribute("x-data")).toContain("yearly: true");
    const amountEls = [...root.querySelectorAll("[data-price-amount]")];
    // İlk boyama = yıllık: 3.990/12 = 332,50 · 5.990/12 = 499,17
    expect(amountEls.map((el) => el.textContent?.trim())).toEqual(["332,50", "499,17"]);
    // Aylık dalı: 399 · 599
    expect(amountEls[0].getAttribute("x-text")).toBe("yearly ? '332,50' : '399'");
    expect(amountEls[1].getAttribute("x-text")).toBe("yearly ? '499,17' : '599'");
    const periods = [...root.querySelectorAll("[data-price-period]")].map((el) =>
      el.textContent?.trim()
    );
    expect(periods).toEqual(["sellPage.month", "sellPage.month"]);
  });

  it("yıllıkta 10 aylık peşin toplam, aylıkta 12 aylık yıllık toplam alt satırda yazar", () => {
    const root = render();
    const metas = [...root.querySelectorAll("[data-price-meta]")];
    // İlk boyama = yıllık: 3.990 / 5.990 peşin
    expect(metas.map((el) => el.textContent?.trim())).toEqual([
      "sellPage.yearlyBilled:€3.990 · sellPage.yearlyUpfrontVatExcl",
      "sellPage.yearlyBilled:€5.990 · sellPage.yearlyUpfrontVatExcl",
    ]);
    // Aylık dalı: 12 × 399 = 4.788, 12 × 599 = 7.188
    expect(metas[0].getAttribute("x-text")).toContain("sellPage.monthlyYearTotal:€4.788");
    expect(metas[1].getAttribute("x-text")).toContain("sellPage.monthlyYearTotal:€7.188");
  });

  it("kart içinde üstü çizili tutar / 'ay bedava' rozeti YOK (istenmedi)", () => {
    const root = render();
    expect(root.querySelector("#paketler [data-pricing-card] s")).toBeNull();
    const cardText = [...root.querySelectorAll("#paketler [data-pricing-card]")]
      .map((c) => c.textContent)
      .join(" ");
    expect(cardText).not.toContain("sellPage.monthsFree");
  });

  it("fiyatı olmayan plan meta satırı yerine 'hacme göre' metnini basar", () => {
    const root = render();
    const cards = root.querySelectorAll("#paketler [data-pricing-card]");
    expect(cards.length).toBe(3);
    expect(cards[2].querySelector("[data-price-meta]")).toBeNull();
    expect(cards[2].textContent).toContain("Teklif Alın");
  });
});
