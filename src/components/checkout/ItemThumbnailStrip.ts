import { ProductImage } from "../media/ProductImage";
/**
 * ItemThumbnailStrip — sipariş özetindeki ürün küçük-resim şeridi.
 *
 * Sepet sayfası (CartSummary) ile ödeme adımı (OrderSummary) aynı şeridi paylaşır:
 * her ürün kendi adet rozetiyle, hepsi yatay kaydırmalı bir şeritte; şerit
 * taşınca sağ/sol oklar görünür (hover'da). Kart sınıf adları sepet sayfasının
 * Alpine kaydırma mantığıyla (cart.ts initThumbnailSlider) uyumludur.
 */

import { t } from "../../i18n";

export interface ThumbnailItem {
  image: string;
  listingId?: string;
  quantity: number;
}

const SCROLL_STEP = 140;

/**
 * Tek küçük-resim kartı. Sepet sayfasının Alpine yenilemesi (cart.ts
 * updateThumbnailGrid) de bunu kullanır — kart işaretlemesi tek yerde durur.
 * Görsel yoksa kırık img yerine nötr yer tutucu; adet rozeti her durumda kalır.
 */
export function renderThumbnailCard(item: ThumbnailItem): string {
  return `
      <div class="checkout-item-card relative w-14 h-14 min-w-[56px] max-[380px]:w-12 max-[380px]:h-12 max-[380px]:min-w-[48px] sm:w-16 sm:h-16 sm:min-w-[64px] rounded overflow-hidden border border-[#e5e5e5] flex-shrink-0">
        <div class="block w-full h-full">
          ${
            item.image
              ? ProductImage({
                  listing: item.listingId || "",
                  src: item.image,
                  className: "w-full h-full object-cover",
                  sizes: "(min-width: 640px) 64px, (max-width: 380px) 48px, 56px",
                  width: 64,
                  height: 64,
                })
              : `<div data-thumb-placeholder class="w-full h-full flex items-center justify-center bg-[#f5f5f5] text-[#c4c4c4]" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </div>`
          }
        </div>
        <span data-qty-badge class="absolute bottom-0 end-0 bg-black/60 text-white rounded-ss text-[11px] font-bold leading-4 px-1 py-px">${item.quantity}</span>
      </div>`;
}

export function renderItemThumbnailStrip(items: ThumbnailItem[]): string {
  if (items.length === 0) return "";

  const thumbnails = items.map(renderThumbnailCard).join("");

  const arrowCls =
    "checkout-items-arrow absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-[#e5e5e5] bg-white flex items-center justify-center cursor-pointer z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm hover:bg-[#f5f5f5]";

  const arrowLeft = `<button type="button" class="${arrowCls} -start-1.5" data-dir="left" aria-label="${t("cart.scrollLeft")}">
    <svg class="w-3.5 h-3.5 stroke-[#222] fill-none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  </button>`;

  const arrowRight = `<button type="button" class="${arrowCls} -end-1.5" data-dir="right" aria-label="${t("cart.scrollRight")}">
    <svg class="w-3.5 h-3.5 stroke-[#222] fill-none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
  </button>`;

  return `<div class="checkout-items-wrapper group relative mb-4">${arrowLeft}<div class="checkout-items-images flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide">${thumbnails}</div>${arrowRight}</div>`;
}

/**
 * Ok davranışı: tıklayınca şerit kayar; taşma yoksa oklar gizlenir, uçlarda
 * ilgili ok söner. Sepet sayfasındaki Alpine mantığının (cart.ts) birebir karşılığı —
 * ödeme adımı Alpine bileşeni olmadığı için burada düz TS.
 */
export function initItemThumbnailStrip(wrapper: HTMLElement): void {
  const track = wrapper.querySelector<HTMLElement>(".checkout-items-images");
  const left = wrapper.querySelector<HTMLButtonElement>('[data-dir="left"]');
  const right = wrapper.querySelector<HTMLButtonElement>('[data-dir="right"]');
  if (!track || !left || !right) return;

  const updateVisibility = () => {
    const overflows = track.scrollWidth > track.clientWidth + 1;
    left.classList.toggle("!hidden", !overflows);
    right.classList.toggle("!hidden", !overflows);
    if (!overflows) return;
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    left.classList.toggle("!opacity-0", atStart);
    left.classList.toggle("!pointer-events-none", atStart);
    right.classList.toggle("!opacity-0", atEnd);
    right.classList.toggle("!pointer-events-none", atEnd);
  };

  wrapper.querySelectorAll<HTMLButtonElement>(".checkout-items-arrow").forEach((button) => {
    button.addEventListener("click", () => {
      track.scrollBy({
        left: button.dataset.dir === "left" ? -SCROLL_STEP : SCROLL_STEP,
        behavior: "smooth",
      });
    });
  });

  track.addEventListener("scroll", updateVisibility, { passive: true });
  window.addEventListener("resize", updateVisibility, { passive: true });
  updateVisibility();
}
