/**
 * OrderListItem — Sipariş kartının yatay strip + drawer trigger versiyonu (D yaklaşımı).
 *
 * Yapı:
 *   ┌─────────────────────────────────────────────┐
 *   │ [★ ORD-XX · tarih · tedarikçi]   [STATUS]   │
 *   │                                  [TOPLAM]   │
 *   │                                  [N ürün]   │
 *   ├─────────────────────────────────────────────┤
 *   │ Sipariş içeriği          Tümünü gör (N) →   │
 *   │ [▢×10][▢×20][▢×20][▢×5][▢+45]              │
 *   ├─────────────────────────────────────────────┤
 *   │ Ara toplam — TRY 15.429,40   [Det][Öde]    │
 *   └─────────────────────────────────────────────┘
 *
 * Toplam fiyat 3 yerde: kart başlık sağ üst, footer-sol, drawer footer (drawer ayrı).
 *
 * Tıklama → drawer açılır: $dispatch('open-order-items', order)
 * Tüketici Alpine scope: ordersListComponent — bu kart <template x-for="order in filteredOrders"> içine basılır.
 */
import { t } from "../../i18n";

// Strip'te görünür thumbnail sayısı. Kalanlar "+N daha" rozeti gizler ve yatay scroll ile erişilir.
const STRIP_VISIBLE_THUMBS = 4;

export function OrderListItem(): string {
  return /* html */ `
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden mb-2">

      <!-- ─── Header ─── -->
      <div class="px-4 sm:px-5 py-3 border-b border-gray-100">
        <div class="flex justify-between items-start gap-3 flex-wrap">
          <!-- Meta -->
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
              <span class="text-text-link">★</span>
              <span x-text="order.orderNumber"></span>
              <span class="text-gray-300">·</span>
              <span class="font-medium text-gray-500" x-text="order.orderDate"></span>
              <span class="text-gray-300 max-sm:hidden">·</span>
              <span class="text-gray-500 font-medium max-sm:hidden">${t("orders.supplier")}:</span>
              <span class="font-semibold text-gray-800 truncate max-sm:hidden" x-text="order.seller"></span>
            </div>
            <div class="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 items-center">
              <span class="sm:hidden">${t("orders.supplier")}:</span>
              <span class="font-semibold text-gray-700 sm:hidden truncate" x-text="order.seller"></span>
              <template x-if="order.status === 'Waiting for payment'">
                <span class="inline-flex items-center gap-1.5">
                  <span class="text-gray-300 sm:hidden">·</span>
                  <button type="button"
                    @click="cancelOrder(order)"
                    class="text-gray-500 bg-transparent border-0 cursor-pointer p-0 text-xs appearance-none outline-none focus:outline-none focus-visible:outline-none">
                    ${t("orders.cancelOrder")}
                  </button>
                </span>
              </template>
              <span class="text-gray-300">·</span>
              <span><span x-text="totalQty(order)"></span> ${t("orders.productsUnit")} · <span x-text="(order.products || []).length"></span> ${t("orders.lines")}</span>
            </div>
          </div>

          <!-- Totals (right-aligned, 2 rows = matches left meta height) -->
          <div class="text-right shrink-0 flex flex-col items-end justify-between gap-1">
            <span class="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider"
              :class="order.statusColor === 'text-amber-600' ? 'bg-amber-100 text-amber-700'
                    : order.statusColor === 'text-green-600' ? 'bg-emerald-100 text-emerald-700'
                    : order.statusColor === 'text-blue-600' ? 'bg-blue-100 text-blue-700'
                    : order.statusColor === 'text-red-600' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'"
              x-text="getStatusLabel(order)"></span>
            <div class="text-[16px] sm:text-[18px] lg:text-[20px] font-extrabold text-gray-900 leading-none">
              <span class="text-[10px] text-gray-500 font-semibold mr-0.5" x-text="order.currency"></span><span x-text="order.total"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Thumbnail Strip ─── -->
      <template x-if="(order.products || []).length > 0">
        <div class="px-4 sm:px-5 py-2.5 bg-gradient-to-b from-gray-50 to-white">
          <div class="flex justify-between items-center mb-1.5 text-[11px] text-gray-500">
            <span>${t("orders.orderContents")}</span>
            <button type="button"
              @click="$dispatch('open-order-items', order)"
              aria-haspopup="dialog"
              aria-controls="order-items-drawer"
              class="text-text-link font-bold text-xs inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 appearance-none outline-none focus:outline-none focus-visible:outline-none">
              ${t("orders.viewAll")} (<span x-text="(order.products || []).length"></span>)
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <template x-for="(product, idx) in (order.products || []).slice(0, ${STRIP_VISIBLE_THUMBS})" :key="product.name + idx">
              <div class="w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] lg:w-[58px] lg:h-[58px] rounded-md border border-gray-200 shrink-0 relative overflow-hidden bg-gray-50">
                <img :src="product.image" :alt="product.name" class="w-full h-full object-cover"
                  onerror="this.style.display='none'" />
                <span class="absolute bottom-0.5 right-0.5 bg-gray-900/85 text-white text-[9px] font-extrabold px-1 py-px rounded">
                  ×<span x-text="product.quantity"></span>
                </span>
              </div>
            </template>
            <template x-if="(order.products || []).length > ${STRIP_VISIBLE_THUMBS}">
              <button type="button"
                @click="$dispatch('open-order-items', order)"
                aria-haspopup="dialog"
                aria-controls="order-items-drawer"
                class="w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] lg:w-[58px] lg:h-[58px] rounded-md shrink-0 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 text-amber-800 font-extrabold text-xs flex items-center justify-center cursor-pointer appearance-none outline-none focus:outline-none focus-visible:outline-none">
                +<span x-text="(order.products || []).length - ${STRIP_VISIBLE_THUMBS}"></span>
              </button>
            </template>
          </div>
        </div>
      </template>

      <!-- ─── Footer / Action Bar ─── -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-t border-gray-200 bg-[var(--color-surface-muted,#fafafa)]">
        <div class="text-[11px] text-gray-500" aria-hidden="true">
          ${t("orders.subtotalVatIncluded")} — <strong class="text-gray-900 font-extrabold text-[13px]"><span x-text="order.currency"></span> <span x-text="order.total"></span></strong>
        </div>
        <div class="flex items-center gap-2 max-[480px]:w-full">
          <button type="button"
            @click="viewDetail(order)"
            class="th-btn-outline h-8 px-4 max-[480px]:flex-1 text-xs font-semibold whitespace-nowrap">
            ${t("orders.viewDetails")}
          </button>
          <template x-if="canPay(order)">
            <button type="button"
              @click="openRemittanceModal(order.orderNumber, order.total, order.currency, order.paymentMethod)"
              class="th-btn h-8 px-4 max-[480px]:flex-1 text-xs font-semibold whitespace-nowrap">
              ${t("orders.makePayment")}
            </button>
          </template>
          <template x-if="hasReceipt(order)">
            <a :href="order.receiptUrl" target="_blank"
              class="th-btn-outline h-8 px-4 max-[480px]:flex-1 text-xs font-semibold whitespace-nowrap text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              ${t("orders.viewReceipt")}
            </a>
          </template>
        </div>
      </div>
    </div>
  `;
}
