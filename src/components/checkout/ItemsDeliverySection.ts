/**
 * ItemsDeliverySection Component (C4)
 * Seller-based order list and delivery option selection.
 */

import { getCurrencyCode } from "../../utils/currency";
import { formatCurrency } from "../../services/currencyService";
import { t } from "../../i18n";

export interface CheckoutDeliveryMethod {
  id: string;
  etaLabel: string;
  shippingFee: number;
  isDefault?: boolean;
}

export interface CheckoutDeliverySkuLine {
  id: string;
  image: string;
  variantText: string;
  unitPrice: number;
  quantity: number;
  listingVariant?: string;
  isSample?: boolean;
}

export interface CheckoutDeliveryProductCard {
  id: string;
  title: string;
  moqLabel: string;
  image: string;
  skuLines: CheckoutDeliverySkuLine[];
}

export interface CheckoutDeliveryOrderGroup {
  orderId: string;
  orderLabel: string;
  sellerId: string;
  sellerName: string;
  methods: CheckoutDeliveryMethod[];
  products: CheckoutDeliveryProductCard[];
}

export interface ItemsDeliverySectionProps {
  orders?: CheckoutDeliveryOrderGroup[];
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeJsSingleQuoted(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function formatUsd(value: number): string {
  return formatCurrency(value, getCurrencyCode());
}

function renderShippingSummary(order: CheckoutDeliveryOrderGroup): string {
  const safeOrderId = escapeJsSingleQuoted(order.orderId);

  if (order.methods.length === 0) {
    return `
      <div class="rounded-md border border-dashed border-[#d1d5db] bg-[#fafafa] px-4 py-3 text-[15px] text-[#6b7280]">
        ${t("checkout.shippingUnavailable")}
      </div>
    `;
  }

  const multiple = order.methods.length > 1;

  return `
    <div class="flex items-center justify-between gap-2 sm:gap-3 rounded-md border-[1.5px] border-[#1a1a1a] bg-white px-3 sm:px-4 py-2.5 sm:py-3">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <svg class="w-4 h-4 sm:w-5 sm:h-5 text-[#111827] shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="7" cy="18" r="1.5" />
          <circle cx="17" cy="18" r="1.5" />
        </svg>
        <div class="min-w-0">
          <p class="text-[12.5px] sm:text-[13.5px] font-semibold text-[#111827] truncate"
             x-text="getSelectedMethod('${safeOrderId}')?.etaLabel || ''"></p>
          <p class="text-[11.5px] sm:text-[12.5px] text-[#8a877f] mt-0.5">
            ${t("checkout.shippingFee")}:
            <strong class="text-[#111827]" x-text="formatShippingFee(getSelectedMethod('${safeOrderId}')?.shippingFee ?? 0)"></strong>
          </p>
        </div>
      </div>
      ${
        multiple
          ? `<button type="button"
              class="shrink-0 text-[12px] sm:text-[15px] font-semibold underline text-[#111827] hover:opacity-70"
              @click="openShippingModal('${safeOrderId}')">
              ${t("checkout.changeShippingMethod")}
            </button>`
          : ""
      }
    </div>
  `;
}

function renderSkuLine(sku: CheckoutDeliverySkuLine): string {
  const total = sku.unitPrice * sku.quantity;
  const sampleBadge = sku.isSample
    ? `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 w-fit">
        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
        ${t("cart.sampleBadge")}
      </span>`
    : "";
  return `
    <!-- Mobile: 2-col grid, image top-aligned. Desktop: 4-col with qty+total columns -->
    <div class="grid grid-cols-[36px_1fr] sm:grid-cols-[40px_1fr_auto_auto] gap-x-2.5 gap-y-0 sm:gap-3 items-start sm:items-center rounded-md bg-[#fafaf8] border border-[#e8e6e0] px-2.5 sm:px-[14px] py-2.5 sm:py-[10px]">
      <img src="${sku.image}" alt="" class="w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] object-cover border border-[#e5e7eb] mt-0.5 sm:mt-0" />
      <div class="min-w-0">
        ${sampleBadge ? `<div class="mb-1">${sampleBadge}</div>` : ""}
        <p class="text-[12px] sm:text-[13px] text-[#4a4a48] leading-[1.4]">${sku.variantText}</p>
        <p class="text-[12px] sm:text-[13px] font-semibold text-[#1a1a1a] mt-1">${formatUsd(sku.unitPrice)} <span class="font-normal text-[#8a877f]">/${t("checkout.pieceUnit")}</span></p>
        <div class="flex items-center gap-2 sm:hidden mt-1 pt-1 border-t border-dashed border-[#e8e6e0]">
          <span class="text-[11px] text-[#8a877f]">x ${sku.quantity}</span>
          <span class="text-[12px] font-semibold text-[#1a1a1a]">${formatUsd(total)}</span>
        </div>
      </div>
      <span class="hidden sm:inline text-[13px] font-semibold text-[#1a1a1a]">x ${sku.quantity}</span>
      <span class="hidden sm:inline text-[13px] font-semibold text-[#1a1a1a]">${formatUsd(total)}</span>
    </div>
  `;
}

const SKU_COLLAPSE_THRESHOLD = 2;
const SKU_VISIBLE_WHEN_COLLAPSED = 2;

function renderProductCard(
  product: CheckoutDeliveryProductCard,
  totalProductsInOrder: number
): string {
  const variantCount = product.skuLines.length;
  const totalQty = product.skuLines.reduce((sum, sku) => sum + sku.quantity, 0);
  const totalAmount = product.skuLines.reduce((sum, sku) => sum + sku.unitPrice * sku.quantity, 0);

  const collapsible = variantCount > SKU_COLLAPSE_THRESHOLD;
  const visibleSkus = collapsible
    ? product.skuLines.slice(0, SKU_VISIBLE_WHEN_COLLAPSED)
    : product.skuLines;
  const hiddenSkus = collapsible ? product.skuLines.slice(SKU_VISIBLE_WHEN_COLLAPSED) : [];
  const hiddenCount = hiddenSkus.length;

  const visibleRows = visibleSkus.map(renderSkuLine).join("");
  const hiddenRows = hiddenSkus.map(renderSkuLine).join("");

  // Tek ürünlü tedarikçide otomatik açık; çok ürünlü tedarikçide
  // (≥2) varsayılan kapalı — sayfa uzamasın diye.
  const productOpen = totalProductsInOrder === 1;

  const summaryParts = [
    t("checkout.variantsLabel", { count: variantCount }),
    t("checkout.unitsLabel", { count: totalQty }),
  ];

  return `
    <div class="co-product-card border border-[#e8e6e0] rounded-md bg-white overflow-hidden mt-[10px]" x-data="{ open: ${productOpen}, skuExpanded: false }">
      <button
        type="button"
        class="co-product-head w-full flex items-center gap-2 sm:gap-3 px-3 py-[10px] text-left cursor-pointer transition-colors hover:bg-[#fafaf8]"
        @click="open = !open"
        :aria-expanded="open"
      >
        <img src="${product.image}" alt="" class="w-10 h-10 sm:w-12 sm:h-12 rounded-[6px] object-cover border border-[#e5e7eb] shrink-0" />
        <div class="flex-1 min-w-0">
          <h4 class="text-[12.5px] sm:text-[13.5px] leading-[1.35] font-semibold text-[#1a1a1a] truncate">${product.title}</h4>
          <p class="text-[11px] sm:text-[11.5px] text-[#8a877f] mt-0.5 leading-[1.4]">${product.moqLabel}</p>
          <p class="hidden sm:flex mt-1.5 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-[#8a877f]">
            ${summaryParts
              .map(
                (part, i) =>
                  `${i > 0 ? `<span class="text-[#9ca3af]">·</span>` : ""}<span>${part}</span>`
              )
              .join("")}
          </p>
        </div>
        <div class="co-product-end flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span class="co-product-total hidden sm:inline whitespace-nowrap text-[12.5px] sm:text-[13.5px] font-semibold text-[#1a1a1a] tabular-nums">${formatUsd(totalAmount)}</span>
          <svg class="co-product-chev w-3.5 h-3.5 text-[#8a877f] transition-transform duration-200"
            :class="{ 'rotate-180': open }"
            fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </button>
      <div x-show="open" x-collapse>
        <div class="px-3 pb-3 space-y-2">
          ${visibleRows}
          ${
            hiddenRows
              ? `<div x-show="skuExpanded" x-cloak class="space-y-2">${hiddenRows}</div>`
              : ""
          }
        </div>
        ${
          collapsible
            ? `<button
                type="button"
                class="mx-3 mb-3 inline-flex items-center gap-1.5 text-[14px] sm:text-[15px] font-semibold text-[#111827] underline hover:opacity-70"
                @click="skuExpanded = !skuExpanded"
                :aria-expanded="skuExpanded"
              >
                <span x-show="!skuExpanded">${t("checkout.showMoreVariants", { count: hiddenCount })}</span>
                <span x-show="skuExpanded" x-cloak>${t("checkout.showLessVariants")}</span>
                <svg class="w-4 h-4 transition-transform duration-200"
                  :class="skuExpanded ? 'rotate-180' : ''"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderOrderSupplierNote(order: CheckoutDeliveryOrderGroup): string {
  const safeOrderId = escapeJsSingleQuoted(order.orderId);

  return `
    <div class="mt-3 sm:mt-4">
      <template x-if="!hasOrderNote('${safeOrderId}')">
        <button
          type="button"
          class="inline-block text-[12px] sm:text-[13px] font-semibold underline text-[#4a4a48] decoration-[#d5d2c9] underline-offset-[3px] hover:opacity-70"
          @click="openNoteModal('${safeOrderId}')"
        >
          ${t("checkout.addNoteToSupplier")}
        </button>
      </template>
      <template x-if="hasOrderNote('${safeOrderId}')">
        <div>
          <p class="text-[12px] sm:text-[13px] text-[#4a4a48]">
            ${t("checkout.noteToSupplierLabel")}
            <span class="font-medium" x-text="getOrderNote('${safeOrderId}')"></span>
          </p>
          <button
            type="button"
            class="mt-1.5 sm:mt-2 inline-block text-[12px] sm:text-[13px] font-semibold underline text-[#4a4a48] decoration-[#d5d2c9] underline-offset-[3px] hover:opacity-70"
            @click="openNoteModal('${safeOrderId}')"
          >
            ${t("checkout.editNote")}
          </button>
        </div>
      </template>
    </div>
  `;
}

function renderOrder(order: CheckoutDeliveryOrderGroup, defaultExpanded: boolean): string {
  const shippingSummary = renderShippingSummary(order);
  const productCount = order.products.length;
  const productCards = order.products.map((p) => renderProductCard(p, productCount)).join("");
  const noteBlock = renderOrderSupplierNote(order);

  const itemSubtotal = order.products.reduce(
    (sum, product) =>
      sum + product.skuLines.reduce((acc, sku) => acc + sku.unitPrice * sku.quantity, 0),
    0
  );
  const totalQty = order.products.reduce(
    (sum, product) => sum + product.skuLines.reduce((acc, sku) => acc + sku.quantity, 0),
    0
  );

  return `
    <div class="p-0 border-t border-[#e8e6e0] first:border-t-0 mt-0"
      x-data="{ expanded: ${defaultExpanded} }">
      <button type="button"
        class="w-full flex items-center gap-2 sm:gap-3 m-0 px-4 sm:px-[22px] py-[10px] sm:py-[14px] rounded-none cursor-pointer hover:bg-[#fafaf8] transition-colors select-none text-left"
        @click="expanded = !expanded"
        :aria-expanded="expanded">
        <svg class="w-4 h-4 text-[#8a877f] shrink-0 hidden sm:block" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path d="M4 7h16M4 7l2-3h12l2 3M4 7v12a2 2 0 002 2h12a2 2 0 002-2V7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <h3 class="text-[13px] sm:text-[14.5px] font-semibold text-[#1a1a1a] tracking-[-0.005em] flex-1 truncate">${order.sellerName}</h3>
        <span class="co-supplier-count hidden sm:inline text-[11.5px] font-medium text-[#4a4a48] bg-[#fafaf8] border border-[#e8e6e0] rounded-full px-2 py-[2px] whitespace-nowrap tracking-[0.01em]" x-show="!expanded">${totalQty} ürün</span>
        <span class="text-[12px] sm:text-[14px] font-semibold text-[#1a1a1a] whitespace-nowrap"
          x-show="!expanded">${formatUsd(itemSubtotal)}</span>
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8a877f] transition-transform duration-300 shrink-0"
          :class="{ 'rotate-180': expanded, 'rotate-0': !expanded }"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="transition-all duration-300 pt-1 px-4 sm:px-[22px] pb-4 sm:pb-[18px]" x-show="expanded">
        ${shippingSummary}

        <div class="mt-4">
          ${productCards}
          ${noteBlock}
        </div>
      </div>
    </div>
  `;
}

function renderSupplierNoteModal(): string {
  return `
    <div
      class="fixed inset-0 z-[90] bg-black/45 p-3 sm:p-4 flex items-center justify-center"
      x-cloak
      x-show="isNoteModalOpen"
      @click.self="closeNoteModal()"
      @keydown.escape.window="closeNoteModal()"
    >
      <div class="w-full max-w-[760px] rounded-md bg-white shadow-xl">
        <div class="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-5 border-b border-[#f1f1f1]">
          <h3 class="text-[16px] sm:text-xl xl:text-2xl font-bold leading-tight text-[#111827]">${t("checkout.noteToSupplierTitle")}</h3>
          <button type="button" class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[#111827] hover:bg-gray-100 transition-colors" @click="closeNoteModal()">
            <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div class="px-4 pb-4 sm:px-6 sm:pb-6 pt-3 sm:pt-4">
          <div class="relative">
            <textarea
              class="th-input h-[120px] sm:h-[160px] resize-none text-[13px] sm:text-[14px]"
              placeholder="${t("checkout.noteFillIn")}"
              maxlength="2000"
              x-model="noteDraft"
            ></textarea>
            <span class="pointer-events-none absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[12px] sm:text-[14px] text-[#9ca3af]">
              <span x-text="noteDraft.length"></span>/2000
            </span>
          </div>
          <div class="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              class="min-w-0 w-full sm:min-w-[200px] sm:w-auto th-btn h-10 sm:h-auto text-[13px] sm:text-[14px]"
              @click="saveNote()"
            >
              ${t("checkout.confirm")}
            </button>
            <button
              type="button"
              class="min-w-0 w-full sm:min-w-[200px] sm:w-auto th-btn-outline h-10 sm:h-auto text-[13px] sm:text-[14px]"
              @click="closeNoteModal()"
            >
              ${t("checkout.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderShippingMethodModal(): string {
  return `
    <div
      class="fixed inset-0 z-[90] bg-black/45 p-3 sm:p-4 flex items-center justify-center"
      x-cloak
      x-show="isShippingModalOpen"
      @click.self="closeShippingModal()"
      @keydown.escape.window="closeShippingModal()"
    >
      <div class="w-full max-w-[860px] rounded-md bg-white shadow-xl">
        <div class="flex items-center justify-between px-4 py-3 sm:px-7 sm:py-6 border-b border-[#e5e5e5]">
          <h3 class="text-[16px] sm:text-2xl font-bold leading-tight text-[#111827]">${t("checkout.selectShippingMethod")}</h3>
          <button type="button" class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[#111827] hover:bg-gray-100 transition-colors" @click="closeShippingModal()">
            <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div class="px-4 py-4 sm:px-7 sm:py-6 space-y-2 sm:space-y-3 max-h-[60vh] overflow-auto">
          <template x-for="method in getActiveShippingMethods()" :key="method.id">
            <label
              class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 rounded-md border px-3 py-3 sm:px-5 sm:py-4 cursor-pointer transition-colors"
              :class="shippingDraft === method.id
                ? 'border-[#111827] bg-white'
                : 'border-[#d1d5db] bg-[#fafafa] hover:border-[#9ca3af]'"
            >
              <div class="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                <input
                  type="radio"
                  class="h-5 w-5 sm:h-6 sm:w-6 accent-[#111827] cursor-pointer shrink-0 mt-0.5"
                  :value="method.id"
                  :checked="shippingDraft === method.id"
                  @change="shippingDraft = method.id"
                />
                <span class="text-[13px] sm:text-[17px] font-semibold text-[#111827] leading-snug break-words" x-text="method.etaLabel"></span>
              </div>
              <span class="shrink-0 text-[12px] sm:text-[16px] text-[#374151] sm:border-l sm:border-[#d1d5db] sm:pl-5 sm:min-w-[180px] sm:text-right pl-[30px] sm:pl-5">
                ${t("checkout.shippingFee")}:
                <strong class="text-[#111827] whitespace-nowrap" x-text="formatShippingFee(method.shippingFee)"></strong>
              </span>
            </label>
          </template>
        </div>
        <div class="px-4 pb-4 sm:px-7 sm:pb-7 pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-4 border-t border-[#f1f1f1]">
          <button
            type="button"
            class="w-full sm:w-auto sm:min-w-[200px] th-btn h-10 sm:h-auto text-[13px] sm:text-[14px]"
            @click="confirmShipping()"
          >
            ${t("checkout.confirm")}
          </button>
          <button
            type="button"
            class="w-full sm:w-auto sm:min-w-[200px] th-btn-outline h-10 sm:h-auto text-[13px] sm:text-[14px]"
            @click="closeShippingModal()"
          >
            ${t("checkout.cancel")}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function ItemsDeliverySection({ orders = [] }: ItemsDeliverySectionProps = {}): string {
  const encodedOrders = escapeHtmlAttribute(JSON.stringify(orders));

  const defaultExpanded = orders.length <= 1;
  const ordersHtml =
    orders.length > 0
      ? orders.map((order) => renderOrder(order, defaultExpanded)).join("")
      : `<p class="text-[#6b7280] text-base p-6">${t("checkout.itemsDeliveryEmpty")}</p>`;

  const supplierCount = orders.length;

  return `
    <section
      id="checkout-items"
      class="checkout-section bg-white border border-[#e8e6e0] rounded-md shadow-[0_1px_2px_rgba(20,20,18,0.04)] overflow-hidden"
      x-data="checkoutItemsDelivery"
      data-delivery-orders="${encodedOrders}"
    >
      <div class="checkout-section__header w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-[22px] py-[12px] sm:py-[18px]">
        <span class="checkout-section__icon hidden sm:inline-flex items-center justify-center w-8 h-8 min-w-[32px] rounded-md bg-[#fafaf8] text-[#4a4a48] p-[7px]">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.27 6.96 12 12.01l8.73-5.05" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 22.08V12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <h2 class="checkout-section__title flex-1 text-left text-[13px] sm:text-[15px] font-semibold text-[#1a1a1a] tracking-[-0.005em] whitespace-nowrap truncate">${t("checkout.itemsAndDeliveryOptions")}</h2>
        ${supplierCount > 0 ? `<span class="text-[11px] sm:text-[12px] text-[#8a877f] whitespace-nowrap shrink-0">${supplierCount} tedarikçi</span>` : ""}
      </div>
      <div class="checkout-section__content p-0">
        ${ordersHtml}
      </div>
      ${renderSupplierNoteModal()}
      ${renderShippingMethodModal()}
    </section>
  `.trim();
}
