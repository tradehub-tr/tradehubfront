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

export interface SkuRowProps {
  sku: CartSku;
  productHref?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function SkuRow({ sku, productHref }: SkuRowProps): string {
  const unavailable = sku.isAvailable === false;
  const imgContent = `<img src="${escapeHtml(sku.skuImage)}" alt="SKU ${escapeHtml(sku.id)}" class="w-full h-full object-cover" loading="lazy" />`;
  const imgWrapper = productHref
    ? `<a href="${escapeHtml(productHref)}" class="block w-full h-full">${imgContent}</a>`
    : imgContent;

  return `
    <article class="sc-c-sku-container-new flex items-center gap-3 bg-[#fafaf8] border border-[#e8e6e0] rounded-[10px] p-[8px_12px] [&+&]:mt-1.5 transition-colors${unavailable ? " opacity-60" : ""}" data-sku-id="${escapeHtml(sku.id)}" x-data>
      <div class="shrink-0">
        ${Checkbox({ id: `sku-checkbox-${sku.id}`, checked: sku.selected, onChange: unavailable ? "" : `sku-select-${sku.id}`, disabled: unavailable })}
      </div>

      <div class="w-10 h-10 rounded-[6px] border border-[#e8e6e0] overflow-hidden bg-[#fafaf8] shrink-0${unavailable ? " grayscale" : ""}">
        ${imgWrapper}
      </div>

      <div class="flex-1 min-w-0 flex items-center gap-3">
        <div class="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div class="flex flex-col gap-0 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              ${
                sku.isSample
                  ? `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 w-fit">
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                ${t("cart.sampleBadge")}
              </span>`
                  : ""
              }
              <span class="text-[13px] text-[#1a1a1a] leading-[1.4] truncate">${escapeHtml(sku.variantText)}</span>
            </div>
            ${
              sku.isSample
                ? `<span class="text-[11px] text-text-tertiary">${t("cart.sampleNote")}</span>`
                : ""
            }
            ${
              unavailable
                ? `<span class="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5 w-fit">
              <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Bu ürün artık satışta değil
            </span>`
                : ""
            }
            <div class="text-[11px] text-[#8a877f] font-medium order-2">
              ${PriceDisplay({ amount: sku.unitPrice, fromCurrency: sku.baseCurrency || "USD", unit: `/${sku.unit}` })}
            </div>
          </div>

          <div class="relative group shrink-0">
            <button type="button" class="sc-c-sku-delete-btn w-[26px] h-[26px] inline-flex items-center justify-center rounded-full text-[#8a877f] hover:bg-white transition-colors" data-sku-id="${escapeHtml(sku.id)}" @click="$dispatch('sku-delete', { skuId: '${escapeHtml(sku.id)}' })" aria-label="SKU sil">
              <img src="${trashIcon}" class="w-[14px] h-[14px] object-contain" alt="Sil" />
            </button>
            <div class="absolute right-0 top-full mt-2 w-max px-3 py-2 bg-black text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Remove this variation
              <div class="absolute -top-1 right-3 w-2 h-2 bg-black rotate-45"></div>
            </div>
          </div>
        </div>

        <div class="flex flex-row items-center gap-3 ml-auto order-3 shrink-0 ${unavailable ? "pointer-events-none opacity-50" : ""}">
          ${QuantityInput({ id: `sku-qty-${sku.id}`, value: sku.quantity, min: sku.minQty || 1, max: sku.maxQty, step: sku.sellInMoqMultiples ? sku.minQty || 1 : 1 })}
          ${!unavailable ? `<span class="sc-c-sku-line-total text-[14px] font-bold text-[#1a1a1a] m-0">${formatPrice(sku.unitPrice * sku.quantity, sku.baseCurrency || "USD")}</span>` : ""}
          ${
            !unavailable
              ? `<div class="sc-c-sku-moq-warning text-right text-[14px] leading-[20px] text-[#dc2626] hidden">
            <span class="sc-c-sku-moq-missing">0</span> more required to check out
            <button
              type="button"
              class="ml-1 underline font-semibold text-[#8b1e1e] hover:opacity-80"
              @click="$dispatch('sku-fill-min', { skuId: '${escapeHtml(sku.id)}' })"
            >
              Add all
            </button>
          </div>`
              : ""
          }
        </div>
      </div>
    </article>
  `.trim();
}

/** @deprecated Alpine.js handles sku-delete dispatch declaratively via @click + $dispatch. Kept as no-op for backward compatibility. */
export function initSkuRows(_container?: HTMLElement): void {
  // No-op — Alpine x-data on article + @click="$dispatch('sku-delete', ...)" handles delete dispatch.
}
