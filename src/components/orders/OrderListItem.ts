/**
 * OrderListItem — Tek sipariş kartının HTML render fonksiyonu.
 *
 * Bu HTML, `ordersListComponent` Alpine scope'u içinde
 * <template x-for="order in filteredOrders"> içine basılır.
 * Yani Alpine direktifleri (x-text, x-show, @click) burada string olarak yer alır;
 * gerçek evaluation Alpine tarafından runtime'da yapılır.
 */
import { t } from "../../i18n";
import { getBaseUrl } from "../../utils/url";

export function OrderListItem(): string {
  return /* html */ `
          <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">

            <!-- ── Card Header ── -->
            <div class="px-5 max-sm:px-3 py-4 max-sm:py-3 bg-[#FAFAFA] border-b border-gray-200">
              <div class="flex items-center justify-between gap-4 max-[480px]:gap-2 flex-wrap min-h-[36px]">
                <!-- Left: Order info -->
                <div class="flex items-center gap-2.5 text-sm max-[480px]:text-xs text-gray-500 flex-wrap max-sm:gap-1.5 leading-6">
                  <span class="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                    <svg class="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                    <span x-text="order.orderNumber"></span>
                  </span>
                  <span class="text-gray-300">|</span>
                  <span x-text="order.orderDate" class="max-sm:hidden"></span>
                  <span class="text-gray-300 max-sm:hidden">|</span>
                  <span class="max-[380px]:hidden">${t("orders.supplierLabel")}: <strong class="text-gray-700" x-text="order.seller"></strong></span>
                </div>
                <!-- Right: Status + Cancel + Total -->
                <div class="flex items-center gap-3 max-[480px]:gap-1.5">
                  <template x-if="canCancel(order)">
                    <button @click="cancellingOrder = order; openModal('showCancelOrder')" class="th-no-press text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors text-[13px] whitespace-nowrap">
                      ${t("orders.cancelOrderBtn")}
                    </button>
                  </template>
                  <span class="text-gray-300" x-show="canCancel(order)">|</span>
                  <span class="inline-flex items-center h-7 px-3 max-[480px]:h-6 max-[480px]:px-2 rounded-md text-[11px] max-[480px]:text-[10px] font-bold uppercase tracking-wide"
                        :class="order.refundStatus === 'Pending'  ? 'bg-orange-100 text-orange-700'
                              : order.refundStatus === 'Approved' ? 'bg-purple-100 text-purple-700'
                              : order.refundStatus === 'Rejected' ? 'bg-red-100 text-red-700'
                              : order.statusColor === 'text-amber-600' ? 'bg-amber-100 text-amber-700'
                              : order.statusColor === 'text-green-600' ? 'bg-green-100 text-green-700'
                              : order.statusColor === 'text-blue-600' ? 'bg-blue-100 text-blue-700'
                              : order.statusColor === 'text-red-600' ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'"
                        x-text="getStatusLabel(order)"></span>
                  <span class="text-base max-[480px]:text-[13px] font-bold text-gray-900" x-text="order.currency + ' ' + order.total"></span>
                </div>
              </div>
            </div>

            <!-- ── Product Rows ── -->
            <div class="divide-y divide-gray-100">
              <template x-for="product in order.products" :key="product.name">
                <div class="flex items-center gap-4 max-sm:gap-3 px-5 max-sm:px-3 py-3.5">
                  <!-- Image -->
                  <div class="w-[60px] h-[60px] max-sm:w-12 max-sm:h-12 rounded-md border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                    <img :src="product.image" :alt="product.name" class="w-full h-full object-cover" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'flex items-center justify-center w-full h-full text-gray-300\\'><svg class=\\'w-6 h-6\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\' viewBox=\\'0 0 24 24\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><path d=\\'M21 15l-5-5L5 21\\'/></svg></div>'" />
                  </div>
                  <!-- Name + Specs -->
                  <div class="flex-1 min-w-0">
                    <a href="#" class="text-sm text-gray-800 hover:text-blue-600 transition-colors line-clamp-1 leading-snug" x-text="product.name"></a>
                    <p class="text-xs text-gray-400 mt-1 truncate" x-text="product.variation"></p>
                  </div>
                  <!-- Price & Qty -->
                  <div class="text-right shrink-0 max-sm:hidden">
                    <p class="text-sm font-medium text-gray-800" x-text="order.currency + ' ' + product.unitPrice"></p>
                    <p class="text-xs text-gray-400 mt-0.5" x-text="'x' + product.quantity"></p>
                  </div>
                </div>
              </template>
            </div>

            <!-- ── Action Bar ── -->
            <div class="flex flex-wrap items-center justify-between gap-3 max-[480px]:gap-2 px-5 max-sm:px-3 py-3 border-t border-gray-200 bg-[#FAFAFA]">
              <!-- DISABLED: "Satıcıyla iletişim" linki — messages.html altyapısı yok, ileride geri açılacak. -->
              <!-- <a :href="'${getBaseUrl()}pages/dashboard/messages.html?seller=' + encodeURIComponent(order.seller)" class="text-gray-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors whitespace-nowrap text-[13px] max-[480px]:text-xs">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                ${t("orders.contactSupplier")}
              </a> -->
              <span></span><!-- spacer: action bar justify-between'ı korumak için -->

              <!-- Buttons -->
              <div class="flex items-center gap-2.5 max-[480px]:w-full">
                <button @click="viewDetail(order)" class="th-btn-outline h-9 px-5 max-[480px]:px-3 max-[480px]:flex-1 text-[13px] max-[480px]:text-xs cursor-pointer font-medium whitespace-nowrap">
                  ${t("orders.viewDetails")}
                </button>
                <template x-if="canPay(order)">
                  <button @click="openRemittanceModal(order.orderNumber, order.total, order.currency, order.paymentMethod)" class="th-btn h-9 px-5 max-[480px]:px-3 max-[480px]:flex-1 text-[13px] max-[480px]:text-xs whitespace-nowrap">
                    ${t("orders.makePayment")}
                  </button>
                </template>
                <template x-if="hasReceipt(order)">
                  <a :href="order.receiptUrl" target="_blank" class="th-btn-outline h-9 px-5 max-[480px]:px-3 max-[480px]:flex-1 text-[13px] max-[480px]:text-xs font-medium text-emerald-700 bg-emerald-50 border-emerald-200 whitespace-nowrap hover:bg-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Dekontu görüntüle
                  </a>
                </template>
              </div>
            </div>
          </div>
  `;
}
