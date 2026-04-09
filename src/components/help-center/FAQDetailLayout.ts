/**
 * FAQDetailLayout Component
 * Shows detailed FAQ Q&A content for a selected subcategory.
 * Reads ?cat=xxx&sub=yyy from URL params.
 * Alpine.js drives accordion state.
 */

import { t } from '../../i18n';

export function FAQDetailLayout(): string {
  return `
    <div
      id="faq-detail-root"
      x-data="faqDetail()"
      x-init="init()"
      class="min-h-screen bg-[#F5F5F5]"
    >

      <!-- Breadcrumb -->
      <div class="bg-white border-b border-gray-200 py-4">
        <div class="max-w-[900px] mx-auto px-4">
          <nav class="flex items-center gap-2 text-sm text-gray-500">
            <a href="help-center.html" class="hover:text-primary-500 transition-colors">${t('faqDetail.home')}</a>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            <a href="faq.html" class="hover:text-primary-500 transition-colors">${t('faqDetail.faq')}</a>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            <span class="text-gray-400" x-text="categoryLabel"></span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            <span class="text-gray-800 font-medium" x-text="subTitle"></span>
          </nav>
        </div>
      </div>

      <!-- Main content -->
      <div class="max-w-[900px] mx-auto px-4 py-6 flex gap-6 items-start">

        <!-- Sidebar: category subs -->
        <aside class="w-[220px] flex-shrink-0 hidden lg:block sticky top-[80px]">
          <div class="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100" style="background: linear-gradient(135deg, var(--color-primary-50), white)">
              <h3 class="text-sm font-bold text-gray-800" x-text="categoryLabel"></h3>
            </div>
            <template x-for="sib in siblings" :key="sib.key">
              <a
                :href="'faq-detail.html?cat=' + catParam + '&sub=' + sib.key"
                class="block px-4 py-2.5 text-[13px] border-b border-gray-50 transition-colors"
                :class="sib.key === subParam ? 'text-primary-600 bg-primary-50 font-semibold border-l-2 border-l-primary-500' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-500'"
                x-text="sib.label"
              ></a>
            </template>
          </div>

          <!-- Back to FAQ -->
          <a href="faq.html" class="mt-4 flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors px-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
            <span>${t('faqDetail.backToFaq')}</span>
          </a>
        </aside>

        <!-- Content area -->
        <div class="flex-1 min-w-0">

          <!-- Mobile back button -->
          <a href="faq.html" class="lg:hidden flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
            <span>${t('faqDetail.backToFaq')}</span>
          </a>

          <!-- Title & description -->
          <div class="bg-white rounded-md shadow-sm border border-gray-100 p-6 mb-4">
            <h1 class="text-xl font-bold text-gray-800 mb-2" x-text="subTitle"></h1>
            <p class="text-sm text-gray-500" x-text="subDescription"></p>
          </div>

          <!-- FAQ Accordion Items -->
          <div class="space-y-3">
            <template x-for="(item, idx) in faqItems" :key="idx">
              <div class="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
                <!-- Question -->
                <button
                  @click="toggleItem(idx)"
                  class="w-full flex items-center justify-between gap-3 px-6 py-4 text-left transition-colors"
                  :class="openItem === idx ? 'bg-primary-50' : 'hover:bg-gray-50'"
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      :class="openItem === idx ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'"
                    >Q</span>
                    <span
                      class="text-[14px] font-medium"
                      :class="openItem === idx ? 'text-primary-700' : 'text-gray-800'"
                      x-text="item.q"
                    ></span>
                  </div>
                  <svg
                    class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
                    :class="openItem === idx ? 'rotate-180 text-primary-500' : ''"
                    fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </button>

                <!-- Answer -->
                <div
                  x-show="openItem === idx"
                  x-transition:enter="transition ease-out duration-200"
                  x-transition:enter-start="opacity-0 -translate-y-1"
                  x-transition:enter-end="opacity-100 translate-y-0"
                  class="px-6 pb-5"
                >
                  <div class="flex items-start gap-3 pt-2 border-t border-gray-100">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600 mt-0.5">A</span>
                    <div class="text-[13px] text-gray-600 leading-relaxed prose prose-sm max-w-none" x-html="item.a"></div>
                  </div>
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
              <p class="text-gray-500 text-sm">${t('faqDetail.noContent')}</p>
              <a href="faq.html" class="inline-flex items-center gap-1 text-sm text-primary-500 hover:underline mt-3">
                <span>${t('faqDetail.backToFaq')}</span>
              </a>
            </div>
          </template>

          <!-- Helpful section -->
          <div x-show="faqItems.length > 0" class="bg-white rounded-md shadow-sm border border-gray-100 p-5 mt-4">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-600">${t('faqDetail.wasHelpful')}</p>
              <div class="flex items-center gap-2">
                <button
                  @click="helpful = 'yes'"
                  class="px-4 py-1.5 text-sm rounded-full border transition-all"
                  :class="helpful === 'yes' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'"
                >
                  <span class="mr-1">&uarr;</span> ${t('faqDetail.yes')}
                </button>
                <button
                  @click="helpful = 'no'"
                  class="px-4 py-1.5 text-sm rounded-full border transition-all"
                  :class="helpful === 'no' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600'"
                >
                  <span class="mr-1">&darr;</span> ${t('faqDetail.no')}
                </button>
              </div>
            </div>
            <p x-show="helpful" x-transition class="text-xs text-gray-400 mt-2">${t('faqDetail.thankYou')}</p>
          </div>

          <!-- Related topics -->
          <div x-show="relatedTopics.length > 0" class="bg-white rounded-md shadow-sm border border-gray-100 p-5 mt-4">
            <h3 class="text-sm font-bold text-gray-800 mb-3">${t('faqDetail.relatedTopics')}</h3>
            <div class="flex flex-wrap gap-2">
              <template x-for="rel in relatedTopics" :key="rel.key">
                <a
                  :href="'faq-detail.html?cat=' + rel.cat + '&sub=' + rel.key"
                  class="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  x-text="rel.label"
                ></a>
              </template>
            </div>
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="bg-white border-t border-gray-100 mt-8 py-5">
        <div class="max-w-[900px] mx-auto px-4 text-center">
          <p class="text-[11px] text-gray-400">${t('helpCenter.faqFooterCopyright')}</p>
        </div>
      </div>

    </div>
  `;
}

export function initFAQDetailPage(): void {
  // registered via alpine.ts
}
