/**
 * TopRankingCategoryTabs Component
 * Horizontal scrollable category tab bar with arrow navigation
 * Mobile: chevron opens the shared drill-down bottom sheet (top-deals ile aynı)
 * Desktop: arrow buttons for scroll navigation
 * Categories loaded dynamically from apiCategories (API)
 */

import { t } from "../../i18n";
import { BottomSheet } from "../shared/BottomSheet";
import { categoryDrillSkeleton } from "../shared/CategoryDrillSheet";

export function TopRankingCategoryTabs(): string {
  return `
    <div class="relative flex items-center" x-ref="tabsContainer">
      <!-- Left arrow (desktop only) -->
      <button
        type="button"
        class="hidden lg:flex absolute start-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-surface shadow border border-border-default text-text-tertiary hover:text-text-primary transition-colors"
        x-show="canScrollLeft"
        x-transition:enter="transition ease-out duration-150"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-in duration-100"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        @click="scrollTabs('left')"
        aria-label="Scroll left"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Tabs container -->
      <div
        class="flex-1 flex overflow-x-auto scrollbar-hide border-b border-border-default"
        x-ref="tabsScroll"
        @scroll="updateScrollState()"
        style="scroll-behavior: smooth;"
      >
        <!-- "All" tab (always first) -->
        <button
          type="button"
          class="top-ranking-tab flex-shrink-0 whitespace-nowrap px-[10px] sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm transition-colors border-b-[3px] border-transparent"
          :class="activeTab === 'all'
            ? '!border-secondary-800 !text-text-primary font-semibold'
            : 'text-text-tertiary hover:text-text-primary'"
          @click="setTab('all')"
          data-i18n="topRankingPage.tabAll"
        >${t("topRankingPage.tabAll")}</button>

        <!-- Dynamic category tabs from API -->
        <template x-for="cat in apiCategories" :key="'tab-' + cat.slug">
          <a
            :href="'/pages/top-ranking-category.html?cat=' + encodeURIComponent(cat.slug) + '&sort=' + activeSort + '&page=1'"
            class="top-ranking-tab flex-shrink-0 whitespace-nowrap px-[10px] sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm transition-colors border-b-[3px] border-transparent text-text-tertiary hover:text-text-primary"
            x-text="cat.name"
          ></a>
        </template>
      </div>

      <!-- Mobile chevron → opens shared drill-down bottom sheet -->
      <button
        type="button"
        id="tr-cat-trigger"
        class="th-no-press appearance-none focus:outline-none [-webkit-tap-highlight-color:transparent] lg:hidden flex-shrink-0 flex items-center justify-center w-9 self-stretch border-b border-border-default bg-surface text-text-tertiary"
        aria-label="${t("mobileCategory.allCategories")}" data-i18n-aria-label="mobileCategory.allCategories"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>

      <!-- Right arrow (desktop only) -->
      <button
        type="button"
        class="hidden lg:flex absolute end-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-surface shadow border border-border-default text-text-tertiary hover:text-text-primary transition-colors"
        x-show="canScrollRight"
        x-transition:enter="transition ease-out duration-150"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-in duration-100"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        @click="scrollTabs('right')"
        aria-label="Scroll right"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Mobile Category Drill-down Bottom Sheet (paylaşılan component; init sayfada) -->
    ${BottomSheet(
      { id: "tr-cat-sheet", titleKey: "mobileCategory.allCategories", hiddenAt: "lg:hidden" },
      categoryDrillSkeleton("data-tr-cat-list")
    )}
  `;
}

export function initRankingCategoryTabs(): void {
  setTimeout(() => {
    const scrollEl = document.querySelector<HTMLElement>('[x-ref="tabsScroll"]');
    if (scrollEl) {
      scrollEl.dispatchEvent(new Event("scroll"));
    }
  }, 100);
}
