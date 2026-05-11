/**
 * OrderItemsDrawer — Sağdan açılan ürün çekmecesi.
 * Sayfada bir kez mount edilir; içerik Alpine state'inden gelir (currentOrder).
 *
 * Tetikleyici: $dispatch('open-order-items', order) ya da
 *   window.dispatchEvent(new CustomEvent("open-order-items", { detail: order }))
 * (Bkz: OrderListItem.ts içindeki "Tümünü gör" butonu)
 */
import { t } from "../../i18n";

export function OrderItemsDrawer(): string {
  return /* html */ `
    <div x-data="orderItemsDrawer" x-cloak>
      <!-- Overlay -->
      <div
        x-show="open"
        x-transition:enter="transition-opacity ease-out duration-200"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition-opacity ease-in duration-150"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        @click="close()"
        class="fixed inset-0 z-[60] bg-black/40"
        aria-hidden="true">
      </div>

      <!-- Drawer Panel -->
      <aside
        id="order-items-drawer"
        x-show="open"
        x-transition:enter="transition ease-out duration-200"
        x-transition:enter-start="translate-x-full"
        x-transition:enter-end="translate-x-0"
        x-transition:leave="transition ease-in duration-150"
        x-transition:leave-start="translate-x-0"
        x-transition:leave-end="translate-x-full"
        class="fixed top-0 right-0 bottom-0 z-[61] w-full sm:w-[440px] bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-items-drawer-title">

        <!-- Header -->
        <header class="px-4 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between gap-3">
            <h4 id="order-items-drawer-title" class="text-[15px] font-extrabold text-gray-900 truncate">
              <span x-text="currentOrder ? currentOrder.orderNumber : ''"></span>
              <span class="text-gray-400 font-normal text-sm"> · </span>
              <span x-text="totals.lines + ' ${t("orders.lines")}'" class="text-sm font-medium text-gray-600"></span>
            </h4>
            <button
              type="button"
              @click="close()"
              class="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors border-0 cursor-pointer appearance-none focus:outline-none"
              aria-label="${t("common.close")}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Search + Sort -->
          <div class="flex gap-2 mt-3">
            <input
              type="text"
              x-model="search"
              placeholder="${t("orders.searchInProducts")}"
              aria-label="${t("orders.searchInProducts")}"
              class="flex-1 h-9 px-3 text-xs rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors" />
            <div class="relative shrink-0">
              <select
                x-model="sort"
                aria-label="${t("orders.sortLabel")}"
                class="h-9 pl-3 pr-7 text-xs rounded-md border border-gray-200 bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors cursor-pointer appearance-none">
                <option value="added">${t("orders.sortAdded")}</option>
                <option value="price_asc">${t("orders.sortPriceAsc")}</option>
                <option value="price_desc">${t("orders.sortPriceDesc")}</option>
                <option value="qty">${t("orders.sortQty")}</option>
              </select>
              <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
        </header>

        <!-- Body — product list (scrolls) -->
        <div class="flex-1 overflow-y-auto px-4">
          <template x-for="product in filteredItems" :key="product.name + product.variation">
            <div class="flex items-center gap-2.5 py-2.5 border-b border-gray-100">
              <div class="w-10 h-10 rounded-md border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                <img :src="product.image" :alt="product.name" class="w-full h-full object-cover"
                  onerror="this.style.display='none'" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-gray-900 line-clamp-1 leading-snug" x-text="product.name"></div>
                <div class="text-[11px] text-gray-400 mt-0.5 truncate" x-text="product.variation"></div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-xs font-bold text-gray-900">
                  <span x-text="currentOrder.currency + ' ' + product.unitPrice"></span>
                </div>
                <div class="text-[11px] text-gray-500">
                  ×<span x-text="product.quantity"></span> =
                  <span x-text="lineSubtotal(product)"></span>
                </div>
              </div>
            </div>
          </template>

          <!-- Empty state when search yields nothing -->
          <template x-if="currentOrder && filteredItems.length === 0">
            <div class="py-12 text-center text-sm text-gray-400">
              ${t("orders.noProductsMatch")}
            </div>
          </template>
        </div>

        <!-- Footer — totals -->
        <footer class="px-4 py-4 border-t border-gray-200 bg-[var(--color-surface-muted,#fafafa)]">
          <div class="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>${t("orders.productCount")}</span>
            <span class="font-bold text-gray-900" x-text="totals.count"></span>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>${t("orders.lineCount")}</span>
            <span class="font-bold text-gray-900" x-text="totals.lines"></span>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-600 mb-2">
            <span>${t("orders.vat")}</span>
            <span x-text="currentOrder ? currentOrder.currency + ' ' + totals.vat.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}) : ''"></span>
          </div>
          <div class="flex justify-between items-baseline pt-2 border-t border-dashed border-gray-200">
            <span class="text-xs font-semibold text-gray-700">${t("orders.grandTotal")}</span>
            <span class="text-[20px] font-extrabold text-[#cc9900]"
              x-text="currentOrder ? currentOrder.currency + ' ' + formattedGrandTotal() : ''"></span>
          </div>
          <template x-if="canPay()">
            <button
              type="button"
              @click="document.dispatchEvent(new CustomEvent('remittance:open', { detail: { orderNumber: currentOrder.orderNumber, orderTotal: currentOrder.total, orderCurrency: currentOrder.currency, paymentMethod: currentOrder.paymentMethod } })); close();"
              class="th-btn w-full h-10 mt-3 text-[13px] font-semibold">
              ${t("orders.makePayment")}
            </button>
          </template>
        </footer>
      </aside>
    </div>
  `;
}
