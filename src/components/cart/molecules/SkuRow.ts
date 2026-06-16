/**
 * SKU row inside product card.
 * Alpine.js: Uses x-data on article for @click + $dispatch on delete button.
 * Checkbox and QuantityInput children have their own Alpine scopes.
 */

import type { CartSku } from "../../../types/cart";
import { Checkbox } from "../atoms/Checkbox";
import { PriceDisplay } from "../atoms/PriceDisplay";
import { QuantityInput } from "../atoms/QuantityInput";
import { formatPrice } from "../../../services/currencyService";
import { t } from "../../../i18n";
import trashIcon from "../../../assets/images/trash.png";
import { escapeHtml, sanitizeUrl } from "../../../utils/sanitize";

export interface SkuRowProps {
  sku: CartSku;
  productHref?: string;
}

export function SkuRow({ sku, productHref }: SkuRowProps): string {
  const unavailable = sku.isAvailable === false;
  const imgContent = `<img src="${escapeHtml(sanitizeUrl(sku.skuImage))}" alt="SKU ${escapeHtml(sku.id)}" class="w-full h-full object-cover" loading="lazy" />`;
  const imgWrapper = productHref
    ? `<a href="${escapeHtml(sanitizeUrl(productHref))}" class="block w-full h-full">${imgContent}</a>`
    : imgContent;

  return `
    <article class="sc-c-sku-container-new bg-[#fafafa] border border-[#e5e5e5] rounded-md p-[6px_8px] sm:p-[8px_12px] [&+&]:mt-1.5${unavailable ? " opacity-60" : ""}" data-sku-id="${escapeHtml(sku.id)}" x-data>
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <div class="shrink-0">
          ${Checkbox({ id: `sku-checkbox-${sku.id}`, checked: sku.selected, onChange: unavailable ? "" : `sku-select-${sku.id}`, disabled: unavailable })}
        </div>

        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-md border border-[#e5e5e5] overflow-hidden bg-[#fafafa] shrink-0${unavailable ? " grayscale" : ""}">
          ${imgWrapper}
        </div>

        <div class="flex-1 min-w-0 flex flex-col gap-0">
          <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            ${
              sku.isSample
                ? `<span class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded-full px-1.5 sm:px-2 py-0.5 w-fit">
              <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
              ${t("cart.sampleBadge")}
            </span>`
                : ""
            }
            <span class="text-[11px] sm:text-[13px] text-[#1a1a1a] leading-[1.4] truncate">${escapeHtml(sku.variantText)}</span>
          </div>
          ${
            sku.isSample
              ? `<span class="text-[10px] sm:text-[11px] text-text-tertiary">${t("cart.sampleNote")}</span>`
              : ""
          }
          ${
            unavailable
              ? `<span class="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded px-1.5 sm:px-2 py-0.5 w-fit">
            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            ${t("cart.noLongerForSale")}
          </span>`
              : ""
          }
          <div class="text-[12px] text-text-secondary font-medium">
            ${PriceDisplay({ amount: sku.unitPrice, fromCurrency: sku.baseCurrency || "USD", unit: `/${sku.unit}` })}
          </div>
        </div>

        <!-- Adet + satır toplamı: desktop'ta inline, mobilde alt satıra tam genişlik sağa yaslı -->
        <div class="flex items-center gap-2 sm:gap-3 max-sm:order-last max-sm:w-full max-sm:justify-end ${unavailable ? "pointer-events-none opacity-50" : ""}">
          ${QuantityInput({ id: `sku-qty-${sku.id}`, value: sku.quantity, min: sku.minQty || 1, max: sku.maxQty, step: sku.sellInMoqMultiples ? sku.minQty || 1 : 1 })}
          ${!unavailable ? `<span class="sc-c-sku-line-total text-[12px] sm:text-[14px] font-bold text-[#1a1a1a] m-0 whitespace-nowrap">${formatPrice(sku.unitPrice * sku.quantity, sku.baseCurrency || "USD")}</span>` : ""}
        </div>

        <div class="relative group shrink-0">
          <button type="button" class="sc-c-sku-delete-btn th-no-press w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] inline-flex items-center justify-center rounded-full text-text-tertiary hover:bg-white transition-colors" data-sku-id="${escapeHtml(sku.id)}" @click="$dispatch('sku-delete', { skuId: '${escapeHtml(sku.id)}' })" aria-label="${t("cart.removeSku")}">
            <img src="${trashIcon}" class="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] object-contain" alt="Sil" />
          </button>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 sm:gap-3 mt-1.5 ps-[calc(20px+0.5rem+36px+0.5rem)] sm:ps-[calc(20px+0.75rem+40px+0.75rem)] ${unavailable ? "pointer-events-none opacity-50" : ""}">
        ${
          !unavailable
            ? `<div class="sc-c-sku-moq-warning text-end text-[12px] sm:text-[14px] leading-[20px] text-[#dc2626] hidden">
          <span class="sc-c-sku-moq-missing">0</span> ${t("cart.moqMoreRequiredSuffix")}
          <button
            type="button"
            class="ms-1 underline font-semibold text-[#8b1e1e] hover:opacity-80"
            @click="$dispatch('sku-fill-min', { skuId: '${escapeHtml(sku.id)}' })"
          >
            ${t("cart.addAll")}
          </button>
        </div>`
            : ""
        }
      </div>
    </article>
  `.trim();
}

/** @deprecated Alpine.js handles sku-delete dispatch declaratively via @click + $dispatch. Kept as no-op for backward compatibility. */
export function initSkuRows(_container?: HTMLElement): void {
  // No-op — Alpine x-data on article + @click="$dispatch('sku-delete', ...)" handles delete dispatch.
}
