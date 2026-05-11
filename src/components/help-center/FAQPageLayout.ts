/**
 * FAQPageLayout Component
 * iSTOC-style FAQ page: search header + left category sidebar + 2-column category grid
 * Alpine.js drives sidebar selection & search filtering
 */

import { t } from "../../i18n";

export function FAQPageLayout(): string {
  return `
    <div
      id="faq-root"
      x-data="faqPage()"
      class="min-h-screen bg-[#F5F5F5]"
    >

      <!-- ── Search bar under header ── -->
      <div class="bg-white border-b border-gray-200 py-5">
        <div class="max-w-[900px] mx-auto px-4">
          <form
            @submit.prevent="doSearch()"
            class="flex items-center h-12 bg-white rounded-lg shadow-sm ring-1 ring-gray-200 max-w-[600px] mx-auto transition-shadow focus-within:ring-2 focus-within:ring-primary-500"
          >
            <!-- Leading search icon (decorative) -->
            <span class="pl-4 pr-2 text-gray-400 flex items-center shrink-0" aria-hidden="true">
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
              class="flex-1 min-w-0 px-2 text-sm text-gray-700 outline-none focus:outline-none focus-visible:outline-none placeholder-gray-400 bg-transparent"
            />

            <!-- Clear (X) button — only when query exists -->
            <button
              type="button"
              x-show="searchQuery"
              x-cloak
              @click="clearSearch()"
              aria-label="${t("helpCenter.faqClearSearch")}"
              class="px-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0 flex items-center justify-center h-full"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>

            <button
              type="submit"
              id="faq-search-btn"
              class="th-btn th-btn-sm th-btn-gradient mr-1.5 shrink-0"
            >
              ${t("helpCenter.faqSearchSubmit")}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </button>
          </form>

          <!-- Result counter chip — only when searching -->
          <div x-show="searchQuery.trim()" x-cloak class="max-w-[600px] mx-auto mt-3 text-center">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-50,#fff8e1)] text-[var(--color-primary-700,#a87c00)] text-xs">
              <span x-text="resultsLabel"></span>
            </span>
          </div>
        </div>
      </div>

      <!-- ── Body: sidebar + content ── -->
      <div class="max-w-[1100px] mx-auto px-4 py-6 flex gap-5 items-start">

        <!-- ════ LEFT SIDEBAR ════ -->
        <aside class="w-[210px] flex-shrink-0 rounded overflow-hidden shadow-sm sticky top-[64px]">
          <template x-for="(cat, idx) in categories" :key="cat.id">
            <button
              @click="selectCategory(cat.id)"
              class="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors"
              :class="activeCategory === cat.id
                ? 'font-bold text-white bg-[var(--color-primary-500,#f5b800)] border-b border-transparent'
                : 'text-gray-700 bg-white hover:bg-gray-50 border-b border-gray-100'"
            >
              <span x-text="cat.label"></span>
              <svg class="w-3.5 h-3.5 opacity-60 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </template>
        </aside>

        <!-- ════ MAIN CONTENT ════ -->
        <div class="flex-1 min-w-0">

          <!-- Category heading -->
          <p class="text-[15px] font-semibold text-gray-700 mb-4" x-text="activeCategoryLabel + (searchQuery ? ' — &quot;' + searchQuery + '&quot; ${t("helpCenter.faqSearchResults")}' : '')"></p>

          <!-- No results -->
          <template x-if="visibleCategories.length === 0">
            <p class="text-sm text-gray-500 bg-white rounded p-6 shadow-sm">${t("helpCenter.faqNoResults")}</p>
          </template>

          <!-- 2-column category grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <template x-for="(cat, ci) in visibleCategories" :key="cat.id">
              <div class="bg-white rounded border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <!-- Category title -->
                <h3 class="text-[14px] font-bold text-gray-800 mb-2" x-html="highlight(cat.label)"></h3>
                <hr class="border-gray-100 mb-2" />
                <!-- Sub-links -->
                <div class="flex flex-wrap gap-x-2 gap-y-1">
                  <template x-for="(sub, si) in cat.subs" :key="si">
                    <span class="flex items-center">
                      <a
                        :href="'faq-detail.html?cat=' + cat.id + '&sub=' + (sub.key || '')"
                        class="text-[12px] transition-colors"
                        :class="sub.highlight ? 'text-[var(--color-primary-500,#f5b800)] hover:text-[var(--color-primary-700,#a87c00)]' : 'text-gray-600 hover:text-[var(--color-primary-500,#f5b800)]'"
                        x-html="highlight(sub.label)"
                      ></a>
                      <span x-show="si < cat.subs.length - 1" class="text-gray-300 mx-1.5 text-[11px]">|</span>
                    </span>
                  </template>
                </div>
              </div>
            </template>
          </div>

        </div>
      </div>

      <!-- Footer links -->
      <div class="bg-white border-t border-gray-100 mt-8 py-5">
        <div class="max-w-[1100px] mx-auto px-4 text-center">
          <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-gray-500 mb-2">
            <a href="#" class="hover:text-primary-500 transition-colors">${t("helpCenter.faqFooterProductPolicy")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors">${t("helpCenter.faqFooterIpProtection")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors">${t("helpCenter.faqFooterPrivacy")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors">${t("helpCenter.faqFooterTerms")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors">${t("helpCenter.faqFooterUserInfo")}</a>
            <span class="text-gray-200">–</span>
            <a href="#" class="hover:text-primary-500 transition-colors">${t("helpCenter.faqFooterContact")}</a>
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
