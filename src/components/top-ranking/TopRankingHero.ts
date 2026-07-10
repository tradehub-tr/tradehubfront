/**
 * TopRankingHero Component
 * Full-width beige gradient hero banner containing:
 * - Title + subtitle (centered, desktop only)
 * - Category dropdown filter (centered, both mobile and desktop)
 *
 * Also exports mobile-specific headers:
 * - TopRankingMobileHeader()  — compact header that scrolls with content
 * - TopRankingStickyMobileHeader() — fixed header that appears when hero scrolls out
 */

import { t } from "../../i18n";
import { TopRankingFilters } from "./TopRankingFilters";

/**
 * Mobile-only compact header for Top Ranking page
 * White background bar with back arrow, centered title, search icon
 */
export function TopRankingMobileHeader(): string {
  return `
    <div class="lg:hidden bg-white">
      <!-- Nav row: back + title / in-hero arama alanı + aksiyon (TopDealsMobileHeader deseni).
           Arama sayfa Alpine state'ini kullanır: showSearch/searchQuery/openSearch/closeSearch/clearSearch/submitSearch -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-3">
        <!-- Back (arama açıkken gizli) -->
        <a href="javascript:history.back()" x-show="!showSearch" class="text-gray-800 p-1 -ms-1 flex-shrink-0 transition-opacity active:opacity-60" aria-label="${t("common.goBack")}" data-i18n-aria-label="common.goBack">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </a>

        <!-- Title (arama açıkken gizli) -->
        <h1 x-show="!showSearch" class="flex-1 min-w-0 text-center text-base font-bold text-[#222] truncate" data-i18n="topRankingPage.heroTitle">${t("topRankingPage.heroTitle")}</h1>

        <!-- Arama alanı — bu sayfadaki sıralamayı filtreler -->
        <form
          x-show="showSearch"
          x-cloak
          @submit.prevent="submitSearch()"
          class="flex-1 min-w-0 flex items-center gap-2 bg-gray-100 rounded-full ps-3 pe-1.5 py-1.5"
        >
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
          <input
            x-ref="rankingSearchInput"
            x-model="searchQuery"
            type="text"
            enterkeyhint="search"
            autocomplete="off"
            class="flex-1 min-w-0 bg-transparent text-sm text-gray-700 border-0 outline-none p-0"
            placeholder="${t("topRankingPage.searchPlaceholder")}"
            data-i18n-placeholder="topRankingPage.searchPlaceholder"
          />
          <button type="button" x-show="searchQuery" @click="clearSearch()" class="th-no-press flex-shrink-0 text-gray-400 p-0.5 transition-opacity active:opacity-60" aria-label="${t("common.clear")}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </form>

        <!-- Aramayı aç (arama açıkken gizli) -->
        <button type="button" x-show="!showSearch" @click="openSearch()" class="th-no-press text-gray-800 p-1 -me-1 flex-shrink-0 transition-opacity active:opacity-60" aria-label="${t("common.search")}" data-i18n-aria-label="common.search">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
        </button>

        <!-- Aramayı kapat (arama açıkken görünür) -->
        <button type="button" x-show="showSearch" x-cloak @click="closeSearch()" class="th-no-press text-gray-800 p-1 -me-1 flex-shrink-0 transition-opacity active:opacity-60" aria-label="${t("common.close")}">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Sticky compact mobile header -- appears when hero scrolls out of view
 * Layout: [< back]  ["Top Ranking" text]  [search icon]
 */
export function TopRankingStickyMobileHeader(): string {
  return `
    <div
      id="tr-sticky-mobile-header"
      class="lg:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 transition-[transform,opacity] duration-300 motion-reduce:transition-none motion-reduce:translate-y-0 -translate-y-full opacity-0 pointer-events-none"
    >
      <div class="flex items-center gap-2.5 px-3 py-2">
        <!-- Back arrow -->
        <a href="javascript:history.back()" class="text-gray-800 flex-shrink-0" aria-label="${t("common.goBack")}" data-i18n-aria-label="common.goBack">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </a>

        <!-- Title -->
        <span class="text-sm font-bold text-gray-900 flex-shrink-0 whitespace-nowrap" data-i18n="topRankingPage.heroTitle">${t("topRankingPage.heroTitle")}</span>

        <!-- Search input -->
        <form action="/urunler" method="GET" class="flex-1 min-w-0">
          <div class="flex items-center bg-gray-100 rounded-full px-3 py-2 gap-2">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              type="text"
              name="q"
              class="flex-1 bg-transparent text-sm text-gray-700 border-0 outline-none p-0 min-w-0"
              placeholder="${t("search.placeholder")}"
              data-i18n-placeholder="search.placeholder"
              autocomplete="off"
            />
          </div>
        </form>
      </div>
    </div>
  `;
}

export function TopRankingHero(): string {
  return `
    <div class="relative">
      <!-- Centered content -->
      <div class="relative z-10 container-boxed py-2 sm:py-4 lg:py-10 lg:py-14 text-center">
        <!-- Title + subtitle: desktop only -->
        <div class="hidden lg:block">
          <h1
            class="text-3xl sm:text-[40px] md:text-[44px] font-bold leading-tight text-secondary-800"
            data-i18n="topRankingPage.heroTitle"
          >${t("topRankingPage.heroTitle")}</h1>
          <p
            class="mt-1 text-sm sm:text-base font-medium text-secondary-500"
            data-i18n="topRankingPage.heroSubtitle"
          >${t("topRankingPage.heroSubtitle")}</p>
        </div>

        <div class="flex justify-center">
          ${TopRankingFilters()}
        </div>
      </div>
    </div>
  `;
}
