// Kaynak-bazlı cache politikaları (ms). Spec §5 Faz 1 tablosu.
export interface CachePolicy {
  staleTime: number;
  gcTime: number;
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const policies = {
  categories: { staleTime: 24 * HOUR, gcTime: 7 * DAY },
  currency: { staleTime: HOUR, gcTime: DAY },
  filters: { staleTime: 6 * HOUR, gcTime: DAY },
  listings: { staleTime: MIN, gcTime: 5 * MIN },
  promo: { staleTime: 30 * MIN, gcTime: DAY }, // hero slider, header notice
} as const satisfies Record<string, CachePolicy>;

/** Obje param'larını deterministik (anahtar-sıralı) bir diziye çevirir. */
function normalize(params: Record<string, unknown>): Array<[string, unknown]> {
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => [k, params[k]] as [string, unknown]);
}

export const queryKeys = {
  categories: () => ["categories"] as const,
  currencyRates: () => ["currency", "rates"] as const,
  filters: (category: string) => ["filters", category] as const,
  listings: (params: Record<string, unknown>) => ["listings", normalize(params)] as const,
  heroSlider: () => ["promo", "hero"] as const,
  headerNotice: () => ["promo", "header-notice"] as const,
};
