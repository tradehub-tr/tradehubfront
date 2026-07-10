export interface TailoredCategory {
  id: string;
  slug?: string;
  title: string;
  description: string;
  imageSrc: string;
  badge?: "personal" | "trend" | "quality" | null;
  /** Kategori görüntülenme sayısı — kanal şeridi meta satırı. */
  viewsCount?: number;
  /** Son 30 gün sipariş değişimi (%). Yoksa trend rozeti render edilmez. */
  trendPct?: number | null;
  /** 30 günlük sipariş serisi — sparkline. Backend sağlayana dek opsiyonel. */
  series?: number[] | null;
}
