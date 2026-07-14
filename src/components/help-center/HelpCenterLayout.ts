/**
 * HelpCenterLayout Component
 * V2.5 "Split İstatistik" redesign — koyu kurumsal bant (başlık+arama solda,
 * güven istatistikleri lg:+ sağda), kesintisiz kategori satır-grid'i ve
 * popüler sorular kartı. Alpine.js drives search state.
 */

import { t } from "../../i18n";

export function HelpCenterLayout(): string {
  return `
    <!-- Help Center page — Alpine.js drives search state -->
    <div
      id="help-center-root"
      x-data="helpCenter()"
      class="min-h-screen bg-[#F5F5F5]"
    >

      <!-- ══════════════════════════════════════
           BAND — dark hero: title + search (left) / trust stats (lg:+ right)
      ══════════════════════════════════════════ -->
      <section class="bg-[#15130d] border-b-[3px] border-primary-500 py-9 lg:py-11">
        <div class="max-w-[960px] mx-auto px-4 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-9">
          <div class="min-w-0 flex-1 lg:max-w-[600px]">
            <h1 class="text-white text-2xl lg:text-[28px] font-bold tracking-tight" data-i18n="help.title">${t("help.title")}</h1>
            <p class="text-gray-400 text-[13px] mt-1.5 mb-4" data-i18n="help.subtitle">${t("help.subtitle")}</p>

            <form @submit.prevent="doSearch()" class="flex items-center bg-white rounded-md overflow-hidden max-w-[560px]">
              <span class="flex items-center ps-3.5 text-gray-400 shrink-0" aria-hidden="true">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"/>
                </svg>
              </span>
              <input
                id="hc-search-input"
                x-model="searchQuery"
                type="text"
                placeholder="${t("help.searchPlaceholder")}" data-i18n-placeholder="help.searchPlaceholder"
                class="flex-1 min-w-0 px-3 py-3 text-sm text-gray-700 outline-none border-0 bg-transparent placeholder-gray-400"
              />
              <button
                type="submit"
                id="hc-search-btn"
                class="th-btn px-6 py-3 text-sm font-semibold shrink-0"
              >
                <span data-i18n="help.searchBtn">${t("help.searchBtn")}</span>
              </button>
            </form>

            <div class="flex flex-wrap items-center gap-2 mt-3">
              <span class="text-xs text-gray-400" data-i18n="help.popular">${t("help.popular")}</span>
              <template x-for="chip in popularSearches" :key="chip">
                <button
                  type="button"
                  @click="searchQuery = chip; doSearch()"
                  class="th-no-press appearance-none focus:outline-none text-xs text-gray-300 bg-transparent border border-[#3f3a2b] rounded-full px-3 py-1 hover:text-primary-300 hover:border-primary-500/50 transition-colors duration-150 motion-reduce:transition-none"
                  x-text="chip"
                ></button>
              </template>
            </div>
          </div>

          <!-- Trust stats panel — lg:+ only -->
          <div class="hidden lg:grid grid-cols-3 gap-px bg-[#2e2a20] border border-[#2e2a20] rounded-md overflow-hidden w-[350px] shrink-0">
            <div class="bg-[#1c1913] p-4">
              <b class="block text-primary-300 text-xl font-extrabold tabular-nums" data-i18n="help.statArticlesValue">${t("help.statArticlesValue")}</b>
              <span class="text-[11px] text-[#8a8570]" data-i18n="help.statArticlesLabel">${t("help.statArticlesLabel")}</span>
            </div>
            <div class="bg-[#1c1913] p-4">
              <b class="block text-primary-300 text-xl font-extrabold tabular-nums" data-i18n="help.statResponseValue">${t("help.statResponseValue")}</b>
              <span class="text-[11px] text-[#8a8570]" data-i18n="help.statResponseLabel">${t("help.statResponseLabel")}</span>
            </div>
            <div class="bg-[#1c1913] p-4">
              <b class="block text-primary-300 text-xl font-extrabold tabular-nums" data-i18n="help.statResolutionValue">${t("help.statResolutionValue")}</b>
              <span class="text-[11px] text-[#8a8570]" data-i18n="help.statResolutionLabel">${t("help.statResolutionLabel")}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════
           SEARCH RESULTS (shown only when active)
      ══════════════════════════════════════════ -->
      <div x-show="searchActive" x-cloak x-transition class="max-w-[960px] mx-auto px-4 py-6">
        <div class="bg-white rounded-md shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">
              "<span x-text="searchQuery"></span>" ${t("help.searchResultsFor")}
            </h2>
            <button type="button" class="th-no-press appearance-none focus:outline-none text-sm text-primary-500 hover:text-primary-700 transition-colors duration-150 motion-reduce:transition-none" @click="clearSearch()" data-i18n="help.clearBtn">${t("help.clearBtn")}</button>
          </div>
          <template x-if="searchResults.length === 0">
            <p class="text-gray-500 text-sm" data-i18n="help.noResults">${t("help.noResults")}</p>
          </template>
          <ul class="divide-y divide-gray-100">
            <template x-for="(r, i) in searchResults" :key="i">
              <li class="py-3">
                <a :href="'/sss/detay?cat=' + r.cat + '&sub=' + r.sub" class="group flex items-start gap-3">
                  <span class="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center bg-primary-50">
                    <svg class="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" clip-rule="evenodd"/></svg>
                  </span>
                  <span class="text-sm text-gray-700 group-hover:text-primary-600 transition-colors duration-150 motion-reduce:transition-none" x-text="r.text"></span>
                </a>
              </li>
            </template>
          </ul>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           MAIN CONTENT
      ══════════════════════════════════════════ -->
      <div x-show="!searchActive" class="max-w-[960px] mx-auto px-4 py-8 space-y-8">

        <!-- ── Category row-grid ─────────── -->
        <div class="bg-white border border-[#e8e8e6] rounded-md overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <template x-for="tab in tabs" :key="tab.id">
            <a
              :href="'/sss?cat=' + tab.faqCat"
              class="group flex items-center gap-3 p-4 border-e border-b border-[#f0f0ee] hover:bg-[#fffdf5] transition-colors duration-150 motion-reduce:transition-none"
            >
              <span class="w-[38px] h-[38px] rounded-md bg-primary-50 text-primary-700 flex items-center justify-center shrink-0" x-html="tab.icon"></span>
              <span class="flex-1 min-w-0 text-[13px] font-semibold text-gray-800 truncate" x-text="tab.label"></span>
              <svg class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-600 shrink-0 transition-colors duration-150 motion-reduce:transition-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/>
              </svg>
            </a>
          </template>
        </div>

        <!-- ── Popular questions ─────────── -->
        <div>
          <h2 class="text-[15px] font-bold text-gray-800 mb-3" data-i18n="help.popularQuestionsTitle">${t("help.popularQuestionsTitle")}</h2>
          <div class="bg-white rounded-md shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-x-9 px-4 sm:px-5">
            <template x-for="(q, qi) in popularQuestions" :key="qi">
              <a :href="'/sss/detay?cat=' + q.cat + '&sub=' + q.sub" class="group flex items-start gap-1.5 py-2.5 text-[13px] text-gray-700 border-b border-gray-50 hover:text-primary-700 transition-colors duration-150 motion-reduce:transition-none">
                <svg class="w-3 h-3 text-primary-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/>
                </svg>
                <span x-text="q.text"></span>
              </a>
            </template>
          </div>
        </div>

        <!-- ── Useful Links Strip ─────────────── -->
        <div class="bg-white rounded-md shadow-sm border border-gray-100 px-6 py-5">
          <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-gray-500">
            <a href="/urun-listeleme-kurallari" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none" data-i18n="help.productListingPolicy">${t("help.productListingPolicy")}</a>
            <span class="text-gray-200">|</span>
            <a href="/fikri-mulkiyet" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none" data-i18n="help.ipProtection">${t("help.ipProtection")}</a>
            <span class="text-gray-200">|</span>
            <a href="/gizlilik" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none" data-i18n="help.privacyPolicy">${t("help.privacyPolicy")}</a>
            <span class="text-gray-200">|</span>
            <a href="/kullanim-kosullari" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none" data-i18n="help.termsOfUse">${t("help.termsOfUse")}</a>
            <span class="text-gray-200">|</span>
            <a href="/yasal-uyari" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none" data-i18n="help.userInfoLaws">${t("help.userInfoLaws")}</a>
            <span class="text-gray-200">|</span>
            <a href="contact.html" class="hover:text-primary-500 transition-colors duration-150 motion-reduce:transition-none" data-i18n="help.contactGuide">${t("help.contactGuide")}</a>
          </div>
          <p class="text-center text-[11px] text-gray-400 mt-3" data-i18n="help.copyright">${t("help.copyright")}</p>
        </div>

      </div><!-- /main content -->
    </div><!-- /help-center-root -->
  `;
}

export function initHelpCenter(): void {
  // Alpine component definition — registered globally via startAlpine()
}
