/**
 * Listing grid sosyal kanıt rozeti.
 *
 * Statik `selling_point` yerine — eşiği geçen sosyal kanıt sinyallerini (satış,
 * favori, sepet, görüntülenme, farklı alıcı, satıcı sipariş) kartın rozet alanında
 * 4 saniyede bir dikey ticker ile dönerek gösterir. Sinyali olmayan ürün statik
 * selling_point'te kalır.
 *
 * Veri: tek `get_signals_batch` isteği (grid başına) → sessionStorage cache ısıtılır.
 * Rozet alanı: ProductListingGrid kartındaki `[data-sp-slot="<listingId>"]` elemanları
 * (grid: görsel altı şerit, list: metin satırı).
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

const ROTATE_MS = 4000;

const ICON_MAP: Record<SignalType, string> = {
  sales: "zap",
  favorites: "star",
  cart_now: "shopping-cart",
  views_24h: "eye",
  distinct_buyers: "building-2",
  seller_orders: "shield-check",
};

// Sinyal tipi → metin+ikon rengi (spec: renk sistemi tablosu)
const COLOR_MAP: Record<SignalType, string> = {
  sales: "text-orange-600",
  favorites: "text-amber-600",
  cart_now: "text-green-600",
  views_24h: "text-blue-600",
  distinct_buyers: "text-violet-600",
  seller_orders: "text-teal-700",
};

const TICKER_TRANSITION = "transform 240ms cubic-bezier(0.23,1,0.32,1)";

// Aktif rotasyon timer'ları — her grid re-render'ında temizlenir (timer sızıntısı yok).
let timers: number[] = [];

function clearTimers(): void {
  timers.forEach((id) => window.clearInterval(id));
  timers = [];
}

function labelFor(sig: Signal): string {
  return t(`socialProofCard.${sig.type}`, {
    value: formatCount(sig.value),
    days: sig.window_days ?? "",
  });
}

function rowHtml(sig: Signal, slot: HTMLElement): string {
  const align = slot.dataset.spAlign === "center" ? "justify-center" : "";
  return `<div class="flex items-center ${align} gap-1 shrink-0 h-full whitespace-nowrap ${COLOR_MAP[sig.type]}">${getLucideIcon(ICON_MAP[sig.type], "w-3.5 h-3.5 shrink-0")}<span class="truncate">${labelFor(sig)}</span></div>`;
}

/** Slot içeriğini roll yapısına çevirir (ilk sinyalde statik selling point'in yerini alır). */
function mountRoll(slot: HTMLElement, sig: Signal): void {
  slot.classList.remove("sp-strip-empty", "!hidden");
  slot.innerHTML = `<div class="sp-roll flex h-full flex-col will-change-transform">${rowHtml(sig, slot)}</div>`;
}

/** Dikey ticker adımı: yeni satır alta girer, roll yukarı kayar, eski satır düşer. */
function tickSlot(slot: HTMLElement, sig: Signal, reduced: boolean): void {
  const roll = slot.querySelector<HTMLElement>(".sp-roll");
  if (!roll) {
    mountRoll(slot, sig);
    return;
  }
  // Önceki transition yarım kaldıysa (gizli tab: transitionend gelmez) temizle.
  roll.style.transition = "";
  roll.style.transform = "";
  while (roll.children.length > 1) roll.firstElementChild?.remove();

  if (reduced) {
    roll.innerHTML = rowHtml(sig, slot);
    return;
  }
  roll.insertAdjacentHTML("beforeend", rowHtml(sig, slot));
  const rowH = slot.clientHeight;
  requestAnimationFrame(() => {
    roll.style.transition = TICKER_TRANSITION;
    roll.style.transform = `translateY(-${rowH}px)`;
  });
  roll.addEventListener("transitionend", function done() {
    roll.removeEventListener("transitionend", done);
    // Sıra kritik: transition önce sıfırlanmalı ki transform reset'i (-rowH → 0)
    // ikinci bir geri-kayma animasyonu tetiklemesin. Üç atama aynı senkron task'ta
    // olduğu sürece tarayıcı yalnız son stili boyar — araya layout okuması EKLEME.
    roll.style.transition = "";
    roll.firstElementChild?.remove();
    roll.style.transform = "";
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

    const slots = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-sp-slot="${CSS.escape(id)}"]`)
    );
    if (!slots.length) continue;

    slots.forEach((slot) => mountRoll(slot, signals[0]));

    if (signals.length > 1) {
      // Hover'da duraklat — okuma anı bölünmesin (pointer-coarse'ta hover yok, sorun değil).
      let paused = false;
      const card = slots[0].closest(".fy26-product-card-wrapper");
      card?.addEventListener("pointerenter", () => {
        paused = true;
      });
      card?.addEventListener("pointerleave", () => {
        paused = false;
      });

      let idx = 0;
      const tm = window.setInterval(() => {
        if (paused) return;
        idx = (idx + 1) % signals.length;
        slots.forEach((slot) => tickSlot(slot, signals[idx], reduced));
      }, ROTATE_MS);
      timers.push(tm);
    }
  }
}
