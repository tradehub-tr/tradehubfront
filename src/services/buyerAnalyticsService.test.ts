/**
 * Alıcı panosu KPI kartı başlıkları arayüz dilini izlemeli.
 *
 * Kusur (11 Ağu – 30 Eyl 2026): başlıklar `data/buyerAnalytics.ts`'te sabit Türkçeydi;
 * İngilizce arayüzde "Toplam Harcama" + "vs. last month" yan yana çiziliyordu.
 * `t` mock'u anahtarı aynen döndürür: sabit metin varsa başlık anahtar DEĞİL metin olur.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const callMethod = vi.fn();

vi.mock("../utils/api", () => ({
  callMethod: (...args: unknown[]) => callMethod(...args),
}));
vi.mock("../i18n", () => ({ t: (k: string) => k, getCurrentLang: () => "en" }));

const BEKLENEN = [
  "buyerUi.kpiTotalSpend",
  "buyerUi.kpiActiveOrders",
  "buyerUi.kpiPendingQuotes",
  "buyerUi.kpiNegotiationSavings",
];

beforeEach(() => {
  vi.resetModules();
  callMethod.mockReset();
});

describe("KPI başlıkları", () => {
  it("backend verisiyle çizilen kartlar başlığı çeviriden alır", async () => {
    callMethod.mockResolvedValue({
      kpis: {
        total_spend: { amount: 0, currency: "TRY", change_pct: 0, trend: "neutral" },
        active_orders: { count: 0, shipping: 0, preparing: 0 },
        pending_quotes: { quote_count: 0, rfq_count: 0 },
        negotiation_savings: { amount: 0, avg_discount_pct: 0, currency: "TRY" },
      },
      spending_trend: { labels: [], spend: [], orders: [] },
      category_breakdown: [],
    });
    const { fetchBuyerAnalytics } = await import("./buyerAnalyticsService");
    const { kpis } = await fetchBuyerAnalytics();
    expect(kpis.map((k) => k.label)).toEqual(BEKLENEN);
  });

  it("hata durumundaki sıfır kartlar da başlığı çeviriden alır", async () => {
    const { getZeroAnalytics } = await import("./buyerAnalyticsService");
    expect(getZeroAnalytics().kpis.map((k) => k.label)).toEqual(BEKLENEN);
  });
});
