/**
 * FAZ 1.7 — Storefront entitlement client.
 *
 * Backend `tradehub_core.api.v1.entitlement_snapshot.get_snapshot` çağırır,
 * sonucu sessionStorage'da 5 dakika cache'ler.
 *
 * Bu modül **deneyim ipucu** üretir — gerçek güvenlik kararı her korumalı
 * eylemde backend'den taze sorulur (cart.add, rfq.create vb. endpoint'ler
 * server-side has_feature kontrolü yapar). Frontend snapshot **güvenlik
 * sınırı değildir**.
 *
 * Kullanım:
 *
 *   import { getEntitlement, hasFeature, withinQuota, isVerifiedForCheckout } from "@/utils/entitlement";
 *
 *   const ent = await getEntitlement();
 *   if (!isVerifiedForCheckout(ent)) {
 *     showBanner("Sipariş için KYC doğrulaması gerekli");
 *     return;
 *   }
 *
 *   if (!hasFeature(ent, "feature.functional.rfq")) {
 *     hideRfqButton();
 *   }
 *
 * Detay: docs/yetki/TradeHub-Yetkilendirme-Mimarisi-v2.md §6.3
 */

import { callMethod } from "./api";

// ─── Types ──────────────────────────────────────────────

export interface EntitlementSnapshot {
  user: string;
  is_buyer: boolean;
  is_seller: boolean;
  account_type?: "Individual" | "Business";
  kyc_status?: "Locked" | "Pending" | "Verified" | "Rejected" | "Suspended" | null;
  kyb_status?:
    | "Locked"
    | "Pending"
    | "Under Review"
    | "Verified"
    | "Rejected"
    | "Suspended"
    | null;
  can_buy: boolean;
  can_sell: boolean;
  tenant?: string | null;
  plan_code?: string | null;
  subscription_status?: string | null;
  trial_end?: string | null;
  features: Record<string, boolean>;
  quotas: Record<string, number>;
  ttl_seconds: number;
  _fetched_at?: number; // local-only timestamp
}

// ─── Cache ──────────────────────────────────────────────

const CACHE_KEY = "tradehub:entitlement:snapshot";

let _inflight: Promise<EntitlementSnapshot> | null = null;

function _readCache(): EntitlementSnapshot | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as EntitlementSnapshot;
    const ttl = (data.ttl_seconds || 300) * 1000;
    const age = Date.now() - (data._fetched_at || 0);
    if (age > ttl) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function _writeCache(snapshot: EntitlementSnapshot): void {
  try {
    snapshot._fetched_at = Date.now();
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage full / private mode — graceful
  }
}

export function clearEntitlementCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
  _inflight = null;
}

// ─── Public API ─────────────────────────────────────────

/**
 * Mevcut kullanıcının entitlement snapshot'ını döner.
 * Cache hit ise direkt döner; miss ise backend'i çağırır.
 *
 * @param force - cache by-pass yap
 */
export async function getEntitlement(force = false): Promise<EntitlementSnapshot> {
  if (!force) {
    const cached = _readCache();
    if (cached) return cached;
  }

  // Race condition: paralel çağrılar aynı promise'i bekler
  if (!_inflight) {
    _inflight = callMethod<EntitlementSnapshot>(
      "tradehub_core.api.v1.entitlement_snapshot.get_snapshot",
    )
      .then((snapshot) => {
        _writeCache(snapshot);
        _inflight = null;
        return snapshot;
      })
      .catch((err) => {
        _inflight = null;
        throw err;
      });
  }
  return _inflight;
}

/**
 * Belirli bir feature için fresh backend check (cache by-pass).
 * Kullanım: "RFQ Gönder" butonuna basılınca son anda doğrula.
 */
export async function checkFeatureFresh(featureKey: string): Promise<boolean> {
  try {
    const res = await callMethod<{ has_feature: boolean }>(
      "tradehub_core.api.v1.entitlement_snapshot.check_feature",
      { feature_key: featureKey },
    );
    return !!res.has_feature;
  } catch {
    return false; // fail-closed
  }
}

// ─── Helpers ───────────────────────────────────────────

export function hasFeature(snapshot: EntitlementSnapshot | null, key: string): boolean {
  if (!snapshot) return false;
  return !!snapshot.features[key];
}

export function getQuota(snapshot: EntitlementSnapshot | null, key: string): number {
  if (!snapshot) return 0;
  return snapshot.quotas[key] ?? 0;
}

export function withinQuota(
  snapshot: EntitlementSnapshot | null,
  key: string,
  current: number,
): boolean {
  if (!snapshot) return false;
  const limit = snapshot.quotas[key];
  if (limit === undefined) return false;
  if (limit === -1) return true; // sınırsız
  if (limit === 0) return false; // devre dışı
  return current < limit;
}

// ─── Verification gates ─────────────────────────────────
// Karar dosyamızdaki KYC/KYB gate'leri için pratik wrapper'lar.

export function isKycVerified(snapshot: EntitlementSnapshot | null): boolean {
  return snapshot?.kyc_status === "Verified";
}

export function isKybVerified(snapshot: EntitlementSnapshot | null): boolean {
  return snapshot?.kyb_status === "Verified";
}

/**
 * Buyer checkout (sipariş ver) için doğrulama:
 *   - account_type=Individual → KYC=Verified gerekli
 *   - account_type=Business   → KYB=Verified gerekli
 */
export function isVerifiedForCheckout(snapshot: EntitlementSnapshot | null): boolean {
  if (!snapshot || !snapshot.can_buy) return false;
  if (snapshot.account_type === "Business") {
    return isKybVerified(snapshot);
  }
  return isKycVerified(snapshot);
}

/**
 * Banner gösterilmeli mi? (KYC/KYB pending veya rejected)
 */
export function shouldShowVerificationBanner(snapshot: EntitlementSnapshot | null): {
  show: boolean;
  kind: "kyc_pending" | "kyc_rejected" | "kyb_pending" | "kyb_rejected" | "trial_ending" | null;
  message?: string;
} {
  if (!snapshot) return { show: false, kind: null };

  // Trial bitiyor mu (3 günden az)?
  if (snapshot.trial_end) {
    const trialEnd = new Date(snapshot.trial_end).getTime();
    const diffDays = (trialEnd - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays > 0 && diffDays < 3) {
      return {
        show: true,
        kind: "trial_ending",
        message: `Deneme süreniz ${Math.ceil(diffDays)} gün içinde sona eriyor.`,
      };
    }
  }

  if (snapshot.is_buyer) {
    if (snapshot.account_type === "Business") {
      if (snapshot.kyb_status === "Rejected") {
        return {
          show: true,
          kind: "kyb_rejected",
          message: "KYB doğrulamanız reddedildi. Lütfen belgelerinizi güncelleyin.",
        };
      }
      if (snapshot.kyb_status === "Pending" || snapshot.kyb_status === "Under Review") {
        return {
          show: true,
          kind: "kyb_pending",
          message: "KYB doğrulamanız incelemede. Sipariş verebilmek için doğrulamanız onaylanmalı.",
        };
      }
    } else {
      if (snapshot.kyc_status === "Rejected") {
        return {
          show: true,
          kind: "kyc_rejected",
          message: "Kimlik doğrulamanız reddedildi. Lütfen belgelerinizi güncelleyin.",
        };
      }
      if (snapshot.kyc_status === "Pending") {
        return {
          show: true,
          kind: "kyc_pending",
          message: "Kimlik doğrulamanız incelemede. Sipariş verebilmek için doğrulamanız onaylanmalı.",
        };
      }
    }
  }

  return { show: false, kind: null };
}
