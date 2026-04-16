/**
 * TopDealsCategoryTabs Component
 * Horizontal scrollable category tab bar with arrow navigation
 * Mobile: chevron opens a bottom sheet for category selection
 * Desktop: arrow buttons for scroll navigation
 *
 * Categories are fetched dynamically from the API on init.
 */

import { t } from "../../i18n";

/** Build a single tab button HTML — uses manual styling, no Alpine :class */
function buildTabHtml(id: string, label: string, isActive = false): string {
  const activeClass = isActive
    ? "!border-[#222] !text-[#222] font-semibold"
    : "text-[#666] hover:text-[#222]";
  return `
    <button
      type="button"
      class="top-deals-tab flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors border-b-[3px] border-transparent ${activeClass}"
      data-cat-slug="${id}"
    >${label}</button>
  `;
}

/** Build a single bottom-sheet item HTML */
function buildSheetItemHtml(id: string, label: string): string {
  return `
    <button
      type="button"
      class="flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50"
      @click="setCategory('${id}'); showCategorySheet = false"
    >
      <span
        class="flex-1 text-[15px]"
        :class="activeCategory === '${id}' ? 'font-semibold text-gray-900' : 'text-gray-600'"
      >${label}</span>
      <span
        class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
        :class="activeCategory === '${id}' ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'"
      >
        <span
          class="w-2 h-2 rounded-full transition-colors"
          :class="activeCategory === '${id}' ? 'bg-white' : 'bg-transparent'"
        ></span>
      </span>
    </button>
  `;
}

export function TopDealsCategoryTabs(): string {
  // Only render the "Tumu" (All) tab statically (active by default); rest loaded from API
  const defaultTabHtml = buildTabHtml("all", t("topDealsPage.tabAll"), true);
  const defaultSheetHtml = buildSheetItemHtml("all", t("topDealsPage.tabAll"));

  return `
    <div class="relative flex items-center" x-ref="tabsContainer">
      <!-- Left arrow (desktop only) -->
      <button
        type="button"
        class="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all cursor-pointer"
        x-show="canScrollLeft"
        x-transition
        @click="scrollTabs('left')"
        aria-label="Scroll left"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Tabs container -->
      <div
        class="flex-1 flex overflow-x-auto scrollbar-hide border-b border-gray-200"
        x-ref="tabsScroll"
        id="td-tabs-scroll"
        @scroll="updateScrollState()"
        style="scroll-behavior: smooth;"
      >
        ${defaultTabHtml}
      </div>

      <!-- Mobile chevron → opens bottom sheet -->
      <button
        type="button"
        class="md:hidden flex-shrink-0 flex items-center justify-center w-9 self-stretch border-b border-gray-200 bg-white text-gray-500"
        @click="showCategorySheet = !showCategorySheet"
        aria-label="All categories"
      >
        <svg
          class="w-4 h-4 transition-transform duration-200"
          :class="showCategorySheet ? 'rotate-180' : ''"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>

      <!-- Right arrow (desktop only) -->
      <button
        type="button"
        class="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all cursor-pointer"
        x-show="canScrollRight"
        x-transition
        @click="scrollTabs('right')"
        aria-label="Scroll right"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Mobile Category Bottom Sheet -->
    <!-- Backdrop -->
    <div
      class="md:hidden fixed inset-0 z-[99] bg-black/50 transition-opacity duration-300"
      :class="showCategorySheet ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      @click="showCategorySheet = false"
      x-effect="document.body.style.overflow = showCategorySheet ? 'hidden' : ''"
    ></div>

    <!-- Sheet Panel -->
    <div
      class="md:hidden fixed inset-x-0 bottom-0 z-[100] transition-transform duration-300 ease-out"
      :class="showCategorySheet ? 'translate-y-0' : 'translate-y-full'"
    >
      <div class="bg-white rounded-t-md max-h-[85vh] flex flex-col shadow-2xl">
        <!-- Drag Handle -->
        <div class="flex-shrink-0 flex items-center justify-center pt-3 pb-2">
          <div class="w-9 h-1 rounded-full bg-gray-300"></div>
        </div>

        <!-- Category List -->
        <div id="td-sheet-categories" class="overflow-y-auto flex-1 pb-6 overscroll-contain">
          ${defaultSheetHtml}
        </div>
      </div>
    </div>
  `;
}

export function initCategoryTabs(): void {
  setTimeout(() => {
    const scrollEl = document.querySelector<HTMLElement>('[x-ref="tabsScroll"]');
    if (scrollEl) {
      scrollEl.dispatchEvent(new Event("scroll"));
    }
  }, 100);

  // Wire "Tümü" tab click handler (statically rendered)
  const allTab = document.querySelector<HTMLElement>('.top-deals-tab[data-cat-slug="all"]');
  if (allTab) {
    allTab.addEventListener("click", () => {
      const mainEl = document.querySelector<HTMLElement>('[x-data="topDealsPage"]');
      if (mainEl && (mainEl as any)._x_dataStack) {
        const data = (mainEl as any)._x_dataStack[0];
        if (data) data.setCategory("all");
      }
      updateTabStyles("all");
    });
  }

  // Fetch categories from API and inject dynamic tabs
  loadCategoryTabs();
}

async function loadCategoryTabs(): Promise<void> {
  try {
    const { getCategories } = await import("../../services/listingService");
    const categories = await getCategories();

    const tabsContainer = document.getElementById("td-tabs-scroll");
    const sheetContainer = document.getElementById("td-sheet-categories");
    if (!tabsContainer || !categories || categories.length === 0) return;

    // Get Alpine data for wiring click handlers
    const mainEl = document.querySelector<HTMLElement>('[x-data="topDealsPage"]');

    for (const cat of categories) {
      const slug = (cat as any).slug || (cat as any).name || "";
      const name = (cat as any).name || slug;
      if (!slug) continue;

      // --- Desktop/tablet tab ---
      const tabBtn = document.createElement("button");
      tabBtn.type = "button";
      tabBtn.className =
        "top-deals-tab flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors border-b-[3px] border-transparent text-[#666] hover:text-[#222]";
      tabBtn.textContent = name;
      tabBtn.dataset.catSlug = slug;
      tabBtn.addEventListener("click", () => {
        if (mainEl && (mainEl as any)._x_dataStack) {
          const data = (mainEl as any)._x_dataStack[0];
          if (data) data.setCategory(slug);
        }
        // Update active styles
        updateTabStyles(slug);
      });
      tabsContainer.appendChild(tabBtn);

      // --- Mobile sheet item ---
      if (sheetContainer) {
        const sheetBtn = document.createElement("button");
        sheetBtn.type = "button";
        sheetBtn.className =
          "flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50";
        sheetBtn.dataset.catSlug = slug;
        sheetBtn.innerHTML = `
          <span class="flex-1 text-[15px] text-gray-600">${name}</span>
          <span class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors border-gray-300 bg-transparent">
            <span class="w-2 h-2 rounded-full transition-colors bg-transparent"></span>
          </span>
        `;
        sheetBtn.addEventListener("click", () => {
          if (mainEl && (mainEl as any)._x_dataStack) {
            const data = (mainEl as any)._x_dataStack[0];
            if (data) {
              data.setCategory(slug);
              data.showCategorySheet = false;
            }
          }
          updateTabStyles(slug);
        });
        sheetContainer.appendChild(sheetBtn);
      }
    }

    // Update scroll state after tabs are added
    const scrollEl = document.querySelector<HTMLElement>('[x-ref="tabsScroll"]');
    if (scrollEl) scrollEl.dispatchEvent(new Event("scroll"));
  } catch (err) {
    console.warn("[TopDealsCategoryTabs] Failed to load categories:", err);
  }
}

/** Update active/inactive styles on all tabs */
function updateTabStyles(activeSlug: string): void {
  // Desktop tabs
  const tabsContainer = document.getElementById("td-tabs-scroll");
  if (tabsContainer) {
    tabsContainer.querySelectorAll(".top-deals-tab").forEach((btn) => {
      const el = btn as HTMLElement;
      const slug =
        el.dataset.catSlug || (el.textContent?.trim() === t("topDealsPage.tabAll") ? "all" : "");
      if (slug === activeSlug) {
        el.classList.add("!border-[#222]", "!text-[#222]", "font-semibold");
        el.classList.remove("text-[#666]");
      } else {
        el.classList.remove("!border-[#222]", "!text-[#222]", "font-semibold");
        el.classList.add("text-[#666]");
      }
    });
  }
}
