/**
 * FAQPageLayout Component
 * V2.5 "Split İstatistik" redesign — küçük koyu bant + arama, lg:+ sticky
 * sidebar (ikon + alt-konu sayısı) / mobilde yatay kaydırılan chip şeridi,
 * kategori kartlarında satır satır alt-konu listesi.
 * Alpine.js drives sidebar selection & search filtering.
 */

import { t } from "../../i18n";

export function FAQPageLayout(): string {
  return `
    <div
      id="faq-root"
      x-data="faqPage()"
      class="min-h-screen bg-[#F5F5F5]"
    >

      <!-- ══════════════════════════════════════
           BAND-SM — dark hero: title + search
      ══════════════════════════════════════════ -->
      <section class="bg-[#15130d] border-b-[3px] border-primary-500 py-6 lg:py-8">
        <div class="max-w-[960px] mx-auto px-4">
          <h1 class="text-white text-2xl lg:text-[28px] font-bold tracking-tight" data-i18n="helpCenter.faqPageTitle">${t("helpCenter.faqPageTitle")}</h1>
          <p class="text-gray-400 text-[13px] mt-1.5 mb-4" data-i18n="helpCenter.faqPageSubtitle">${t("helpCenter.faqPageSubtitle")}</p>

          <form
            @submit.prevent="doSearch()"
            class="flex items-center bg-white rounded-md overflow-hidden max-w-[560px]"
          >
            <span class="flex items-center ps-3.5 text-gray-400 shrink-0" aria-hidden="true">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"/>
              </svg>
            </span>

            <input
              id="faq-search-input"
              x-model="searchQuery"
              type="text"
              placeholder="${t("helpCenter.faqSearchPlaceholder")}"
              aria-label="${t("helpCenter.faqSearchAriaLabel")}"
              class="flex-1 min-w-0 px-2 text-sm text-gray-700 outline-none border-none focus:outline-none focus-visible:outline-none placeholder-gray-400 bg-transparent"
            />

            <!-- Clear (X) button — only when query exists -->
            <button
              type="button"
              x-show="searchQuery"
              x-cloak
              @click="clearSearch()"
              aria-label="${t("helpCenter.faqClearSearch")}"
              class="th-no-press appearance-none focus:outline-none px-2 text-gray-400 hover:text-gray-600 transition-colors duration-150 motion-reduce:transition-none shrink-0 flex items-center justify-center h-full"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>

            <button
              type="submit"
              id="faq-search-btn"
              class="th-btn th-btn-sm me-1.5 shrink-0"
            >
              ${t("helpCenter.faqSearchSubmit")}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </button>
          </form>

          <!-- Result counter chip — only when searching -->
          <div x-show="searchQuery.trim()" x-cloak class="mt-3">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 text-primary-300 text-xs" x-text="resultsLabel"></span>
          </div>
        </div>
      </section>

      <!-- ── Body: sidebar + content ── -->
      <div class="max-w-[960px] mx-auto px-4 py-6 flex gap-5 items-start">

        <!-- ════ LEFT SIDEBAR (lg:+) ════ -->
        <aside class="hidden lg:block w-[232px] flex-shrink-0 sticky top-[72px]">
          <div class="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
            <template x-for="cat in sidebarCategories" :key="cat.id">
              <button
                type="button"
                @click="selectCategory(cat.id)"
                class="th-no-press appearance-none focus:outline-none w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-start border-b border-gray-50 last:border-b-0 transition-colors duration-150 motion-reduce:transition-none"
                :class="activeCategory === cat.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'"
              >
                <span class="shrink-0" x-html="cat.icon"></span>
                <span class="flex-1 min-w-0 truncate" x-text="cat.label"></span>
                <span class="text-[11px] text-gray-300 tabular-nums shrink-0" x-text="cat.count"></span>
              </button>
            </template>
          </div>
        </aside>

        <!-- ════ MAIN CONTENT ════ -->
        <div class="flex-1 min-w-0">

          <!-- Mobile horizontal chip strip (lg: hidden) -->
          <div class="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
            <template x-for="cat in sidebarCategories" :key="cat.id">
              <button
                type="button"
                @click="selectCategory(cat.id)"
                class="th-no-press appearance-none focus:outline-none shrink-0 inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md border transition-colors duration-150 motion-reduce:transition-none"
                :class="activeCategory === cat.id
                  ? 'bg-[#15130d] border-[#15130d] text-primary-300 font-semibold'
                  : 'bg-white border-gray-200 text-gray-600'"
              >
                <span x-html="cat.icon"></span>
                <span x-text="cat.label"></span>
              </button>
            </template>
          </div>

          <!-- Category heading -->
          <p class="text-[15px] font-semibold text-gray-700 mb-4" x-text="activeCategoryLabel + (searchQuery ? ' — &quot;' + searchQuery + '&quot; ${t("helpCenter.faqSearchResults")}' : '')"></p>

          <!-- No results -->
          <template x-if="visibleCategories.length === 0">
            <p class="text-sm text-gray-500 bg-white rounded-md p-6 shadow-sm">${t("helpCenter.faqNoResults")}</p>
          </template>

          <!-- Category cards: icon + label + sub-count, subs as rows -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <template x-for="(cat, ci) in visibleCategories" :key="cat.id">
              <div class="bg-white rounded-md border border-gray-200 p-4">
                <!-- Category header -->
                <div class="flex items-center gap-2.5 pb-2.5 mb-1 border-b border-gray-100">
                  <span class="w-[30px] h-[30px] rounded-md bg-primary-50 text-primary-700 flex items-center justify-center shrink-0" x-html="catIcon(cat.id)"></span>
                  <h3 class="flex-1 min-w-0 text-[13.5px] font-bold text-gray-800 truncate" x-html="highlight(cat.label)"></h3>
                  <span class="text-[11px] text-gray-300 tabular-nums shrink-0" x-text="cat.subs.length"></span>
                </div>
                <!-- Sub-links — row per sub -->
                <div>
                  <template x-for="(sub, si) in cat.subs" :key="si">
                    <a
                      :href="'/sss/detay?cat=' + cat.id + '&sub=' + (sub.key || '')"
                      class="group flex items-center gap-1.5 py-1.5 text-[12.5px] transition-colors duration-150 motion-reduce:transition-none"
                      :class="sub.highlight ? 'text-primary-600 hover:text-primary-700' : 'text-gray-600 hover:text-primary-600'"
                    >
                      <svg class="w-3 h-3 text-primary-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/>
                      </svg>
                      <span x-html="highlight(sub.label)"></span>
                    </a>
                  </template>
                </div>
              </div>
            </template>
          </div>

        </div>
      </div>

      <!-- Footer links -->
      <div class="bg-white border-t border-gray-100 mt-8 py-5">
        <div class="max-w-[960px] mx-auto px-4 text-center">
          <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-gray-500 mb-2">
            <a href="#" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none">${t("helpCenter.faqFooterProductPolicy")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none">${t("helpCenter.faqFooterIpProtection")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none">${t("helpCenter.faqFooterPrivacy")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none">${t("helpCenter.faqFooterTerms")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none">${t("helpCenter.faqFooterUserInfo")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none">${t("helpCenter.faqFooterContact")}</a>
          </div>
          <p class="text-[11px] text-gray-400">${t("helpCenter.faqFooterCopyright")}</p>
        </div>
      </div>

    </div><!-- /faq-root -->
  `;
}

export function initFAQPage(): void {
  // registered via alpine.ts
}
