/**
 * TopRankingFilters Component
 * Category dropdown filter (inside hero)
 * Desktop: dropdown popover
 * Mobile: bottom sheet with Alpine.js state
 * Categories loaded dynamically from API via loadCategories()
 */

import { t } from "../../i18n";

export function TopRankingFilters(): string {
  return `
    <div class="flex items-center justify-center mt-1 lg:mt-5 px-[10px] sm:px-0">
      <!-- Category Dropdown -->
      <!-- scroll.window: sayfa scroll'unda dropdown kapanır (panel hero ile
           akıp grid'in üstünde asılı kalmasın); panelin kendi iç scroll'u
           window'a ulaşmadığı için liste içinde gezinmek kapatmaz -->
      <div class="relative" @click.outside="categoryDropdownOpen = false" @scroll.window="categoryDropdownOpen = false">
        <button
          type="button"
          class="th-btn-outline inline-flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium py-[7px] px-[10px] sm:px-6 sm:py-3"
          @click="openCategoryDropdown()"
        >
          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-secondary-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <span class="me-[3px] sm:me-0" x-text="selectedCategoryLabel">${t("topRankingPage.allCategories")}</span>
          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-secondary-400 transition-transform flex-shrink-0" :class="categoryDropdownOpen && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>

        <!-- Desktop dropdown panel -->
        <div
          x-show="categoryDropdownOpen"
          x-transition:enter="transition ease-[cubic-bezier(0.23,1,0.32,1)] duration-200 origin-top motion-reduce:transition-none"
          x-transition:enter-start="opacity-0 scale-95 -translate-y-1"
          x-transition:enter-end="opacity-100 scale-100"
          x-transition:leave="transition ease-in duration-150 origin-top motion-reduce:transition-none"
          x-transition:leave-start="opacity-100"
          x-transition:leave-end="opacity-0 scale-95"
          x-cloak
          class="hidden lg:block absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-surface border border-border-default rounded-md shadow-lg z-30 p-3"
        >
          <!-- Level 1: Main categories -->
          <div x-show="categoryDropdownLevel === 1" class="max-h-[60vh] overflow-y-auto">
            <button
              type="button"
              class="flex items-center w-full px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-raised rounded-lg transition-colors text-start"
              @click="selectedMainCategory = null; pendingSubCategory = null; applyCategoryFilter()"
            >
              <span data-i18n="topRankingPage.allCategories">${t("topRankingPage.allCategories")}</span>
            </button>
            <div class="my-1 border-t border-border-default"></div>
            <div class="space-y-0.5">
              <template x-for="cat in apiCategories" :key="cat.slug">
                <button
                  type="button"
                  class="flex items-center justify-between w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-raised rounded-lg transition-colors text-start"
                  @click="cat.children && cat.children.length > 0 ? openCategoryLevel2(cat.slug) : (selectedMainCategory = cat.slug, pendingSubCategory = null, applyCategoryFilter())"
                >
                  <span x-text="cat.name"></span>
                  <svg x-show="cat.children && cat.children.length > 0" class="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </template>
            </div>
          </div>

          <!-- Level 2: Subcategories -->
          <template x-for="cat in apiCategories.filter(c => c.children && c.children.length > 0)" :key="'l2-' + cat.slug">
            <div x-show="categoryDropdownLevel === 2 && selectedMainCategory === cat.slug" x-cloak class="max-h-[60vh] overflow-y-auto">
              <!-- Alt kategori seçimi → chip group (tek seçim). pendingSubCategory korunur. -->
              <div class="flex flex-wrap gap-2 px-2 py-2">
                <button
                  type="button"
                  @click="pendingSubCategory = null"
                  class="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer"
                  :class="pendingSubCategory === null
                    ? 'bg-[var(--color-primary-500,#cc9900)] text-white border-[var(--color-primary-500,#cc9900)]'
                    : 'bg-white text-text-secondary border-border-default hover:border-[var(--color-primary-500,#cc9900)]'"
                  x-text="$t('topRankingPage.allCategories') + ' - ' + cat.name"
                ></button>
                <template x-for="sub in cat.children" :key="sub.slug">
                  <button
                    type="button"
                    @click="pendingSubCategory = sub.slug"
                    class="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer"
                    :class="pendingSubCategory === sub.slug
                      ? 'bg-[var(--color-primary-500,#cc9900)] text-white border-[var(--color-primary-500,#cc9900)]'
                      : 'bg-white text-text-secondary border-border-default hover:border-[var(--color-primary-500,#cc9900)]'"
                    x-text="sub.name"
                  ></button>
                </template>
              </div>
              <div class="flex gap-2 pt-3 mt-2 border-t border-border-default px-4 pb-1">
                <button
                  type="button"
                  class="th-btn-outline flex-1 px-4 py-2 text-sm font-medium"
                  @click="goBackToLevel1()"
                  data-i18n="topRankingPage.back"
                >${t("topRankingPage.back")}</button>
                <button
                  type="button"
                  class="th-btn flex-1 px-4 py-2 text-sm font-medium"
                  @click="applyCategoryFilter()"
                  data-i18n="topRankingPage.apply"
                >${t("topRankingPage.apply")}</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Mobil kategori seçimi: paylaşılan drill-down BottomSheet (tr-cat-sheet).
         Ana sayfada TopRankingCategoryTabs, kategori sayfasında sayfa assembly'si basar;
         openCategoryDropdown mobilde onu açar. -->
  `;
}
