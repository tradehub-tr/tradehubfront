/**
 * Buyer Dashboard — Analytics tipleri + tasarım sabitleri.
 * Veri artık `tradehub_core.api.v1.dashboard.get_buyer_analytics`'ten gelir
 * (bkz. src/services/buyerAnalyticsService.ts). Bu dosya yalnızca tip
 * tanımlarını, KPI meta sabitlerini ve renk paletini tutar.
 */

export interface KpiCard {
  label: string;
  /** Önceden formatlanmış görünen değer (₺248.900, 7, vb.) */
  value: string;
  /** Alt satır açıklaması */
  hint: string;
  /** Trend yönü — yoksa nötr (sadece hint gösterilir) */
  trend?: "up" | "down";
  /** Trend metni (örn. "%12,4") */
  trendText?: string;
  /** lucide-static ikon anahtarı (lucideIcons.ts ICONS map) */
  icon: string;
  /** Renk teması — KPI ikon arkaplanı + trend rengi */
  tone: "primary" | "info" | "accent" | "success";
}

export interface SpendingTrend {
  labels: string[];
  /** Aylık harcama (₺) — bar */
  spend: number[];
  /** Aylık sipariş adedi — line */
  orders: number[];
}

export interface CategorySlice {
  name: string;
  /** Yüzde değeri (0-100) */
  value: number;
  /** Dilim rengi (hex) — paletten */
  color: string;
}

/** KPI kartlarının statik tasarım bilgisi (etiket/ikon/tema). */
export interface KpiMeta {
  label: string;
  icon: string;
  tone: KpiCard["tone"];
}

export const KPI_META: Record<
  "totalSpend" | "activeOrders" | "pendingQuotes" | "negotiationSavings",
  KpiMeta
> = {
  totalSpend: { label: "Toplam Harcama", icon: "wallet", tone: "primary" },
  activeOrders: { label: "Aktif Sipariş", icon: "package", tone: "info" },
  pendingQuotes: { label: "Bekleyen Teklif", icon: "file-text", tone: "accent" },
  negotiationSavings: { label: "Pazarlık Tasarrufu", icon: "tag", tone: "success" },
};

/** Kategori donut dilim renkleri — index ile atanır, taşarsa döner. */
export const CATEGORY_PALETTE = ["#f5b800", "#06b6d4", "#3b82f6", "#22c55e", "#a3a3a3"];
