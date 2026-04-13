/**
 * TopRankingFilters Component
 * Category dropdown filter (inside hero)
 * Desktop: dropdown popover
 * Mobile: bottom sheet with Alpine.js state
 * Categories loaded dynamically from API via loadCategories()
 */

import { t } from '../../i18n';

export function TopRankingFilters(): string {
  return `
    <div class="flex items-center justify-center mt-1 lg:mt-5 px-[10px] sm:px-0">
      <!-- Category Dropdown -->
      <div class="relative" @click.outside="categoryDropdownOpen = false">
        <button
          type="button"
          class="th-btn-outline inline-flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium py-[7px] px-[10px] sm:px-6 sm:py-3"
          @click="openCategoryDropdown()"
        >
          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-secondary-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <span class="mr-[3px] sm:mr-0" x-text="selectedCategoryLabel">${t('topRankingPage.allCategories')}</span>
          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-secondary-400 transition-transform flex-shrink-0" :class="categoryDropdownOpen && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>

        <!-- Desktop dropdown panel -->
        <div
          x-show="categoryDropdownOpen"
          x-transition
          x-cloak
          class="hidden lg:block absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-surface border border-border-default rounded-md shadow-lg z-30 p-3"
        >
          <!-- Level 1: Main categories -->
          <div x-show="categoryDropdownLevel === 1" class="max-h-[60vh] overflow-y-auto">
            <button
              type="button"
              class="flex items-center w-full px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-raised rounded-lg transition-colors text-left"
              @click="selectedMainCategory = null; pendingSubCategory = null; applyCategoryFilter()"
            >
              <span data-i18n="topRankingPage.allCategories">${t('topRankingPage.allCategories')}</span>
            </button>
            <div class="my-1 border-t border-border-default"></div>
            <div class="space-y-0.5">
              <template x-for="cat in apiCategories" :key="cat.slug">
                <button
                  type="button"
                  class="flex items-center justify-between w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-raised rounded-lg transition-colors text-left"
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
              <label
                class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-raised rounded-lg transition-colors"
                @click="pendingSubCategory = null"
              >
                <input
                  type="radio"
                  name="subcategory"
                  :checked="pendingSubCategory === null"
                  class="w-4 h-4 text-primary-500 border-border-default focus:ring-primary-400"
                />
                <span class="text-sm text-text-secondary font-medium" x-text="$t('topRankingPage.allCategories') + ' - ' + cat.name"></span>
              </label>
              <template x-for="sub in cat.children" :key="sub.slug">
                <label
                  class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-raised rounded-lg transition-colors"
                  @click="pendingSubCategory = sub.slug"
                >
                  <input
                    type="radio"
                    name="subcategory"
                    :checked="pendingSubCategory === sub.slug"
                    class="w-4 h-4 text-primary-500 border-border-default focus:ring-primary-400"
                  />
                  <span class="text-sm text-text-secondary" x-text="sub.name"></span>
                </label>
              </template>
              <div class="flex gap-2 pt-3 mt-2 border-t border-border-default px-4 pb-1">
                <button
                  type="button"
                  class="th-btn-outline flex-1 px-4 py-2 text-sm font-medium"
                  @click="goBackToLevel1()"
                  data-i18n="topRankingPage.back"
                >${t('topRankingPage.back')}</button>
                <button
                  type="button"
                  class="th-btn flex-1 px-4 py-2 text-sm font-medium"
                  @click="applyCategoryFilter()"
                  data-i18n="topRankingPage.apply"
                >${t('topRankingPage.apply')}</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- MOBILE BOTTOM SHEET — Category                 -->
    <!-- ═══════════════════════════════════════════════ -->

    <!-- Category Bottom Sheet — Backdrop -->
    <div
      class="lg:hidden fixed inset-0 z-[99] bg-black/50 transition-opacity duration-300"
      :class="showCategorySheet ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      @click="showCategorySheet = false"
      x-effect="if(showCategorySheet) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''"
    ></div>

    <!-- Category Bottom Sheet — Panel -->
    <div
      class="lg:hidden fixed inset-x-0 bottom-0 z-[100] transition-transform duration-300 ease-out"
      :class="showCategorySheet ? 'translate-y-0' : 'translate-y-full'"
    >
      <div class="bg-white rounded-t-md max-h-[85vh] flex flex-col shadow-2xl">
        <!-- Drag handle -->
        <div class="flex-shrink-0 flex items-center justify-center pt-3 pb-2">
          <div class="w-9 h-1 rounded-full bg-gray-300"></div>
        </div>
        <!-- Header -->
        <div class="flex items-center justify-between px-5 pb-3">
          <h3 class="text-base font-bold text-gray-900">Select category</h3>
          <button type="button" @click="showCategorySheet = false" class="p-1 text-gray-400 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <!-- Category list -->
        <div class="overflow-y-auto flex-1 overscroll-contain">
          <!-- Level 1 -->
          <div x-show="categoryDropdownLevel === 1">
            <!-- All categories option -->
            <button
              type="button"
              class="flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50"
              @click="selectedMainCategory = null; pendingSubCategory = null; applyCategoryFilter(); showCategorySheet = false"
            >
              <span
                class="flex-1 text-[15px]"
                :class="!selectedMainCategory ? 'font-semibold text-gray-900' : 'text-gray-600'"
                data-i18n="topRankingPage.allCategories"
              >${t('topRankingPage.allCategories')}</span>
              <span
                class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="!selectedMainCategory ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'"
              >
                <span
                  class="w-2 h-2 rounded-full transition-colors"
                  :class="!selectedMainCategory ? 'bg-white' : 'bg-transparent'"
                ></span>
              </span>
            </button>
            <!-- Dynamic category items -->
            <template x-for="cat in apiCategories" :key="'m-' + cat.slug">
              <button
                type="button"
                class="flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50"
                @click="cat.children && cat.children.length > 0 ? openCategoryLevel2(cat.slug) : (selectedMainCategory = cat.slug, pendingSubCategory = null, applyCategoryFilter(), showCategorySheet = false)"
              >
                <span
                  class="flex-1 text-[15px]"
                  :class="selectedMainCategory === cat.slug ? 'font-semibold text-gray-900' : 'text-gray-600'"
                  x-text="cat.name"
                ></span>
                <svg x-show="cat.children && cat.children.length > 0" class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </template>
          </div>
          <!-- Level 2: Subcategories -->
          <template x-for="cat in apiCategories.filter(c => c.children && c.children.length > 0)" :key="'ml2-' + cat.slug">
            <div x-show="categoryDropdownLevel === 2 && selectedMainCategory === cat.slug" x-cloak>
              <!-- "All" option for this category -->
              <button
                type="button"
                class="flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50"
                @click="pendingSubCategory = null"
              >
                <span
                  class="flex-1 text-[15px]"
                  :class="pendingSubCategory === null ? 'font-semibold text-gray-900' : 'text-gray-600'"
                  x-text="$t('topRankingPage.allCategories') + ' - ' + cat.name"
                ></span>
                <span
                  class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                  :class="pendingSubCategory === null ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'"
                >
                  <span
                    class="w-2 h-2 rounded-full transition-colors"
                    :class="pendingSubCategory === null ? 'bg-white' : 'bg-transparent'"
                  ></span>
                </span>
              </button>
              <!-- Subcategory items -->
              <template x-for="sub in cat.children" :key="'ms-' + sub.slug">
                <button
                  type="button"
                  class="flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50"
                  @click="pendingSubCategory = sub.slug"
                >
                  <span
                    class="flex-1 text-[15px]"
                    :class="pendingSubCategory === sub.slug ? 'font-semibold text-gray-900' : 'text-gray-600'"
                    x-text="sub.name"
                  ></span>
                  <span
                    class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    :class="pendingSubCategory === sub.slug ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'"
                  >
                    <span
                      class="w-2 h-2 rounded-full transition-colors"
                      :class="pendingSubCategory === sub.slug ? 'bg-white' : 'bg-transparent'"
                    ></span>
                  </span>
                </button>
              </template>
              <!-- Back + Apply buttons -->
              <div class="flex gap-3 px-5 py-4">
                <button
                  type="button"
                  class="th-btn-outline flex-1 py-3 text-sm font-semibold"
                  @click="goBackToLevel1()"
                  data-i18n="topRankingPage.back"
                >${t('topRankingPage.back')}</button>
                <button
                  type="button"
                  class="th-btn flex-1 py-3 text-sm font-semibold"
                  @click="applyCategoryFilter(); showCategorySheet = false"
                  data-i18n="topRankingPage.apply"
                >${t('topRankingPage.apply')}</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  `;
}
