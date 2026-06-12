/**
 * Pricing Service
 * ---------------
 * Storefront sell.html pricing card'larını Frappe backend'inden çeker.
 * - localStorage cache (5 dk) ile FOUC'suz başlangıç
 * - Stale-while-revalidate: cache döner, arka planda yeni veri çekilir
 * - Backend: tradehub_core.api.v1.public_pricing.get_pricing_plans
 *
 * Süper Admin Permission Console'dan plan'ı değiştirdiğinde backend cache
 * invalidate olur ve bu service de yeni veriyi çeker.
 */

// v3 (2026-06-05): Faz J features_matrix + admin matris tek doğru kaynak.
// Eski v2 cache'leri zorla geçersiz kıl.
const CACHE_KEY = "tradehub-pricing-plans-v6";
const CACHE_TTL_MS = 5 * 60_000; // 5 dk

export interface PricingPlanFeature {
  display_text: string;
  icon: "check" | "x" | "star" | "zap" | "info";
  is_disabled: boolean;
  feature_key: string | null;
  tooltip: string | null;
  /** Faz K — true ise plan kartının "Paket içeriği" özet listesinde bullet olur. */
  show_on_card: boolean;
  /** Enum/quota değeri (ör. "7×24 tahsisli", "15+ dil"); boolean'da boş. */
  text_value?: string;
  /** true ise kartta "Yakında" rozeti gösterilir (henüz çalışmayan özellik). */
  coming_soon?: boolean;
}

export interface PricingPlan {
  plan_code: string;
  plan_name: string;
  description: string | null;
  badge_label: string | null;
  badge_color: "default" | "yellow" | "black" | "premium";
  theme: "default" | "dark" | "premium";
  short_tagline: string | null;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  commission_rate: number;
  /** Admin komisyon alanını boş bıraktıysa true — oran yerine "Özel" gösterilir. */
  commission_custom?: boolean;
  max_active_listings: number;
  cta_label: string;
  cta_action: "signup" | "signup_billing" | "contact_sales" | "learn_more";
  /** Doluysa fiyat yerine bu metin gösterilir (ör. "Özel teklif"). */
  price_override_label: string | null;
  highlighted: boolean;
  trial_days: number;
  features: PricingPlanFeature[];
}

/**
 * Faz J — Feature matrix (admin Paket İçeriği matris UI ile aynı veri).
 * Storefront pricing tablosunu tamamen dinamik render etmek için kullanılır.
 */
export interface PricingMatrixCell {
  value_type: "checkbox" | "text";
  is_included: boolean;
  text_value: string;
}

export interface PricingMatrixFeature {
  feature_key: string;
  display_name: string;
  value_type: "checkbox" | "text";
  tooltip: string | null;
  /** true ise karşılaştırma tablosunda adın yanında "Yakında" rozeti. */
  coming_soon?: boolean;
  /** Anahtar plan_code (ör. FREE, PRO) — değer hücre */
  values_by_plan: Record<string, PricingMatrixCell>;
}

export interface PricingMatrixCategory {
  name: string;
  features: PricingMatrixFeature[];
}

export interface PricingFeaturesMatrix {
  categories: PricingMatrixCategory[];
}

/** Global trial konfigürasyonu (Trial Settings) — seçilen pakette buton-üstü CTA + üst bant. */
export interface TrialConfig {
  enabled: boolean;
  plan_code: string;
  days: number;
  cta_label: string;
}

export interface PricingPlansResponse {
  plans: PricingPlan[];
  /** Faz J — backend Feature Catalog'tan beslenir; eski yanıtlarda olmayabilir. */
  features_matrix?: PricingFeaturesMatrix;
  /** Trial ayarı; eski yanıtlarda olmayabilir (enabled=false fallback). */
  trial_config?: TrialConfig;
  meta: {
    currency: string;
    /** True if plans use multiple currencies — frontend per-plan currency kullanmalı */
    mixed_currency?: boolean;
    updated_at: string;
  };
}

interface CacheShape {
  ts: number;
  data: PricingPlansResponse;
}

const EMPTY: PricingPlansResponse = { plans: [], meta: { currency: "EUR", updated_at: "" } };

export function getCachedPricingPlans(): PricingPlansResponse {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed || !Array.isArray(parsed.data?.plans)) return EMPTY;
    return parsed.data;
  } catch {
    return EMPTY;
  }
}

export async function fetchPricingPlans(): Promise<PricingPlansResponse> {
  try {
    const res = await fetch("/api/method/tradehub_core.api.v1.public_pricing.get_pricing_plans", {
      credentials: "include",
    });
    if (!res.ok) return getCachedPricingPlans();
    const json = (await res.json()) as { message?: PricingPlansResponse };
    const data: PricingPlansResponse = json?.message ?? EMPTY;
    const payload: CacheShape = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    return data;
  } catch (err) {
    console.warn("[Pricing] fetch failed", err);
    return getCachedPricingPlans();
  }
}

export function isCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CacheShape;
    return Date.now() - parsed.ts < CACHE_TTL_MS;
  } catch {
    return false;
  }
}
