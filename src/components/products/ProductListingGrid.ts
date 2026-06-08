import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import { getBrandUrl } from "../../utils/brandUrl";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
/**
 * ProductListingGrid Component
 * iSTOC-style product listing grid for products page.
 * Responsive grid with hover zoom effect on product images.
 * Uses CSS transitions for smooth 500ms zoom animation.
 */

import type { ProductListingCard, ViewMode } from "../../types/productListing";
// Mock data import removed — grid is now API-driven

// Placeholder images removed — all images come from API now

/**
 * Camera search icon for image search overlay - DISABLED
 */
// function cameraSearchIcon(): string {
//   return `
//     <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
//       <path d="M3 9a2 2 0 0 1 2-2h2l1-2h8l1 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
//       <circle cx="12" cy="13" r="3" />
//     </svg>
//   `;
// }

/**
 * Render image slider for product card (iSTOC-style)
 * - translateX-based horizontal sliding with CSS transition
 * - group/img for hover detection on image area only
 * - Prev/next arrows + dot indicators visible on hover
 * - "${t('products.addToCompare')}" checkbox overlay on hover
 * - Camera icon at bottom-left
 */
function renderImageSlider(card: ProductListingCard): string {
  // ──────────────────────────────────────────────────────────────
  // DISABLED: Camera/visual search icon (bottom-left overlay)
  // İleride tekrar etkinleştirmek için:
  //   1) Yukarıdaki cameraSearchIcon() fonksiyonunun yorumunu kaldır
  //   2) Aşağıdaki cameraIconHtml'i return template'ine ekle
  //      (compare checkbox label'ının altına)
  //
  // const cameraIconHtml = `
  //   <div
  //     class="absolute bottom-2 start-2 z-10 flex h-6 w-6 items-center justify-center rounded-full opacity-60 group-hover/img:opacity-100 transition-opacity"
  //     style="background: rgba(0,0,0,0.4); color: #ffffff;"
  //     aria-hidden="true"
  //   >
  //     ${cameraSearchIcon()}
  //   </div>
  // `;
  // ──────────────────────────────────────────────────────────────

  // Build image list from available source
  const realImageSrc = card.imageSrc || "";
  const imageList: string[] = realImageSrc ? [realImageSrc] : [];
  const hasMultiple = imageList.length > 1;

  let slidesHtml: string;

  if (imageList.length > 0) {
    slidesHtml = imageList
      .map(
        (src, i) => `
      <div class="w-full h-full flex-shrink-0">
        <img src="${escapeHtml(sanitizeUrl(src))}" alt="${escapeHtml(card.name)}${i > 0 ? ` - ${i + 1}` : ""}" class="w-full h-full object-cover" decoding="async" ${i > 0 ? 'loading="lazy"' : ""} />
      </div>
    `
      )
      .join("");
  } else {
    // No image — show placeholder
    slidesHtml = `
      <div class="w-full h-full flex-shrink-0 flex items-center justify-center bg-gray-100">
        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
      </div>
    `;
  }

  const arrowsHtml = hasMultiple
    ? `
    <!-- Prev arrow -->
    <button type="button"
      class="product-slider-prev absolute start-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow-sm opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-white cursor-pointer"
      data-slider-prev="${escapeHtml(card.id)}" aria-label="Previous"
      onclick="event.preventDefault(); event.stopPropagation(); this.dispatchEvent(new CustomEvent('slider-nav', {detail:{id:this.dataset.sliderPrev,dir:-1},bubbles:true}));">
      <svg class="w-3.5 h-3.5 text-gray-700 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <!-- Next arrow -->
    <button type="button"
      class="product-slider-next absolute end-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow-sm opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-white cursor-pointer"
      data-slider-next="${escapeHtml(card.id)}" aria-label="Next"
      onclick="event.preventDefault(); event.stopPropagation(); this.dispatchEvent(new CustomEvent('slider-nav', {detail:{id:this.dataset.sliderNext,dir:1},bubbles:true}));">
      <svg class="w-3.5 h-3.5 text-gray-700 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  `
    : "";

  const dotsHtml = hasMultiple
    ? `
    <div class="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
      ${imageList.map((_, i) => `<div class="w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}" data-slider-dot="${escapeHtml(card.id)}" data-dot-index="${i}"></div>`).join("")}
    </div>
  `
    : "";

  return `
    <div class="relative aspect-square w-full flex-shrink-0 overflow-hidden group/img">
      <!-- Slides container -->
      <div class="product-slider flex w-full h-full transition-transform duration-300 ease-out"
           data-slider-id="${escapeHtml(card.id)}"
           style="transform: translateX(0%)">
        ${slidesHtml}
      </div>

      ${arrowsHtml}
      ${dotsHtml}

      <!-- Camera icon (bottom-left) - DISABLED -->
    </div>
  `;
}

/**
 * Country flag emoji lookup
 */
function countryFlag(code?: string): string {
  const flags: Record<string, string> = {
    CN: "\u{1F1E8}\u{1F1F3}",
    TR: "\u{1F1F9}\u{1F1F7}",
    IN: "\u{1F1EE}\u{1F1F3}",
    BD: "\u{1F1E7}\u{1F1E9}",
    VN: "\u{1F1FB}\u{1F1F3}",
    DE: "\u{1F1E9}\u{1F1EA}",
  };
  return code ? flags[code] || "" : "";
}

/**
 * Checkmark icon for selling point badge
 */
function checkIcon(): string {
  return `
    <svg class="w-3.5 h-3.5 shrink-0 text-[rgb(34,137,31)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `;
}

/**
 * Star icon for supplier rating
 */
function starIcon(): string {
  return `<svg style="width:12px;height:12px;flex-shrink:0;" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;
}

/**
 * Render a single product card (fy26 snapshot-matched design)
 */
function renderProductListingCard(card: ProductListingCard): string {
  // Selling point badge
  const sellingPointText = card.sellingPoint || card.promo || "";
  const sellingPointHtml = sellingPointText
    ? `<div data-sp-slot="${escapeHtml(card.id)}" class="flex group-data-[list-mode=grid]/grid:hidden min-[480px]:group-data-[list-mode=grid]/grid:flex items-center min-w-0 gap-1 mt-1 text-[11px] leading-tight min-[480px]:text-xs text-[rgb(34,137,31)]">
        ${checkIcon()}
        <span class="truncate min-[480px]:whitespace-normal">${escapeHtml(sellingPointText)}</span>
      </div>`
    : "";
  // Grid 2'li (mobil <480) kartta selling point görselin altında tam genişlik şerit (ribbon) olarak görünür.
  // "Çok satan" → amber + yıldız; diğerleri → yeşil + check (referans: Liste Karti 320px GridCard).
  const sellingIsAmber = /satan/i.test(sellingPointText);
  const sellingIcon = sellingIsAmber ? starIcon() : checkIcon();
  const sellingTone = sellingIsAmber ? "text-[#A6730A]" : "text-[rgb(34,137,31)]";
  const sellingOverlayHtml = sellingPointText
    ? `<div data-sp-slot="${escapeHtml(card.id)}" class="hidden group-data-[list-mode=grid]/grid:flex min-[480px]:group-data-[list-mode=grid]/grid:hidden absolute inset-x-0 bottom-0 z-20 items-center gap-1 px-2 py-1 bg-white/95 border-t border-gray-100 text-[9.5px] font-extrabold whitespace-nowrap overflow-hidden ${sellingTone} pointer-events-none">${sellingIcon}<span class="truncate">${escapeHtml(sellingPointText)}</span></div>`
    : "";

  // MOQ
  const moqHtml = card.moq
    ? `<div class="text-[11px] leading-tight min-[480px]:text-sm min-[480px]:leading-[18px] font-normal text-gray-900">${t("products.minOrder", { moq: card.moq })}</div>`
    : "";

  // Supplier name
  const supplierNameHtml = card.supplierName
    ? `<a class="hidden min-[480px]:block text-xs font-normal text-[#767676] no-underline whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">${escapeHtml(card.supplierName)}</a>`
    : "";

  // Brand chip — small badge with brand name (logo if available)
  const brandHtml = card.brandName
    ? `<a class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-700 hover:bg-gray-100 no-underline max-w-full"
          href="${escapeHtml(sanitizeUrl(getBrandUrl({ slug: card.brandSlug })))}"
          title="${escapeHtml(card.brandName)}">
        ${card.brandLogo ? `<img src="${escapeHtml(sanitizeUrl(card.brandLogo))}" alt="${escapeHtml(card.brandName)}" class="w-3 h-3 object-contain" />` : ""}
        <span class="whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(card.brandName)}</span>
      </a>`
    : "";

  // Supplier info: year, country, rating
  const yearCountryParts: string[] = [];
  if (card.supplierYears)
    yearCountryParts.push(
      `<span>${t("products.yearLabel", { count: String(card.supplierYears) })}</span>`
    );
  if (card.supplierCountry)
    yearCountryParts.push(
      `${countryFlag(card.supplierCountry)} <span>${escapeHtml(card.supplierCountry)}</span>`
    );

  const yearCountryHtml =
    yearCountryParts.length > 0
      ? `<a class="text-xs font-normal text-black no-underline">${yearCountryParts.join(" ")}</a>`
      : "";

  const ratingHtml = card.rating
    ? `<span class="text-xs font-normal text-gray-900 leading-4"><span>${card.rating}</span>/5.0${card.reviewCount ? ` <span>(${card.reviewCount.toLocaleString()})</span>` : ""}</span>`
    : "";

  const supplierInfoParts = [yearCountryHtml, ratingHtml].filter(Boolean);
  const supplierContentHtml =
    card.supplierYears || card.supplierCountry || card.rating
      ? `<div class="hidden min-[480px]:flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] min-[480px]:text-xs font-normal leading-4 text-black mt-0.5">
        ${starIcon()}
        ${supplierInfoParts.join("")}
      </div>`
      : "";

  const isOOS = !!card.outOfStock;
  // Sprint 2.6: KYB unverified seller — fiyatı gizle + sepete ekle disable + amber badge.
  // OOS önceliği KYB'den yüksek (envanter bilgisi her zaman gösterilmeli).
  const kybBlocked = card.sellerKybVerified === false;
  const oosBadgeHtml = isOOS
    ? `<div class="absolute top-2 start-2 z-20 px-2 py-1 rounded-md bg-red-600 text-white text-[11px] font-semibold shadow-sm pointer-events-none">${t("products.outOfStock")}</div>`
    : "";
  const oosOverlayHtml = isOOS
    ? `<div class="absolute inset-0 z-10 bg-white/40 pointer-events-none"></div>`
    : "";
  const kybBadgeHtml =
    kybBlocked && !isOOS
      ? `<div class="absolute top-2 end-2 z-20 px-2 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-semibold shadow-sm pointer-events-none max-w-[60%] truncate" title="${t("common.kybGateBannerTitle")}">${t("common.kybGateBannerTitle")}</div>`
      : "";
  const addToCartBtnHtml = isOOS
    ? `<button type="button" class="searchx-product-e-abutton flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium whitespace-nowrap rounded-md bg-gray-200 text-gray-500 cursor-not-allowed
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8"
              disabled aria-disabled="true">
        ${t("products.outOfStock")}
      </button>`
    : kybBlocked
      ? `<button type="button" class="searchx-product-e-abutton th-btn flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium whitespace-nowrap opacity-50 !cursor-not-allowed pointer-events-none
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8"
              disabled aria-disabled="true" title="${t("common.addToCartDisabledKyb")}">
        ${t("products.addToCart")}
      </button>`
      : `<button type="button" class="searchx-product-e-abutton th-btn flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8"
              data-add-to-cart="${escapeHtml(card.id)}">
        ${t("products.addToCart")}
      </button>`;

  const escapeAttr = (s: string): string => escapeHtml(s);
  const moqDigits = card.moq?.match(/\d+/)?.[0] ?? "1";
  const chatBtnHtml = `<button type="button"
              data-chat-trigger
              data-product-id="${escapeAttr(card.id)}"
              data-product-title="${escapeAttr(card.name)}"
              data-product-price="${escapeAttr(card.price)}"
              data-product-thumb="${escapeAttr(card.imageSrc ?? "")}"
              data-product-min-order="${escapeAttr(moqDigits)}"
              class="th-btn-outline searchx-product-e-chatbutton flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        ${t("chat.chatWithSeller")}
      </button>`;

  // ── Yoğun (mobil list) görünüm — sadece <480px list modunda görünür, ≥480px list ve grid modunda gizli ──
  // Kompakt meta satırı: ★ rating · ülke · Min. {moq}  (referans: Alibaba dense list)
  const denseMetaParts: string[] = [];
  if (card.rating) {
    const reviewBit = card.reviewCount
      ? `<span class="text-gray-400">(${card.reviewCount.toLocaleString()})</span>`
      : "";
    denseMetaParts.push(
      `<span class="inline-flex items-center gap-0.5">${starIcon()}<span class="font-medium text-gray-700">${card.rating}</span>${reviewBit}</span>`
    );
  }
  if (card.moq) denseMetaParts.push(`<span class="whitespace-nowrap">Min. ${escapeHtml(card.moq)}</span>`);
  const denseMetaHtml = denseMetaParts.length
    ? `<div class="flex min-[480px]:hidden items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] leading-tight text-gray-500">${denseMetaParts.join(`<span class="text-gray-300">·</span>`)}</div>`
    : "";

  // Sağ kolon: küçük chat butonu (outline) + yuvarlak sepete ekle butonu (sarı), dikey yığılı.
  const plusIcon = `<svg class="w-5 h-5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
  const denseAddCls = "shrink-0 flex items-center justify-center !w-10 !h-10 !p-0 rounded-full";
  const denseAddBtnHtml = isOOS
    ? `<button type="button" class="${denseAddCls} bg-gray-200 text-gray-400 cursor-not-allowed" disabled aria-disabled="true" aria-label="${t("products.outOfStock")}">${plusIcon}</button>`
    : kybBlocked
      ? `<button type="button" class="${denseAddCls} th-btn opacity-50 !cursor-not-allowed pointer-events-none" disabled aria-disabled="true" aria-label="${t("products.addToCart")}" title="${t("common.addToCartDisabledKyb")}">${plusIcon}</button>`
      : `<button type="button" class="${denseAddCls} th-btn" data-add-to-cart="${escapeHtml(card.id)}" aria-label="${t("products.addToCart")}">${plusIcon}</button>`;
  const denseChatBtnHtml = `<button type="button" data-chat-trigger
        data-product-id="${escapeAttr(card.id)}"
        data-product-title="${escapeAttr(card.name)}"
        data-product-price="${escapeAttr(card.price)}"
        data-product-thumb="${escapeAttr(card.imageSrc ?? "")}"
        data-product-min-order="${escapeAttr(moqDigits)}"
        class="th-btn-outline shrink-0 flex items-center justify-center !w-10 !h-10 !p-0 rounded-full" aria-label="${t("chat.chatWithSeller")}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>`;
  const denseActionsHtml = `<div class="hidden group-data-[list-mode=list]/grid:flex min-[480px]:group-data-[list-mode=list]/grid:!hidden flex-col items-center gap-2 col-start-3 row-start-1 self-center pl-1">
      ${denseChatBtnHtml}
      ${denseAddBtnHtml}
    </div>`;

  // ── Grid 2'li (mobil <480) aksiyon satırı: geniş "Sepete ekle" (sepet ikonlu) + küçük yuvarlak chat ──
  // Sepet ikonu sadece ≥400px'de görünür — 320px dar kartta "Sepete ekle" metnine yer açar (okunabilirlik).
  const cartIcon = `<span class="hidden min-[400px]:inline-flex shrink-0"><svg class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H5"/></svg></span>`;
  const gridAddCls =
    "flex-1 min-w-0 flex items-center justify-center gap-1 h-8 rounded-md !px-1 text-[11px] font-semibold whitespace-nowrap";
  const gridAddBtnHtml = isOOS
    ? `<button type="button" class="${gridAddCls} bg-gray-200 text-gray-500 cursor-not-allowed" disabled aria-disabled="true">${t("products.outOfStock")}</button>`
    : kybBlocked
      ? `<button type="button" class="${gridAddCls} th-btn opacity-50 !cursor-not-allowed pointer-events-none" disabled aria-disabled="true" title="${t("common.kybGateBannerTitle")}">${cartIcon}<span class="truncate">${t("products.addToCart")}</span></button>`
      : `<button type="button" class="${gridAddCls} th-btn" data-add-to-cart="${escapeHtml(card.id)}">${cartIcon}<span class="truncate">${t("products.addToCart")}</span></button>`;
  const gridChatBtnHtml = `<button type="button" data-chat-trigger
        data-product-id="${escapeAttr(card.id)}"
        data-product-title="${escapeAttr(card.name)}"
        data-product-price="${escapeAttr(card.price)}"
        data-product-thumb="${escapeAttr(card.imageSrc ?? "")}"
        data-product-min-order="${escapeAttr(moqDigits)}"
        class="th-btn-outline shrink-0 flex items-center justify-center !w-8 !h-8 !p-0 rounded-md" aria-label="${t("chat.chatWithSeller")}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>`;
  const gridMobileActionsHtml = `<div class="hidden group-data-[list-mode=grid]/grid:flex min-[480px]:group-data-[list-mode=grid]/grid:hidden items-center gap-1 px-2 mt-auto pt-2.5">
      ${gridAddBtnHtml}
      ${gridChatBtnHtml}
    </div>`;

  return `
    <div class="fy26-product-card-wrapper flex flex-col justify-between w-full rounded-md overflow-hidden bg-white pb-3 border-0
            group-data-[list-mode=grid]/grid:border group-data-[list-mode=grid]/grid:border-gray-200 group-data-[list-mode=grid]/grid:rounded-md
            min-[480px]:group-data-[list-mode=grid]/grid:border-0
            group-data-[list-mode=list]/grid:grid
            group-data-[list-mode=list]/grid:grid-cols-[76px_1fr_auto]
            group-data-[list-mode=list]/grid:grid-rows-[1fr_auto]
            group-data-[list-mode=list]/grid:gap-x-3
            group-data-[list-mode=list]/grid:gap-y-0
            group-data-[list-mode=list]/grid:p-3
            group-data-[list-mode=list]/grid:border
            group-data-[list-mode=list]/grid:border-[var(--product-card-border,#e5e7eb)]
            group-data-[list-mode=list]/grid:rounded-lg
            group-data-[list-mode=list]/grid:overflow-visible
            min-[480px]:group-data-[list-mode=list]/grid:grid-cols-[200px_1fr]
            min-[480px]:group-data-[list-mode=list]/grid:gap-x-4
            min-[1200px]:group-data-[list-mode=list]/grid:flex
            min-[1200px]:group-data-[list-mode=list]/grid:flex-row
            min-[1200px]:group-data-[list-mode=list]/grid:items-start
            min-[1200px]:group-data-[list-mode=list]/grid:gap-4">
      <!-- Image area (full-bleed, kart padding'inin dışında) -->
      <a href="${escapeHtml(sanitizeUrl(card.href))}" class="searchx-img-area relative mb-3 block
            group-data-[list-mode=grid]/grid:mx-3 group-data-[list-mode=grid]/grid:mt-3 group-data-[list-mode=grid]/grid:mb-2 group-data-[list-mode=grid]/grid:rounded-md group-data-[list-mode=grid]/grid:border group-data-[list-mode=grid]/grid:border-gray-200 group-data-[list-mode=grid]/grid:overflow-hidden
            min-[480px]:group-data-[list-mode=grid]/grid:mx-0 min-[480px]:group-data-[list-mode=grid]/grid:mt-0 min-[480px]:group-data-[list-mode=grid]/grid:mb-3 min-[480px]:group-data-[list-mode=grid]/grid:rounded-none min-[480px]:group-data-[list-mode=grid]/grid:border-0
            group-data-[list-mode=list]/grid:row-[1/-1]
            group-data-[list-mode=list]/grid:col-start-1
            group-data-[list-mode=list]/grid:self-start
            group-data-[list-mode=list]/grid:mb-0
            group-data-[list-mode=list]/grid:w-full
            group-data-[list-mode=list]/grid:rounded-md
            group-data-[list-mode=list]/grid:border
            group-data-[list-mode=list]/grid:border-gray-200
            group-data-[list-mode=list]/grid:overflow-hidden
            min-[480px]:group-data-[list-mode=list]/grid:border-0
            min-[480px]:group-data-[list-mode=list]/grid:rounded-none
            min-[1200px]:group-data-[list-mode=list]/grid:w-60
            min-[1200px]:group-data-[list-mode=list]/grid:shrink-0">
        ${oosBadgeHtml}
        ${kybBadgeHtml}
        ${oosOverlayHtml}
        ${renderImageSlider(card)}
        ${sellingOverlayHtml}
      </a>

      <!-- Content area -->
      <div class="fy26-product-card-content flex-1 flex flex-col
            group-data-[list-mode=list]/grid:col-start-2
            group-data-[list-mode=list]/grid:row-start-1
            group-data-[list-mode=list]/grid:min-w-0
            min-[1200px]:group-data-[list-mode=list]/grid:flex-1">
        <!-- Title area -->
        <div class="px-3">
          ${brandHtml ? `<div class="mb-1.5 group-data-[list-mode=list]/grid:hidden min-[480px]:group-data-[list-mode=list]/grid:block">${brandHtml}</div>` : ""}
          <h2 class="searchx-product-e-title text-[13px] font-normal leading-[17px] min-h-[34px] min-[480px]:text-sm min-[480px]:leading-[20px] min-[480px]:min-h-[40px] text-[#333] overflow-hidden text-ellipsis line-clamp-2 m-0
            group-data-[list-mode=list]/grid:line-clamp-1 group-data-[list-mode=list]/grid:!min-h-0 min-[480px]:group-data-[list-mode=list]/grid:line-clamp-2
            min-[480px]:group-data-[list-mode=list]/grid:!h-auto
            min-[480px]:group-data-[list-mode=list]/grid:text-base
            min-[480px]:group-data-[list-mode=list]/grid:leading-[22px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-[13px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:leading-[17px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-[51px]">
            <a href="${escapeHtml(sanitizeUrl(card.href))}" target="_blank" class="text-inherit no-underline hover:text-primary-500"><span>${escapeHtml(card.name)}</span></a>
          </h2>
          ${sellingPointHtml}
          ${denseMetaHtml}
        </div>

        <!-- Price area -->
        <div class="px-3 mt-2">
          ${
            kybBlocked
              ? `<div class="fy26-price text-sm font-medium leading-[20px] text-amber-800" title="${t("common.kybGateBannerTitle")}">${t("common.kybGateBannerTitle")}</div>`
              : `<div class="fy26-price text-[15px] leading-tight font-semibold text-gray-900 whitespace-nowrap min-[480px]:text-lg sm:text-xl sm:leading-[26px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-base
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:leading-[1.375rem]">${formatPrice(card.price)}</div>`
          }
          <div class="fy26-moq-stats hidden min-[480px]:flex gap-1.5 flex-wrap mt-0.5
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:leading-4
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:[&_.text-sm]:text-xs
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:[&_.text-sm]:leading-4">
            ${moqHtml}
          </div>
          ${isOOS ? `<div class="mt-1 text-xs font-medium text-red-600">${t("products.outOfStock")}</div>` : ""}
        </div>

        <!-- Supplier area -->
        <div class="px-3 mt-2">
          ${supplierNameHtml}
          ${supplierContentHtml}
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-area-layout flex group-data-[list-mode=list]/grid:hidden min-[480px]:group-data-[list-mode=list]/grid:flex group-data-[list-mode=grid]/grid:hidden min-[480px]:group-data-[list-mode=grid]/grid:flex flex-col min-[480px]:flex-row gap-2 px-3 mt-3 items-stretch min-[480px]:items-center
            group-data-[list-mode=list]/grid:col-start-2
            group-data-[list-mode=list]/grid:row-start-2
            group-data-[list-mode=list]/grid:px-0
            group-data-[list-mode=list]/grid:mt-2
            min-[1200px]:group-data-[list-mode=list]/grid:flex-col
            min-[1200px]:group-data-[list-mode=list]/grid:items-stretch
            min-[1200px]:group-data-[list-mode=list]/grid:w-[140px]
            min-[1200px]:group-data-[list-mode=list]/grid:mt-0
            min-[1200px]:group-data-[list-mode=list]/grid:shrink-0">
        ${addToCartBtnHtml}
        ${chatBtnHtml}
      </div>
      ${gridMobileActionsHtml}
      ${denseActionsHtml}
    </div>
  `;
}

/**
 * No results component for empty state
 */
function renderNoResults(): string {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <!-- Search illustration -->
      <div class="relative mb-6">
        <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <!-- Small X badge -->
        <div class="absolute -top-1 -end-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg class="h-4 w-4 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${t("products.noResults")}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        ${t("products.noResultsDesc")}
      </p>
      <button
        type="button"
        class="th-btn inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-colors"
        data-filter-action="clear-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        ${t("products.clearFilters")}
      </button>
    </div>
  `;
}

/** No-op — ProductListingGrid uses CSS grid, no JS initialization needed. */
export function initProductListingGrid(): void {}

/**
 * Navigate a product slider to the given index using translateX.
 * Updates the slider transform and dot indicators.
 */
function navigateSlider(sliderId: string, direction: number): void {
  const slider = document.querySelector<HTMLElement>(`[data-slider-id="${sliderId}"]`);
  if (!slider) return;

  const totalSlides = slider.children.length;
  if (totalSlides <= 1) return;

  // Parse current index from transform
  const currentTransform = slider.style.transform;
  const currentIndex = Math.abs(parseInt(currentTransform.match(/-?(\d+)/)?.[1] || "0")) / 100;

  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = totalSlides - 1;
  if (newIndex >= totalSlides) newIndex = 0;

  slider.style.transform = `translateX(-${newIndex * 100}%)`;

  // Update dots
  const dots = document.querySelectorAll<HTMLElement>(`[data-slider-dot="${sliderId}"]`);
  dots.forEach((dot, i) => {
    if (i === newIndex) {
      dot.classList.remove("bg-white/50");
      dot.classList.add("bg-white");
    } else {
      dot.classList.remove("bg-white");
      dot.classList.add("bg-white/50");
    }
  });
}

/**
 * Navigate a product slider to a specific index (for dot clicks).
 */
function navigateSliderTo(sliderId: string, targetIndex: number): void {
  const slider = document.querySelector<HTMLElement>(`[data-slider-id="${sliderId}"]`);
  if (!slider) return;

  const totalSlides = slider.children.length;
  if (totalSlides <= 1 || targetIndex < 0 || targetIndex >= totalSlides) return;

  slider.style.transform = `translateX(-${targetIndex * 100}%)`;

  // Update dots
  const dots = document.querySelectorAll<HTMLElement>(`[data-slider-dot="${sliderId}"]`);
  dots.forEach((dot, i) => {
    if (i === targetIndex) {
      dot.classList.remove("bg-white/50");
      dot.classList.add("bg-white");
    } else {
      dot.classList.remove("bg-white");
      dot.classList.add("bg-white/50");
    }
  });
}

/**
 * Initialize product image sliders.
 * Uses event delegation on document for prev/next arrows and dot clicks.
 * Prevents navigation events from following the product card link.
 */
let _slidersInitialized = false;
export function initProductSliders(): void {
  if (_slidersInitialized) return;
  _slidersInitialized = true;

  // Arrow buttons use inline onclick (stopPropagation to prevent <a> navigate)
  // and dispatch custom 'slider-nav' event that bubbles to document
  document.addEventListener("slider-nav", ((e: CustomEvent) => {
    const { id, dir } = e.detail || {};
    if (id && typeof dir === "number") navigateSlider(id, dir);
  }) as EventListener);

  // Dot clicks
  document.addEventListener("click", (e: MouseEvent) => {
    const dotEl = (e.target as HTMLElement).closest<HTMLElement>("[data-dot-index]");
    if (dotEl) {
      e.preventDefault();
      e.stopPropagation();
      const sliderId = dotEl.getAttribute("data-slider-dot");
      const dotIndex = parseInt(dotEl.getAttribute("data-dot-index") ?? "0", 10);
      if (sliderId) navigateSliderTo(sliderId, dotIndex);
    }
  });
}

/**
 * ProductListingGrid Component
 * Renders a responsive grid of product cards with hover zoom effect.
 *
 * @param products - Array of products to display (defaults to mock data)
 * @returns HTML string for the product grid
 *
 * Grid Configuration (per spec):
 * - Mobile (< 768px): 2 columns
 * - Tablet (768px - 1023px): 3 columns
 * - Desktop (1024px+): 4 columns
 * See src/style.css .product-grid for CSS implementation
 *
 * Hover Zoom Effect:
 * - transition-transform duration-500 ease-out
 * - group-hover/product:scale-110 (10% zoom)
 */
export function ProductListingGrid(products: ProductListingCard[] = []): string {
  if (products.length === 0) {
    return `
      <section aria-label="${t("products.productList")}" class="flex-1">
        <div
          class="group/grid grid grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4 data-[list-mode=list]:!grid-cols-1 data-[list-mode=list]:!gap-3 product-grid"
          style="gap: var(--product-grid-gap, 12px);"
          data-list-mode="grid"
          role="list"
          aria-label="${t("products.productListLabel")}"
        >
          ${renderNoResults()}
        </div>
      </section>
    `;
  }

  return `
    <section aria-label="${t("products.productList")}" class="flex-1">
      <div
        class="group/grid grid grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4 data-[list-mode=list]:!grid-cols-1 data-[list-mode=list]:!gap-3 product-grid"
        style="gap: var(--product-grid-gap, 12px);"
        data-list-mode="grid"
        role="list"
        aria-label="${t("products.productListLabel")}"
      >
        ${products.map((card) => `<div role="listitem" class="flex">${renderProductListingCard(card)}</div>`).join("")}
      </div>
    </section>
  `;
}

/**
 * Re-render the product grid in-place with a new set of products.
 * Called by the filter engine when filters/sort change.
 */
export function rerenderProductGrid(products: ProductListingCard[]): void {
  const grid = document.querySelector<HTMLElement>(".product-grid");
  if (!grid) return;

  // Preserve the current view mode
  const isListView = grid.dataset.listMode === "list";

  if (products.length === 0) {
    grid.innerHTML = renderNoResults();
  } else {
    grid.innerHTML = products
      .map((card) => `<div role="listitem" class="flex">${renderProductListingCard(card)}</div>`)
      .join("");
  }

  // Re-apply list view classes if it was in list mode
  if (isListView) {
    setGridViewMode("list");
  } else {
    // Ensure all grid classes are correct just in case
    setGridViewMode("grid");
  }
}

/**
 * Export helper to render grid with custom products
 */
export { renderProductListingCard, renderNoResults };

/**
 * Toggle grid between 'grid' and 'list' view modes using Tailwind classes.
 */
export function setGridViewMode(mode: ViewMode): void {
  const grid = document.querySelector<HTMLElement>(".product-grid");
  if (!grid) return;

  // data-list-mode attribute controls layout via Tailwind group-data variants
  grid.dataset.listMode = mode === "list" ? "list" : "grid";
}
