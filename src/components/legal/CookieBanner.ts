/**
 * CookieBanner Component
 * Global cookie consent banner shown on first visit (no consent saved yet).
 * Uses Alpine.js x-data="cookieBanner" for state management.
 * Positioned fixed at bottom of viewport.
 */

import { t } from '../../i18n';

export function CookieBanner(): string {
  return `
    <div
      x-data="cookieBanner"
      x-show="visible"
      x-cloak
      x-transition:enter="transition ease-out duration-300"
      x-transition:enter-start="translate-y-full opacity-0"
      x-transition:enter-end="translate-y-0 opacity-100"
      x-transition:leave="transition ease-in duration-200"
      x-transition:leave-start="translate-y-0 opacity-100"
      x-transition:leave-end="translate-y-full opacity-0"
      class="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
      role="dialog"
      aria-label="${t('cookieBanner.ariaLabel')}"
    >
      <div class="max-w-5xl mx-auto bg-white border border-gray-200 rounded-md shadow-2xl overflow-hidden">
        <!-- Main bar -->
        <div class="p-4 sm:p-6">
          <div class="flex flex-col lg:flex-row lg:items-start gap-4">

            <!-- Icon + Text -->
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <div class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-gray-900" data-i18n="cookieBanner.title">${t('cookieBanner.title')}</h3>
                <p class="text-sm text-gray-600 mt-1" data-i18n-html="cookieBanner.description">${t('cookieBanner.description')}</p>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex flex-col sm:flex-row gap-2 shrink-0 lg:ml-4">
              <button
                @click="rejectAll()"
                class="th-btn-outline px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap"
                data-i18n="cookieBanner.rejectAll"
              >${t('cookieBanner.rejectAll')}</button>
              <a
                href="/pages/legal/cookies.html"
                class="th-btn-outline px-4 py-2 text-sm font-medium cursor-pointer text-center whitespace-nowrap"
                data-i18n="cookieBanner.managePreferences"
              >${t('cookieBanner.managePreferences')}</a>
              <button
                @click="acceptAll()"
                class="th-btn px-5 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                data-i18n="cookieBanner.acceptAll"
              >${t('cookieBanner.acceptAll')}</button>
            </div>

          </div>
        </div>

        <!-- Expandable details (mini category toggles) -->
        <div x-show="showDetails" x-collapse class="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 py-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <span class="text-xs font-medium text-gray-700" data-i18n="cookieConsent.necessaryCookies">${t('cookieConsent.necessaryCookies')}</span>
              <span class="text-xs text-green-600 font-medium" data-i18n="cookieBanner.alwaysOn">${t('cookieBanner.alwaysOn')}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <span class="text-xs font-medium text-gray-700" data-i18n="cookieConsent.functionalCookies">${t('cookieConsent.functionalCookies')}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" x-model="categories.functional" class="sr-only peer">
                <div class="w-10 h-5 bg-gray-300 peer-checked:bg-primary-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <span class="text-xs font-medium text-gray-700" data-i18n="cookieConsent.analyticsCookies">${t('cookieConsent.analyticsCookies')}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" x-model="categories.analytics" class="sr-only peer">
                <div class="w-10 h-5 bg-gray-300 peer-checked:bg-primary-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <span class="text-xs font-medium text-gray-700" data-i18n="cookieConsent.marketingCookies">${t('cookieConsent.marketingCookies')}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" x-model="categories.marketing" class="sr-only peer">
                <div class="w-10 h-5 bg-gray-300 peer-checked:bg-primary-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>
          <div class="flex justify-end mt-3">
            <button
              @click="saveCustom()"
              class="th-btn px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
              data-i18n="cookieConsent.savePreferences"
            >${t('cookieConsent.savePreferences')}</button>
          </div>
        </div>

        <!-- Toggle details link -->
        <div class="border-t border-gray-100 px-4 sm:px-6 py-2">
          <button
            @click="showDetails = !showDetails"
            class="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <svg class="w-3 h-3 transition-transform" :class="showDetails && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
            <span x-text="showDetails ? '${t('cookieBanner.hideDetails')}' : '${t('cookieBanner.showDetails')}'"></span>
          </button>
        </div>
      </div>
    </div>
  `;
}
