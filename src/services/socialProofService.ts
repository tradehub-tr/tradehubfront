/**
 * Social Proof Service — fetches rotating-badge signals + records page views.
 *
 * Backend endpoints:
 *   GET  /api/method/tradehub_core.api.social_proof.get_signals
 *   POST /api/method/tradehub_core.api.social_proof.record_view
 *
 * sessionStorage cache (10 dk TTL) listingId ile anahtarlanır — aynı tab'da aynı
 * listing tekrar fetch'lenmez. AbortController 3s timeout sonrası iptal eder ve
 * tüm hata yolları sessizce boş sinyal listesi döner (rozet temiz şekilde gizlenir).
 *
 * Hand-rolled fetch deseni (callMethod yerine) tercih edildi:
 * - 401/403'te login redirect istemiyoruz — anonim ziyaretçide de çalışmalı
 * - AbortController + 3s timeout gerekli, callMethod desteklemiyor
 * - Aynı pattern: src/services/headerNoticeService.ts
 *
 * Spec: docs/superpowers/specs/2026-05-20-product-social-proof-badges-design.md
 */

import { getCsrfToken } from "../utils/api";

export type SignalType =
  | "sales"
  | "favorites"
  | "cart_now"
  | "views_24h"
  | "distinct_buyers"
  | "seller_orders";

export interface Signal {
  type: SignalType;
  value: number;
  window_days?: number;
}

interface Cached {
  signals: Signal[];
  expires_at: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 3000;
const CACHE_PREFIX = "sp:";

// ── DEV mock ──────────────────────────────────────────────────────────────
// Backend DocType'ları migrate edilmeden / eşik üstü data olmadan rozetin nasıl
// göründüğünü görmek için.
//
//   URL:           ?mock_sp=1  → tek sayfa için mock
//   localStorage:  dev_mock_social_proof = "1"  → kalıcı (sekmeler arası)
//
// Production'da kullanıcı flag açmaz, hiçbir etki yapmaz. Backend hazır olduğunda
// bu blok komple silinir.
const MOCK_SIGNALS: Signal[] = [
  { type: "sales", value: 2073, window_days: 3 },
  { type: "favorites", value: 14 },
  { type: "cart_now", value: 8 },
  { type: "views_24h", value: 312 },
  { type: "distinct_buyers", value: 14, window_days: 30 },
  { type: "seller_orders", value: 1240 },
];

function isMockEnabled(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock_sp") === "1") return true;
    return localStorage.getItem("dev_mock_social_proof") === "1";
  } catch {
    return false;
  }
}

export async function fetchSocialProofSignals(
  listingId: string,
  supplierId: string
): Promise<Signal[]> {
  if (!listingId) return [];

  if (isMockEnabled()) return MOCK_SIGNALS;

  const cacheKey = `${CACHE_PREFIX}${listingId}`;

  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const cached = JSON.parse(raw) as Cached;
      if (cached.expires_at > Date.now()) return cached.signals;
    }
  } catch {
    /* sessionStorage erişimi yoksa (incognito quota) atla */
  }

  const ctrl = new AbortController();
  const timeout = window.setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  let signals: Signal[] = [];
  try {
    const url =
      "/api/method/tradehub_core.api.social_proof.get_signals" +
      `?listing_id=${encodeURIComponent(listingId)}` +
      `&supplier_id=${encodeURIComponent(supplierId)}`;
    const res = await fetch(url, { signal: ctrl.signal, credentials: "include" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as {
      message?: { signals?: Signal[] };
      signals?: Signal[];
    };
    signals = data.message?.signals ?? data.signals ?? [];
  } catch {
    signals = [];
  } finally {
    window.clearTimeout(timeout);
  }

  try {
    const payload: Cached = { signals, expires_at: Date.now() + CACHE_TTL_MS };
    sessionStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    /* sessionStorage write hatası — sessizce geç */
  }

  return signals;
}

export function recordListingView(listingId: string): void {
  if (!listingId) return;
  const fire = (): void => void postView(listingId);
  type W = Window & {
    requestIdleCallback?: (cb: () => void) => void;
  };
  const w = window as W;
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(fire);
  } else {
    window.setTimeout(fire, 1000);
  }
}

async function postView(listingId: string): Promise<void> {
  try {
    const csrf = getCsrfToken();
    await fetch("/api/method/tradehub_core.api.social_proof.record_view", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Frappe-CSRF-Token": csrf,
      },
      body: `listing_id=${encodeURIComponent(listingId)}`,
    });
  } catch {
    /* sessizce yut — view tracking fire-and-forget */
  }
}
