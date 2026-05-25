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

// v2 (2026-05-22): CTA label birleşmesi — eski cache'leri zorla geçersiz kıl.
const CACHE_KEY = "tradehub-pricing-plans-v2";
const CACHE_TTL_MS = 5 * 60_000; // 5 dk

export interface PricingPlanFeature {
  display_text: string;
  icon: "check" | "x" | "star" | "zap" | "info";
  is_disabled: boolean;
  feature_key: string | null;
  tooltip: string | null;
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
  max_active_listings: number;
  cta_label: string;
  cta_action: "signup" | "signup_billing" | "contact_sales";
  highlighted: boolean;
  trial_days: number;
  features: PricingPlanFeature[];
}

export interface PricingPlansResponse {
  plans: PricingPlan[];
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
