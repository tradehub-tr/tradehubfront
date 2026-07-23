/**
 * MobileCategoryBar Component
 * iSTOC-style horizontal scrollable category tabs + subcategory thumbnails
 * Bottom sheet drawer for category selection
 * Visible only on mobile/tablet (xl:hidden)
 * Kategoriler API'den dinamik olarak yüklenir (categoryService).
 */

import { onCategoriesLoaded } from "../../services/categoryService";
import type { ApiCategory } from "../../services/categoryService";
import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { BottomSheet } from "../shared/BottomSheet";
import { initCategoryDrillSheet } from "../shared/CategoryDrillSheet";

/* ──── Subcategory thumbnail renderer ──── */

function renderMobileSubcategory(name: string, slug: string, image?: string): string {
  const placeholderSvg = `<svg class="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 sm:w-6 sm:h-6 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75Z"/></svg>`;
  const inner = image
    ? `<img src="${escapeHtml(sanitizeUrl(image))}" alt="${escapeHtml(name)}" width="60" height="60" decoding="async" class="w-full h-full object-cover rounded-md" onerror="this.outerHTML=this.dataset.fallback" data-fallback='${placeholderSvg.replace(/'/g, "&apos;")}' />`
    : placeholderSvg;
  return `
    <a href="/urunler?cat=${encodeURIComponent(slug)}" class="mcb-product flex-shrink-0 flex flex-col items-center gap-1 w-[42px] min-[400px]:w-[52px] sm:w-[60px]">
      <div class="w-[42px] h-[42px] min-[400px]:w-[52px] min-[400px]:h-[52px] sm:w-[60px] sm:h-[60px] rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        ${inner}
      </div>
      <span class="text-[9px] min-[400px]:text-[11px] text-gray-600 dark:text-gray-400 text-center leading-tight truncate w-full">${escapeHtml(name)}</span>
    </a>
  `;
}

/* ──── Bottom Sheet (paylaşılan component, skeleton until API loads) ──── */

function renderBottomSheet(): string {
  // Drill-down sheet gövdesi: paylaşılan helper rows'u buraya basar (data-mcb-mobile-list).
  // İlk açılışa kadar skeleton görünür; helper renderSheet ile içeriği değiştirir.
  const skeleton = `
    <ul data-mcb-mobile-list class="overflow-y-auto flex-1 py-2 list-none m-0 p-0">
      ${Array.from(
        { length: 6 },
        () => `
        <li class="flex items-center w-full px-5 py-4 border-b border-gray-50 dark:border-gray-700/50 animate-pulse">
          <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 flex-1"></div>
        </li>
      `
      ).join("")}
    </ul>
  `;
  return BottomSheet({ id: "mcb-sheet", titleKey: "categoryBrowse.title", hiddenAt: "xl:hidden" }, skeleton);
}

/* ──── HTML ──── */

export function MobileCategoryBar(): string {
  return `
    <div id="mobile-category-bar" class="xl:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <!-- Row 1: Category Tabs (skeleton, replaced after API) -->
      <div class="relative">
        <div id="mcb-tabs" class="flex overflow-x-auto scrollbar-hide gap-0.5 pe-10">
          ${Array.from(
            { length: 6 },
            (_, i) => `
            <div class="flex-shrink-0 px-3 py-2 animate-pulse">
              <div class="h-3 rounded bg-gray-200 dark:bg-gray-700 ${i === 0 ? "w-24" : "w-16"}"></div>
            </div>
          `
          ).join("")}
        </div>
        <!-- Dropdown button with gradient fade -->
        <div class="absolute end-0 top-0 bottom-0 flex items-center pointer-events-none">
          <div class="w-12 h-full bg-gradient-to-l from-white dark:from-gray-800 to-transparent"></div>
        </div>
        <button
          type="button"
          id="mcb-dropdown-btn"
          class="th-no-press absolute end-0 top-0 bottom-0 w-9 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800"
          aria-label="${t("mobileCategory.allCategories")}" data-i18n-aria-label="mobileCategory.allCategories"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>
      </div>

      <!-- Row 2: Subcategory Items (skeleton, replaced after API) -->
      <div id="mcb-products" class="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 px-2 sm:px-3 py-2.5">
        ${Array.from(
          { length: 6 },
          () => `
          <div class="flex-shrink-0 flex flex-col items-center gap-1 w-[52px] sm:w-[60px] animate-pulse">
            <div class="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-md bg-gray-200 dark:bg-gray-700"></div>
            <div class="h-2.5 w-10 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        `
        ).join("")}
      </div>
    </div>

    ${renderBottomSheet()}
  `;
}

/* ──── Init ──── */

export function initMobileCategoryBar(): void {
  const tabsContainer = document.getElementById("mcb-tabs");
  const productsContainer = document.getElementById("mcb-products");

  if (!productsContainer || !tabsContainer) return;

  const TAB_ACT = [
    "font-bold",
    "text-gray-900",
    "dark:text-white",
    "border-gray-900",
    "dark:border-white",
  ];
  const TAB_INACT = ["text-gray-500", "dark:text-gray-400", "font-normal", "border-transparent"];

  let _cats: ApiCategory[] = [];
  // Drill-down sheet'in ✓ işareti için aktif kök slug'ı (seçili tab).
  let activeRootSlug = "";

  function selectCategory(catId: string): void {
    // Update tab bar
    tabsContainer!.querySelectorAll<HTMLButtonElement>(".mcb-tab").forEach((t) => {
      t.classList.remove(...TAB_ACT);
      t.classList.add(...TAB_INACT);
    });
    const activeTab = tabsContainer!.querySelector<HTMLButtonElement>(
      `.mcb-tab[data-mcb-cat="${catId}"]`
    );
    if (activeTab) {
      activeTab.classList.remove(...TAB_INACT);
      activeTab.classList.add(...TAB_ACT);
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    // Update subcategories row
    const cat = _cats.find((c) => c.id === catId);
    if (cat && productsContainer) {
      activeRootSlug = cat.slug;
      productsContainer.innerHTML = cat.children
        .slice(0, 10)
        .map((ch) => renderMobileSubcategory(ch.name, ch.slug, ch.image))
        .join("");
    }
  }

  // ──── Populate from API ────
  onCategoriesLoaded((cats) => {
    if (!cats.length) return;
    _cats = cats;

    // Render tab bar
    tabsContainer.innerHTML = cats
      .map(
        (cat, i) => `
      <button
        type="button"
        class="mcb-tab flex-shrink-0 px-3 py-2 text-xs whitespace-nowrap transition-colors ${
          i === 0
            ? "font-bold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white"
            : "text-gray-500 dark:text-gray-400 font-normal border-b-2 border-transparent"
        }"
        data-mcb-cat="${escapeHtml(cat.id)}"
      >${escapeHtml(cat.name)}</button>
    `
      )
      .join("");

    // Bind tab clicks
    tabsContainer.querySelectorAll<HTMLButtonElement>(".mcb-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const catId = tab.getAttribute("data-mcb-cat");
        if (catId) selectCategory(catId);
      });
    });

    // Mobil drill-down sheet (paylaşılan helper, üreticiler çubuğuyla aynı pattern).
    // Seçim → detaylı kategori sayfasına git (categories.html o ?cat bölümüne kaydırır).
    initCategoryDrillSheet({
      sheetId: "mcb-sheet",
      triggerId: "mcb-dropdown-btn",
      listSelector: "[data-mcb-mobile-list]",
      categories: cats,
      rootLabel: t("mobileCategory.allCategories"),
      allInCategoryLabel: (name: string) => t("mobileCategory.allInCategory", { name }),
      onSelect: (slug: string) => {
        window.location.href = "/kategoriler?cat=" + encodeURIComponent(slug);
      },
      getActiveSlug: () => activeRootSlug,
    });

    // Render first category's subcategories
    if (cats[0]) {
      activeRootSlug = cats[0].slug;
      productsContainer.innerHTML = cats[0].children
        .slice(0, 10)
        .map((ch) => renderMobileSubcategory(ch.name, ch.slug, ch.image))
        .join("");
    }
  });
}
