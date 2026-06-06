import type { OrderSummary as OrderSummaryData, OrderSummaryThumbnail } from "../../types/checkout";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import { getSellerUrl } from "../../utils/sellerUrl";
import { btn } from "../../utils/ui/button";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

export interface OrderSummaryProps {
  data: OrderSummaryData;
  /** Ödeme yapılacak satıcı(lar); sağ panelin altında gösterilir. */
  payeeSuppliers?: { id: string; name: string }[];
}

function renderThumbnailGrid(thumbnails: OrderSummaryThumbnail[], itemCount: number): string {
  if (thumbnails.length === 0) return "";

  const visibleThumbnails = thumbnails.slice(0, 4);
  const grid = visibleThumbnails
    .map(
      (thumb, idx) => `
      <div class="relative w-10 sm:w-[48px] h-10 sm:h-[48px] min-w-[40px] sm:min-w-[48px] rounded border border-[#e5e5e5]">
        <img class="w-full h-full object-cover rounded" src="${escapeHtml(sanitizeUrl(thumb.image))}" alt="" />
        ${idx === 0 ? `<div class="absolute -top-1.5 -end-1.5 flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] rounded-full px-1 bg-[#222222] text-white text-[11px] sm:text-[12px] font-bold z-10 leading-none">${itemCount}</div>` : ""}
      </div>`
    )
    .join("");

  return `
    <div class="flex gap-1.5 sm:gap-2 mb-3 sm:mb-5">
      ${grid}
    </div>`;
}

export function OrderSummary({ data, payeeSuppliers = [] }: OrderSummaryProps): string {
  const cur = getSelectedCurrency();
  const fmt = (v: number) => formatCurrency(v, cur);

  const subtotalStr = fmt(data.itemSubtotal);
  const shippingStr = fmt(data.shipping);
  const totalStr = fmt(data.total);
  const implicitDiscount = Number((data.itemSubtotal + data.shipping - data.total).toFixed(2));

  // Ödeme yapılacak satıcı(lar) bloğu — her satıcı kartı, mağaza sayfasına link verir.
  const validSuppliers = payeeSuppliers.filter((s) => s.name && s.id);
  const payeeRows = validSuppliers
    .map(
      (s) => `
    <a
      href="${escapeHtml(sanitizeUrl(getSellerUrl({ id: s.id })))}"
      class="group flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-[#f9fafb] border border-[#e5e5e5] rounded-md hover:border-[var(--color-primary-500)] hover:bg-white transition-colors no-underline"
      title="${escapeHtml(s.name)} mağazasına git"
    >
      <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-white border border-[#e5e5e5] flex items-center justify-center shrink-0 group-hover:border-[var(--color-primary-500)] transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#555] group-hover:text-[var(--color-primary-500)] transition-colors">
          <path d="M3 9l1.5-5h15L21 9" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M9 20v-6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="flex-1 text-[13px] sm:text-[15px] font-semibold text-[#222222] group-hover:text-[var(--color-primary-500)] transition-colors">${escapeHtml(s.name)}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[#999] group-hover:text-[var(--color-primary-500)] shrink-0 transition-colors">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  `
    )
    .join("");

  // Tek satıcı → satıcı kartı/kartları. Çok satıcı (global) → iSTOC platform kartı.
  // Logo küçük (h-4 = 16px) + "Güvenceli Ödeme" mini rozet trust signal olarak.
  const platformPayeeBlock = `
    <div class="mt-5 pt-5 border-t border-[#e5e5e5]">
      <div class="p-3 sm:p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md">
        <img src="/images/istoc-logo.png" alt="iSTOC" class="h-3.5 sm:h-4 w-auto mb-1.5 sm:mb-2" />
        <p class="text-[11px] sm:text-[12px] text-[#6b7280] leading-relaxed">Ödeme güvenli olarak platforma yapılır; sipariş satıcılara iSTOC güvencesi ile yönlendirilir.</p>
      </div>
    </div>`;

  const payeeBlock = validSuppliers.length
    ? `
    <div class="mt-5 pt-5 border-t border-[#e5e5e5]">
      <div class="flex flex-col gap-2">
        ${payeeRows}
      </div>
    </div>`
    : platformPayeeBlock;

  return `
    <div
      class="checkout-sidebar w-full p-4 sm:p-5 xl:p-[28px] bg-[#FFFFFF] border border-[#e5e5e5] rounded-md xl:max-h-[calc(100vh-48px)] overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 [&::-webkit-scrollbar-thumb]:rounded-full"
      x-data="checkoutOrderSummary({ itemSubtotal: ${data.itemSubtotal}, discount: ${implicitDiscount}, initialShippingFee: ${data.shipping}, currency: '${escapeHtml(cur)}' })"
    >
      <!-- Title -->
      <div class="text-[17px] sm:text-[20px] font-bold leading-7 text-[#222222] mb-5 font-inter">
        <span data-i18n="checkout.orderSummary">${t("checkout.orderSummary")}</span> (${data.itemCount} <span data-i18n="common.items">${t("common.items")}</span>)
      </div>

      <!-- Thumbnail Grid -->
      ${renderThumbnailGrid(data.thumbnails, data.itemCount)}

      <!-- Price Breakdown -->
      <div class="flex flex-col summary-amounts-layout-row">
        <div class="flex justify-between items-center py-[6px] text-[13px] sm:text-[14px] leading-5 text-[#222222]">
          <span data-i18n="checkout.itemSubtotal">${t("checkout.itemSubtotal")}</span>
          <span x-text="formatMoney(itemSubtotal)">${subtotalStr}</span>
        </div>
        <div class="flex justify-between items-center py-[6px] text-[13px] sm:text-[14px] leading-5 text-[#222222]">
          <span data-i18n="checkout.estimatedShipping">${t("checkout.estimatedShipping")}</span>
          <span x-text="formatMoney(shippingFee)">${shippingStr}</span>
        </div>
      </div>

      <!-- Coupon Code Section -->
      <div class="mt-3 mb-1">
        <!-- Input row (hidden when coupon applied) -->
        <template x-if="!couponApplied">
          <div class="flex gap-1.5 sm:gap-2">
            <input
              type="text"
              x-model="couponCode"
              @keydown.enter="applyCoupon()"
              placeholder="${t("checkout.couponPlaceholder")}" data-i18n-placeholder="checkout.couponPlaceholder"
              class="th-input th-input-md flex-1 min-w-0 text-[13px] sm:text-[14px]"
            />
            <button
              type="button"
              @click="applyCoupon()"
              class="th-btn-outline h-[var(--input-height-md)] shrink-0 px-3 sm:px-5 text-[13px] sm:text-[14px]"
            ><span data-i18n="common.apply">${t("common.apply")}</span></button>
          </div>
        </template>
        <!-- Applied coupon badge -->
        <template x-if="couponApplied">
          <div class="flex items-center justify-between bg-[#f0fdf4] border border-[#bbf7d0] rounded-md px-2.5 sm:px-3 py-2">
            <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <svg class="w-4 h-4 text-[#16a34a] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              <span class="text-[12px] sm:text-[14px] font-semibold text-[#16a34a] truncate" x-text="couponApplied.code"></span>
              <span class="text-[11px] sm:text-[13px] text-[#4b5563] truncate" x-text="'— ' + couponApplied.description"></span>
            </div>
            <button type="button" @click="removeCoupon()" class="text-[#6b7280] hover:text-[#ef4444] transition-colors cursor-pointer p-0.5" aria-label="Remove coupon">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </template>
        <!-- Error message -->
        <template x-if="couponError && !couponApplied">
          <p class="text-[13px] text-[#ef4444] mt-1" x-text="couponError"></p>
        </template>
      </div>

      <!-- Coupon discount row -->
      <template x-if="couponDiscount > 0">
        <div class="flex justify-between items-center py-[6px] text-[13px] sm:text-[14px] leading-5">
          <span class="text-[#16a34a]" data-i18n="checkout.couponDiscount">${t("checkout.couponDiscount")}</span>
          <span class="text-[#16a34a] font-semibold" x-text="'- ' + formatMoney(couponDiscount)"></span>
        </div>
      </template>

      <!-- Total -->
      <div class="flex justify-between items-center mt-[10px] pt-[16px] border-t border-[#e5e5e5] summary-amounts-total-block text-[17px] sm:text-[20px] font-bold text-[#222222]">
        <span data-i18n="checkout.total">${t("checkout.total")}</span>
        <span x-text="formatMoney(total)">${totalStr}</span>
      </div>

      <!-- Yasal onay: MSY md. 5 gereği açık, serbest, pre-checked olmayan onay. -->
      <div x-data="{ consented: false }" class="mt-4 sm:mt-[20px] mb-4 sm:mb-[20px]">
        <label class="flex items-start gap-2 cursor-pointer mb-2.5 sm:mb-3 select-none">
          <input
            type="checkbox"
            x-model="consented"
            class="sr-only"
          />
          <span class="th-checkbox relative mt-0.5" :class="{ 'is-checked': consented }">
            <svg class="absolute inset-0 m-auto" x-show="consented" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m5 13 4 4L19 7"/>
            </svg>
          </span>
          <span class="text-[11px] sm:text-[12px] leading-snug text-[#555]">
            <a href="/mesafeli-satis" target="_blank" rel="noopener" class="text-primary-600 underline hover:text-primary-700">Ön Bilgilendirme Formunu ve Mesafeli Satış Sözleşmesini</a>
            okudum, kabul ediyorum.
          </span>
        </label>

        <!-- Place Order Button (onay yoksa disabled; güvenli ödeme rozeti olarak kilit ikonu) -->
        <button
          type="button"
          id="summary-place-order-btn"
          :disabled="!consented"
          class="${btn({ variant: "success", block: true })} h-10 sm:h-11 text-[13px] sm:text-[14px]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="w-5 h-5 sm:w-[22px] sm:h-[22px]">
            <path d="M12 3 4 6v6c0 4.5 3.2 8.5 8 9 4.8-.5 8-4.5 8-9V6l-8-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span data-i18n="checkout.placeOrder">${t("checkout.placeOrder")}</span>
        </button>
      </div>

      <!-- Ödeme yapılacak satıcı -->
      ${payeeBlock}
    </div>
  `;
}
