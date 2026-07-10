/**
 * OrdersPageLayout Component
 * "Siparişlerim" page — 2-panel: left nav + right dynamic content.
 * Supports hash-based sub-pages: #all-orders, #refunds, #reviews
 */
import { t } from "../../i18n";
import { OrderListItem } from "./OrderListItem";
import { OrderItemsDrawer } from "./OrderItemsDrawer";
import { styleSvg } from "../icons/lucideIcons";
import receiptIcon from "lucide-static/icons/receipt-text.svg?raw";
import starIcon from "lucide-static/icons/star.svg?raw";
import messageSquareIcon from "lucide-static/icons/message-square-text.svg?raw";
import packageIcon from "lucide-static/icons/package.svg?raw";
import thumbsUpIcon from "lucide-static/icons/thumbs-up.svg?raw";
import infoIcon from "lucide-static/icons/info.svg?raw";

interface OrdersNavItem {
  id: string;
  label: string;
}

function getNavItems(): OrdersNavItem[] {
  return [
    { id: "all-orders", label: t("orders.allOrders") },
    { id: "refunds", label: t("orders.refundsTab") },
    { id: "reviews", label: t("orders.reviews") },
  ];
}

/* ────────────────────────────────────────
   SHARED EMPTY ICON (receipt/document)
   ──────────────────────────────────────── */
const EMPTY_RECEIPT_ICON = `
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
    <rect x="12" y="5" width="36" height="46" rx="3" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="1"/>
    <rect x="18" y="14" width="24" height="3" rx="1.5" fill="#D1D5DB"/>
    <rect x="18" y="22" width="18" height="3" rx="1.5" fill="#D1D5DB"/>
    <rect x="18" y="30" width="20" height="3" rx="1.5" fill="#D1D5DB"/>
    <path d="M12 51l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3V5H12v46z" fill="#E5E7EB"/>
  </svg>`;

/* ────────────────────────────────────────
   SECTION RENDERERS
   ──────────────────────────────────────── */

function getOrderStatusTabs() {
  return [
    { id: "all", label: t("common.all") },
    { id: "confirming", label: t("orders.confirming") },
    { id: "unpaid", label: t("orders.unpaid") },
    { id: "preparing", label: t("orders.preparingShipment") },
    { id: "delivering", label: t("orders.delivering") },
    { id: "refunds-aftersales", label: t("orders.refundsAfterSales") },
    { id: "completed-review", label: t("orders.completedReview") },
    { id: "closed", label: t("orders.closed") },
  ];
}

function renderAllOrders(): string {
  return `
    <div x-data="ordersListComponent()" x-cloak>
      ${OrderItemsDrawer()}
      <template x-if="!selectedOrder"><div>
      <!-- Header -->
      <div class="flex items-center justify-between gap-2 px-5 max-sm:px-3.5 pt-6 max-sm:pt-4 pb-5 max-sm:pb-2 border-b border-gray-100 max-sm:border-b-0">
        <div class="flex items-baseline gap-2 min-w-0 shrink">
          <h1 class="text-[22px] max-sm:text-[17px] font-bold text-gray-900 whitespace-nowrap" data-i18n="orders.yourOrders">${t("orders.yourOrders")}</h1>
          <span class="sm:hidden text-[12px] text-gray-400 min-w-0 truncate" x-show="filteredOrders.length > 0" x-text="filteredOrders.length + ' ${t("orders.ordersCount")}'"></span>
        </div>
        <template x-if="filteredOrders.some((o) => o.status === 'Waiting for payment')">
          <button @click="openRemittanceModal(filteredOrders.find((o) => o.status === 'Waiting for payment')?.orderNumber || '', filteredOrders.find((o) => o.status === 'Waiting for payment')?.total, filteredOrders.find((o) => o.status === 'Waiting for payment')?.currency, filteredOrders.find((o) => o.status === 'Waiting for payment')?.paymentMethod)"
            class="th-btn-outline px-5 py-2 text-sm whitespace-nowrap shrink-0 max-sm:h-8 max-sm:px-3 max-sm:py-0 max-sm:text-[12px] max-sm:rounded-full max-sm:border-amber-300 max-sm:bg-amber-50 max-sm:text-amber-800">
            <span class="max-sm:hidden">${t("orders.submitRemittanceProof")}</span>
            <span class="sm:hidden">${t("orders.submitRemittanceProofShort")}</span>
          </button>
        </template>
      </div>

      <!-- Status Tabs — masaüstünde alt çizgili sekmeler, mobilde chip'ler -->
      <div class="relative border-b border-gray-200 max-sm:border-b-0" id="order-tabs-wrapper">
        <!-- Left fade + arrow -->
        <button type="button" id="order-tabs-left" class="max-sm:hidden! absolute start-0 top-0 bottom-0 z-10 w-8 items-center justify-center bg-gradient-to-r from-white via-white/80 to-transparent cursor-pointer border-none hidden" aria-label="Scroll left">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <!-- Scrollable tab container -->
        <div class="overflow-x-auto scrollbar-hide" id="order-tabs-scroll">
          <div class="flex px-7 max-sm:px-3.5 min-w-max max-sm:gap-1.5 max-sm:pb-3">
            ${getOrderStatusTabs()
              .map(
                (tab) => `
              <button
                @click="activeTab = '${tab.id}'"
                :class="activeTab === '${tab.id}'
                  ? 'text-gray-900 font-medium sm:border-gray-900 max-sm:bg-gray-900 max-sm:text-white max-sm:border-gray-900 max-sm:font-semibold'
                  : 'text-gray-500 hover:text-gray-700 sm:border-transparent max-sm:bg-white max-sm:text-gray-600 max-sm:border-gray-200'"
                class="py-3 px-4 text-sm whitespace-nowrap transition-colors bg-transparent cursor-pointer sm:border-b-2 max-sm:inline-flex max-sm:items-center max-sm:h-8 max-sm:py-0 max-sm:px-3.5 max-sm:text-[13px] max-sm:rounded-full max-sm:border"
              >
                ${tab.label}<template x-if="tabCount('${tab.id}') > 0"><span class="text-gray-400 ms-0.5 max-sm:text-[11px]" :class="activeTab === '${tab.id}' ? 'max-sm:text-white/70' : ''" x-text="'(' + tabCount('${tab.id}') + ')'"></span></template>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
        <!-- Right fade + arrow -->
        <button type="button" id="order-tabs-right" class="max-sm:hidden! absolute end-0 top-0 bottom-0 z-10 w-8 items-center justify-center bg-gradient-to-l from-white via-white/80 to-transparent cursor-pointer border-none hidden" aria-label="Scroll right">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- Search & Filter Bar -->
      <div class="flex items-center gap-2.5 max-sm:gap-1.5 px-5 max-sm:px-3.5 py-4 max-sm:pt-0 max-sm:pb-3 flex-wrap">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[180px] max-w-[380px] max-sm:max-w-full max-sm:min-w-full">
          <svg class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            x-model.debounce.300ms="searchQuery"
            @keydown.escape="searchQuery = ''"
            placeholder="${t("orders.searchPlaceholder")}"
            class="th-input th-input-sm ps-9 pe-8 max-sm:h-9 max-sm:rounded-full max-sm:bg-gray-50 max-sm:text-[13px]"
            :class="searchQuery.trim() ? 'border-amber-400! ring-1! ring-amber-200!' : ''"
          />
          <button
            x-show="searchQuery.trim()"
            @click="searchQuery = ''"
            class="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none transition-colors p-0"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Order Date Dropdown -->
        <div class="relative max-sm:flex-1 max-sm:min-w-0">
          <button
            @click="dateOpen = !dateOpen; timeOpen = false"
            class="flex items-center gap-2 max-sm:gap-1.5 h-9 max-sm:h-8 px-3 text-sm max-sm:text-[12px] border rounded-lg max-sm:rounded-full cursor-pointer transition-colors whitespace-nowrap max-sm:w-full max-sm:justify-center"
            :class="dateFilter !== 'all' && dateFilter !== 'custom'
              ? 'text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
              : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'"
          >
            <span class="max-sm:truncate max-sm:min-w-0" x-text="dateFilterLabel"></span>
            <svg class="w-3.5 h-3.5 shrink-0 transition-transform" :class="dateOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div
            x-show="dateOpen"
            @click.outside="dateOpen = false"
            x-transition:enter="transition ease-out duration-150"
            x-transition:enter-start="opacity-0 translate-y-1 motion-reduce:translate-y-0"
            x-transition:enter-end="opacity-100 translate-y-0"
            x-transition:leave="transition ease-out duration-100"
            x-transition:leave-start="opacity-100 translate-y-0"
            x-transition:leave-end="opacity-0 translate-y-1 motion-reduce:translate-y-0"
            class="absolute top-full start-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]"
          >
            <button @click="setDateFilter('all')"
              class="flex items-center justify-between w-full text-start px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer bg-transparent border-none transition-colors"
              :class="dateFilter === 'all' ? 'text-amber-700 font-medium' : 'text-gray-700'"
            >
              ${t("orders.allDates")}
              <svg x-show="dateFilter === 'all'" class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </button>
            <button @click="setDateFilter('7d')"
              class="flex items-center justify-between w-full text-start px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer bg-transparent border-none transition-colors"
              :class="dateFilter === '7d' ? 'text-amber-700 font-medium' : 'text-gray-700'"
            >
              ${t("orders.last7Days")}
              <svg x-show="dateFilter === '7d'" class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </button>
            <button @click="setDateFilter('30d')"
              class="flex items-center justify-between w-full text-start px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer bg-transparent border-none transition-colors"
              :class="dateFilter === '30d' ? 'text-amber-700 font-medium' : 'text-gray-700'"
            >
              ${t("orders.last30Days")}
              <svg x-show="dateFilter === '30d'" class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </button>
            <button @click="setDateFilter('90d')"
              class="flex items-center justify-between w-full text-start px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer bg-transparent border-none transition-colors"
              :class="dateFilter === '90d' ? 'text-amber-700 font-medium' : 'text-gray-700'"
            >
              ${t("orders.last90Days")}
              <svg x-show="dateFilter === '90d'" class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </button>
          </div>
        </div>

        <!-- Time Range Picker -->
        <div class="relative max-sm:flex-1 max-sm:min-w-0">
          <button
            @click="timeOpen = !timeOpen; dateOpen = false"
            class="flex items-center gap-2 max-sm:gap-1.5 h-9 max-sm:h-8 px-3 text-sm max-sm:text-[12px] border rounded-lg max-sm:rounded-full cursor-pointer transition-colors whitespace-nowrap max-sm:w-full max-sm:justify-center"
            :class="dateFilter === 'custom'
              ? 'text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
              : 'text-gray-400 bg-white border-gray-300 hover:bg-gray-50'"
          >
            <span class="max-sm:truncate max-sm:min-w-0" x-text="timeRangeLabel"></span>
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </button>
          <div
            x-show="timeOpen"
            @click.outside="timeOpen = false"
            x-transition:enter="transition ease-out duration-150"
            x-transition:enter-start="opacity-0 translate-y-1 motion-reduce:translate-y-0"
            x-transition:enter-end="opacity-100 translate-y-0"
            x-transition:leave="transition ease-out duration-100"
            x-transition:leave-start="opacity-100 translate-y-0"
            x-transition:leave-end="opacity-0 translate-y-1 motion-reduce:translate-y-0"
            class="absolute top-full end-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[280px] max-sm:min-w-0 max-sm:w-60"
          >
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">${t("orders.selectDateRange")}</p>
            <div class="flex items-center gap-2 mb-3 max-sm:flex-col max-sm:items-stretch">
              <div class="flex-1 max-sm:min-w-0">
                <label class="block text-xs text-gray-500 mb-1">${t("orders.startDate")}</label>
                <input type="date" x-model="dateFrom"
                  class="th-input th-input-sm max-sm:w-full" />
              </div>
              <span class="text-gray-300 mt-4 max-sm:hidden">—</span>
              <div class="flex-1 max-sm:min-w-0">
                <label class="block text-xs text-gray-500 mb-1">${t("orders.endDate")}</label>
                <input type="date" x-model="dateTo"
                  class="th-input th-input-sm max-sm:w-full" />
              </div>
            </div>
            <div class="flex items-center justify-end gap-2">
              <button @click="clearTimeRange()"
                class="px-3 py-1.5 text-xs text-gray-500 bg-transparent border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                ${t("common.clear")}
              </button>
              <button @click="applyTimeRange()"
                class="px-3 py-1.5 text-xs text-white bg-gray-900 border border-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                :class="!(dateFrom || dateTo) ? 'opacity-40 cursor-not-allowed' : ''"
                :disabled="!(dateFrom || dateTo)">
                ${t("common.apply")}
              </button>
            </div>
          </div>
        </div>

        <!-- Active filter badges -->
        <template x-if="dateFilter !== 'all' || searchQuery.trim()">
          <button @click="searchQuery = ''; dateFilter = 'all'; dateFrom = ''; dateTo = ''; activeTab = 'all'"
            class="flex items-center gap-1 h-8 px-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-full cursor-pointer hover:bg-red-100 transition-colors whitespace-nowrap">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            ${t("orders.clearAllFilters")}
          </button>
        </template>
      </div>

      <!-- Info Banner -->
      <div class="mx-7 max-sm:mx-3.5 mb-4 max-sm:mb-3 px-4 max-sm:px-3 py-3 max-sm:py-2.5 bg-amber-50 border border-amber-200 rounded-sm max-sm:rounded-lg">
        <div class="flex items-start gap-2.5 max-sm:gap-2">
          <svg class="w-5 h-5 max-sm:w-4 max-sm:h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9l1.5-1.5L6 9V5.5a2.5 2.5 0 015 0V9l1.5-1.5L14 9v5a7 7 0 01-14 0V9z" opacity="0"/>
            <path d="M12 2C8.14 2 5 5.14 5 9v5l-2 2v1h18v-1l-2-2V9c0-3.86-3.14-7-7-7zm0 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/>
          </svg>
          <div class="text-[13px] max-sm:text-[12px] text-gray-700 max-sm:text-amber-900/80 leading-relaxed max-sm:leading-snug">
            <p class="mb-1"><strong>1.</strong> ${t("orders.bannerRemittance")} <a href="#" class="text-blue-600 hover:underline">${t("orders.bannerHowTo")}</a></p>
            <p><strong>2.</strong> ${t("orders.bannerHolidayDelay")}</p>
          </div>
        </div>
      </div>

      <!-- Search result info -->
      <template x-if="searchQuery.trim() || dateFilter !== 'all'">
        <div class="px-7 max-sm:px-3 pb-3">
          <p class="text-sm text-gray-500">
            <span x-text="filteredOrders.length"></span> ${t("orders.resultsFound")}
            <template x-if="searchQuery.trim()">
              <span> &mdash; &quot;<strong class="text-gray-700" x-text="searchQuery.trim()"></strong>&quot; ${t("orders.searchFor")}</span>
            </template>
            <template x-if="dateFilter !== 'all' && dateFilter !== 'custom'">
              <span> &mdash; <span x-text="dateFilterLabel"></span></span>
            </template>
            <template x-if="dateFilter === 'custom'">
              <span> &mdash; <span x-text="timeRangeLabel"></span></span>
            </template>
          </p>
        </div>
      </template>

      <!-- Loading Indicator -->
      <template x-if="loading">
        <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <p class="text-sm text-gray-500">${t("orders.loadingOrders") || "Siparişler yükleniyor..."}</p>
        </div>
      </template>

      <!-- Orders List -->
      <div x-show="!loading" class="px-7 max-sm:px-3.5 pb-6 max-sm:pb-4 space-y-4 max-sm:space-y-2.5">
        <template x-if="filteredOrders.length === 0">
          <div class="flex flex-col items-center justify-center gap-3 py-16 max-sm:py-10 text-center">
            ${EMPTY_RECEIPT_ICON}
            <template x-if="searchQuery.trim() || dateFilter !== 'all'">
              <div class="flex flex-col items-center gap-2">
                <h3 class="text-base font-bold text-gray-900">${t("orders.noOrdersFound")}</h3>
                <p class="text-sm text-gray-500 max-w-[400px]">${t("orders.tryDifferentKeywords")}</p>
                <button @click="searchQuery = ''; dateFilter = 'all'; dateFrom = ''; dateTo = ''; activeTab = 'all'"
                  class="inline-block px-6 py-2 text-sm text-amber-700 border border-amber-300 rounded-full no-underline mt-2 transition-colors hover:bg-amber-50 cursor-pointer bg-transparent">
                  ${t("orders.clearFilters")}
                </button>
              </div>
            </template>
            <template x-if="!searchQuery.trim() && dateFilter === 'all'">
              <div class="flex flex-col items-center gap-2">
                <h3 class="text-base font-bold text-gray-900">${t("orders.noOrdersYet")}</h3>
                <p class="text-sm text-gray-500 max-w-[400px]">${t("orders.startSourcingDesc")}</p>
                <a href="/" class="th-btn-outline mt-2 max-sm:py-2 max-sm:text-[13px] max-sm:rounded-full">${t("orders.startSourcing")}</a>
              </div>
            </template>
          </div>
        </template>

        <template x-for="order in filteredOrders" :key="order.id">
          ${OrderListItem()}
        </template>
      </div>

      <!-- Pagination -->
      <div x-show="filteredOrders.length > 0" class="flex items-center justify-end max-sm:justify-center gap-3 px-7 max-sm:px-3.5 pb-6 max-sm:pb-5">
        <span class="text-sm text-gray-500 max-sm:hidden" x-text="filteredOrders.length + ' ${t("orders.ordersCount")}'"></span>
        <div class="flex items-center gap-1.5">
          <button class="flex items-center justify-center w-8 h-8 border border-gray-300 max-sm:border-gray-200 rounded max-sm:rounded-full bg-white text-gray-400 cursor-not-allowed" disabled>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="flex items-center justify-center w-8 h-8 text-sm text-white bg-gray-900 rounded max-sm:rounded-full font-medium">1</span>
          <button class="flex items-center justify-center w-8 h-8 border border-gray-300 max-sm:border-gray-200 rounded max-sm:rounded-full bg-white text-gray-400 cursor-not-allowed" disabled>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      </div></template>

      <!-- ════════════════════════════════════════
           ORDER DETAIL VIEW
           ════════════════════════════════════════ -->
      <template x-if="selectedOrder"><div>

        <!-- Back Button -->
        <div class="px-7 max-sm:px-3 pt-5 pb-2">
          <button @click="backToList()" class="th-no-press flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer transition-colors p-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15 19l-7-7 7-7"/></svg>
            ${t("orders.backToOrders")}
          </button>
        </div>

        <!-- Section 1: Breadcrumb + Header -->
        <div class="px-7 max-sm:px-3 pt-2 pb-5 border-b border-gray-100">
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <a href="/" class="hover:text-gray-600 transition-colors">${t("common.home")}</a>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
            <a href="/pages/dashboard/orders.html" class="hover:text-gray-600 transition-colors">${t("orders.orderManagement")}</a>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
            <span class="text-gray-600">${t("orders.orderDetails")}</span>
          </nav>

          <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:gap-3">
            <div>
              <h1 class="text-[22px] max-sm:text-lg font-bold text-gray-900 mb-2">${t("orders.orderDetails")}</h1>
              <div class="flex items-center gap-3 flex-wrap max-sm:gap-2">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-800" x-text="selectedOrder.orderNumber"></span>
                </div>
                <button @click="copyOrderNumber()" class="th-no-press flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer transition-colors p-0">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <span x-text="copiedNumber ? '${t("orders.copied")}' : '${t("orders.copy")}'"></span>
                </button>
                <span class="text-gray-300 max-sm:hidden">|</span>
                <span class="text-sm text-gray-500" x-text="'${t("orders.orderDateLabel")} ' + selectedOrder.orderDate"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Progress Stepper -->
        <div class="px-7 max-sm:px-3 py-6 border-b border-gray-100">
          <!-- Cancelled banner -->
          <template x-if="isCancelled(selectedOrder)">
            <div class="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
              <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"/></svg>
              <span class="text-sm font-medium text-red-700">${t("orders.orderCancelled") || "Bu sipariş iptal edilmiştir"}</span>
            </div>
          </template>
          <!-- İade stepper (iade talebi varsa) -->
          <template x-if="!isCancelled(selectedOrder) && hasActiveRefund(selectedOrder)">
            <div class="flex items-center justify-between max-w-lg mx-auto max-sm:max-w-full">
              <!-- Step 1: İade Talebi -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getRefundStepIndex(selectedOrder) >= 0 ? getRefundStepColor(selectedOrder) + ' text-white' : 'bg-gray-200 text-gray-500'">1</div>
                <span class="text-xs max-sm:text-[9px] text-gray-600 text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]">${t("ordersUi.refundRequest")}</span>
              </div>
              <div class="flex-1 h-0.5 -mt-4 max-sm:-mt-3"
                   :class="getRefundStepIndex(selectedOrder) >= 1 ? getRefundStepColor(selectedOrder) : 'bg-gray-200'"></div>
              <!-- Step 2: İnceleniyor -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getRefundStepIndex(selectedOrder) >= 1 ? getRefundStepColor(selectedOrder) + ' text-white' : 'bg-gray-200 text-gray-500'">2</div>
                <span class="text-xs max-sm:text-[9px] text-gray-600 text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]">${t("ordersUi.underReview")}</span>
              </div>
              <div class="flex-1 h-0.5 -mt-4 max-sm:-mt-3"
                   :class="getRefundStepIndex(selectedOrder) >= 2 ? getRefundStepColor(selectedOrder) : 'bg-gray-200'"></div>
              <!-- Step 3: Sonuç -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getRefundStepIndex(selectedOrder) >= 2 ? getRefundStepColor(selectedOrder) + ' text-white' : 'bg-gray-200 text-gray-500'">3</div>
                <span class="text-xs max-sm:text-[9px] text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]"
                      :class="selectedOrder.refundStatus === 'Rejected' ? 'text-red-500' : selectedOrder.refundStatus === 'Approved' ? 'text-orange-600 font-medium' : 'text-gray-600'">
                  <span x-text="selectedOrder.refundStatus === 'Rejected' ? '${t("ordersUi.refundRejected")}' : '${t("ordersUi.refundApproved")}'"></span>
                </span>
              </div>
            </div>
          </template>
          <!-- Normal stepper (iade yoksa ve iptal değilse) -->
          <template x-if="!isCancelled(selectedOrder) && !hasActiveRefund(selectedOrder)">
            <div class="flex items-center justify-between max-w-2xl mx-auto max-sm:max-w-full">
              <!-- Step 1: Siparis -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getStepIndex(selectedOrder) >= 0 ? 'bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a)' : 'bg-gray-200 text-gray-500'">1</div>
                <span class="text-xs max-sm:text-[9px] text-gray-600 text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]">${t("orders.stepOrder")}</span>
              </div>
              <div class="flex-1 h-0.5 -mt-4 max-sm:-mt-3" :class="getStepIndex(selectedOrder) >= 1 ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-200'"></div>
              <!-- Step 2: Ödeme -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getStepIndex(selectedOrder) >= 1 ? 'bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a)' : 'bg-gray-200 text-gray-500'">2</div>
                <span class="text-xs max-sm:text-[9px] text-gray-600 text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]">${t("orders.stepPayment")}</span>
              </div>
              <div class="flex-1 h-0.5 -mt-4 max-sm:-mt-3" :class="getStepIndex(selectedOrder) >= 2 ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-200'"></div>
              <!-- Step 3: Hazırlanıyor -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getStepIndex(selectedOrder) >= 2 ? 'bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a)' : 'bg-gray-200 text-gray-500'">3</div>
                <span class="text-xs max-sm:text-[9px] text-gray-600 text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]">${t("orders.stepShipping")}</span>
              </div>
              <div class="flex-1 h-0.5 -mt-4 max-sm:-mt-3" :class="getStepIndex(selectedOrder) >= 3 ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-200'"></div>
              <!-- Step 4: Kargoda -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getStepIndex(selectedOrder) >= 3 ? 'bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a)' : 'bg-gray-200 text-gray-500'">4</div>
                <span class="text-xs max-sm:text-[9px] text-gray-600 text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]">${t("orders.stepDelivery")}</span>
              </div>
              <div class="flex-1 h-0.5 -mt-4 max-sm:-mt-3" :class="getStepIndex(selectedOrder) >= 4 ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-200'"></div>
              <!-- Step 5: Teslim Edildi -->
              <div class="flex flex-col items-center gap-1.5 relative z-10">
                <div class="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     :class="getStepIndex(selectedOrder) >= 4 ? 'bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a)' : 'bg-gray-200 text-gray-500'">5</div>
                <span class="text-xs max-sm:text-[9px] text-gray-600 text-center max-sm:whitespace-normal max-sm:leading-tight max-sm:max-w-[52px]">${t("orders.stepReview")}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Section 3: Status -->
        <div class="px-7 max-sm:px-3 py-5 border-b border-gray-100">
          <p class="text-base font-bold mb-1" :class="getStatusColor(selectedOrder)" x-text="getStatusLabel(selectedOrder)"></p>
          <p class="text-sm text-gray-500" x-text="getStatusDescription(selectedOrder)"></p>
        </div>

        <!-- Action Buttons (status-aware) -->
        <div class="px-7 max-sm:px-3 py-5 border-b border-gray-100">
          <div class="flex items-center gap-3 mt-4 flex-wrap" x-show="isActionable(selectedOrder)">
            <template x-if="canPay(selectedOrder)">
              <button @click="openRemittanceModal(selectedOrder.orderNumber, selectedOrder.total, selectedOrder.currency, selectedOrder.paymentMethod)" class="th-btn">
                ${t("orders.makePayment")}
              </button>
            </template>
            <template x-if="hasReceipt(selectedOrder)">
              <a :href="selectedOrder.receiptUrl" target="_blank" class="th-btn-outline inline-flex items-center gap-1.5 text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                ${t("ordersUi.viewReceipt")}
              </a>
            </template>
            <template x-if="canModifyShipping(selectedOrder)">
              <button @click="openModal('showModifyShipping')" class="th-btn-outline">
                ${t("orders.modifyShippingDetails")}
              </button>
            </template>
            <template x-if="canCancel(selectedOrder)">
              <button @click="openModal('showCancelOrder')" class="th-btn-outline">
                ${t("orders.cancelOrderBtn")}
              </button>
            </template>
          </div>
        </div>

        <!-- Section 4: Ürün detayları (closed + open hybrid) -->
        <div class="px-7 max-sm:px-3 py-5 border-b border-gray-100">
          <!-- Header: özet + tedarikçi adı -->
          <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <h2 class="text-base font-bold text-gray-900">
                <span x-text="selectedOrder.products.length"></span> ${t("orders.productName")} ·
                <span x-text="(selectedOrder.currency || '') + ' ' + selectedOrderTotal"></span>
              </h2>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span class="text-gray-500">${t("orders.seller")}:</span>
              <span class="font-medium text-gray-800" x-text="selectedOrder.seller"></span>
              <a href="#" class="text-blue-600 hover:underline">${t("orders.chatNow")}</a>
            </div>
          </div>

          <!-- Search + sort toolbar (sadece açık durumda) -->
          <div x-show="showAllProducts" x-transition class="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
            <div class="relative flex-1">
              <svg class="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                x-model="productSearch"
                placeholder="${t("orders.productName")}"
                aria-label="${t("orders.productName")}"
                class="w-full ps-8 pe-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--btn-bg,#cc9900)]/30 focus:border-[var(--btn-bg,#cc9900)]" />
            </div>
            <div class="relative" x-data="{ sortOpen: false }">
              <button @click="sortOpen = !sortOpen" class="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 whitespace-nowrap cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h13M3 12h9m-9 6h5"/></svg>
                <span x-text="productSortLabel"></span>
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5H5z"/></svg>
              </button>
              <div x-show="sortOpen" @click.outside="sortOpen = false" x-transition class="absolute end-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1 min-w-[160px]">
                <button @click="productSort = 'default'; sortOpen = false" class="th-no-press w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">${t("orders.sortDefault")}</button>
                <button @click="productSort = 'name-asc'; sortOpen = false" class="th-no-press w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">${t("orders.sortNameAsc")}</button>
                <button @click="productSort = 'name-desc'; sortOpen = false" class="th-no-press w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">${t("orders.sortNameDesc")}</button>
                <button @click="productSort = 'price-asc'; sortOpen = false" class="th-no-press w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">${t("orders.sortPriceAsc")}</button>
                <button @click="productSort = 'price-desc'; sortOpen = false" class="th-no-press w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">${t("orders.sortPriceDesc")}</button>
              </div>
            </div>
          </div>

          <!-- Product list: closed = first 5, open = scroll container -->
          <div
            :class="showAllProducts ? 'max-h-[340px] overflow-y-auto pe-1 relative' : ''">
            <template x-for="(product, idx) in (showAllProducts ? filteredProducts : selectedOrder.products.slice(0, productPreviewCount))" :key="product.name + idx">
              <div class="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                <div class="w-10 h-10 max-sm:w-8 max-sm:h-8 rounded border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                  <img :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-800 line-clamp-2 leading-snug" x-text="product.name"></div>
                  <div class="text-xs text-gray-500 mt-0.5" x-text="product.quantity + ' × ' + (selectedOrder.currency || '') + ' ' + product.unitPrice"></div>
                </div>
                <span class="text-sm font-medium text-gray-900 text-end whitespace-nowrap"><span x-text="(selectedOrder.currency || '') + ' ' + product.totalPrice"></span></span>
              </div>
            </template>

            <!-- Open + boş arama -->
            <template x-if="showAllProducts && filteredProducts.length === 0">
              <p class="text-sm text-gray-400 text-center py-6">${t("orders.noProductsFound")}</p>
            </template>

            <!-- Scroll fade indicator (open + scrollable) -->
            <div x-show="showAllProducts && filteredProducts.length > productPreviewCount" class="sticky bottom-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none -mt-5"></div>
          </div>

          <!-- CTA + summary row (closed) -->
          <template x-if="!showAllProducts && selectedOrder.products.length > productPreviewCount">
            <button @click="showAllProducts = true" class="w-full mt-3 py-2.5 text-sm font-medium text-blue-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 cursor-pointer transition-colors">
              ↓ <span x-text="selectedOrder.products.length - productPreviewCount"></span> ${t("orders.showMoreProducts")}
            </button>
          </template>

          <!-- Open CTA (collapse) -->
          <template x-if="showAllProducts">
            <button @click="showAllProducts = false; productSearch = ''; productSort = 'default'" class="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer">
              ↑ ${t("orders.collapse")}
            </button>
          </template>

          <!-- Summary row (closed only) -->
          <template x-if="!showAllProducts">
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <span class="text-sm text-gray-500">${t("orders.productQuantity")}: <strong class="text-gray-800" x-text="selectedOrderQty"></strong></span>
              <span class="text-sm text-gray-500">${t("orders.totalPrice")}: <strong class="text-gray-900" x-text="(selectedOrder.currency || '') + ' ' + selectedOrderTotal"></strong></span>
            </div>
          </template>
        </div>

        <!-- Section 5-7: Detay tab container (Kargo / Ödeme / Tedarikçi) -->
        <div class="px-7 max-sm:px-3 pt-5">
          <!-- Boxed tab bar -->
          <div class="flex items-end gap-0" role="tablist" aria-label="${t("ordersUi.orderDetailSections")}">
            <button
              @click="activeDetailTab = 'shipping'"
              @keydown.right.prevent="activeDetailTab = 'payment'; document.getElementById('tab-payment')?.focus()"
              @keydown.left.prevent="activeDetailTab = 'supplier'; document.getElementById('tab-supplier')?.focus()"
              :class="activeDetailTab === 'shipping' ? 'bg-white border-s border-e border-t border-gray-200 text-gray-900 font-semibold -mb-px z-10 relative' : 'bg-transparent text-gray-500 hover:text-gray-700 border-b border-gray-200'"
              class="px-4 py-2.5 max-sm:px-3 max-sm:py-2 text-sm max-sm:text-xs rounded-t-md cursor-pointer flex items-center gap-2 transition-colors"
              role="tab"
              id="tab-shipping"
              :aria-selected="activeDetailTab === 'shipping'"
              aria-controls="panel-shipping">
              <svg class="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" :class="activeDetailTab === 'shipping' ? 'text-[var(--btn-bg,#cc9900)]' : 'text-gray-400'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
              </svg>
              <span>${t("orders.tabShipping")}</span>
            </button>
            <button
              @click="activeDetailTab = 'payment'"
              @keydown.right.prevent="activeDetailTab = 'supplier'; document.getElementById('tab-supplier')?.focus()"
              @keydown.left.prevent="activeDetailTab = 'shipping'; document.getElementById('tab-shipping')?.focus()"
              :class="activeDetailTab === 'payment' ? 'bg-white border-s border-e border-t border-gray-200 text-gray-900 font-semibold -mb-px z-10 relative' : 'bg-transparent text-gray-500 hover:text-gray-700 border-b border-gray-200'"
              class="px-4 py-2.5 max-sm:px-3 max-sm:py-2 text-sm max-sm:text-xs rounded-t-md cursor-pointer flex items-center gap-2 transition-colors"
              role="tab"
              id="tab-payment"
              :aria-selected="activeDetailTab === 'payment'"
              aria-controls="panel-payment">
              <svg class="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" :class="activeDetailTab === 'payment' ? 'text-[var(--btn-bg,#cc9900)]' : 'text-gray-400'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
              </svg>
              <span>${t("orders.tabPayment")}</span>
            </button>
            <button
              @click="activeDetailTab = 'supplier'"
              @keydown.right.prevent="activeDetailTab = 'shipping'; document.getElementById('tab-shipping')?.focus()"
              @keydown.left.prevent="activeDetailTab = 'payment'; document.getElementById('tab-payment')?.focus()"
              :class="activeDetailTab === 'supplier' ? 'bg-white border-s border-e border-t border-gray-200 text-gray-900 font-semibold -mb-px z-10 relative' : 'bg-transparent text-gray-500 hover:text-gray-700 border-b border-gray-200'"
              class="px-4 py-2.5 max-sm:px-3 max-sm:py-2 text-sm max-sm:text-xs rounded-t-md cursor-pointer flex items-center gap-2 transition-colors"
              role="tab"
              id="tab-supplier"
              :aria-selected="activeDetailTab === 'supplier'"
              aria-controls="panel-supplier">
              <svg class="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" :class="activeDetailTab === 'supplier' ? 'text-[var(--btn-bg,#cc9900)]' : 'text-gray-400'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span>${t("orders.tabSupplier")}</span>
            </button>
            <div class="flex-1 border-b border-gray-200"></div>
          </div>

          <!-- Tab panels (border-l/r/b ile aktif tab'a bağlı) -->
          <div class="bg-white border-s border-e border-b border-gray-200 rounded-b-md p-5 max-sm:p-4">
            <!-- Kargo paneli -->
            <div x-show="activeDetailTab === 'shipping'" x-transition.opacity id="panel-shipping" role="tabpanel" aria-labelledby="tab-shipping">
              <div class="flex items-center justify-end gap-3 mb-4 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
                      :class="selectedOrder.shipping.trackingStatus === 'Kargo yolda' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'"
                      x-text="selectedOrder.shipping.trackingStatus"></span>
                <button @click="openModal('showTrackPackage')" class="text-sm text-blue-600 hover:underline whitespace-nowrap bg-transparent border-none cursor-pointer p-0">${t("orders.trackShipments")} &gt;</button>
                <template x-if="canModifyShipping(selectedOrder)">
                  <button @click="openModal('showModifyShipping')" class="text-sm text-blue-600 hover:underline whitespace-nowrap bg-transparent border-none cursor-pointer p-0">${t("orders.modifyShippingDetails")}</button>
                </template>
              </div>
              <div class="grid grid-cols-4 max-sm:grid-cols-1 gap-4 max-sm:gap-3">
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.deliveryAddress")}</p>
                  <p class="text-sm text-gray-700 leading-relaxed" x-text="selectedOrder.shipping.address"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.shipFromCountry")}</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.shipping.shipFrom"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.shippingMethod")}</p>
                  <p class="text-sm text-gray-700 whitespace-pre-line" x-text="selectedOrder.shipping.method"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Incoterms</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.shipping.incoterms"></p>
                </div>
              </div>
            </div>

            <!-- Ödeme paneli -->
            <div x-show="activeDetailTab === 'payment'" x-transition.opacity id="panel-payment" role="tabpanel" aria-labelledby="tab-payment">
              <div class="flex items-center justify-end gap-2 mb-4 flex-wrap">
                <button @click="openModal('showPaymentHistory')" class="px-4 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">
                  ${t("orders.paymentHistoryTitle")}
                </button>
                <div class="relative" x-data="{ moreOpen: false }">
                  <button @click="moreOpen = !moreOpen" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border border-gray-200 rounded-full cursor-pointer transition-colors">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>
                  </button>
                  <div x-show="moreOpen" @click.outside="moreOpen = false" x-transition class="absolute end-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 min-w-[160px]">
                    <button @click="downloadInvoice(selectedOrder); moreOpen = false" class="th-no-press w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      ${t("orders.downloadInvoice")}
                    </button>
                    <template x-if="canRefund(selectedOrder)">
                      <button @click="openRefundModal(selectedOrder); moreOpen = false" class="th-no-press w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer flex items-center gap-2">
                        <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        ${t("orders.requestRefund")}
                      </button>
                    </template>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 max-sm:grid-cols-1 gap-6 max-sm:gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
                        :class="selectedOrder.payment.status === 'Paid' ? 'bg-green-50 text-green-700' :
                                selectedOrder.payment.status === 'Processing' ? 'bg-blue-50 text-blue-700' :
                                selectedOrder.payment.status === 'Refunded' ? 'bg-purple-50 text-purple-700' :
                                'bg-amber-50 text-amber-700'">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                           x-show="selectedOrder.payment.status === 'Paid'"><path stroke-linecap="round" d="M5 13l4 4L19 7"/></svg>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                           x-show="selectedOrder.payment.status === 'Refunded'"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                           x-show="selectedOrder.payment.status !== 'Paid' && selectedOrder.payment.status !== 'Refunded'"><path stroke-linecap="round" d="M12 8v4m0 4h.01"/><circle cx="12" cy="12" r="10"/></svg>
                      <span x-text="selectedOrder.payment.status === 'Paid' ? '${t("ordersUi.paid")}' : selectedOrder.payment.status === 'Refunded' ? '${t("ordersUi.refundedStatus")}' : selectedOrder.payment.status === 'Unpaid' ? '${t("ordersUi.unpaidStatus")}' : selectedOrder.payment.status"></span>
                    </span>
                  </div>
                  <template x-if="selectedOrder.payment.hasRecord">
                    <a href="#" class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      ${t("orders.viewPaymentHistory")}
                    </a>
                  </template>
                  <template x-if="!selectedOrder.payment.hasRecord">
                    <p class="text-sm text-gray-400">${t("orders.noPaymentRecord")}</p>
                  </template>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 max-sm:p-3">
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">${t("orders.subtotal")}</span>
                      <span class="text-gray-800"><span x-text="(selectedOrder.currency || '') + ' ' + selectedOrder.payment.subtotal"></span></span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">${t("orders.shippingFee")}</span>
                      <span class="text-gray-800"><span x-text="(selectedOrder.currency || '') + ' ' + selectedOrder.payment.shippingFee"></span></span>
                    </div>
                    <div class="border-t border-gray-200 pt-2.5 flex items-center justify-between text-sm">
                      <span class="text-gray-500">${t("orders.subtotal")}</span>
                      <span class="text-gray-800"><span x-text="(selectedOrder.currency || '') + ' ' + selectedOrder.payment.grandTotal"></span></span>
                    </div>
                    <div class="flex items-center justify-between text-base font-bold">
                      <span class="text-gray-900">${t("orders.grandTotal")}*</span>
                      <span class="text-gray-900"><span x-text="(selectedOrder.currency || '') + ' ' + selectedOrder.payment.grandTotal"></span></span>
                    </div>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-3 leading-relaxed">${t("orders.totalDisclaimer")}</p>
                </div>
              </div>
            </div>
            <!-- Tedarikçi paneli -->
            <div x-show="activeDetailTab === 'supplier'" x-transition.opacity id="panel-supplier" role="tabpanel" aria-labelledby="tab-supplier">
              <div class="grid grid-cols-4 max-sm:grid-cols-2 max-[380px]:grid-cols-1 gap-4 max-sm:gap-3 mb-4">
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.supplier")}</p>
                  <p class="text-sm font-medium text-gray-800" x-text="selectedOrder.supplier.name"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.contactName")}</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.supplier.contact"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.phone")}</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.supplier.phone"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.email")}</p>
                  <p class="text-sm text-gray-700 break-all" x-text="selectedOrder.supplier.email"></p>
                </div>
              </div>
              <div class="flex items-center gap-4 max-sm:gap-3">
                <a :href="selectedOrder.supplier.code ? '/magaza/' + encodeURIComponent(selectedOrder.supplier.code) : '#'" class="text-sm text-blue-600 hover:underline">${t("orders.visitStore")}</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 10: Action Buttons -->
        <div class="px-7 max-sm:px-3 py-5 flex items-center gap-3 flex-wrap">
          <button @click="openModal('showOperationHistory')" class="th-btn-outline whitespace-nowrap">
            ${t("orders.operationHistory")}
          </button>
        </div>

      <!-- ═══════════════════════════════════════
           MODALS
           ═══════════════════════════════════════ -->

      <!-- Modal 1: Operation History -->
      <template x-if="showOperationHistory">
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="closeModal('showOperationHistory')">
          <div class="absolute inset-0 bg-black/50" @click="closeModal('showOperationHistory')"></div>
          <div class="relative bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-bold text-gray-900">${t("orders.operationHistory")}</h3>
              <button @click="closeModal('showOperationHistory')" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded-full hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Body — Dynamic timeline based on order status -->
            <div class="px-6 py-5 overflow-y-auto max-h-[60vh]">
              <div class="relative ps-6 border-s-2 border-gray-200 space-y-6">
                <!-- Step 1: Order submitted (always) -->
                <div class="relative">
                  <div class="absolute -start-[25px] top-1 w-3 h-3 bg-(--btn-bg,#f5b800) rounded-full border-2 border-white"></div>
                  <p class="text-sm font-medium text-gray-900">${t("orders.orderSubmitted")}</p>
                  <p class="text-xs text-gray-500 mt-0.5" x-text="selectedOrder.orderDate"></p>
                  <p class="text-xs text-gray-400 mt-1" x-text="'${t("orders.orderPrefix")} ' + selectedOrder.orderNumber"></p>
                </div>

                <!-- Cancelled -->
                <template x-if="selectedOrder.status === 'Cancelled'">
                  <div class="relative">
                    <div class="absolute -start-[25px] top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                    <p class="text-sm font-medium text-red-600">${t("orders.orderCancelled")}</p>
                    <p class="text-xs text-gray-400 mt-1" x-text="selectedOrder.statusDescription"></p>
                  </div>
                </template>

                <!-- Normal flow steps -->
                <template x-if="selectedOrder.status !== 'Cancelled'">
                  <div class="space-y-6">
                    <!-- Step 2: Payment -->
                    <div class="relative">
                      <div class="absolute -start-[25px] top-1 w-3 h-3 rounded-full border-2 border-white"
                           :class="getStepIndex(selectedOrder) >= 1 ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-300'"></div>
                      <p class="text-sm font-medium" :class="getStepIndex(selectedOrder) >= 1 ? 'text-gray-900' : 'text-gray-400'"
                         x-text="getStepIndex(selectedOrder) === 0 ? '${t("orders.awaitingPayment")}' : '${t("orders.orderConfirming")}'"></p>
                      <p class="text-xs text-gray-400 mt-1"
                         x-text="getStepIndex(selectedOrder) === 0 ? '${t("orders.waitingPaymentMessage")}' : '${t("orders.orderConfirmingMessage")}'"></p>
                    </div>
                    <!-- Step 3: Preparing -->
                    <template x-if="getStepIndex(selectedOrder) >= 2">
                      <div class="relative">
                        <div class="absolute -start-[25px] top-1 w-3 h-3 bg-(--btn-bg,#f5b800) rounded-full border-2 border-white"></div>
                        <p class="text-sm font-medium text-gray-900">${t("orders.orderPreparing")}</p>
                        <p class="text-xs text-gray-400 mt-1">${t("orders.orderPreparingMessage")}</p>
                      </div>
                    </template>
                    <!-- Step 4: Delivering -->
                    <template x-if="getStepIndex(selectedOrder) >= 3">
                      <div class="relative">
                        <div class="absolute -start-[25px] top-1 w-3 h-3 bg-(--btn-bg,#f5b800) rounded-full border-2 border-white"></div>
                        <p class="text-sm font-medium text-gray-900">${t("orders.orderDelivering")}</p>
                        <p class="text-xs text-gray-400 mt-1">${t("orders.orderDeliveringMessage")}</p>
                      </div>
                    </template>
                    <!-- Step 5: Completed -->
                    <template x-if="getStepIndex(selectedOrder) >= 4">
                      <div class="relative">
                        <div class="absolute -start-[25px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        <p class="text-sm font-medium text-green-700">${t("orders.orderCompleted")}</p>
                        <p class="text-xs text-gray-400 mt-1">${t("orders.orderCompletedMessage")}</p>
                      </div>
                    </template>
                    <!-- Refund: Pending -->
                    <template x-if="selectedOrder.refundStatus === 'Pending'">
                      <div class="relative">
                        <div class="absolute -start-[25px] top-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white"></div>
                        <p class="text-sm font-medium text-amber-700">${t("ordersUi.refundUnderReview")}</p>
                        <p class="text-xs text-gray-400 mt-1" x-text="selectedOrder.refundReason || '${t("ordersUi.reviewedBySeller")}'"></p>
                      </div>
                    </template>
                    <!-- Refund: Approved -->
                    <template x-if="selectedOrder.refundStatus === 'Approved'">
                      <div class="relative">
                        <div class="absolute -start-[25px] top-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
                        <p class="text-sm font-medium text-purple-700">${t("ordersUi.refundApprovedTitle")}</p>
                        <p class="text-xs text-gray-400 mt-1">
                          <span x-text="selectedOrder.currency + ' ' + Number(selectedOrder.total).toLocaleString('tr-TR', {minimumFractionDigits: 2})"></span> ${t("ordersUi.refundApprovedBySeller")}
                        </p>
                      </div>
                    </template>
                    <!-- Refund: Rejected -->
                    <template x-if="selectedOrder.refundStatus === 'Rejected'">
                      <div class="relative">
                        <div class="absolute -start-[25px] top-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white"></div>
                        <p class="text-sm font-medium text-red-600">${t("ordersUi.refundRejectedTitle")}</p>
                        <p class="text-xs text-gray-400 mt-1">${t("ordersUi.refundRejectedBySeller")}</p>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button @click="closeModal('showOperationHistory')" class="th-btn-outline px-5 py-2 text-sm font-medium cursor-pointer">
                ${t("common.close")}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Modal 2: Choose a Service -->
      <template x-if="showAddServices">
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="closeModal('showAddServices')">
          <div class="absolute inset-0 bg-black/50" @click="closeModal('showAddServices')"></div>
          <div class="relative bg-white rounded-md shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-bold text-gray-900">${t("orders.chooseAService")}</h3>
              <button @click="closeModal('showAddServices')" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded-full hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Body -->
            <div class="px-6 py-5 overflow-y-auto max-h-[65vh] space-y-4">
              <!-- Production Monitoring -->
              <div class="border border-gray-200 rounded-lg p-5 hover:border-amber-300 transition-colors cursor-pointer">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <h4 class="text-base font-bold text-gray-900">${t("orders.productionMonitoring")}</h4>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${t("orders.productionMonitoringDesc")}</p>
                    <p class="text-xs text-gray-500">${t("orders.startingFrom")} <strong class="text-amber-600">$48.00</strong></p>
                  </div>
                  <button class="th-btn whitespace-nowrap shrink-0">
                    ${t("orders.selectService")}
                  </button>
                </div>
              </div>
              <!-- Inspection Service -->
              <div class="border border-gray-200 rounded-lg p-5 hover:border-amber-300 transition-colors cursor-pointer">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                      <h4 class="text-base font-bold text-gray-900">${t("orders.preShipmentInspection")}</h4>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${t("orders.preShipmentInspectionDesc")}</p>
                    <p class="text-xs text-gray-500">${t("orders.startingFrom")} <strong class="text-amber-600">$88.00</strong></p>
                  </div>
                  <button class="th-btn whitespace-nowrap shrink-0">
                    ${t("orders.selectService")}
                  </button>
                </div>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button @click="closeModal('showAddServices')" class="th-btn-outline px-5 py-2 text-sm font-medium cursor-pointer">
                ${t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Modal 3: Payment History -->
      <template x-if="showPaymentHistory">
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="closeModal('showPaymentHistory')">
          <div class="absolute inset-0 bg-black/50" @click="closeModal('showPaymentHistory')"></div>
          <div class="relative bg-white rounded-md shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-bold text-gray-900">${t("orders.paymentHistoryTitle")}</h3>
              <button @click="closeModal('showPaymentHistory')" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded-full hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Tabs -->
            <div class="border-b border-gray-200 px-6">
              <div class="flex gap-0">
                <button @click="paymentHistoryTab = 'records'"
                  :class="paymentHistoryTab === 'records' ? 'text-gray-900 border-b-2 border-gray-900 font-medium' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'"
                  class="py-3 px-4 text-sm bg-transparent cursor-pointer transition-colors border-none">
                  ${t("orders.paymentRecords")}
                </button>
                <button @click="paymentHistoryTab = 'refunds'"
                  :class="paymentHistoryTab === 'refunds' ? 'text-gray-900 border-b-2 border-gray-900 font-medium' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'"
                  class="py-3 px-4 text-sm bg-transparent cursor-pointer transition-colors border-none">
                  ${t("orders.refunds")}
                </button>
                <button @click="paymentHistoryTab = 'wire'"
                  :class="paymentHistoryTab === 'wire' ? 'text-gray-900 border-b-2 border-gray-900 font-medium' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'"
                  class="py-3 px-4 text-sm bg-transparent cursor-pointer transition-colors border-none">
                  ${t("orders.wireTransferTracking")}
                </button>
              </div>
            </div>
            <!-- Body -->
            <div class="px-6 py-5 overflow-y-auto max-h-[55vh]">
              <!-- Loading -->
              <template x-if="paymentLoading">
                <div class="flex items-center justify-center py-12">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                </div>
              </template>

              <div x-show="!paymentLoading">
                <!-- Payment records tab -->
                <div x-show="paymentHistoryTab === 'records'">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-200">
                        <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("orders.date")}</th>
                        <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("orders.method")}</th>
                        <th class="text-end text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("orders.amount")}</th>
                        <th class="text-end text-xs font-semibold text-gray-500 uppercase pb-3">${t("orders.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template x-if="paymentRecords.length === 0">
                        <tr>
                          <td colspan="4" class="py-12 text-center text-gray-400 text-sm">${t("orders.noPaymentRecords")}</td>
                        </tr>
                      </template>
                      <template x-for="rec in paymentRecords" :key="rec.name">
                        <tr class="border-b border-gray-100">
                          <td class="py-3 pe-4 text-gray-700" x-text="rec.payment_date ? new Date(rec.payment_date).toLocaleDateString('tr-TR') : '-'"></td>
                          <td class="py-3 pe-4 text-gray-700" x-text="rec.method || '-'"></td>
                          <td class="py-3 pe-4 text-end font-medium text-gray-900" x-text="(rec.currency || 'USD') + ' ' + Number(rec.amount || 0).toFixed(2)"></td>
                          <td class="py-3 text-end">
                            <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                                  :class="rec.status === 'Completed' ? 'bg-green-50 text-green-700' : rec.status === 'Failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
                                  x-text="rec.status"></span>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
                <!-- Refunds tab -->
                <div x-show="paymentHistoryTab === 'refunds'">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-200">
                        <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("orders.date")}</th>
                        <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("orders.reason")}</th>
                        <th class="text-end text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("orders.amount")}</th>
                        <th class="text-end text-xs font-semibold text-gray-500 uppercase pb-3">${t("orders.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template x-if="refundRecords.length === 0">
                        <tr>
                          <td colspan="4" class="py-12 text-center text-gray-400 text-sm">${t("orders.noRefundRecords")}</td>
                        </tr>
                      </template>
                      <template x-for="rec in refundRecords" :key="rec.name">
                        <tr class="border-b border-gray-100">
                          <td class="py-3 pe-4 text-gray-700" x-text="rec.payment_date ? new Date(rec.payment_date).toLocaleDateString('tr-TR') : '-'"></td>
                          <td class="py-3 pe-4 text-gray-700" x-text="rec.reason || '-'"></td>
                          <td class="py-3 pe-4 text-end font-medium text-red-600" x-text="(rec.currency || 'USD') + ' -' + Number(rec.amount || 0).toFixed(2)"></td>
                          <td class="py-3 text-end">
                            <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                                  :class="rec.status === 'Refunded' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'"
                                  x-text="rec.status"></span>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
                <!-- Wire transfer tab -->
                <div x-show="paymentHistoryTab === 'wire'">
                  <template x-if="wireRecords.length === 0">
                    <p class="py-12 text-center text-gray-400 text-sm">${t("orders.noWireTransferRecords")}</p>
                  </template>
                  <template x-for="rec in wireRecords" :key="rec.name">
                    <div class="border border-gray-100 rounded-md p-5 mb-3 space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-gray-500 uppercase">${t("ordersUi.wireEft")}</span>
                        <span class="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full"
                              :class="rec.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'"
                              x-text="rec.status === 'Completed' ? '${t("ordersUi.confirmed")}' : '${t("ordersUi.pendingStatus")}'"></span>
                      </div>
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p class="text-xs text-gray-400 mb-0.5">${t("ordersUi.transferDate")}</p>
                          <p class="font-medium text-gray-800" x-text="rec.payment_date ? new Date(rec.payment_date).toLocaleDateString('tr-TR') : '-'"></p>
                        </div>
                        <div>
                          <p class="text-xs text-gray-400 mb-0.5">${t("ordersUi.sender")}</p>
                          <p class="font-medium text-gray-800" x-text="rec.reference || '-'"></p>
                        </div>
                        <div>
                          <p class="text-xs text-gray-400 mb-0.5">${t("ordersUi.amountLabel")}</p>
                          <p class="font-semibold text-gray-900" x-text="(rec.currency || 'USD') + ' ' + Number(rec.amount || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})"></p>
                        </div>
                        <div x-show="rec.receipt_url">
                          <p class="text-xs text-gray-400 mb-0.5">${t("ordersUi.receipt")}</p>
                          <a :href="rec.receipt_url" target="_blank"
                            class="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                            ${t("ordersUi.viewReceipt")}
                          </a>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button @click="closeModal('showPaymentHistory')" class="th-btn-outline px-5 py-2 text-sm font-medium cursor-pointer">
                ${t("common.close")}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Modal: Refund Request -->
      <template x-if="showRefundModal">
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="closeModal('showRefundModal')">
          <div class="absolute inset-0 bg-black/50" @click="closeModal('showRefundModal')"></div>
          <div class="relative bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-base font-bold text-gray-900">${t("ordersUi.refundRequest")}</h3>
              <button @click="closeModal('showRefundModal')" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded-full hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Blocked: aktif iade talebi var -->
            <template x-if="refundBlocked">
              <div class="px-6 py-10 text-center">
                <div class="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                </div>
                <h4 class="text-base font-semibold text-gray-900 mb-2">${t("ordersUi.refundCannotCreate")}</h4>
                <p class="text-sm text-gray-500 mb-6" x-text="refundError"></p>
                <button @click="closeModal('showRefundModal')" class="px-6 py-2 text-sm font-medium bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) rounded-full border border-(--btn-border-color,#d39c00) cursor-pointer active:scale-[0.97] motion-reduce:active:scale-100 transition-[transform,background-color] duration-150">${t("common.close")}</button>
              </div>
            </template>
            <!-- Success state -->
            <template x-if="refundSuccess">
              <div class="px-6 py-10 text-center">
                <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h4 class="text-base font-semibold text-gray-900 mb-2">${t("ordersUi.refundReceived")}</h4>
                <p class="text-sm text-gray-500 mb-6">${t("ordersUi.refundReceivedDesc")}</p>
                <button @click="closeModal('showRefundModal')" class="px-6 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-full border-none cursor-pointer transition-colors">${t("common.close")}</button>
              </div>
            </template>
            <!-- Form -->
            <template x-if="!refundSuccess && !refundBlocked">
              <div class="px-6 py-5">
                <p class="text-sm text-gray-500 mb-5">
                  <strong x-text="selectedOrder?.orderNumber"></strong> ${t("ordersUi.refundFormIntro")}
                </p>
                <!-- Refund amount -->
                <div class="mb-4">
                  <label class="block text-xs font-semibold text-gray-600 mb-1.5">${t("ordersUi.refundAmount")}</label>
                  <div class="relative">
                    <span class="absolute start-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" x-text="selectedOrder?.currency || 'TRY'"></span>
                    <input type="text" :value="Number(refundForm.amount).toLocaleString('tr-TR', {minimumFractionDigits: 2})" readonly
                      class="th-input th-input-md ps-12" aria-disabled="true" />
                  </div>
                </div>
                <!-- Reason -->
                <div class="mb-5">
                  <label class="block text-xs font-semibold text-gray-600 mb-1.5">${t("ordersUi.refundReason")} <span class="text-red-500">*</span></label>
                  <textarea x-model="refundForm.reason" rows="4"
                    class="th-input resize-none"
                    placeholder="${t("ordersUi.refundReasonPlaceholder")}"></textarea>
                </div>
                <!-- Error -->
                <p x-show="refundError" x-text="refundError" class="text-xs text-red-500 mb-3"></p>
                <!-- Actions -->
                <div class="flex gap-3 justify-end">
                  <button @click="closeModal('showRefundModal')" class="th-btn-outline px-5 py-2 text-sm font-medium cursor-pointer">${t("common.cancel")}</button>
                  <button @click="submitRefundRequest()"
                    :disabled="submittingRefund || !refundForm.reason.trim()"
                    class="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <template x-if="submittingRefund">
                      <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    </template>
                    ${t("ordersUi.submitRefundRequest")}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Modal 4: Track Package -->
      <template x-if="showTrackPackage">
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="closeModal('showTrackPackage')">
          <div class="absolute inset-0 bg-black/50" @click="closeModal('showTrackPackage')"></div>
          <div class="relative bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-bold text-gray-900">${t("orders.trackPackage")}</h3>
              <button @click="closeModal('showTrackPackage')" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded-full hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Body -->
            <div class="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-5">
              <!-- Shipment info -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.shipTime")}</p>
                  <p class="text-sm text-gray-700">${t("orders.pending")}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.shippingMethod")}</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.shipping.method"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.estimatedDelivery")}</p>
                  <p class="text-sm text-gray-700">${t("orders.toBeConfirmed")}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.trackingNumber")}</p>
                  <p class="text-sm text-gray-400">${t("orders.notAvailableYet")}</p>
                </div>
              </div>
              <!-- Timeline -->
              <div class="border-t border-gray-100 pt-4">
                <h4 class="text-sm font-bold text-gray-900 mb-3">${t("orders.trackingUpdates")}</h4>
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <svg class="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                  </svg>
                  <p class="text-sm text-gray-400">${t("orders.noTrackingUpdates")}</p>
                </div>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button @click="closeModal('showTrackPackage')" class="th-btn-outline px-5 py-2 text-sm font-medium cursor-pointer">
                ${t("common.close")}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Modal 5: Modify Shipping Details -->
      <template x-if="showModifyShipping">
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="closeModal('showModifyShipping')">
          <div class="absolute inset-0 bg-black/50" @click="closeModal('showModifyShipping')"></div>
          <div class="relative bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-bold text-gray-900">${t("orders.modifyShippingDetails")}</h3>
              <button @click="closeModal('showModifyShipping')" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded-full hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Body -->
            <div class="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4">
              <!-- Address -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">${t("orders.shippingAddress")}</label>
                <textarea class="th-input h-20 resize-none" x-model="selectedOrder.shipping.address" placeholder="${t("orders.enterShippingAddress")}"></textarea>
              </div>
              <!-- Country -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">${t("orders.shipFrom")}</label>
                  <input type="text" class="th-input th-input-md" :value="selectedOrder.shipping.shipFrom" disabled />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Incoterms</label>
                  <input type="text" class="th-input th-input-md" :value="selectedOrder.shipping.incoterms" disabled />
                </div>
              </div>
              <!-- Service line -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">${t("orders.shippingServiceLine")}</label>
                <template x-if="shippingMethodsLoading">
                  <div class="w-full h-10 px-3 flex items-center text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400">
                    ${t("common.loading") || "Yükleniyor..."}
                  </div>
                </template>
                <template x-if="!shippingMethodsLoading">
                  <select
                    x-model="selectedShippingMethod"
                    class="th-input th-input-md cursor-pointer"
                  >
                    <template x-if="shippingMethods.length === 0">
                      <option value="">${t("orders.noShippingMethods") || "Kargo yöntemi bulunamadı"}</option>
                    </template>
                    <template x-for="method in shippingMethods" :key="method.id">
                      <option :value="method.id" x-text="method.estimatedDays ? method.method + ' (' + method.estimatedDays + ')' : method.method"></option>
                    </template>
                  </select>
                </template>
              </div>
              <!-- Fee info -->
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
                  </svg>
                  <p class="text-xs text-gray-600">${t("orders.shippingModificationNote")}</p>
                </div>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button @click="closeModal('showModifyShipping')" class="th-btn-outline">
                ${t("common.cancel")}
              </button>
              <button @click="closeModal('showModifyShipping')" class="th-btn">
                ${t("orders.submitChanges")}
              </button>
            </div>
          </div>
        </div>
      </template>

      </div></template>

      <!-- ════════════════════════════════════════
           CANCEL ORDER MODAL (shared by list & detail)
           ════════════════════════════════════════ -->
      <template x-if="showCancelOrder">
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="closeModal('showCancelOrder')">
          <div class="absolute inset-0 bg-black/50" @click="cancelReason = ''; cancellingOrder = null; closeModal('showCancelOrder')"></div>
          <div class="relative bg-white rounded-md shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-bold text-gray-900">${t("orders.cancelOrderTitle")}</h3>
              <button @click="cancelReason = ''; cancellingOrder = null; closeModal('showCancelOrder')" class="th-no-press flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded-full hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Body -->
            <div class="px-6 py-5 overflow-y-auto max-h-[60vh]">
              <p class="text-sm text-gray-700 mb-1">${t("orders.cancelReasonQuestion")}</p>
              <p class="text-sm text-gray-500 mb-5">${t("orders.cancelReasonSubtext")}</p>
              <!-- 9 sebep → native dropdown. value'lar ve x-model="cancelReason" korunur. -->
              <select
                name="cancelReason"
                x-model="cancelReason"
                class="th-input th-input-md w-full"
              >
                <option value="" disabled>${t("orders.cancelReasonQuestion")}</option>
                <option value="shipping_fee">${t("orders.cancelShippingFee")}</option>
                <option value="no_stock">${t("orders.cancelNoStock")}</option>
                <option value="not_paid_30">${t("orders.cancelNotPaid30Days")}</option>
                <option value="shipping_method">${t("orders.cancelShippingMethod")}</option>
                <option value="shipping_time">${t("orders.cancelShippingTime")}</option>
                <option value="no_longer_needed">${t("orders.cancelNoLongerNeeded")}</option>
                <option value="wrong_info">${t("orders.cancelWrongOrder")}</option>
                <option value="price_increased">${t("orders.cancelPriceIncreased")}</option>
                <option value="others">${t("orders.cancelOther")}</option>
              </select>
            </div>
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button @click="confirmCancelOrder()"
                :class="cancelReason ? 'th-btn' : 'th-btn opacity-50 cursor-not-allowed'"
                :disabled="!cancelReason">
                ${t("orders.confirmCancel")}
              </button>
              <button @click="cancelReason = ''; cancellingOrder = null; closeModal('showCancelOrder')" class="th-btn-outline">
                ${t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </template>

    </div>

      <!-- ════════════════════════════════════════
           REMITTANCE PROOF MODAL
           ════════════════════════════════════════ -->
      <div class="os-modal hidden fixed inset-0 z-[9999] items-center justify-center" id="remittance-modal">
        <div class="os-modal__overlay absolute inset-0 bg-black/45"></div>
        <div class="os-modal__dialog relative bg-white rounded-md w-[740px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-64px)] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.2)]" style="animation: osModalIn 200ms ease-out"
             x-data="remittanceComponent()">

          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-md">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-bold text-gray-900" x-text="isCheckPayment ? '${t("ordersUi.submitDocument")}' : '${t("orders.submitRemittanceProof")}'"></h3>
              <!-- Step indicator (3 steps) -->
              <div class="flex items-center gap-1.5" x-show="step !== 'success'">
                <span class="w-2 h-2 rounded-full transition-colors" :class="step === 'iban' ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-300'"></span>
                <span class="w-2 h-2 rounded-full transition-colors" :class="step === 'upload' ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-300'"></span>
                <span class="w-2 h-2 rounded-full transition-colors" :class="step === 'form' || step === 'submitting' ? 'bg-(--btn-bg,#f5b800)' : 'bg-gray-300'"></span>
              </div>
            </div>
            <button @click="reset()" class="os-modal__close bg-transparent border-none cursor-pointer p-1.5 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100" aria-label="${t("common.close")}">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="#666" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>

          <!-- ═══ STEP 0: Satıcı IBAN Bilgileri ═══ -->
          <div x-show="step === 'iban'" x-transition class="p-6">
            <!-- Loading -->
            <template x-if="loadingBank">
              <div class="flex items-center justify-center py-12 gap-3 text-gray-400">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                <span class="text-sm">${t("ordersUi.loadingBankInfo")}</span>
              </div>
            </template>

            <template x-if="!loadingBank">
              <div>
                <!-- Title -->
                <p class="text-sm text-gray-600 mb-5">${t("ordersUi.transferToAccountHint")}</p>

                <!-- IBAN Card -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-md p-5 mb-5">
                  <div class="flex items-center gap-2 mb-4">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    <h4 class="font-bold text-amber-900 text-sm">${t("ordersUi.paymentInfo")}</h4>
                  </div>

                  <template x-if="!sellerIban">
                    <p class="text-sm text-red-500">${t("ordersUi.sellerNoBankInfo")}</p>
                  </template>

                  <template x-if="sellerIban">
                    <div class="space-y-3">
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-xs text-amber-700 font-medium w-28 shrink-0 pt-0.5">${t("ordersUi.accountHolder")}</span>
                        <span class="text-sm font-semibold text-gray-900 text-end" x-text="sellerAccountHolder || sellerName || '—'"></span>
                      </div>
                      <div class="border-t border-amber-200"></div>
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-xs text-amber-700 font-medium w-28 shrink-0 pt-0.5">${t("ordersUi.bankName")}</span>
                        <span class="text-sm font-semibold text-gray-900 text-end" x-text="sellerBankName || '—'"></span>
                      </div>
                      <div class="border-t border-amber-200"></div>
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-xs text-amber-700 font-medium w-28 shrink-0 pt-0.5">IBAN</span>
                        <div class="flex items-center gap-2 flex-wrap justify-end">
                          <span class="text-sm font-mono font-bold text-gray-900 tracking-wider" x-text="sellerIban"></span>
                          <button type="button" @click="navigator.clipboard.writeText(sellerIban); $el.textContent='${t("ordersUi.copiedExcl")}'; setTimeout(() => $el.textContent='${t("ordersUi.copy")}', 2000)"
                            class="text-xs text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300 transition-colors cursor-pointer whitespace-nowrap">
                            ${t("ordersUi.copy")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Warning note -->
                <div class="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
                  <svg class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <p class="text-xs text-blue-700" x-text="isCheckPayment ? '${t("ordersUi.checkPaymentNote")}' : '${t("ordersUi.wirePaymentNote")}'"></p>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between gap-3">
                  <button @click="reset()" class="th-no-press text-sm text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer transition-colors">${t("common.cancel")}</button>
                  <button @click="goToUpload()" :disabled="!sellerIban"
                    class="flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    <span x-text="isCheckPayment ? '${t("ordersUi.paidUploadDoc")}' : '${t("ordersUi.paidUploadReceipt")}'"></span>
                  </button>
                </div>
              </div>
            </template>
          </div>

          <!-- ═══ STEP 1: Upload ═══ -->
          <div x-show="step === 'upload'" x-transition class="p-6">
            <!-- Error message -->
            <template x-if="errors.file">
              <div class="flex items-center gap-2 px-4 py-2.5 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span x-text="errors.file"></span>
              </div>
            </template>

            <!-- Upload Zone -->
            <div class="border-2 border-dashed rounded-md p-8 max-sm:p-5 text-center transition-colors cursor-pointer"
                 :class="dragging ? 'border-amber-400 bg-amber-50/60' : hasFile ? 'border-green-300 bg-green-50/30' : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'"
                 @dragover.prevent="dragging = true"
                 @dragleave.prevent="dragging = false"
                 @drop.prevent="dragging = false; handleFiles($event.dataTransfer.files)">

              <div class="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <!-- Document Preview -->
                <div class="w-[140px] h-[180px] shrink-0 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm overflow-hidden relative">
                  <!-- No file -->
                  <template x-if="!hasFile">
                    <div class="text-center">
                      <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <p class="text-[11px] text-gray-400">${t("orders.remitPreview")}</p>
                    </div>
                  </template>
                  <!-- Image preview -->
                  <template x-if="hasFile && filePreviewUrl">
                    <img :src="filePreviewUrl" class="w-full h-full object-contain" />
                  </template>
                  <!-- PDF file -->
                  <template x-if="hasFile && !filePreviewUrl">
                    <div class="text-center px-3">
                      <svg class="w-10 h-10 text-red-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 14a1 1 0 110-2 1 1 0 010 2zm7 0h-4a.5.5 0 010-1h4a.5.5 0 010 1zm0 3h-4a.5.5 0 010-1h4a.5.5 0 010 1z"/></svg>
                      <p class="text-[10px] text-gray-500 truncate" x-text="fileName"></p>
                    </div>
                  </template>
                  <!-- Remove button -->
                  <button x-show="hasFile" @click.stop="removeFile()"
                    class="absolute top-1 end-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-xs cursor-pointer border-none hover:bg-red-600 transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <!-- Upload Info -->
                <div class="flex-1 text-start max-md:text-center">
                  <p class="text-sm text-gray-600 mb-1">
                    <span class="text-amber-600 font-semibold">*</span>
                    ${t("orders.remitUploadHint")}
                  </p>
                  <div class="text-[13px] text-gray-500 space-y-0.5 mb-4">
                    <p><strong class="text-gray-700">${t("orders.remitDocClear")}</strong></p>
                    <p>${t("orders.remitFileSize")}: 20 MB</p>
                    <p>${t("orders.remitFormats")}: JPG, JPEG, PNG, GIF, PDF</p>
                    <p>${t("orders.remitManualLink")} <a href="#" class="text-blue-600 hover:underline">${t("orders.remitEnterManually")}</a></p>
                  </div>

                  <!-- File info badge when uploaded -->
                  <template x-if="hasFile">
                    <div class="flex items-center gap-2 mb-3 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 inline-flex">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span x-text="fileName" class="truncate max-w-[200px]"></span>
                      <span class="text-green-500 text-xs" x-text="'(' + fileSize + ')'"></span>
                    </div>
                  </template>

                  <label class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-(--color-cta-primary) rounded-full cursor-pointer transition-colors hover:bg-(--color-cta-primary-hover)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span x-text="hasFile ? '${t("orders.remitChangeFile")}' : '${t("orders.remitUploadFile")}'"></span>
                    <input type="file" accept=".jpg,.jpeg,.png,.gif,.pdf" class="hidden"
                           @change="handleFiles($event.target.files)" />
                  </label>
                </div>
              </div>
            </div>

            <!-- Continue Button -->
            <div class="flex justify-end mt-5">
              <button @click="goToForm()"
                class="px-6 py-2.5 text-sm font-medium text-white bg-(--color-cta-primary) rounded-lg cursor-pointer transition-[background-color,box-shadow,transform] motion-reduce:transition-[background-color,box-shadow] duration-150 hover:bg-(--color-cta-primary-hover)"
                :class="!hasFile ? 'opacity-40 cursor-not-allowed! scale-[0.98]' : 'hover:shadow-md'">
                ${t("orders.remitContinue")}
                <svg class="w-4 h-4 inline ms-1 -mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <!-- ═══ STEP 2: Form ═══ -->
          <div x-show="step === 'form'" x-transition class="p-6">
            <!-- Success Banner -->
            <div class="flex items-center gap-2 px-4 py-2.5 mb-5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ${t("orders.remitUploadSuccess")}
            </div>

            <div class="flex gap-6 max-md:flex-col">
              <!-- Left: Preview -->
              <div class="w-[220px] max-md:w-full shrink-0 space-y-3">
                <div class="w-full aspect-[3/4] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <template x-if="filePreviewUrl">
                    <img :src="filePreviewUrl" class="w-full h-full object-contain" />
                  </template>
                  <template x-if="!filePreviewUrl">
                    <div class="text-center">
                      <svg class="w-10 h-10 text-red-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
                      <p class="text-xs text-gray-500 truncate px-2" x-text="fileName"></p>
                    </div>
                  </template>
                </div>
                <button @click="removeFile()" class="th-no-press w-full text-center text-xs text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors">
                  ${t("orders.remitChangeFile")}
                </button>
              </div>

              <!-- Right: Form -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-4">
                  <p class="text-sm text-gray-600">${t("orders.remitFormHint")}</p>
                  <button @click="clearForm()" class="th-no-press text-xs text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center gap-1 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    ${t("orders.remitClearAll")}
                  </button>
                </div>

                <div class="space-y-4">

                  <!-- Remittance Date (read-only — sipariş tarihinden otomatik) -->
                  <div>
                    <label class="block text-sm text-gray-700 mb-1.5">
                      ${t("orders.remitDate")}
                    </label>
                    <input type="date" x-model="form.remittanceDate"
                      readonly
                      class="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-700 cursor-default" />
                  </div>

                  <!-- Amount (read-only — sipariş tutarından otomatik) -->
                  <div>
                    <label class="block text-sm text-gray-700 mb-1.5">
                      ${t("orders.remitAmount")}
                    </label>
                    <div class="flex gap-2">
                      <div class="h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 flex items-center w-[100px] font-medium" x-text="form.currency"></div>
                      <input type="text" x-model="form.amount"
                        readonly
                        class="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-700 cursor-default font-medium" />
                    </div>
                  </div>

                  <!-- Bank Name -->
                  <div>
                    <label class="block text-sm text-gray-700 mb-1.5">
                      <span class="text-red-500">*</span> ${t("orders.remitBankName")}
                    </label>
                    <input type="text" x-model="form.bankName"
                      @blur="submitted && validateField('bankName')"
                      :class="errors.bankName ? 'border-red-400! ring-1! ring-red-200!' : ''"
                      placeholder="${t("orders.remitPlaceholderEnter")}"
                      class="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none bg-white text-gray-700 transition-colors focus:border-amber-400 focus:ring-1 focus:ring-amber-200" />
                    <p x-show="errors.bankName" class="text-xs text-red-500 mt-1">${t("common.required")}</p>
                  </div>

                  <!-- Sender Name -->
                  <div>
                    <label class="block text-sm text-gray-700 mb-1.5">
                      <span class="text-red-500">*</span> ${t("orders.remitSenderName")}
                    </label>
                    <input type="text" x-model="form.senderName"
                      @blur="submitted && validateField('senderName')"
                      :class="errors.senderName ? 'border-red-400! ring-1! ring-red-200!' : ''"
                      placeholder="${t("orders.remitPlaceholderEnter")}"
                      class="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none bg-white text-gray-700 transition-colors focus:border-amber-400 focus:ring-1 focus:ring-amber-200" />
                    <p x-show="errors.senderName" class="text-xs text-red-500 mt-1">${t("common.required")}</p>
                  </div>

                  <!-- Smart Prediction Note -->
                  <div class="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-700 leading-relaxed">
                    <svg class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>
                    ${t("orders.remitSmartPrediction")}
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between mt-6 gap-3">
                  <button @click="step = 'upload'"
                    class="px-4 py-2.5 text-sm text-gray-600 bg-transparent border border-gray-300 rounded-lg cursor-pointer font-medium transition-colors hover:bg-gray-50">
                    <svg class="w-4 h-4 inline me-1 -mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15 19l-7-7 7-7"/></svg>
                    ${t("common.back")}
                  </button>
                  <button @click="submitRemittance()"
                    class="inline-flex items-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-(--color-cta-primary) rounded-lg cursor-pointer transition-[background-color,box-shadow] duration-150 hover:bg-(--color-cta-primary-hover) hover:shadow-md"
                    :class="!isFormValid ? 'opacity-60' : ''">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    ${t("orders.remitCheckStatus")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ STEP: Submitting ═══ -->
          <div x-show="step === 'submitting'" x-transition class="p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
              <svg class="w-12 h-12 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            </div>
            <h4 class="text-lg font-bold text-gray-900 mb-2">${t("orders.remitSubmitting")}</h4>
            <p class="text-sm text-gray-500">${t("orders.remitPleaseWait")}</p>
          </div>

          <!-- ═══ STEP: Success ═══ -->
          <div x-show="step === 'success'" x-transition class="p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h4 class="text-lg font-bold text-gray-900 mb-2">${t("orders.remitSuccessTitle")}</h4>
            <p class="text-sm text-gray-500 mb-6 max-w-[360px] mx-auto">${t("orders.remitSuccessDesc")}</p>
            <button @click="reset()" class="os-modal__close px-6 py-2.5 text-sm font-medium text-white bg-(--color-cta-primary) rounded-lg cursor-pointer transition-colors hover:bg-(--color-cta-primary-hover)">
              ${t("common.close")}
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

/* Ortak boş-durum bloğu — üç sekmede aynı görsel dil (tonal daire + başlık + açıklama + ops. CTA) */
function renderEmptyState(iconRaw: string, title: string, desc: string, cta = ""): string {
  return `
    <div class="flex flex-col items-center px-6 py-16 max-sm:py-12 text-center">
      <div class="flex items-center justify-center w-14 h-14 rounded-full bg-(--color-surface-raised,#f5f5f5) mb-4">
        ${styleSvg(iconRaw, "w-6 h-6 text-gray-400")}
      </div>
      <h3 class="text-[15px] font-semibold text-gray-900 m-0 mb-1.5">${title}</h3>
      <p class="text-[13px] leading-relaxed text-gray-500 max-w-[280px] m-0">${desc}</p>
      ${cta}
    </div>`;
}

/* Skeleton — spinner yerine içerik iskeleti (product register) */
function renderListSkeleton(): string {
  return `
    <div class="px-7 max-sm:px-4 py-5 space-y-3 animate-pulse" aria-hidden="true">
      ${`<div class="h-24 max-sm:h-28 rounded-md bg-gray-100"></div>`.repeat(3)}
    </div>`;
}

function renderRefunds(): string {
  const chips = [
    { bucket: "all", label: t("common.all") },
    { bucket: "pending", label: t("ordersUi.underReview") },
    { bucket: "approved", label: t("orders.refundStatusApproved") },
    { bucket: "rejected", label: t("orders.refundStatusRejected") },
  ]
    .map(
      ({ bucket, label }) => `
      <button type="button" x-show="countOf('${bucket}') > 0" @click="statusFilter = '${bucket}'"
        :class="statusFilter === '${bucket}'
          ? 'bg-gray-900 text-white border-gray-900 font-semibold'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'"
        class="th-no-press inline-flex items-center gap-1 h-8 px-3.5 text-[13px] rounded-full border whitespace-nowrap cursor-pointer transition-colors">
        ${label}
        <span class="text-[11px]" :class="statusFilter === '${bucket}' ? 'text-white/70' : 'text-gray-400'" x-text="'(' + countOf('${bucket}') + ')'"></span>
      </button>`
    )
    .join("");

  return `
    <div x-data="refundsComponent()" x-cloak>
      <!-- Header -->
      <div class="flex items-baseline justify-between gap-3 px-7 max-sm:px-4 pt-6 max-sm:pt-5 pb-5 max-sm:pb-4 border-b border-(--color-border-light,#f0f0f0)">
        <h1 class="text-[22px] max-sm:text-[18px] font-bold text-(--color-text-heading,#111827) m-0">${t("orders.refundsTab")}</h1>
        <span class="text-[13px] text-gray-500 whitespace-nowrap" x-show="!loading && refunds.length > 0"
          x-text="refunds.length + ' ${t("orders.refundRequests")}'"></span>
      </div>

      <template x-if="loading">${renderListSkeleton()}</template>

      <!-- Empty -->
      <template x-if="!loading && refunds.length === 0">
        ${renderEmptyState(
          receiptIcon,
          t("orders.refundsEmptyTitle"),
          t("orders.refundsEmptyDesc"),
          `<a href="#all-orders" class="th-btn-outline mt-5 px-5 py-2 text-[13px] max-sm:rounded-full no-underline">${t("orders.backToOrders")}</a>`
        )}
      </template>

      <!-- Dolu durum -->
      <template x-if="!loading && refunds.length > 0">
        <div>
          <!-- Durum filtresi chip'leri -->
          <div class="flex gap-1.5 px-7 max-sm:px-4 pt-4 pb-1 overflow-x-auto scrollbar-hide">${chips}</div>

          <!-- Mobil: kart listesi -->
          <div class="sm:hidden px-4 py-4 space-y-2.5">
            <template x-for="r in filteredRefunds" :key="r.order_number">
              <article class="rounded-md border border-gray-200 p-3.5">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono text-[12px] font-semibold text-gray-800 truncate min-w-0" x-text="r.order_number"></span>
                  <span class="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0" :class="statusClass(r.refund_status)" x-text="r.refund_status_label"></span>
                </div>
                <p class="text-[13px] text-gray-600 leading-snug line-clamp-2 mt-2 mb-0" x-text="r.refund_reason || '-'"></p>
                <div class="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-gray-100 min-w-0">
                  <span class="text-[12px] text-gray-500 truncate min-w-0">
                    <span x-text="fmtDate(r.refund_requested_at || r.order_date)"></span><template x-if="r.seller_name"><span> · <span x-text="r.seller_name"></span></span></template>
                  </span>
                  <span class="text-[14px] font-semibold text-gray-900 whitespace-nowrap shrink-0" x-text="fmtAmount(r)"></span>
                </div>
              </article>
            </template>
          </div>

          <!-- Desktop: tablo -->
          <div class="max-sm:hidden px-7 py-5">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("ordersUi.orderNo")}</th>
                  <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("ordersUi.date")}</th>
                  <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("ordersUi.seller")}</th>
                  <th class="text-start text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("ordersUi.reason")}</th>
                  <th class="text-end text-xs font-semibold text-gray-500 uppercase pb-3 pe-4">${t("ordersUi.refundAmountCol")}</th>
                  <th class="text-center text-xs font-semibold text-gray-500 uppercase pb-3">${t("ordersUi.statusCol")}</th>
                </tr>
              </thead>
              <tbody>
                <template x-for="r in filteredRefunds" :key="r.order_number">
                  <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td class="py-3 pe-4 font-mono text-xs font-semibold text-gray-800 whitespace-nowrap" x-text="r.order_number"></td>
                    <td class="py-3 pe-4 text-gray-500 text-xs whitespace-nowrap" x-text="fmtDate(r.refund_requested_at || r.order_date)"></td>
                    <td class="py-3 pe-4 text-gray-700 text-xs max-w-[180px] truncate" :title="r.seller_name" x-text="r.seller_name || '-'"></td>
                    <td class="py-3 pe-4 text-gray-600 text-xs max-w-[200px] truncate" :title="r.refund_reason" x-text="r.refund_reason || '-'"></td>
                    <td class="py-3 pe-4 text-end font-semibold text-gray-900 text-xs whitespace-nowrap" x-text="fmtAmount(r)"></td>
                    <td class="py-3 text-center">
                      <span class="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap" :class="statusClass(r.refund_status)" x-text="r.refund_status_label"></span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  `;
}

/* Değerlendirme kartlarında görsel yoksa tonal ikon kutusu (taşmaya dayanıklı tasarım) */
function productThumb(expr: string, sizeCls: string): string {
  return `
    <template x-if="${expr}.image"><img :src="${expr}.image" :alt="${expr}.product_name" class="${sizeCls} rounded-md border border-gray-200 object-cover shrink-0" loading="lazy" /></template>
    <template x-if="!${expr}.image">
      <div class="${sizeCls} rounded-md border border-gray-200 bg-(--color-surface-muted,#fafafa) flex items-center justify-center shrink-0">
        ${styleSvg(packageIcon, "w-5 h-5 text-gray-400")}
      </div>
    </template>`;
}

const STAR_POINTS = "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26";

function renderReviews(): string {
  const tabBtn = (id: string, longLabel: string, shortLabel: string, countExpr: string) => `
    <button type="button" role="tab" @click="tab = '${id}'" :aria-selected="tab === '${id}'"
      :class="tab === '${id}' ? 'text-gray-900 font-semibold border-gray-900' : 'text-gray-500 hover:text-gray-700 border-transparent'"
      class="th-no-press py-3 px-4 max-sm:px-3 text-sm max-sm:text-[13px] bg-transparent border-0 border-b-2 border-solid whitespace-nowrap cursor-pointer transition-colors -mb-px">
      <span class="max-sm:hidden">${longLabel}</span><span class="sm:hidden">${shortLabel}</span>
      <span class="font-normal" :class="tab === '${id}' ? 'text-gray-500' : 'text-gray-400'" x-text="'(' + ${countExpr} + ')'"></span>
    </button>`;

  return `
    <div x-data="reviewsSectionComponent()" x-cloak>
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 px-7 max-sm:px-4 pt-6 max-sm:pt-5 pb-5 max-sm:pb-4 border-b border-(--color-border-light,#f0f0f0)">
        <h1 class="text-[22px] max-sm:text-[18px] font-bold text-(--color-text-heading,#111827) m-0 truncate">${t("orders.myReviews")}</h1>
        <button type="button" class="th-no-press inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer p-0 whitespace-nowrap shrink-0 transition-colors" aria-label="${t("orders.scoringRules")}">
          ${styleSvg(infoIcon, "w-4 h-4 shrink-0")}
          <span class="max-[359px]:hidden">${t("orders.scoringRules")}</span>
        </button>
      </div>

      <!-- Sekmeler -->
      <div class="flex border-b border-(--color-border-default,#e5e5e5) px-7 max-sm:px-4" role="tablist" aria-label="${t("orders.myReviews")}">
        ${tabBtn("pending", t("orders.pendingReviews"), t("orders.pendingShort"), "pending.length")}
        ${tabBtn("done", t("orders.reviewed"), t("orders.reviewed"), "done.length")}
      </div>

      <template x-if="loading">${renderListSkeleton()}</template>

      <template x-if="!loading">
        <div>
          <!-- Arama (yalnızca aktif sekmede içerik varken) -->
          <div class="px-7 max-sm:px-4 pt-4 pb-1" x-show="activeCount > 0">
            <div class="relative sm:max-w-[320px] sm:ms-auto">
              <svg class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" x-model="search" @keydown.escape="search = ''"
                placeholder="${t("orders.reviewSearchPlaceholder")}"
                class="th-input th-input-sm ps-9 w-full max-sm:h-10" />
            </div>
          </div>

          <!-- Bekleyen değerlendirmeler -->
          <div x-show="tab === 'pending'" role="tabpanel">
            <template x-if="pending.length === 0">
              ${renderEmptyState(starIcon, t("orders.noPendingReviews"), t("orders.pendingReviewsEmptyDesc"))}
            </template>
            <template x-if="pending.length > 0 && filteredPending.length === 0">
              <p class="text-[13px] text-gray-500 text-center py-12 m-0">${t("orders.noReviewsFound")}</p>
            </template>
            <div class="px-7 max-sm:px-4 py-4 space-y-2.5" x-show="filteredPending.length > 0">
              <template x-for="p in filteredPending" :key="p.order_item">
                <article class="flex items-center max-sm:flex-col max-sm:items-stretch gap-3 rounded-md border border-gray-200 p-3.5">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    ${productThumb("p", "w-12 h-12")}
                    <div class="min-w-0">
                      <p class="text-[14px] max-sm:text-[13px] font-medium text-gray-900 line-clamp-2 leading-snug m-0" x-text="p.product_name"></p>
                      <div class="flex flex-wrap items-center gap-x-1.5 text-[12px] text-gray-500 mt-1">
                        <span class="font-mono" x-text="p.order_number"></span>
                        <span class="whitespace-nowrap" x-text="fmtDate(p.delivered_at)"></span>
                      </div>
                    </div>
                  </div>
                  <button type="button" class="th-btn shrink-0 px-5 py-2 text-[13px] whitespace-nowrap max-sm:w-full max-sm:rounded-full">${t("orders.writeReview")}</button>
                </article>
              </template>
            </div>
          </div>

          <!-- Yapılan değerlendirmeler -->
          <div x-show="tab === 'done'" role="tabpanel">
            <template x-if="done.length === 0">
              ${renderEmptyState(messageSquareIcon, t("orders.reviewsDoneEmptyTitle"), t("orders.reviewsDoneEmptyDesc"))}
            </template>
            <template x-if="done.length > 0 && filteredDone.length === 0">
              <p class="text-[13px] text-gray-500 text-center py-12 m-0">${t("orders.noReviewsFound")}</p>
            </template>
            <div class="px-7 max-sm:px-4 py-4 space-y-2.5" x-show="filteredDone.length > 0">
              <template x-for="r in filteredDone" :key="r.name">
                <article class="rounded-md border border-gray-200 p-4 max-sm:p-3.5">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="flex items-center gap-0.5 shrink-0" :aria-label="r.rating + '/5'">
                        <template x-for="i in 5">
                          <svg class="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" :class="i <= r.rating ? 'text-[#f5b800]' : 'text-gray-200'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="${STAR_POINTS}"/></svg>
                        </template>
                      </div>
                      <span class="text-[12px] max-sm:text-[11px] text-gray-400 whitespace-nowrap truncate" x-text="fmtDate(r.submitted_at)"></span>
                    </div>
                    <span class="inline-flex px-2.5 max-sm:px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0" :class="reviewStatusChip(r.status).cls" x-text="reviewStatusChip(r.status).label"></span>
                  </div>
                  <template x-if="r.title"><h3 class="text-[14px] font-semibold text-gray-900 mt-2.5 mb-0" x-text="r.title"></h3></template>
                  <p class="text-[13px] text-gray-600 leading-relaxed line-clamp-3 mt-1.5 mb-0" x-text="r.body"></p>
                  <template x-if="r.product_name">
                    <div class="flex items-center gap-2.5 mt-3 pt-3 border-t border-gray-100 min-w-0">
                      ${productThumb("r", "w-8 h-8")}
                      <p class="text-[12px] text-gray-500 truncate m-0 flex-1 min-w-0" x-text="r.product_name"></p>
                      <span class="inline-flex items-center gap-1 text-[12px] text-gray-400 whitespace-nowrap shrink-0" x-show="r.helpful_count > 0">
                        ${styleSvg(thumbsUpIcon, "w-3.5 h-3.5")}
                        <span x-text="r.helpful_count"></span>
                      </span>
                    </div>
                  </template>
                </article>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  `;
}

/* ────────────────────────────────────────
   SECTION MAP
   ──────────────────────────────────────── */
const SECTIONS: Record<string, () => string> = {
  "all-orders": renderAllOrders,
  refunds: renderRefunds,
  reviews: renderReviews,
};

/* ────────────────────────────────────────
   MAIN LAYOUT
   ──────────────────────────────────────── */
function getActiveSection(): string {
  const hash = window.location.hash.replace("#", "");
  return SECTIONS[hash] ? hash : "all-orders";
}

function renderNav(activeId: string): string {
  return getNavItems()
    .map((item) => {
      const isActive = item.id === activeId;
      const activeClasses = isActive
        ? "orders-page__nav-link--active text-gray-900 border-b-2 border-gray-900 font-semibold"
        : "text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300";
      return `<button type="button" class="orders-page__nav-link py-3 px-4 max-sm:px-3 text-sm max-sm:text-[13px] whitespace-nowrap transition-colors shrink-0 bg-transparent border-none cursor-pointer
                     [&.orders-page__nav-link--active]:font-semibold
                     [&.orders-page__nav-link--active]:text-[var(--color-text-heading,#111827)]
                     [&.orders-page__nav-link--active]:border-b-[var(--color-text-heading)] ${activeClasses}" data-nav="${item.id}">${item.label}</button>`;
    })
    .join("");
}

export function OrdersPageLayout(): string {
  const activeId = getActiveSection();
  const renderFn = SECTIONS[activeId] ?? renderAllOrders;

  return `
    <div class="orders-page bg-(--color-surface,#fff) rounded-lg min-h-[calc(100vh-80px)] max-md:rounded-none max-md:min-h-0">
      <!-- Top Tab Navigation -->
      <nav class="orders-page__nav-links flex overflow-x-auto scrollbar-hide border-b border-(--color-border-light,#e5e7eb) px-3 max-sm:px-1 bg-(--color-surface,#fff)">
        ${renderNav(activeId)}
      </nav>
      <div class="orders-page__content flex-1 flex flex-col min-w-0" id="orders-content">
        ${renderFn()}
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────
   INIT
   ──────────────────────────────────────── */
export function initOrdersPageLayout(): void {
  const contentEl = document.getElementById("orders-content");
  if (!contentEl) return;

  function navigate(): void {
    const activeId = getActiveSection();
    const renderFn = SECTIONS[activeId] ?? renderAllOrders;
    contentEl!.innerHTML = renderFn();

    // Alpine, innerHTML ile sonradan eklenen x-data ağacını otomatik taramaz —
    // hash navigasyonunda yeni section'ın (ordersListComponent/
    // refundsComponent) canlanması için manuel initTree gerekir, aksi halde
    // içerik "ölü" kalır.
    const Alpine = (window as unknown as { Alpine?: { initTree(el: HTMLElement): void } }).Alpine;
    if (Alpine) Alpine.initTree(contentEl!);

    // Update nav active state
    document.querySelectorAll<HTMLAnchorElement>(".orders-page__nav-link").forEach((link) => {
      const isActive = link.dataset.nav === activeId;
      link.classList.toggle("orders-page__nav-link--active", isActive);
      link.classList.toggle("font-semibold", isActive);
      link.classList.toggle("text-gray-900", isActive);
      link.classList.toggle("border-gray-900", isActive);
      link.classList.toggle("text-gray-500", !isActive);
      link.classList.toggle("border-transparent", !isActive);
      // Dar ekranda seçili sekme scroll dışında kalabiliyor — görünür alana getir
      if (isActive) link.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
    });

    initTaxModals();
    initOrderTabsScroll();
  }

  // Hash change listener
  window.addEventListener("hashchange", navigate);

  // Nav link clicks
  document.querySelectorAll<HTMLButtonElement>(".orders-page__nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.nav ?? "all-orders";
      window.location.hash = id;
    });
  });

  initTaxModals();
  initOrderTabsScroll();

  // İlk yüklemede de aktif sekme dar ekranda görünür alana gelsin
  document
    .querySelector(".orders-page__nav-link--active")
    ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
}

function openModal(id: string): void {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeModal(modal: HTMLElement): void {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
}

function initTaxModals(): void {
  // Open modal on button click
  document.querySelectorAll<HTMLButtonElement>("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.dataset.modal;
      if (modalId) openModal(modalId);
    });
  });

  // Close modal on overlay click, close button, or cancel button
  document.querySelectorAll<HTMLElement>(".os-modal").forEach((modal) => {
    const overlay = modal.querySelector<HTMLElement>(".os-modal__overlay");
    const closeBtn = modal.querySelector<HTMLButtonElement>(".os-modal__close");
    const cancelBtn = modal.querySelector<HTMLButtonElement>(".os-modal__btn--cancel");

    overlay?.addEventListener("click", () => closeModal(modal));
    closeBtn?.addEventListener("click", () => closeModal(modal));
    cancelBtn?.addEventListener("click", () => closeModal(modal));
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModalEl = document.querySelector<HTMLElement>(".os-modal:not(.hidden)");
      if (openModalEl) closeModal(openModalEl);
    }
  });
}

/* ────────────────────────────────────────
   ORDER TABS HORIZONTAL SCROLL
   ──────────────────────────────────────── */
function initOrderTabsScroll(): void {
  const scrollEl = document.getElementById("order-tabs-scroll");
  const leftBtn = document.getElementById("order-tabs-left");
  const rightBtn = document.getElementById("order-tabs-right");
  if (!scrollEl || !leftBtn || !rightBtn) return;

  const SCROLL_STEP = 150;

  function updateArrows(): void {
    const { scrollLeft, scrollWidth, clientWidth } = scrollEl!;
    const canScrollLeft = scrollLeft > 2;
    const canScrollRight = scrollLeft < scrollWidth - clientWidth - 2;

    leftBtn!.style.display = canScrollLeft ? "flex" : "none";
    rightBtn!.style.display = canScrollRight ? "flex" : "none";
  }

  leftBtn.addEventListener("click", () => {
    scrollEl.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" });
  });

  rightBtn.addEventListener("click", () => {
    scrollEl.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
  });

  scrollEl.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);

  // Mouse wheel horizontal scroll support
  scrollEl.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollEl;
        const canScroll = scrollWidth > clientWidth;
        if (!canScroll) return;

        // Prevent vertical scroll only when tabs can scroll
        const atStart = scrollLeft <= 0 && e.deltaY < 0;
        const atEnd = scrollLeft >= scrollWidth - clientWidth && e.deltaY > 0;
        if (!atStart && !atEnd) {
          e.preventDefault();
          scrollEl.scrollLeft += e.deltaY;
        }
      }
    },
    { passive: false }
  );

  // Drag to scroll
  let isDragging = false;
  let startX = 0;
  let scrollStart = 0;

  scrollEl.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.pageX;
    scrollStart = scrollEl.scrollLeft;
    scrollEl.style.cursor = "grabbing";
    scrollEl.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.pageX - startX;
    scrollEl.scrollLeft = scrollStart - dx;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    scrollEl.style.cursor = "";
    scrollEl.style.userSelect = "";
  });

  // Initial check
  requestAnimationFrame(updateArrows);
}
