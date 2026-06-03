/**
 * Listing grid sosyal kanıt rozeti.
 *
 * Statik `selling_point` yerine — eşiği geçen sosyal kanıt sinyallerini (satış,
 * favori, sepet, görüntülenme, farklı alıcı, satıcı sipariş) kartın rozet alanında
 * 5 saniyede bir dönerek gösterir. Sinyali olmayan ürün statik selling_point'te kalır.
 *
 * Veri: tek `get_signals_batch` isteği (grid başına) → sessionStorage cache ısıtılır.
 * Rozet alanı: ProductListingGrid kartındaki `[data-sp-slot="<listingId>"]` elemanları
 * (hem grid-mobil ribbon hem ≥sm metin satırı).
 *
 * Backend: tradehub_core.api.social_proof.get_signals_batch
 */

import {
  fetchSocialProofSignalsBatch,
  type Signal,
  type SignalType,
} from "../../services/socialProofService";
import { formatCount } from "../../utils/formatCount";
import { getLucideIcon } from "../icons/lucideIcons";
import { t } from "../../i18n";

const ROTATE_MS = 5000;

const ICON_MAP: Record<SignalType, string> = {
  sales: "zap",
  favorites: "star",
  cart_now: "shopping-cart",
  views_24h: "eye",
  distinct_buyers: "building-2",
  seller_orders: "shield-check",
};

// Aktif rotasyon timer'ları — her grid re-render'ında temizlenir (timer sızıntısı yok).
let timers: number[] = [];

function clearTimers(): void {
  timers.forEach((id) => window.clearInterval(id));
  timers = [];
}

function labelFor(sig: Signal): string {
  return t(`socialProof.${sig.type}`, {
    value: formatCount(sig.value),
    days: sig.window_days ?? "",
  });
}

function renderInto(slots: Element[], sig: Signal): void {
  const html = `${getLucideIcon(ICON_MAP[sig.type], "w-3.5 h-3.5 shrink-0")}<span class="truncate">${labelFor(sig)}</span>`;
  slots.forEach((el) => {
    (el as HTMLElement).innerHTML = html;
  });
}

/**
 * Grid render edildikten sonra çağrılır. Sinyali olan kartların rozetini dönen
 * sosyal kanıt etiketiyle değiştirir; sinyalsiz kartlar statik selling_point'te kalır.
 */
export async function applyListingSocialProof(products: { id: string }[]): Promise<void> {
  clearTimers();

  const ids = products.map((p) => p.id).filter(Boolean);
  if (!ids.length) return;

  let map: Record<string, Signal[]>;
  try {
    map = await fetchSocialProofSignalsBatch(ids);
  } catch {
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  for (const id of ids) {
    const signals = map[id];
    if (!signals || signals.length === 0) continue; // statik selling_point'te kal

    const slots = Array.from(document.querySelectorAll(`[data-sp-slot="${CSS.escape(id)}"]`));
    if (!slots.length) continue;

    let idx = 0;
    renderInto(slots, signals[idx]);

    if (signals.length > 1 && !reduced) {
      const tm = window.setInterval(() => {
        idx = (idx + 1) % signals.length;
        renderInto(slots, signals[idx]);
      }, ROTATE_MS);
      timers.push(tm);
    }
  }
}
