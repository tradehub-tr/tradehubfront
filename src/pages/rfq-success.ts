/**
 * RFQ Success Page — Shown after successful RFQ submission
 * Alibaba-style: success message, quality rating, promotional banner.
 */

import '../style.css'
import { t } from '../i18n'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'

import { TopBar, SubHeader, initMobileDrawer, initStickyHeaderSearch, MegaMenu, initMegaMenu } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { requireAuth } from '../utils/auth-guard'

await requireAuth();

// Guard: only accessible after actual RFQ submission
if (!sessionStorage.getItem('rfq_submitted')) {
  window.location.href = '/pages/dashboard/rfq.html';
  throw new Error('redirect');
}
sessionStorage.removeItem('rfq_submitted');

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-(--header-scroll-border) bg-(--header-scroll-bg)">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <!-- Main -->
  <main class="bg-gray-50 min-h-screen">
    <!-- Top bar -->
    <div class="border-b border-gray-200 bg-white">
      <div class="container-boxed flex items-center gap-4 py-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-500 text-white text-xs font-bold">RFQ</span>
          <span class="text-base font-semibold text-gray-800">${t('rfq.requestQuote')}</span>
        </div>
        <a href="/pages/dashboard/inquiries.html" class="text-sm text-gray-500 hover:text-gray-700">${t('rfq.manageRfq')}</a>
      </div>
    </div>

    <div class="container-boxed py-8 max-w-4xl mx-auto">
      <!-- Success Header -->
      <div class="flex items-center gap-3 mb-6 flex-wrap">
        <svg class="w-7 h-7 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h1 class="text-xl font-bold text-gray-800">${t('rfq.submissionSuccessful')}</h1>
        <a href="/pages/dashboard/inquiries.html" class="text-sm text-amber-600 hover:text-amber-700 hover:underline ml-2">${t('rfq.manageMyRequest')}</a>
      </div>

      <!-- Quality Rating Card -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="text-base font-bold text-gray-800">${t('rfq.qualityRating')}</h2>
          <div class="flex gap-0.5">
            <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
        </div>
        <p class="text-sm text-gray-600">${t('rfq.qualityRatingDesc')}</p>
      </div>

      <!-- Source Smarter Banner -->
      <div class="rounded-lg overflow-hidden bg-gradient-to-r from-sky-600 to-cyan-400 p-6 flex items-center justify-between mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-500 text-white text-[10px] font-bold">RFQ</span>
            <span class="text-xs text-white/80">${t('rfq.requestQuote')}</span>
          </div>
          <h3 class="text-xl font-bold text-white">${t('rfq.sourceSmarter')}</h3>
        </div>
        <div class="hidden sm:block">
          <svg class="w-24 h-16 text-white/30" fill="currentColor" viewBox="0 0 100 60"><rect x="10" y="5" width="35" height="50" rx="3" fill="currentColor" opacity="0.3"/><rect x="55" y="10" width="35" height="40" rx="3" fill="currentColor" opacity="0.2"/><circle cx="80" cy="15" r="12" fill="currentColor" opacity="0.15"/></svg>
        </div>
      </div>
    </div>
  </main>

  <footer>${FooterLinks()}</footer>
`;

initMegaMenu();
initFlowbite();
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();
startAlpine();
