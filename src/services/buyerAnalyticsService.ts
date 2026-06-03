import { callMethod } from "../utils/api";
import {
  type KpiCard,
  type SpendingTrend,
  type CategorySlice,
  KPI_META,
  CATEGORY_PALETTE,
} from "../data/buyerAnalytics";

/** Backend ham response şekli (tradehub_core.api.v1.dashboard.get_buyer_analytics). */
interface RawAnalytics {
  kpis: {
    total_spend: {
      amount: number;
      currency: string;
      change_pct: number;
      trend: "up" | "down" | "neutral";
    };
    active_orders: { count: number; shipping: number; preparing: number };
    pending_quotes: { quote_count: number; rfq_count: number };
    negotiation_savings: { amount: number; avg_discount_pct: number; currency: string };
  };
  spending_trend: { labels: string[]; spend: number[]; orders: number[] };
  category_breakdown: { name: string; value: number }[];
}

export interface BuyerAnalytics {
  kpis: KpiCard[];
  spendingTrend: SpendingTrend;
  categoryBreakdown: CategorySlice[];
}

const fmtTRY = (n: number): string => "₺" + Math.round(n).toLocaleString("tr-TR");
const fmtNum = (n: number): string => n.toLocaleString("tr-TR");

function mapKpis(k: RawAnalytics["kpis"]): KpiCard[] {
  return [
    {
      ...KPI_META.totalSpend,
      value: fmtTRY(k.total_spend.amount),
      hint: "geçen aya göre",
      // Nötr (geçen ay verisi yok / değişim 0): yanıltıcı ok+yüzde gösterme, sadece hint.
      ...(k.total_spend.trend === "neutral"
        ? {}
        : {
            trend: k.total_spend.trend,
            trendText: "%" + fmtNum(Math.abs(k.total_spend.change_pct)),
          }),
    },
    {
      ...KPI_META.activeOrders,
      value: String(k.active_orders.count),
      hint: `yolda ${k.active_orders.shipping}, hazırlanıyor ${k.active_orders.preparing}`,
    },
    {
      ...KPI_META.pendingQuotes,
      value: String(k.pending_quotes.quote_count),
      hint: `${k.pending_quotes.rfq_count} RFQ · ${k.pending_quotes.quote_count} satıcı yanıtı`,
    },
    {
      ...KPI_META.negotiationSavings,
      value: fmtTRY(k.negotiation_savings.amount),
      hint: `RFQ ile %${fmtNum(k.negotiation_savings.avg_discount_pct)} ortalama indirim`,
    },
  ];
}

function mapCategories(raw: { name: string; value: number }[]): CategorySlice[] {
  return raw.map((c, i) => ({
    name: c.name,
    value: c.value,
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
  }));
}

export async function fetchBuyerAnalytics(): Promise<BuyerAnalytics> {
  const raw = await callMethod<RawAnalytics>("tradehub_core.api.v1.dashboard.get_buyer_analytics");
  return {
    kpis: mapKpis(raw.kpis),
    spendingTrend: raw.spending_trend,
    categoryBreakdown: mapCategories(raw.category_breakdown),
  };
}

/** Hata veya boş kullanıcı için sıfır değerli analytics (UI çökmeden render eder). */
export function getZeroAnalytics(): BuyerAnalytics {
  return {
    kpis: [
      { ...KPI_META.totalSpend, value: "₺0", hint: "geçen aya göre", trend: "up", trendText: "%0" },
      { ...KPI_META.activeOrders, value: "0", hint: "yolda 0, hazırlanıyor 0" },
      { ...KPI_META.pendingQuotes, value: "0", hint: "0 RFQ · 0 satıcı yanıtı" },
      { ...KPI_META.negotiationSavings, value: "₺0", hint: "RFQ ile %0 ortalama indirim" },
    ],
    spendingTrend: { labels: [], spend: [], orders: [] },
    categoryBreakdown: [],
  };
}
