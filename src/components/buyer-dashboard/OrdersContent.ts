/**
 * OrdersContent Component
 * Dynamic content area: shows order cards when orders exist,
 * empty state when no orders found.
 * Uses Alpine x-data from parent ordersSection for reactive data.
 */

import { t } from "../../i18n";

function documentIconSvg(): string {
  return `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="6" width="28" height="36" rx="3" stroke="var(--color-orders-empty-icon)" stroke-width="2" fill="none"/>
    <line x1="16" y1="16" x2="32" y2="16" stroke="var(--color-orders-empty-icon)" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="22" x2="32" y2="22" stroke="var(--color-orders-empty-icon)" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="28" x2="26" y2="28" stroke="var(--color-orders-empty-icon)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

export function OrdersContent(): string {
  return `
    <div class="orders__content mx-[clamp(0.75rem,0.5rem+1vw,1.25rem)] mb-[clamp(0.75rem,0.5rem+1vw,1.25rem)] mt-3 rounded-(--radius-card) min-h-[140px] sm:min-h-[180px]" role="tabpanel" aria-label="${t("dashboard.ariaOrderContent")}">

      <!-- Loading -->
      <template x-if="loading">
        <div class="bg-(--color-orders-empty-bg) rounded-(--radius-card) flex items-center justify-center min-h-[140px] sm:min-h-[180px]">
          <div class="flex flex-col items-center gap-3 py-6 sm:py-8 px-3 sm:px-5">
            <div class="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <template x-if="!loading && filteredOrders.length === 0">
        <div class="bg-(--color-orders-empty-bg) rounded-(--radius-card) flex items-center justify-center min-h-[140px] sm:min-h-[180px]">
          <div class="flex flex-col items-center gap-3 py-6 sm:py-8 px-3 sm:px-5">
            <div class="text-(--color-orders-empty-icon)" aria-hidden="true">
              ${documentIconSvg()}
            </div>
            <p class="text-sm text-(--color-orders-empty-text) m-0">${t("dashboard.noOrders")}</p>
            <a href="/pages/dashboard/orders.html" class="orders__empty-btn inline-block py-2 px-6 rounded-(--radius-btn) bg-(--color-orders-empty-btn-bg) text-(--color-orders-empty-btn-text) border border-(--color-orders-empty-btn-border) text-[13px] font-semibold no-underline transition-all hover:bg-(--color-surface-raised,#f5f5f5)" role="button">
              ${t("dashboard.startSourcing")}
            </a>
          </div>
        </div>
      </template>

      <!-- Order Cards -->
      <template x-if="!loading && filteredOrders.length > 0">
        <div class="flex flex-col gap-3">
          <template x-for="order in filteredOrders.slice(0, 3)" :key="order.id">
            <a :href="'/pages/dashboard/orders.html'" class="block border border-gray-200 rounded-lg overflow-hidden bg-white no-underline transition-shadow hover:shadow-md">
              <!-- Card Header -->
              <div class="px-4 py-2.5 bg-[#FAFAFA] border-b border-gray-200">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <span class="font-semibold text-gray-800" x-text="order.orderNumber"></span>
                    <span class="text-gray-300">|</span>
                    <span x-text="order.orderDate"></span>
                    <span class="text-gray-300 max-sm:hidden">|</span>
                    <span class="max-sm:hidden" x-text="order.seller"></span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                          :class="order.statusColor === 'text-amber-600' ? 'bg-amber-100 text-amber-700'
                                : order.statusColor === 'text-green-600' ? 'bg-green-100 text-green-700'
                                : order.statusColor === 'text-blue-600' ? 'bg-blue-100 text-blue-700'
                                : order.statusColor === 'text-red-600' ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'"
                          x-text="order.status"></span>
                    <span class="text-sm font-bold text-gray-900" x-text="order.currency + ' ' + order.total"></span>
                  </div>
                </div>
              </div>
              <!-- Product Row(s) -->
              <div class="divide-y divide-gray-100">
                <template x-for="product in order.products.slice(0, 2)" :key="product.name">
                  <div class="flex items-center gap-3 px-4 py-2.5">
                    <div class="w-10 h-10 rounded border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                      <img :src="product.image" :alt="product.name" class="w-full h-full object-cover" onerror="this.style.display='none'" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-gray-800 truncate m-0" x-text="product.name"></p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-xs text-gray-500 m-0" x-text="order.currency + ' ' + product.unitPrice + ' x' + product.quantity"></p>
                    </div>
                  </div>
                </template>
              </div>
            </a>
          </template>
        </div>
      </template>
    </div>
  `;
}
