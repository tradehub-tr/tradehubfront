/**
 * TopDealsCategoryTabs Component
 * Horizontal scrollable category tab bar with arrow navigation.
 * Mobile: chevron opens the shared drill-down bottom sheet (categories +
 * subcategories), same pattern as the homepage / manufacturers category bars.
 * Desktop: arrow buttons for scroll navigation.
 *
 * Categories are fetched dynamically from the API on init.
 */

import { t } from "../../i18n";
import { BottomSheet } from "../shared/BottomSheet";
import { initCategoryDrillSheet } from "../shared/CategoryDrillSheet";
import type { DrillCategory } from "../shared/CategoryDrillSheet";

/** Alpine internal: x-data binding stack üzerinden component state'ine erişmek için */
interface AlpineDataEl extends HTMLElement {
  _x_dataStack?: Array<Record<string, unknown>>;
}

/** Alpine component state shape (topDealsPage scope) — sadece kullandığımız field'lar */
interface TopDealsAlpineData {
  setCategory(slug: string): void;
  activeCategory?: string;
}

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

export function TopDealsCategoryTabs(): string {
  // Only render the "Tumu" (All) tab statically (active by default); rest loaded from API
  const defaultTabHtml = buildTabHtml("all", t("topDealsPage.tabAll"), true);

  // Drill-down sheet gövdesi: paylaşılan helper rows'u [data-td-cat-list]'e basar.
  // API yüklenene kadar skeleton görünür.
  const sheetSkeleton = `
    <ul data-td-cat-list class="overflow-y-auto flex-1 py-2 list-none m-0 p-0">
      ${Array.from(
        { length: 6 },
        () => `
        <li class="flex items-center w-full px-5 py-4 border-b border-gray-50 animate-pulse">
          <div class="h-4 rounded bg-gray-200 flex-1"></div>
        </li>
      `
      ).join("")}
    </ul>
  `;

  return `
    <div class="relative flex items-center" x-ref="tabsContainer">
      <!-- Left arrow (desktop only) -->
      <button
        type="button"
        class="hidden md:flex absolute start-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-gray-900 hover:shadow-lg transition-[color,box-shadow] duration-150 cursor-pointer"
        x-show="canScrollLeft"
        x-transition:enter="transition ease-out duration-150"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-out duration-100"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
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

      <!-- Mobile chevron → opens shared drill-down bottom sheet -->
      <button
        type="button"
        id="td-cat-trigger"
        class="th-no-press appearance-none focus:outline-none [-webkit-tap-highlight-color:transparent] md:hidden flex-shrink-0 flex items-center justify-center w-9 self-stretch border-b border-gray-200 bg-white text-gray-500"
        aria-label="${t("mobileCategory.allCategories")}" data-i18n-aria-label="mobileCategory.allCategories"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>

      <!-- Right arrow (desktop only) -->
      <button
        type="button"
        class="hidden md:flex absolute end-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-gray-900 hover:shadow-lg transition-[color,box-shadow] duration-150 cursor-pointer"
        x-show="canScrollRight"
        x-transition:enter="transition ease-out duration-150"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-out duration-100"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        @click="scrollTabs('right')"
        aria-label="Scroll right"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Mobile Category Drill-down Bottom Sheet (paylaşılan component) -->
    ${BottomSheet(
      { id: "td-cat-sheet", titleKey: "mobileCategory.allCategories", hiddenAt: "md:hidden" },
      sheetSkeleton
    )}
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
      getTopDealsData()?.setCategory("all");
      updateTabStyles("all");
    });
  }

  // Fetch categories from API and inject dynamic tabs + drill-down sheet
  loadCategoryTabs();
}

/** topDealsPage Alpine scope'una erişim (x-data binding stack üzerinden). */
function getTopDealsData(): TopDealsAlpineData | undefined {
  const mainEl = document.querySelector<AlpineDataEl>('[x-data="topDealsPage"]');
  return mainEl?._x_dataStack?.[0] as TopDealsAlpineData | undefined;
}

async function loadCategoryTabs(): Promise<void> {
  try {
    const { loadCategories } = await import("../../services/categoryService");
    const categories = await loadCategories();

    const tabsContainer = document.getElementById("td-tabs-scroll");
    if (!tabsContainer || !categories || categories.length === 0) return;

    // --- Desktop/tablet tabs (top-level only) ---
    for (const cat of categories) {
      const slug = cat.slug || cat.name || "";
      const name = cat.name || slug;
      if (!slug) continue;

      const tabBtn = document.createElement("button");
      tabBtn.type = "button";
      tabBtn.className =
        "top-deals-tab flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors border-b-[3px] border-transparent text-[#666] hover:text-[#222]";
      tabBtn.textContent = name;
      tabBtn.dataset.catSlug = slug;
      tabBtn.addEventListener("click", () => {
        getTopDealsData()?.setCategory(slug);
        updateTabStyles(slug);
      });
      tabsContainer.appendChild(tabBtn);
    }

    // --- Mobile drill-down sheet ---
    // Kök seviyeye "Tümü" satırı eklenir (filtreyi temizler). Alt kategorisi olan
    // kategori chevron ile içeri açılır; yaprak / "Tüm {Kategori}" seçilince o
    // slug'la ürünler filtrelenir (setCategory backend'e category param'ı geçer).
    const drillCategories: DrillCategory[] = [
      { name: t("topDealsPage.tabAll"), slug: "all" },
      ...categories,
    ];
    initCategoryDrillSheet({
      sheetId: "td-cat-sheet",
      triggerId: "td-cat-trigger",
      listSelector: "[data-td-cat-list]",
      categories: drillCategories,
      rootLabel: t("mobileCategory.allCategories"),
      allInCategoryLabel: (name: string) => t("mobileCategory.allInCategory", { name }),
      onSelect: (slug: string) => {
        getTopDealsData()?.setCategory(slug);
        updateTabStyles(slug);
      },
      getActiveSlug: () => getTopDealsData()?.activeCategory || "all",
    });

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
