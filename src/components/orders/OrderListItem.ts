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
      <div class="px-3.5 sm:px-5 py-3 border-b border-gray-100 max-sm:border-b-0 max-sm:pb-1">
        <div class="flex justify-between items-start gap-3 max-sm:gap-2 flex-wrap">
          <!-- Meta (mobilde sıra ters: satıcı üstte, no/tarih meta altta — mock kararı) -->
          <div class="min-w-0 flex-1 max-sm:flex max-sm:flex-col">
            <div class="text-[13px] max-sm:text-[11px] font-bold max-sm:font-normal text-gray-900 max-sm:text-gray-400 flex items-center gap-1.5 flex-wrap max-sm:order-2 max-sm:mt-0.5">
              <span class="text-text-link max-sm:hidden">★</span>
              <span x-text="order.orderNumber"></span>
              <span class="text-gray-300">·</span>
              <span class="font-medium max-sm:font-normal text-gray-500 max-sm:text-gray-400" x-text="order.orderDate"></span>
              <span class="text-gray-300 max-sm:hidden">·</span>
              <span class="text-gray-500 font-medium max-sm:hidden">${t("orders.supplier")}:</span>
              <span class="font-semibold text-gray-800 truncate max-sm:hidden" x-text="order.seller"></span>
            </div>
            <div class="text-xs text-gray-500 mt-1 max-sm:mt-0 flex flex-wrap gap-x-1.5 gap-y-0.5 items-center max-sm:order-1">
              <span class="font-semibold text-gray-700 sm:hidden truncate max-sm:text-[13px] max-sm:text-gray-900" x-text="order.seller"></span>
              <template x-if="order.status === 'Waiting for payment'">
                <span class="inline-flex items-center gap-1.5">
                  <button type="button"
                    @click="cancelOrder(order)"
                    class="th-no-press text-gray-500 hover:text-gray-700 bg-transparent border-0 cursor-pointer p-0 text-xs appearance-none outline-none focus:outline-none focus-visible:outline-none">
                    ${t("orders.cancelOrder")}
                  </button>
                </span>
              </template>
              <span class="text-gray-300">·</span>
              <span class="max-sm:text-[11px] max-sm:text-gray-400"><span x-text="totalQty(order)"></span> ${t("orders.productsUnit")} · <span x-text="(order.products || []).length"></span> ${t("orders.lines")}</span>
            </div>
          </div>

          <!-- Totals (right-aligned, 2 rows = matches left meta height) -->
          <div class="text-end shrink-0 flex flex-col items-end justify-between gap-1">
            <span class="inline-block px-2 max-sm:px-2.5 py-0.5 rounded max-sm:rounded-full text-[9px] max-sm:text-[10.5px] font-extrabold max-sm:font-semibold uppercase max-sm:normal-case tracking-wider max-sm:tracking-normal"
              :class="order.statusColor === 'text-amber-600' ? 'bg-amber-100 text-amber-700'
                    : order.statusColor === 'text-green-600' ? 'bg-emerald-100 text-emerald-700'
                    : order.statusColor === 'text-blue-600' ? 'bg-blue-100 text-blue-700'
                    : order.statusColor === 'text-red-600' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'"
              x-text="getStatusLabel(order)"></span>
            <div class="text-[18px] lg:text-[20px] font-extrabold text-gray-900 leading-none max-sm:hidden" aria-hidden="true">
              <span class="text-[10px] text-gray-500 font-semibold me-0.5" x-text="order.currency"></span><span x-text="order.total"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Thumbnail Strip ─── -->
      <template x-if="(order.products || []).length > 0">
        <div class="px-3.5 sm:px-5 py-2.5 bg-gradient-to-b from-gray-50 to-white max-sm:bg-none">
          <div class="flex justify-between items-center mb-1.5 text-[11px] text-gray-500">
            <span>${t("orders.orderContents")}</span>
            <button type="button"
              @click="$dispatch('open-order-items', order)"
              aria-haspopup="dialog"
              aria-controls="order-items-drawer"
              class="th-no-press text-text-link hover:opacity-80 font-bold text-xs inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 appearance-none outline-none focus:outline-none focus-visible:outline-none">
              ${t("orders.viewAll")} (<span x-text="(order.products || []).length"></span>)
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <template x-for="(product, idx) in (order.products || []).slice(0, ${STRIP_VISIBLE_THUMBS})" :key="product.name + idx">
              <div class="w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] lg:w-[58px] lg:h-[58px] rounded-md border border-gray-200 shrink-0 relative overflow-hidden bg-gray-50">
                <img :src="product.image" :alt="product.name" width="58" height="58" decoding="async" class="w-full h-full object-cover"
                  onerror="this.style.display='none'" />
                <span class="absolute bottom-0.5 end-0.5 bg-gray-900/85 text-white text-[9px] font-extrabold px-1 py-px rounded">
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
      <div class="flex flex-wrap items-center justify-between gap-3 max-sm:gap-2 px-3.5 sm:px-5 py-2.5 border-t border-gray-200 max-sm:border-gray-100 bg-[var(--color-surface-muted,#fafafa)]">
        <div class="text-[11px] text-gray-500">
          <span class="max-sm:hidden">${t("orders.subtotalVatIncluded")} — </span>
          <span class="sm:hidden block leading-tight">${t("orders.totalPrice")}</span>
          <strong class="text-gray-900 font-extrabold text-[13px] max-sm:text-[15px] max-sm:block max-sm:leading-tight"><span x-text="order.currency"></span> <span x-text="order.total"></span></strong>
        </div>
        <div class="flex items-center gap-2 max-[380px]:w-full">
          <button type="button"
            @click="viewDetail(order)"
            class="th-btn-outline h-8 px-4 max-[380px]:flex-1 text-xs font-semibold whitespace-nowrap max-sm:rounded-full">
            ${t("orders.viewDetails")}
          </button>
          <template x-if="canPay(order)">
            <button type="button"
              @click="openRemittanceModal(order.orderNumber, order.total, order.currency, order.paymentMethod)"
              class="th-btn h-8 px-4 max-[380px]:flex-1 text-xs font-semibold whitespace-nowrap max-sm:rounded-full">
              ${t("orders.makePayment")}
            </button>
          </template>
          <template x-if="hasReceipt(order)">
            <a :href="order.receiptUrl" target="_blank"
              class="th-btn-outline h-8 px-4 max-[380px]:flex-1 text-xs font-semibold whitespace-nowrap max-sm:rounded-full text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 inline-flex items-center gap-1">
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
