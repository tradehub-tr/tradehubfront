/**
 * Mağaza vitrin düzeni (`seller.get_storefront_layout`) — sayfa başına TEK istek.
 *
 * `pages/seller-shop.ts` (ilk düzen) ve `alpine/sellerShop.ts` (Alpine init) aynı
 * ucu ayrı ayrı çekiyordu; ölçüldü (MOGEM-638 §2.6, 15 Eyl tekrar): mağaza
 * sayfasında 2× get_storefront_layout. Promise satıcı koduna göre memoize edilir.
 */
import "../utils/api"; // window.API_BASE'i kurar (Alpine bileşenleriyle aynı taban)

const API_BASE = (window as Window & { API_BASE?: string }).API_BASE || "/api";

export interface StorefrontLayoutResponse<TSection = unknown> {
  message?: { sections?: TSection[]; theme?: Record<string, string | undefined> } | null;
}

const _inflight = new Map<string, Promise<unknown>>();

/** `TSection`: çağıranın kendi bölüm tipi — iki çağıran da aynı JSON'u okur. */
export function fetchStorefrontLayout<TSection = unknown>(
  sellerCode: string
): Promise<StorefrontLayoutResponse<TSection> | null> {
  let p = _inflight.get(sellerCode) as
    | Promise<StorefrontLayoutResponse<TSection> | null>
    | undefined;
  if (!p) {
    p = fetch(
      `${API_BASE}/method/tradehub_core.api.seller.get_storefront_layout?seller_code=${encodeURIComponent(sellerCode)}`,
      { credentials: "omit" }
    )
      .then((r) => r.json() as Promise<StorefrontLayoutResponse<TSection>>)
      .catch(() => null);
    _inflight.set(sellerCode, p);
  }
  return p;
}
