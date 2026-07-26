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
  new: "sparkles",
};

// Sinyal tipi → metin+ikon rengi (spec: renk sistemi tablosu)
const COLOR_MAP: Record<SignalType, string> = {
  sales: "text-orange-600",
  favorites: "text-amber-600",
  cart_now: "text-green-600",
  views_24h: "text-blue-600",
  distinct_buyers: "text-violet-600",
  seller_orders: "text-teal-700",
  new: "text-emerald-600",
};

const TICKER_TRANSITION = "transform 240ms cubic-bezier(0.23,1,0.32,1)";

interface ActiveTicker {
  timerId: number;
  card: Element | null;
}

// Progressive grid batch'leri mevcut kartların ticker'ını bozmamalı. Timer'lar
// listing bazında tutulur; aynı listing yeniden render edilirse yalnız o yenilenir.
const timers = new Map<string, ActiveTicker>();
const signalCache = new Map<string, Signal[]>();

function clearTimer(listingId: string): void {
  const active = timers.get(listingId);
  if (!active) return;
  window.clearInterval(active.timerId);
  timers.delete(listingId);
}

function pruneDetachedTimers(): void {
  for (const [listingId, active] of timers) {
    if (!active.card?.isConnected) clearTimer(listingId);
  }
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

function slotsFor(
  root: ParentNode,
  id: string,
  createMissingSlots: boolean
): HTMLElement[] {
  const selector = `[data-sp-slot="${CSS.escape(id)}"]`;
  const existing = Array.from(root.querySelectorAll<HTMLElement>(selector));
  if (existing.length || !createMissingSlots) return existing;

  const hosts = Array.from(
    root.querySelectorAll<HTMLElement>(`[data-sp-host="${CSS.escape(id)}"]`)
  );
  return hosts.map((host) => {
    const slot = document.createElement("div");
    slot.dataset.spSlot = id;
    slot.dataset.spAlign = "center";
    slot.className =
      "absolute inset-x-0 bottom-0 z-20 flex h-[21px] items-center justify-center gap-1 overflow-hidden whitespace-nowrap border-t border-gray-100 bg-white/95 px-2 text-[9.5px] font-bold pointer-events-none min-[480px]:h-6 min-[480px]:text-[10.5px]";
    host.append(slot);
    return slot;
  });
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
export interface ListingSocialProofOptions {
  root?: ParentNode;
  /** Home compact kart boş slot üretmez; gerçek sinyal varsa host içinde oluştur. */
  createMissingSlots?: boolean;
}

export async function applyListingSocialProof(
  products: { id: string }[],
  options: ListingSocialProofOptions = {}
): Promise<void> {
  pruneDetachedTimers();

  const ids = products.map((p) => p.id).filter(Boolean);
  if (!ids.length) return;

  const missingIds = ids.filter((id) => !signalCache.has(id));
  if (missingIds.length) {
    try {
      const fetched = await fetchSocialProofSignalsBatch(missingIds);
      for (const id of missingIds) signalCache.set(id, fetched[id] ?? []);
    } catch {
      for (const id of missingIds) signalCache.set(id, []);
    }
  }

  const root = options.root ?? document;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  for (const id of ids) {
    clearTimer(id);
    const signals = signalCache.get(id);
    if (!signals || signals.length === 0) continue; // statik selling_point'te kal

    const slots = slotsFor(root, id, options.createMissingSlots === true);
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
      timers.set(id, { timerId: tm, card });
    }
  }
}
