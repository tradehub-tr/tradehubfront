/**
 * CartSummary Page Component
 * Right sidebar sticky summary panel with order totals, product thumbnails,
 * line items, CTA button, and assurance block.
 */

import type { CartSummaryData } from "../../../types/cart";
import { PriceDisplay } from "../atoms/PriceDisplay";
import { t } from "../../../i18n";
import { getSelectedCurrency } from "../../../services/currencyService";
import { cartStore } from "../state/CartStore";
import { escapeHtml, sanitizeUrl } from "../../../utils/sanitize";

function renderThumbnailGrid(items: CartSummaryData["items"]): string {
  if (items.length === 0) return "";

  const thumbnails = items
    .map(
      (item) => `
      <div class="checkout-item-card relative w-14 h-14 min-w-[56px] max-[380px]:w-12 max-[380px]:h-12 max-[380px]:min-w-[48px] sm:w-16 sm:h-16 sm:min-w-[64px] rounded overflow-hidden border border-[#e5e5e5] flex-shrink-0">
        <div class="block w-full h-full">
          <img class="w-full h-full object-cover" src="${escapeHtml(sanitizeUrl(item.image))}" alt="" />
        </div>
        <span class="absolute bottom-0 end-0 bg-black/60 text-white rounded-ss text-[11px] font-bold leading-4 px-1 py-px">${item.quantity}</span>
      </div>`
    )
    .join("");

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

export function CartSummary(data: CartSummaryData): string {
  const viewAllLink =
    data.items.length > 0
      ? `<div class="flex justify-end -mt-1.5 sm:-mt-2 mb-2 sm:mb-3"><button type="button" class="sc-view-all-items text-[12px] sm:text-[13px] font-medium text-primary-700 hover:text-primary-800 hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0" data-i18n="common.viewAll">${t("common.viewAll")}</button></div>`
      : "";

  return `
    <div class="sc-shopping-cart-summary-container w-full xl:w-[425px] max-h-[calc(100vh-120px)] p-4 max-[380px]:p-3 sm:p-5 xl:p-7 bg-white border border-[#e5e5e5] rounded-md overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div class="block text-[16px] sm:text-[18px] font-bold leading-tight text-text-primary mb-4 sm:mb-5"><span data-i18n="cart.orderSummary">${t("cart.orderSummary")}</span> (<span class="sc-summary-selected-count">${data.selectedCount}</span> ${t("common.item")})</div>

      ${renderThumbnailGrid(data.items)}
      ${viewAllLink}

      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center text-[13px] sm:text-[14px] leading-5 text-text-secondary">
          <span data-i18n="cart.productSubtotal">${t("cart.productSubtotal")}</span>
          <span class="sc-summary-product-subtotal">${PriceDisplay({ amount: data.productSubtotal, fromCurrency: getSelectedCurrency() })}</span>
        </div>
        ${
          data.discount > 0
            ? `
        <div class="sc-summary-discount-row flex justify-between items-center text-[13px] sm:text-[14px] leading-5">
          <span class="text-[#16a34a]" data-i18n="cart.productDiscount">${t("cart.productDiscount")}</span>
          <span class="sc-summary-discount text-[#16a34a] font-semibold">- ${PriceDisplay({ amount: data.discount, fromCurrency: getSelectedCurrency() })}</span>
        </div>`
            : `
        <div class="sc-summary-discount-row flex justify-between items-center text-[13px] sm:text-[14px] leading-5 hidden">
          <span class="text-[#16a34a]" data-i18n="cart.productDiscount">${t("cart.productDiscount")}</span>
          <span class="sc-summary-discount text-[#16a34a] font-semibold"></span>
        </div>`
        }
        <div class="flex justify-between items-center text-[13px] sm:text-[14px] leading-5 text-text-secondary">
          <span data-i18n="cart.shippingFee">${t("cart.shippingFee")}</span>
          <span>${PriceDisplay({ amount: data.shippingFee, fromCurrency: getSelectedCurrency() })}</span>
        </div>
      </div>

      <div class="flex justify-between items-center text-[15px] sm:text-[17px] font-bold leading-6 text-text-primary pt-3 sm:pt-4 border-t border-[#e5e5e5] mt-2">
        <span class="min-w-0 truncate me-2" data-i18n="cart.subtotalExTax">${t("cart.subtotalExTax")}</span>
        <span class="sc-summary-subtotal">${PriceDisplay({ amount: data.subtotal, fromCurrency: getSelectedCurrency(), bold: true })}</span>
      </div>

      ${
        data.discount > 0
          ? `
      <div class="sc-summary-savings-banner mt-3 w-full rounded-md px-3 py-2.5 flex items-center bg-[#f0fdf4] border border-[#bbf7d0]">
        <span class="text-[13px] sm:text-[14px] leading-5 text-[#15803d]">${t("cart.savedOnOrder", { amount: `<strong class="text-[#16a34a] font-bold">${PriceDisplay({ amount: data.discount, fromCurrency: getSelectedCurrency() })}</strong>` })}</span>
      </div>`
          : `
      <div class="sc-summary-savings-banner mt-3 w-full rounded-md px-3 py-2.5 flex items-center bg-[#f0fdf4] border border-[#bbf7d0] hidden">
        <span class="text-[13px] sm:text-[14px] leading-5 text-[#15803d]">${t("cart.savedOnOrder", { amount: '<strong class="text-[#16a34a] font-bold"></strong>' })}</span>
      </div>`
      }

      ${
        cartStore.hasUnverifiedSeller()
          ? `
      <div class="mt-4 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-300 rounded-md text-amber-800" role="alert">
        <svg class="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div class="text-xs leading-[1.5] flex-1 min-w-0">${t("common.cartHasUnverifiedItems")}</div>
      </div>
      <button type="button" disabled aria-disabled="true" class="sc-summary-checkout-btn flex items-center justify-center gap-1.5 sm:gap-2 w-full mt-3 th-btn-success h-10 sm:h-12 text-[14px] sm:text-base text-center opacity-50 !cursor-not-allowed pointer-events-none" title="${t("common.cartCheckoutBlockedKyb")}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sm:w-[22px] sm:h-[22px]">
          <path d="M12 3 4 6v6c0 4.5 3.2 8.5 8 9 4.8-.5 8-4.5 8-9V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span data-i18n="cart.checkout">${t("cart.checkout")}</span>
      </button>
      `
          : `
      <button type="button" class="sc-summary-checkout-btn flex items-center justify-center gap-1.5 sm:gap-2 w-full mt-3 sm:mt-4 th-btn-success h-10 sm:h-12 text-[14px] sm:text-base text-center" @click="$dispatch('checkout-global')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sm:w-[22px] sm:h-[22px]">
          <path d="M12 3 4 6v6c0 4.5 3.2 8.5 8 9 4.8-.5 8-4.5 8-9V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span data-i18n="cart.checkout">${t("cart.checkout")}</span>
      </button>
      `
      }
      <p class="sc-summary-checkout-warning mt-2 text-[11px] max-[380px]:text-[10px] sm:text-[13px] leading-[18px] text-[#dc2626] hidden"></p>

      <div class="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[#e5e5e5]">
        <div class="p-2.5 sm:p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md">
          <img src="/images/istoc-logo.png" alt="iSTOC" class="h-3.5 max-[380px]:h-3 sm:h-4 w-auto mb-1.5 sm:mb-2" />
          <p class="text-[11px] max-[380px]:text-[10px] sm:text-[12px] text-[#6b7280] leading-relaxed">${t("checkoutMfr.securePaymentNote")}</p>
        </div>
      </div>
    </div>
  `;
}
