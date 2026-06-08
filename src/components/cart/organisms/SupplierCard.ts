/**
 * Supplier card containing product rows.
 * Alpine.js: Uses inline x-data="{ expanded }" for accordion toggle.
 * @checkbox-change on section bridges supplier checkbox to supplier-select for CartPage.
 */

import type { CartSupplier } from "../../../types/cart";
import { Checkbox } from "../atoms/Checkbox";
import { ProductItem } from "../molecules/ProductItem";
import { t } from "../../../i18n";
import { btn } from "../../../utils/ui/button";
import { escapeHtml } from "../../../utils/sanitize";

export interface SupplierCardProps {
  supplier: CartSupplier;
  isSingleSupplier?: boolean;
}

export function SupplierCard({ supplier, isSingleSupplier = true }: SupplierCardProps): string {
  const products = supplier.products.map((product) => ProductItem({ product })).join("");
  const isOpen = isSingleSupplier;

  const totalSupplierSkus = supplier.products.reduce((acc, p) => acc + p.skus.length, 0);
  const selectedSupplierSkus = supplier.products.reduce(
    (acc, p) => acc + p.skus.filter((s) => s.selected).length,
    0
  );
  const supplierIndeterminate =
    selectedSupplierSkus > 0 && selectedSupplierSkus < totalSupplierSkus;

  // Sprint 2.6: KYB doğrulanmamış satıcı → sepette uyarı + ödeme butonu disable.
  const kybBlocked = supplier.sellerKybVerified === false;
  const kybBannerHtml = kybBlocked
    ? `
      <div class="flex items-start gap-2 mx-4 my-2 px-3 py-2.5 bg-amber-50 border border-amber-300 rounded-md text-amber-800" role="alert">
        <svg class="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div class="text-xs leading-[1.5] flex-1 min-w-0">
          <div class="font-semibold mb-0.5">${t("common.kybGateBannerTitle")}</div>
          <div>${t("common.cartItemUnverifiedSeller")}</div>
        </div>
      </div>
    `
    : "";

  const checkoutBtnHtml = kybBlocked
    ? `<button type="button" disabled aria-disabled="true" class="${btn({ variant: "primary", size: "sm" })} sc-c-supplier-checkout-btn max-md:text-center max-[480px]:text-[12px] max-[480px]:py-[6px] max-[480px]:px-[12px] opacity-50 !cursor-not-allowed pointer-events-none" title="${t("common.cartCheckoutBlockedKyb")}">
            ${t("cart.payThisSupplier")}
          </button>`
    : `<button type="button" class="${btn({ variant: "primary", size: "sm" })} sc-c-supplier-checkout-btn max-md:text-center max-[480px]:text-[12px] max-[480px]:py-[6px] max-[480px]:px-[12px]"
                  @click.stop="$dispatch('checkout-supplier', { supplierId: '${escapeHtml(supplier.id)}' })">
            ${t("cart.payThisSupplier")}
          </button>`;

  return `
    <section class="sc-c-supplier-container rounded-2xl border border-[#e8e6e0] bg-white shadow-[0_1px_2px_rgba(20,20,18,0.04)] overflow-hidden"
      data-supplier-id="${escapeHtml(supplier.id)}"
      x-data="{ expanded: ${isOpen} }"
      @checkbox-change="if ($event.detail.handlerId === 'supplier-select-${escapeHtml(supplier.id)}') $dispatch('supplier-select', { supplierId: '${escapeHtml(supplier.id)}', selected: $event.detail.checked })">
      <header class="sc-c-supplier-header flex items-center justify-between gap-3 p-[10px_12px] sm:p-[12px_16px] border-b border-[#e8e6e0] max-md:flex-col max-md:items-stretch max-md:gap-2 max-[380px]:gap-1.5 cursor-pointer hover:bg-[#fafaf8] transition-colors select-none"
        :class="{ 'border-b-0': !expanded }"
        @click="expanded = !expanded">
        <div class="flex items-center gap-3 min-w-0 overflow-hidden">
          <div onclick="event.stopPropagation()" class="shrink-0">
            ${Checkbox({ id: `supplier-checkbox-${supplier.id}`, checked: supplier.selected, indeterminate: supplierIndeterminate, onChange: `supplier-select-${supplier.id}` })}
          </div>
          <span class="text-[13px] max-[380px]:text-[12px] sm:text-[14.5px] font-semibold text-[#1a1a1a] truncate">${escapeHtml(supplier.name)}</span>
          <svg class="sc-c-supplier-chevron w-4 h-4 text-[#8a877f] transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}"
            :class="{ 'rotate-180': expanded }"
            fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="sc-c-supplier-total flex items-center gap-3 text-sm font-bold text-text-primary whitespace-nowrap max-md:flex-col max-md:items-stretch max-md:gap-1 shrink-0">
          <span class="sc-c-supplier-total-text text-[13px] font-medium text-[#4a4a48] whitespace-nowrap [&_strong]:text-[#1a1a1a] [&_strong]:font-bold [&_strong]:ms-1 [&_b]:text-[#1a1a1a] [&_b]:font-bold [&_b]:ms-1" x-show="!expanded" ${isOpen ? "x-cloak" : ""}></span>
          ${checkoutBtnHtml}
        </div>
      </header>
      ${kybBannerHtml}
      <div class="sc-c-supplier-content p-[4px_12px_10px] sm:p-[4px_16px_12px] transition-all duration-300"
        x-show="expanded" ${!isOpen ? "x-cloak" : ""}>${products}</div>
    </section>
  `.trim();
}

/** @deprecated Alpine.js manages accordion toggle and checkbox bridge declaratively. Kept as no-op for backward compatibility. */
export function initSupplierCards(_container?: HTMLElement): void {
  // No-op — Alpine x-data on section handles accordion toggle via @click on header;
  // @checkbox-change bridges supplier checkbox to supplier-select for CartPage.
}
