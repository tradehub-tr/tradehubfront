/**
 * FAQDetailLayout Component
 * V2.5 "Split İstatistik" redesign — koyu band-sm başlık (breadcrumb + ikon
 * kutulu başlık), lg:+ sticky sidebar / mobilde yatay chip şeridi, akordeon
 * Q/A listesi, lg:+ masaüstü CTA kartı ve mobilde fixed sticky destek çubuğu.
 * Reads ?cat=xxx&sub=yyy from URL params. Alpine.js drives accordion state.
 */

import { t } from "../../i18n";

export function FAQDetailLayout(): string {
  return `
    <div
      id="faq-detail-root"
      x-data="faqDetail()"
      class="min-h-screen bg-[#F5F5F5] pb-20 lg:pb-0"
    >

      <!-- ══════════════════════════════════════
           BAND-SM — breadcrumb + icon title
      ══════════════════════════════════════════ -->
      <section class="bg-[#15130d] border-b-[3px] border-primary-500 py-6 lg:py-7">
        <div class="max-w-[960px] mx-auto px-4">
          <nav class="flex items-center flex-wrap gap-1.5 text-[11px] text-[#8a8570] mb-3">
            <a href="/yardim-merkezi" class="hover:text-gray-300 transition-colors duration-150 motion-reduce:transition-none">${t("faqDetail.home")}</a>
            <svg class="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            <a href="/sss" class="hover:text-gray-300 transition-colors duration-150 motion-reduce:transition-none">${t("faqDetail.faq")}</a>
            <svg class="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            <span x-text="categoryLabel"></span>
            <svg class="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            <span class="text-gray-300" x-text="subTitle"></span>
          </nav>

          <div class="flex items-center gap-3.5">
            <span class="w-11 h-11 rounded-md bg-primary-500/15 text-primary-300 flex items-center justify-center shrink-0" x-html="catIcon(catParam)"></span>
            <div class="min-w-0">
              <h1 class="text-white text-lg font-bold" x-text="subTitle"></h1>
              <p class="text-gray-400 text-xs mt-0.5" x-text="subDescription"></p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main content -->
      <div class="max-w-[960px] mx-auto px-4 py-6 flex gap-5 items-start">

        <!-- Sidebar: category subs (lg:+) -->
        <aside class="hidden lg:block w-[232px] flex-shrink-0 sticky top-[72px]">
          <div class="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
            <template x-for="sib in siblings" :key="sib.key">
              <a
                :href="'/sss/detay?cat=' + catParam + '&sub=' + sib.key"
                class="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[13px] border-b border-gray-50 last:border-b-0 transition-colors duration-150 motion-reduce:transition-none"
                :class="sib.key === subParam ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'"
              >
                <span class="truncate" x-text="sib.label"></span>
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
              </a>
            </template>
          </div>

          <a href="/sss" class="mt-4 flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors duration-150 motion-reduce:transition-none px-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
            <span>${t("faqDetail.backToFaq")}</span>
          </a>
        </aside>

        <!-- Content area -->
        <div class="flex-1 min-w-0">

          <!-- Mobile horizontal sibling chip strip (lg: hidden) -->
          <div class="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
            <template x-for="sib in siblings" :key="sib.key">
              <a
                :href="'/sss/detay?cat=' + catParam + '&sub=' + sib.key"
                class="shrink-0 inline-flex items-center text-xs px-3.5 py-1.5 rounded-md border transition-colors duration-150 motion-reduce:transition-none"
                :class="sib.key === subParam
                  ? 'bg-[#15130d] border-[#15130d] text-primary-300 font-semibold'
                  : 'bg-white border-gray-200 text-gray-600'"
                x-text="sib.label"
              ></a>
            </template>
          </div>

          <!-- Mobile back button -->
          <a href="/sss" class="lg:hidden flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors duration-150 motion-reduce:transition-none mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
            <span>${t("faqDetail.backToFaq")}</span>
          </a>

          <!-- FAQ Accordion Items -->
          <div class="space-y-3">
            <template x-for="(item, idx) in faqItems" :key="idx">
              <div
                class="bg-white rounded-md border overflow-hidden transition-colors duration-150 motion-reduce:transition-none"
                :class="openItem === idx ? 'border-primary-200' : 'border-gray-100'"
              >
                <button
                  type="button"
                  @click="toggleItem(idx)"
                  class="th-no-press appearance-none focus:outline-none w-full flex items-center justify-between gap-3 px-5 py-4 text-start"
                  :class="openItem === idx ? 'font-medium' : ''"
                >
                  <span class="text-[14px] font-medium text-gray-800" x-text="item.q"></span>
                  <svg
                    class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
                    :class="openItem === idx ? 'rotate-180 text-primary-500' : ''"
                    fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </button>

                <div
                  x-show="openItem === idx"
                  x-transition:enter="transition ease-out duration-200 motion-reduce:transition-none"
                  x-transition:enter-start="opacity-0 -translate-y-1 motion-reduce:translate-y-0"
                  x-transition:enter-end="opacity-100 translate-y-0"
                  x-transition:leave="transition ease-in duration-150 motion-reduce:transition-none"
                  x-transition:leave-start="opacity-100 translate-y-0"
                  x-transition:leave-end="opacity-0 -translate-y-1 motion-reduce:translate-y-0"
                  class="px-5 pb-5"
                >
                  <div class="pt-3 border-t border-dashed border-gray-100 text-[13px] text-gray-600 leading-relaxed max-w-[64ch]" x-html="item.a"></div>
                </div>
              </div>
            </template>
          </div>

          <!-- No content fallback -->
          <template x-if="faqItems.length === 0">
            <div class="bg-white rounded-md shadow-sm border border-gray-100 p-8 text-center">
              <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>
              </svg>
              <p class="text-gray-500 text-sm">${t("faqDetail.noContent")}</p>
              <a href="/sss" class="inline-flex items-center gap-1 text-sm text-primary-500 hover:underline mt-3">
                <span>${t("faqDetail.backToFaq")}</span>
              </a>
            </div>
          </template>

          <!-- Desktop CTA card (lg:+) -->
          <div x-show="faqItems.length > 0" class="hidden lg:flex items-center justify-between gap-4 bg-gradient-to-br from-primary-50 to-white rounded-md p-[18px] mt-4">
            <div class="min-w-0">
              <b class="text-sm text-gray-800" data-i18n="faqDetail.ctaTitle">${t("faqDetail.ctaTitle")}</b>
              <p class="text-xs text-gray-500 mt-0.5" data-i18n="faqDetail.ctaDesc">${t("faqDetail.ctaDesc")}</p>
            </div>
            <a href="/destek/yeni" class="th-btn shrink-0" data-i18n="faqDetail.ctaBtn">${t("faqDetail.ctaBtn")}</a>
          </div>

          <!-- Helpful section -->
          <div x-show="faqItems.length > 0" class="bg-white rounded-md shadow-sm border border-gray-100 p-5 mt-4">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-600 min-w-0">${t("faqDetail.wasHelpful")}</p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="helpful = 'yes'"
                  class="th-no-press appearance-none focus:outline-none whitespace-nowrap shrink-0 px-4 py-1.5 text-sm rounded-full border transition-[color,background-color,border-color] duration-150 motion-reduce:transition-none"
                  :class="helpful === 'yes' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'"
                >
                  <span class="me-1">&uarr;</span> ${t("faqDetail.yes")}
                </button>
                <button
                  type="button"
                  @click="helpful = 'no'"
                  class="th-no-press appearance-none focus:outline-none whitespace-nowrap shrink-0 px-4 py-1.5 text-sm rounded-full border transition-[color,background-color,border-color] duration-150 motion-reduce:transition-none"
                  :class="helpful === 'no' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600'"
                >
                  <span class="me-1">&darr;</span> ${t("faqDetail.no")}
                </button>
              </div>
            </div>
            <p x-show="helpful" x-transition class="text-xs text-gray-400 mt-2">${t("faqDetail.thankYou")}</p>
          </div>

          <!-- Related topics -->
          <div x-show="relatedTopics.length > 0" class="bg-white rounded-md shadow-sm border border-gray-100 p-5 mt-4">
            <h3 class="text-sm font-bold text-gray-800 mb-3">${t("faqDetail.relatedTopics")}</h3>
            <div class="flex flex-wrap gap-2">
              <template x-for="rel in relatedTopics" :key="rel.key">
                <a
                  :href="'/sss/detay?cat=' + rel.cat + '&sub=' + rel.key"
                  class="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-150 motion-reduce:transition-none"
                  x-text="rel.label"
                ></a>
              </template>
            </div>
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="bg-white border-t border-gray-100 mt-8 py-5">
        <div class="max-w-[960px] mx-auto px-4 text-center">
          <p class="text-[11px] text-gray-400">${t("helpCenter.faqFooterCopyright")}</p>
        </div>
      </div>

      <!-- Mobile fixed sticky support bar (lg: hidden) -->
      <div class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 py-2.5 flex items-center justify-between gap-3">
        <span class="text-xs text-gray-600 min-w-0 truncate" data-i18n="faqDetail.ctaTitle">${t("faqDetail.ctaTitle")}</span>
        <a href="/destek/yeni" class="th-btn th-btn-sm shrink-0" data-i18n="faqDetail.ctaBtn">${t("faqDetail.ctaBtn")}</a>
      </div>

    </div>
  `;
}

export function initFAQDetailPage(): void {
  // registered via alpine.ts
}
