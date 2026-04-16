/**
 * TicketsListLayout — müşteri destek talepleri listesi.
 *
 * Headless: frappe/helpdesk Vue UI kapalı. HD Ticket verisi Frappe REST
 * üzerinden çekilir. Kartlar tıklanınca /pages/help/help-ticket.html?id=X
 * detay sayfasına yönlendirir.
 */
import { t } from "../../i18n";

const STATUS_TABS = [
  { id: "all", label: t("helpCenter.statusAll") },
  { id: "open", label: t("helpCenter.statusOpen") },
  { id: "pending", label: t("helpCenter.statusPending") },
  { id: "closed", label: t("helpCenter.statusResolved") },
];

export function TicketsListLayout(): string {
  return `
    <div class="bg-gray-50 min-h-screen" x-data="ticketsList()" x-init="init()">
      <div class="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">${t("helpCenter.myTickets")}</h1>
            <p class="text-sm text-gray-500 mt-0.5"><span x-text="total"></span> talep</p>
          </div>
          <a href="/pages/help/help-ticket-new.html" class="th-btn th-btn-sm inline-flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            ${t("helpCenter.newTicket")}
          </a>
        </div>

        <!-- Status Tabs -->
        <div class="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
          ${STATUS_TABS.map(
            (tab) => `
            <button
              @click="setTab('${tab.id}')"
              class="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer"
              :class="activeTab === '${tab.id}' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
            >
              ${tab.label}
              <span class="ml-1 text-xs" :class="activeTab === '${tab.id}' ? 'text-white/70' : 'text-gray-400'" x-text="'(' + tabCount('${tab.id}') + ')'"></span>
            </button>
          `
          ).join("")}
        </div>

        <!-- Search -->
        <div class="mb-5">
          <div class="relative max-w-[420px]">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input type="text" x-model="searchQuery" placeholder="${t("helpCenter.ticketSearchPlaceholder")}" class="th-input th-input-md pl-10">
          </div>
        </div>

        <!-- Yukleniyor -->
        <template x-if="loading">
          <div class="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg class="w-6 h-6 mx-auto text-primary-500 animate-spin" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 018-8V4a8 8 0 018 8h-2a6 6 0 00-6-6 6 6 0 00-6 6H4z"/>
            </svg>
            <p class="text-sm text-gray-400 mt-3">Talepler yükleniyor...</p>
          </div>
        </template>

        <!-- Hata -->
        <template x-if="!loading && errorMsg">
          <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700" x-text="errorMsg"></div>
        </template>

        <!-- Liste -->
        <template x-if="!loading && !errorMsg && filteredTickets.length > 0">
          <div class="space-y-3">
            <template x-for="ticket in paginatedTickets" :key="ticket.id">
              <a
                :href="'/pages/help/help-ticket.html?id=' + encodeURIComponent(ticket.id)"
                class="block bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div class="flex items-start gap-3">
                  <!-- Priority bar -->
                  <div class="w-1 rounded-full self-stretch flex-shrink-0"
                    :class="priorityBarCls(ticket.priority)"></div>

                  <div class="flex-1 min-w-0">
                    <!-- Top row: status + tarih -->
                    <div class="flex items-center gap-2 flex-wrap mb-1.5">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        :class="statusCls(ticket.status)">
                        <span class="w-1.5 h-1.5 rounded-full mr-1" :class="statusDotCls(ticket.status)"></span>
                        <span x-text="statusLabel(ticket.status)"></span>
                      </span>
                      <span x-show="ticket.priority && ticket.priority !== 'Medium'"
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
                        :class="priorityChipCls(ticket.priority)"
                        x-text="priorityLabel(ticket.priority)"></span>
                      <span x-show="ticket.category && ticket.category !== '-'"
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600"
                        x-text="ticket.category"></span>
                      <span class="ml-auto text-[11px] text-gray-400" x-text="ticket.createdDate"></span>
                    </div>

                    <!-- Subject -->
                    <h3 class="text-sm font-semibold text-gray-900 mb-1 truncate" x-text="ticket.subject"></h3>

                    <!-- Meta -->
                    <div class="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                      <span class="font-mono">#<span x-text="ticket.id"></span></span>
                      <span class="inline-flex items-center gap-1" x-show="ticket.lastReplyLabel">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span x-text="ticket.lastReplyLabel"></span>
                      </span>
                    </div>
                  </div>

                  <!-- Chevron -->
                  <svg class="w-5 h-5 text-gray-300 mt-1 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </a>
            </template>
          </div>
        </template>

        <!-- Empty -->
        <template x-if="!loading && !errorMsg && filteredTickets.length === 0">
          <div class="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg class="w-14 h-14 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 class="text-base font-semibold text-gray-700 mb-1">${t("helpCenter.noTickets")}</h3>
            <p class="text-sm text-gray-400 mb-4">${t("helpCenter.noTicketsDesc")}</p>
            <a href="/pages/help/help-ticket-new.html" class="th-btn th-btn-sm inline-flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              ${t("helpCenter.newTicket")}
            </a>
          </div>
        </template>

        <!-- Pagination -->
        <template x-if="totalPages > 1">
          <div class="flex items-center justify-center gap-2 mt-8">
            <button @click="setPage(Math.max(1, currentPage - 1))" :disabled="currentPage === 1" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer">${t("helpCenter.previousPage")}</button>
            <template x-for="p in totalPages" :key="p">
              <button @click="setPage(p)" class="w-8 h-8 text-sm rounded-lg transition-colors cursor-pointer" :class="currentPage === p ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'" x-text="p"></button>
            </template>
            <button @click="setPage(Math.min(totalPages, currentPage + 1))" :disabled="currentPage === totalPages" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer">${t("helpCenter.nextPage")}</button>
          </div>
        </template>
      </div>
    </div>
  `;
}
