/**
 * Alıcı panosu kullanıcı kartı sayaçları (Mesajlar · Teklifler · Kuponlar).
 *
 * Kusur (13 Nis'ten 30 Eyl'e): Mesajlar sipariş sayısını (get_order_counts) gösteriyordu,
 * Teklifler hiç dolmuyordu. Doğrusu: Mesajlar = okunmamış mesaj toplamı,
 * Teklifler = açık taleplere gelmiş, karar bekleyen teklif sayısı.
 * Ayrıca get_buyer_analytics aynı sayfada analitik bölümüyle paylaşılıyor — tek istek.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const callMethod = vi.fn();

vi.mock("alpinejs", () => {
  const registry = new Map<string, () => Record<string, unknown>>();
  return {
    default: {
      data: (name: string, fn: () => Record<string, unknown>) => {
        registry.set(name, fn);
      },
      store: vi.fn(),
      start: vi.fn(),
      __dataRegistry: registry,
    },
  };
});
vi.mock("swiper", () => ({ default: class {} }));
vi.mock("swiper/modules", () => ({ Navigation: {}, Pagination: {}, Autoplay: {} }));
vi.mock("swiper/swiper-bundle.css", () => ({}));
vi.mock("../utils/auth", () => ({
  getSessionUser: vi.fn(async () => null),
  resendVerificationEmail: vi.fn(),
}));
vi.mock("../utils/api", () => ({
  callMethod: (...args: unknown[]) => callMethod(...args),
  clearCsrfCache: vi.fn(),
  fetchCsrfToken: vi.fn(async () => "tok"),
}));
vi.mock("../i18n", () => ({ t: (k: string) => k, getCurrentLang: () => "tr" }));

const ANALITIK = "tradehub_core.api.v1.dashboard.get_buyer_analytics";

function uclar(ezme: Record<string, () => unknown> = {}) {
  const varsayilan: Record<string, () => unknown> = {
    // Eski kaynak: burada 5 sipariş var — Mesajlar'a SIZMAMALI.
    "tradehub_core.api.order.get_order_counts": () => ({ success: true, counts: { all: 5 } }),
    "tradehub_core.api.chat.list_my_threads": () => ({
      message: [{ id: 1, unread_count: 3 }, { id: 2, unread_count: 1 }, { id: 3 }],
    }),
    [ANALITIK]: () => ({ kpis: { pending_quotes: { quote_count: 2, rfq_count: 1 } } }),
    "tradehub_core.api.cart.get_buyer_coupons": () => ({ available: 4 }),
  };
  const tablo = { ...varsayilan, ...ezme };
  callMethod.mockImplementation(async (metot: string) => {
    const uc = tablo[metot];
    if (!uc) throw new Error(`beklenmeyen uç: ${metot}`);
    return uc();
  });
}

interface Kart {
  statsMessages: number;
  statsQuotations: number;
  statsCoupons: number;
  loadStats(): Promise<void>;
}

async function kart(): Promise<Kart> {
  const Alpine = (await import("alpinejs")).default as unknown as {
    __dataRegistry: Map<string, () => Kart>;
  };
  await import("./dashboard");
  const fabrika = Alpine.__dataRegistry.get("buyerUserInfo");
  if (!fabrika) throw new Error("buyerUserInfo kaydı yok");
  return fabrika();
}

beforeEach(() => {
  vi.resetModules();
  callMethod.mockReset();
});

describe("alıcı panosu sayaçları", () => {
  it("Mesajlar okunmamış toplamını gösterir, sipariş sayısını DEĞİL", async () => {
    uclar();
    const k = await kart();
    await k.loadStats();
    expect(k.statsMessages).toBe(4);
    expect(k.statsMessages).not.toBe(5);
    const cagrilanlar = callMethod.mock.calls.map(([m]) => m);
    expect(cagrilanlar).not.toContain("tradehub_core.api.order.get_order_counts");
  });

  it("Teklifler karar bekleyen teklif sayısını, Kuponlar kullanılabilir kuponu gösterir", async () => {
    uclar();
    const k = await kart();
    await k.loadStats();
    expect(k.statsQuotations).toBe(2);
    expect(k.statsCoupons).toBe(4);
  });

  it("sohbet servisi düşerse Mesajlar 0 kalır, diğer sayaçlar etkilenmez", async () => {
    uclar({
      "tradehub_core.api.chat.list_my_threads": () => {
        throw new Error("TeamsLike erişilemedi");
      },
    });
    const k = await kart();
    await k.loadStats();
    expect(k.statsMessages).toBe(0);
    expect(k.statsQuotations).toBe(2);
    expect(k.statsCoupons).toBe(4);
  });
});

describe("get_buyer_analytics paylaşımı", () => {
  it("kart ve analitik bölümü aynı sayfada tek istek atar", async () => {
    uclar({
      [ANALITIK]: () => ({
        kpis: {
          total_spend: { amount: 0, currency: "TRY", change_pct: 0, trend: "neutral" },
          active_orders: { count: 0, shipping: 0, preparing: 0 },
          pending_quotes: { quote_count: 2, rfq_count: 1 },
          negotiation_savings: { amount: 0, avg_discount_pct: 0, currency: "TRY" },
        },
        spending_trend: { labels: [], spend: [], orders: [] },
        category_breakdown: [],
      }),
    });
    const servis = await import("../services/buyerAnalyticsService");
    await Promise.all([servis.fetchPendingQuoteCount(), servis.fetchBuyerAnalytics()]);
    expect(callMethod.mock.calls.filter(([m]) => m === ANALITIK)).toHaveLength(1);
  });

  it("istek hata verirse önbellek bırakılır, sonraki çağrı yeniden dener", async () => {
    let ilk = true;
    uclar({
      [ANALITIK]: () => {
        if (ilk) {
          ilk = false;
          throw new Error("geçici hata");
        }
        return { kpis: { pending_quotes: { quote_count: 7, rfq_count: 2 } } };
      },
    });
    const servis = await import("../services/buyerAnalyticsService");
    await expect(servis.fetchPendingQuoteCount()).rejects.toThrow("geçici hata");
    await expect(servis.fetchPendingQuoteCount()).resolves.toBe(7);
  });
});
