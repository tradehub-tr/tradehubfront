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

export interface SupplierCardProps {
  supplier: CartSupplier;
  isSingleSupplier?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

  return `
    <section class="sc-c-supplier-container rounded-2xl border border-[#e8e6e0] bg-white shadow-[0_1px_2px_rgba(20,20,18,0.04)] overflow-hidden"
      data-supplier-id="${escapeHtml(supplier.id)}"
      x-data="{ expanded: ${isOpen} }"
      @checkbox-change="if ($event.detail.handlerId === 'supplier-select-${escapeHtml(supplier.id)}') $dispatch('supplier-select', { supplierId: '${escapeHtml(supplier.id)}', selected: $event.detail.checked })">
      <header class="sc-c-supplier-header flex items-center justify-between gap-3 p-[12px_16px] border-b border-[#e8e6e0] max-md:flex-col max-md:items-stretch max-md:gap-2 max-[720px]:px-[14px] cursor-pointer hover:bg-[#fafaf8] transition-colors select-none"
        :class="{ 'border-b-0': !expanded }"
        @click="expanded = !expanded">
        <div class="flex items-center gap-3 min-w-0 overflow-hidden">
          <div onclick="event.stopPropagation()" class="shrink-0">
            ${Checkbox({ id: `supplier-checkbox-${supplier.id}`, checked: supplier.selected, indeterminate: supplierIndeterminate, onChange: `supplier-select-${supplier.id}` })}
          </div>
          <span class="text-[14.5px] font-semibold text-[#1a1a1a] truncate">${escapeHtml(supplier.name)}</span>
          <svg class="sc-c-supplier-chevron w-4 h-4 text-[#8a877f] transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}"
            :class="{ 'rotate-180': expanded }"
            fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="sc-c-supplier-total flex items-center gap-3 text-sm font-bold text-text-primary whitespace-nowrap max-md:flex-col max-md:items-stretch max-md:gap-1.5 shrink-0">
          <span class="sc-c-supplier-total-text text-[13px] font-medium text-[#4a4a48] whitespace-nowrap [&_strong]:text-[#1a1a1a] [&_strong]:font-bold [&_strong]:ml-1 [&_b]:text-[#1a1a1a] [&_b]:font-bold [&_b]:ml-1" x-show="!expanded" ${isOpen ? "x-cloak" : ""}></span>
          <button type="button" class="${btn({ variant: "primary", size: "sm" })} sc-c-supplier-checkout-btn max-md:text-center"
                  @click.stop="$dispatch('checkout-supplier', { supplierId: '${escapeHtml(supplier.id)}' })">
            ${t("cart.payThisSupplier")}
          </button>
        </div>
      </header>
      <div class="sc-c-supplier-content p-[4px_16px_12px] max-[720px]:p-[4px_14px_12px] transition-all duration-300"
        x-show="expanded" ${!isOpen ? "x-cloak" : ""}>${products}</div>
    </section>
  `.trim();
}

/** @deprecated Alpine.js manages accordion toggle and checkbox bridge declaratively. Kept as no-op for backward compatibility. */
export function initSupplierCards(_container?: HTMLElement): void {
  // No-op — Alpine x-data on section handles accordion toggle via @click on header;
  // @checkbox-change bridges supplier checkbox to supplier-select for CartPage.
}
