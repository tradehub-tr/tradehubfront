import { getCurrencySymbol } from "../../utils/currency";
import { t } from "../../i18n";

/**
 * FilterSidebar Component (iSTOC-style Filter Panel)
 * Left sidebar filter panel with:
 * - Trade Assurance checkbox
 * - Supplier features (Verified Supplier, Verified PRO)
 * - Store reviews (radio buttons)
 * - Product features (Paid samples)
 * - Categories (collapsible list)
 * - Price range (min/max inputs)
 * - Min. order (input)
 * - Supplier country/region (searchable checkboxes)
 * - Management certifications (searchable checkboxes)
 * - Product certifications (searchable checkboxes)
 */

import type {
  FilterSection,
  CheckboxFilterSection,
  RadioFilterSection,
  PriceRangeFilterSection,
  MinOrderFilterSection,
  CategoryFilterSection,
  SearchableCheckboxFilterSection,
  FilterOption,
  StoreReviewFilter,
} from "../../types/productListing";

/**
 * SVG Icons for filter UI elements
 */
const icons = {
  chevronDown: `<svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path d="M19 9l-7 7-7-7" />
  </svg>`,
  chevronRight: `<svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path d="M9 5l7 7-7 7" />
  </svg>`,
  search: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>`,
  check: `<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
  </svg>`,
  shield: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>`,
  star: `<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>`,
  starEmpty: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>`,
  certBadge: `<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" style="color: #6b7280;">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
  </svg>`,
};

/**
 * Default filter sections configuration
 */
function buildDefaultFilterSections(): FilterSection[] {
  return [
    {
      id: "trade-assurance",
      title: t("products.filterTradeAssurance"),
      type: "checkbox",
      collapsible: false,
      options: [
        {
          id: "trade-assurance-enabled",
          label: t("products.filterTradeAssurance"),
          value: "trade-assurance",
          checked: false,
        },
      ],
    } as CheckboxFilterSection,
    {
      id: "supplier-features",
      title: t("products.filterSupplierFeatures"),
      type: "checkbox",
      collapsible: true,
      collapsed: false,
      options: [
        {
          id: "verified-supplier",
          label: t("products.filterVerifiedSupplier"),
          value: "verified",
          checked: false,
        },
        {
          id: "verified-pro",
          label: t("products.filterVerifiedPro"),
          value: "verified-pro",
          checked: false,
        },
      ],
    } as CheckboxFilterSection,
    {
      id: "store-reviews",
      title: t("products.filterStoreReviews"),
      type: "radio",
      collapsible: true,
      collapsed: false,
      options: [
        {
          id: "review-4",
          label: `4.0 ${t("products.filterAndUp")}`,
          minRating: 4.0,
          selected: false,
        },
        {
          id: "review-4.5",
          label: `4.5 ${t("products.filterAndUp")}`,
          minRating: 4.5,
          selected: false,
        },
        { id: "review-5", label: "5.0", minRating: 5.0, selected: false },
      ],
    } as RadioFilterSection,
    {
      id: "product-features",
      title: t("products.filterProductFeatures"),
      type: "checkbox",
      collapsible: true,
      collapsed: false,
      options: [
        {
          id: "paid-samples",
          label: t("products.filterPaidSamples"),
          value: "paid-samples",
          checked: false,
        },
      ],
    } as CheckboxFilterSection,
    {
      id: "categories",
      title: t("products.filterCategories"),
      type: "category",
      collapsible: true,
      collapsed: false,
      items: [],
      showMore: false,
      maxVisible: 5,
    } as CategoryFilterSection,
    {
      id: "price",
      title: t("products.filterPrice"),
      type: "price-range",
      collapsible: true,
      collapsed: false,
      filter: {
        min: undefined,
        max: undefined,
        currency: getCurrencySymbol(),
      },
    } as PriceRangeFilterSection,
    {
      id: "min-order",
      title: t("products.filterMinOrder"),
      type: "min-order",
      collapsible: true,
      collapsed: false,
      filter: {
        value: undefined,
        unit: t("products.filterPieces"),
      },
    } as MinOrderFilterSection,
    {
      id: "brands",
      title: t("products.filterBrand", { defaultValue: "Marka" }),
      type: "searchable-checkbox",
      collapsible: true,
      collapsed: false,
      searchPlaceholder: t("products.filterSearchBrand", { defaultValue: "Marka ara..." }),
      options: [],
    } as SearchableCheckboxFilterSection,
    {
      id: "supplier-country",
      title: t("products.filterSupplierCountry"),
      type: "searchable-checkbox",
      collapsible: true,
      collapsed: false,
      searchPlaceholder: t("products.filterSearchCountry"),
      options: [],
    } as SearchableCheckboxFilterSection,
    {
      id: "mgmt-certifications",
      title: t("products.filterMgmtCertifications"),
      type: "searchable-checkbox",
      collapsible: true,
      collapsed: false,
      searchPlaceholder: t("products.filterSearch"),
      options: [],
    } as SearchableCheckboxFilterSection,
    {
      id: "product-certifications",
      title: t("products.filterProductCertifications"),
      type: "searchable-checkbox",
      collapsible: true,
      collapsed: false,
      searchPlaceholder: t("products.filterSearch"),
      options: [],
    } as SearchableCheckboxFilterSection,
  ];
}

/**
 * Renders a checkbox input
 */
function renderCheckbox(option: FilterOption, sectionId: string, idPrefix = ""): string {
  const checkboxId = `filter-${idPrefix ? idPrefix + "-" : ""}${sectionId}-${option.id}`;
  return `
    <label
      for="${checkboxId}"
      class="flex items-center gap-2 cursor-pointer group py-1"
    >
      <div class="relative flex items-center justify-center w-4 h-4">
        <input
          type="checkbox"
          id="${checkboxId}"
          name="${sectionId}"
          value="${option.value}"
          ${option.checked ? "checked" : ""}
          class="peer sr-only"
          data-filter-section="${sectionId}"
          data-filter-value="${option.value}"
          @change="$dispatch('filter-change')"
        />
        <div
          class="absolute inset-0 border rounded transition-colors duration-150
                 peer-checked:bg-primary-500 peer-checked:border-primary-500
                 peer-focus:ring-2 peer-focus:ring-primary-200"
          style="border-color: var(--filter-checkbox-border, #d1d5db);"
        ></div>
        <span class="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150">
          ${icons.check}
        </span>
      </div>
      <span
        class="text-[13px] leading-tight group-hover:text-primary-600 transition-colors duration-150"
        style="color: var(--filter-text-color, #374151);"
      >${option.label}</span>
      ${
        option.count !== undefined
          ? `
        <span
          class="text-[11px] ml-auto"
          style="color: var(--filter-count-color, #9ca3af);"
        >(${option.count.toLocaleString()})</span>
      `
          : ""
      }
    </label>
  `;
}

/**
 * Renders a radio button for store reviews
 */
function renderRadioOption(option: StoreReviewFilter, sectionId: string, idPrefix = ""): string {
  const radioId = `filter-${idPrefix ? idPrefix + "-" : ""}${sectionId}-${option.id}`;
  const stars = Math.floor(option.minRating);
  const hasHalf = option.minRating % 1 !== 0;

  return `
    <label
      for="${radioId}"
      class="flex items-center gap-2 cursor-pointer group py-1"
      @click.prevent="
        const radio = document.getElementById('${radioId}');
        if (radio) {
          if (radio.checked) { radio.checked = false; }
          else { document.querySelectorAll('input[name=${sectionId}]').forEach(r => r.checked = false); radio.checked = true; }
          $dispatch('filter-change');
        }
      "
    >
      <div class="relative flex items-center justify-center w-4 h-4">
        <input
          type="radio"
          id="${radioId}"
          name="${sectionId}"
          value="${option.minRating}"
          ${option.selected ? "checked" : ""}
          class="peer sr-only"
          data-filter-section="${sectionId}"
          data-filter-value="${option.minRating}"
        />
        <div
          class="absolute inset-0 border rounded-full transition-colors duration-150
                 peer-checked:border-primary-500"
          style="border-color: var(--filter-checkbox-border, #d1d5db);"
        ></div>
        <div class="w-2 h-2 rounded-full bg-primary-500 opacity-0 peer-checked:opacity-100 transition-opacity duration-150"></div>
      </div>
      <div class="flex items-center gap-1" style="color: var(--color-primary-500);">
        ${Array.from({ length: stars }, () => icons.star).join("")}
        ${hasHalf ? icons.starEmpty : ""}
      </div>
      <span
        class="text-[13px] leading-tight group-hover:text-primary-600 transition-colors duration-150"
        style="color: var(--filter-text-color, #374151);"
      >${option.label}</span>
    </label>
  `;
}

/* renderCategoryItem removed — categories now rendered dynamically via initFilterSidebar */

/**
 * Renders the price range filter
 */
function renderPriceRange(section: PriceRangeFilterSection): string {
  return `
    <div class="flex items-center gap-1.5 mt-2">
      <input
        type="number"
        placeholder="${t("products.filterMin")}"
        min="0"
        class="th-input th-input-sm flex-1 min-w-0 w-0 px-2 text-[13px]"
        style="border-color: var(--filter-input-border, #d1d5db); color: var(--filter-text-color, #374151);"
        data-filter-section="${section.id}"
        data-filter-type="min"
        @keydown.enter="applySection('${section.id}')"
      />
      <span class="text-gray-400 text-[13px] shrink-0">-</span>
      <input
        type="number"
        placeholder="${t("products.filterMax")}"
        min="0"
        class="th-input th-input-sm flex-1 min-w-0 w-0 px-2 text-[13px]"
        style="border-color: var(--filter-input-border, #d1d5db); color: var(--filter-text-color, #374151);"
        data-filter-section="${section.id}"
        data-filter-type="max"
        @keydown.enter="applySection('${section.id}')"
      />
      <button
        type="button"
        class="shrink-0 w-8 h-8 flex items-center justify-center rounded bg-primary-500 hover:bg-primary-600 text-white text-base font-semibold leading-none border border-primary-500 hover:border-primary-600 transition-colors cursor-pointer"
        aria-label="${t("products.filterApply")}"
        data-filter-section="${section.id}"
        data-filter-action="apply"
        @click="applySection('${section.id}')"
      >&rsaquo;</button>
    </div>
  `;
}

/**
 * Renders the min order filter
 */
function renderMinOrder(section: MinOrderFilterSection): string {
  return `
    <div class="flex items-center gap-1.5 mt-2">
      <input
        type="number"
        placeholder="${t("products.filterQuantity")}"
        min="1"
        class="th-input th-input-sm flex-1 min-w-0 w-0 px-2 text-[13px]"
        style="border-color: var(--filter-input-border, #d1d5db); color: var(--filter-text-color, #374151);"
        data-filter-section="${section.id}"
        data-filter-type="value"
        @keydown.enter="applySection('${section.id}')"
      />
      <span
        class="text-[12px] whitespace-nowrap shrink-0"
        style="color: var(--filter-text-color, #6b7280);"
      >${section.filter.unit}</span>
      <button
        type="button"
        class="shrink-0 w-8 h-8 flex items-center justify-center rounded bg-primary-500 hover:bg-primary-600 text-white text-base font-semibold leading-none border border-primary-500 hover:border-primary-600 transition-colors cursor-pointer"
        aria-label="${t("products.filterApply")}"
        data-filter-section="${section.id}"
        data-filter-action="apply"
        @click="applySection('${section.id}')"
      >&rsaquo;</button>
    </div>
  `;
}

/**
 * Renders a searchable checkbox section
 */
function renderSearchableCheckbox(section: SearchableCheckboxFilterSection, idPrefix = ""): string {
  const isCertSection =
    section.id === "mgmt-certifications" || section.id === "product-certifications";
  const isCountrySection = section.id === "supplier-country";
  const isDynamic = (isCountrySection || isCertSection) && section.options.length === 0;

  return `
    <div class="space-y-2" ${isCountrySection ? `data-filter-prefix="${idPrefix}"` : ""}>
      <!-- Search input -->
      <div class="relative mt-2">
        <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none" style="color: var(--filter-search-icon, #9ca3af);">
          ${icons.search}
        </div>
        <input
          type="text"
          placeholder="${section.searchPlaceholder || "Search..."}"
          class="th-input th-input-sm pl-8"
          style="border-color: var(--filter-input-border, #d1d5db); color: var(--filter-text-color, #374151);"
          data-filter-section="${section.id}"
          data-filter-type="search"
          @input="handleSearchInput($event)"
        />
      </div>
      <!-- Options list -->
      <div class="space-y-0.5 max-h-[180px] overflow-y-auto" ${isDynamic ? `data-filter-dynamic="${isCountrySection ? "countries" : section.id}"` : ""}>
        ${
          isDynamic
            ? `
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        `
            : section.options
                .map((opt) =>
                  isCertSection
                    ? renderCertCheckbox(opt, section.id, idPrefix)
                    : renderCheckbox(opt, section.id, idPrefix)
                )
                .join("")
        }
      </div>
      ${isCertSection ? renderCertDisclaimer() : ""}
    </div>
  `;
}

/**
 * Renders a certification checkbox with badge icon
 */
function renderCertCheckbox(option: FilterOption, sectionId: string, idPrefix = ""): string {
  const checkboxId = `filter-${idPrefix ? idPrefix + "-" : ""}${sectionId}-${option.id}`;
  return `
    <label
      for="${checkboxId}"
      class="flex items-center gap-2 cursor-pointer group py-1"
    >
      <div class="relative flex items-center justify-center w-4 h-4">
        <input
          type="checkbox"
          id="${checkboxId}"
          name="${sectionId}"
          value="${option.value}"
          ${option.checked ? "checked" : ""}
          class="peer sr-only"
          data-filter-section="${sectionId}"
          data-filter-value="${option.value}"
          @change="$dispatch('filter-change')"
        />
        <div
          class="absolute inset-0 border rounded transition-colors duration-150
                 peer-checked:bg-primary-500 peer-checked:border-primary-500
                 peer-focus:ring-2 peer-focus:ring-primary-200"
          style="border-color: var(--filter-checkbox-border, #d1d5db);"
        ></div>
        <span class="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150">
          ${icons.check}
        </span>
      </div>
      ${icons.certBadge}
      <span
        class="text-[13px] leading-tight group-hover:text-primary-600 transition-colors duration-150"
        style="color: var(--filter-text-color, #374151);"
      >${option.label}</span>
    </label>
  `;
}

/**
 * Renders the certification disclaimer text
 */
function renderCertDisclaimer(): string {
  return `
    <div class="mt-2 pt-2 border-t" style="border-color: var(--filter-divider-color, #e5e7eb);">
      <p class="text-[10px] leading-relaxed" style="color: var(--filter-count-color, #9ca3af);">
        ${t("products.filterCertDisclaimer")}
      </p>
      <a
        href="#"
        class="inline-block mt-1 text-[12px] font-medium text-gray-700 hover:text-primary-600 hover:underline transition-colors dark:text-gray-300"
      >${t("products.filterLearnMore")}</a>
    </div>
  `;
}

/**
 * Renders a collapsible section header
 */
function renderSectionHeader(section: FilterSection): string {
  const isCollapsible = section.collapsible !== false;
  const isCollapsed = section.collapsed === true;

  return `
    <div
      class="flex items-center justify-between py-2 ${isCollapsible ? "cursor-pointer group" : ""}"
      ${isCollapsible ? `@click="toggleSection('${section.id}')"` : ""}
    >
      <h3
        class="text-[13px] font-semibold uppercase tracking-wide"
        style="color: var(--filter-heading-color, #111827);"
      >${section.title}</h3>
      ${
        isCollapsible
          ? `
        <span
          class="transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}"
          :class="{ 'rotate-180': !collapsed['${section.id}'] }"
          style="color: var(--filter-chevron-color, #6b7280);"
          data-filter-chevron="${section.id}"
        >
          ${icons.chevronDown}
        </span>
      `
          : ""
      }
    </div>
  `;
}

/**
 * Renders the content of a filter section based on its type
 */
function renderSectionContent(section: FilterSection, idPrefix = ""): string {
  switch (section.type) {
    case "checkbox": {
      const checkboxSection = section as CheckboxFilterSection;
      return `
        <div class="space-y-0.5">
          ${checkboxSection.options.map((opt) => renderCheckbox(opt, section.id, idPrefix)).join("")}
        </div>
      `;
    }
    case "radio": {
      const radioSection = section as RadioFilterSection;
      return `
        <div class="space-y-0.5">
          ${radioSection.options.map((opt) => renderRadioOption(opt, section.id, idPrefix)).join("")}
        </div>
      `;
    }
    case "category": {
      return `
        <div data-filter-dynamic="categories">
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      `;
    }
    case "price-range":
      return renderPriceRange(section as PriceRangeFilterSection);
    case "min-order":
      return renderMinOrder(section as MinOrderFilterSection);
    case "searchable-checkbox":
      return renderSearchableCheckbox(section as SearchableCheckboxFilterSection, idPrefix);
    default:
      return "";
  }
}

/**
 * Renders a complete filter section
 */
function renderFilterSection(section: FilterSection, idPrefix = ""): string {
  const isCollapsed = section.collapsed === true;

  return `
    <div
      class="border-b py-3"
      style="border-color: var(--filter-divider-color, #e5e7eb);"
      data-filter-section-wrapper="${section.id}"
    >
      ${renderSectionHeader(section)}
      <div
        class="overflow-hidden transition-all duration-200 ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}"
        :class="collapsed['${section.id}'] ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'"
        data-filter-content="${section.id}"
      >
        ${renderSectionContent(section, idPrefix)}
      </div>
    </div>
  `;
}

/**
 * Renders the Trade Assurance section with shield icon
 */
function renderTradeAssuranceSection(idPrefix = ""): string {
  const taId = `filter-${idPrefix ? idPrefix + "-" : ""}trade-assurance`;
  return `
    <div
      class="border-b py-3"
      style="border-color: var(--filter-divider-color, #e5e7eb);"
    >
      <label
        for="${taId}"
        class="flex items-center gap-2 cursor-pointer group"
      >
        <div class="relative flex items-center justify-center w-4 h-4">
          <input
            type="checkbox"
            id="${taId}"
            name="trade-assurance"
            value="trade-assurance"
            class="peer sr-only"
            data-filter-section="trade-assurance"
            data-filter-value="enabled"
            @change="$dispatch('filter-change')"
          />
          <div
            class="absolute inset-0 border rounded transition-colors duration-150
                   peer-checked:bg-primary-500 peer-checked:border-primary-500
                   peer-focus:ring-2 peer-focus:ring-primary-200"
            style="border-color: var(--filter-checkbox-border, #d1d5db);"
          ></div>
          <span class="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150">
            ${icons.check}
          </span>
        </div>
        <span class="text-primary-500">${icons.shield}</span>
        <span
          class="text-[13px] font-semibold group-hover:text-primary-600 transition-colors duration-150"
          style="color: var(--filter-heading-color, #111827);"
        >Trade Assurance</span>
      </label>
    </div>
  `;
}

/**
 * FilterSidebar Component
 * Renders the complete filter sidebar with all filter sections
 */
export function FilterSidebar(sections?: FilterSection[], idPrefix = ""): string {
  const filterSections = sections || buildDefaultFilterSections();

  // Separate Trade Assurance from other sections
  const tradeAssurance = filterSections.find((s) => s.id === "trade-assurance");
  const otherSections = filterSections.filter((s) => s.id !== "trade-assurance");

  // Build initial collapsed state for Alpine (sections with collapsed: true)
  const collapsedEntries = otherSections
    .filter((s) => s.collapsible !== false && s.collapsed === true)
    .map((s) => `'${s.id}': true`);
  const xDataArg =
    collapsedEntries.length > 0
      ? `filterSidebar({${collapsedEntries.join(", ")}})`
      : "filterSidebar";

  const isMobile = idPrefix === "mobile";

  return `
    <aside
      class="w-full lg:w-60 xl:w-64 flex-shrink-0 rounded-md border flex flex-col"
      aria-label="Product filters"
      x-data="${xDataArg}"
      data-filter-prefix-root="${idPrefix || "desktop"}"
      style="background: var(--filter-bg, #ffffff); border-color: var(--filter-border-color, #e5e7eb);"
    >
      <!-- Header: title + inline Clear link -->
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <h2
          class="text-[15px] font-bold"
          style="color: var(--filter-heading-color, #111827);"
        >${t("products.filters")}</h2>
        <button
          type="button"
          class="text-[12px] font-medium transition-colors hover:underline"
          style="color: var(--filter-count-color, #6b7280);"
          data-filter-action="clear-all"
          @click="clearAllFilters()"
        >${t("products.filterClearAll")}</button>
      </div>

      <!-- Filter sections (natural flow, no internal scroll) -->
      <div class="px-4 pb-2" data-filter-sections-container>
        <!-- Trade Assurance (special section with icon) -->
        ${tradeAssurance ? renderTradeAssuranceSection(idPrefix) : ""}

        <!-- Other filter sections -->
        ${otherSections.map((section) => renderFilterSection(section, idPrefix)).join("")}
      </div>

      <!-- Sahibinden-style: sticks to viewport bottom while sidebar is visible -->
      <div
        class="${isMobile ? "" : "lg:sticky lg:bottom-0 z-10"} px-4 py-3 border-t"
        style="background: var(--filter-bg, #ffffff); border-color: var(--filter-divider-color, #e5e7eb);"
      >
        <button
          type="button"
          class="w-full py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold border border-primary-500 hover:border-primary-600 transition-colors cursor-pointer"
          data-filter-action="apply-all"
          @click="applyFilters()"
        >${t("products.filterApply")}</button>
      </div>
    </aside>
  `;
}

/**
 * Initialize filter sidebar interactions
 * No-op — Alpine.js handles all filter interactions via x-data="filterSidebar"
 */
export function initFilterSidebar(query?: string, category?: string): void {
  // Load dynamic facets from API
  import("../../services/listingService")
    .then(({ getFilterFacets }) => {
      getFilterFacets(query, category)
        .then((facets) => {
          // Update category sections
          document
            .querySelectorAll<HTMLElement>('[data-filter-dynamic="categories"]')
            .forEach((container) => {
              if (facets.categories.length === 0) {
                container.innerHTML = `<p class="text-xs" style="color:#9ca3af">${t("products.noResults")}</p>`;
                return;
              }
              container.innerHTML = facets.categories
                .map(
                  (cat) => `
          <button
            type="button"
            class="flex items-center justify-between w-full py-1.5 text-[13px] hover:text-primary-600 transition-colors cursor-pointer"
            style="color: var(--filter-text-color, #374151);"
            onclick="window.location.href='/pages/products.html?cat=${cat.slug}'"
          >
            <span class="truncate">${cat.name}</span>
            <span class="text-[11px] ml-2 flex-shrink-0" style="color:#9ca3af">(${cat.count})</span>
          </button>
        `
                )
                .join("");
            });

          // Update country sections
          document
            .querySelectorAll<HTMLElement>('[data-filter-dynamic="countries"]')
            .forEach((container) => {
              if (facets.countries.length === 0) {
                container.innerHTML = "";
                return;
              }
              const idPrefix =
                container.closest("[data-filter-prefix]")?.getAttribute("data-filter-prefix") || "";
              container.innerHTML = facets.countries
                .map((c) => {
                  const code = (c as any).code || c.value;
                  const translatedName =
                    t(`countries.${code}`) !== `countries.${code}`
                      ? t(`countries.${code}`)
                      : c.label;
                  const checkboxId = `filter-${idPrefix ? idPrefix + "-" : ""}supplier-country-country-${c.value.toLowerCase()}`;
                  return `
            <label for="${checkboxId}" class="flex items-center gap-2 cursor-pointer group py-1 filter-searchable-item">
              <div class="relative flex items-center justify-center w-4 h-4">
                <input type="checkbox" id="${checkboxId}" name="supplier-country" value="${c.value}"
                  class="peer sr-only" data-filter-section="supplier-country" data-filter-value="${c.value}"
                  @change="$dispatch('filter-change')" />
                <div class="absolute inset-0 border rounded transition-colors duration-150
                  peer-checked:bg-primary-500 peer-checked:border-primary-500
                  peer-focus:ring-2 peer-focus:ring-primary-200"
                  style="border-color: var(--filter-checkbox-border, #d1d5db);"></div>
                <span class="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </span>
              </div>
              <span class="text-[13px] leading-tight group-hover:text-primary-600 transition-colors duration-150" style="color: var(--filter-text-color, #374151);">${translatedName}</span>
              <span class="text-[11px] ml-auto" style="color: var(--filter-count-color, #9ca3af);">(${c.count})</span>
            </label>
          `;
                })
                .join("");
            });

          // Update brand sections
          document
            .querySelectorAll<HTMLElement>('[data-filter-dynamic="brands"]')
            .forEach((container) => {
              const brands = (facets as any).brands || [];
              if (brands.length === 0) {
                container.innerHTML = `<p class="text-xs" style="color:#9ca3af">${t("products.noResults")}</p>`;
                return;
              }
              const idPrefix =
                container.closest("[data-filter-prefix]")?.getAttribute("data-filter-prefix") || "";
              container.innerHTML = brands
                .map((b: any) => {
                  const checkboxId = `filter-${idPrefix ? idPrefix + "-" : ""}brands-brand-${String(b.value).toLowerCase().replace(/\s+/g, "-")}`;
                  const logoHtml = b.logo
                    ? `<img src="${b.logo}" alt="${b.label}" class="w-4 h-4 object-contain mr-1" />`
                    : "";
                  return `
            <label for="${checkboxId}" class="flex items-center gap-2 cursor-pointer group py-1 filter-searchable-item">
              <div class="relative flex items-center justify-center w-4 h-4">
                <input type="checkbox" id="${checkboxId}" name="brands" value="${b.value}"
                  class="peer sr-only" data-filter-section="brands" data-filter-value="${b.value}"
                  @change="$dispatch('filter-change')" />
                <div class="absolute inset-0 border rounded transition-colors duration-150
                  peer-checked:bg-primary-500 peer-checked:border-primary-500
                  peer-focus:ring-2 peer-focus:ring-primary-200"
                  style="border-color: var(--filter-checkbox-border, #d1d5db);"></div>
                <span class="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </span>
              </div>
              ${logoHtml}
              <span class="text-[13px] leading-tight group-hover:text-primary-600 transition-colors duration-150" style="color: var(--filter-text-color, #374151);">${b.label}</span>
              <span class="text-[11px] ml-auto" style="color: var(--filter-count-color, #9ca3af);">(${b.count})</span>
            </label>
          `;
                })
                .join("");
            });

          // Render dynamic attribute facets (Renk, Beden, Malzeme, ...)
          const attributes = (facets as any).attributes || [];
          if (attributes.length > 0) {
            document
              .querySelectorAll<HTMLElement>("[data-filter-sections-container]")
              .forEach((container) => {
                // Remove any previously-injected attribute facets to avoid dupes on re-render
                container
                  .querySelectorAll("[data-dynamic-attr-section]")
                  .forEach((el) => el.remove());
                const root = container.closest<HTMLElement>("[data-filter-prefix-root]");
                const idPrefix =
                  root && root.getAttribute("data-filter-prefix-root") !== "desktop"
                    ? root.getAttribute("data-filter-prefix-root") || ""
                    : "";

                const sectionsHtml = attributes
                  .map((attr: any) => {
                    const sectionId = `attr-${attr.code.toLowerCase()}`;
                    const optionsHtml = (attr.options || [])
                      .map((opt: any) => {
                        const checkboxId = `filter-${idPrefix ? idPrefix + "-" : ""}${sectionId}-${String(opt.value).toLowerCase().replace(/\s+/g, "-")}`;
                        const colorSwatch = opt.color
                          ? `<span class="inline-block w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" style="background:${opt.color};"></span>`
                          : "";
                        return `
                <label for="${checkboxId}" class="flex items-center gap-2 cursor-pointer group py-1 filter-searchable-item">
                  <div class="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                    <input type="checkbox" id="${checkboxId}" name="${sectionId}" value="${opt.value}"
                      class="peer sr-only" data-filter-section="${sectionId}" data-filter-value="${opt.value}"
                      data-attribute-code="${attr.code}"
                      @change="$dispatch('filter-change')" />
                    <div class="absolute inset-0 border rounded transition-colors duration-150
                      peer-checked:bg-primary-500 peer-checked:border-primary-500
                      peer-focus:ring-2 peer-focus:ring-primary-200"
                      style="border-color: var(--filter-checkbox-border, #d1d5db);"></div>
                    <span class="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                    </span>
                  </div>
                  ${colorSwatch}
                  <span class="text-[13px] leading-tight group-hover:text-primary-600 transition-colors duration-150 truncate" style="color: var(--filter-text-color, #374151);">${opt.label}</span>
                  <span class="text-[11px] ml-auto flex-shrink-0" style="color: var(--filter-count-color, #9ca3af);">(${opt.count})</span>
                </label>
              `;
                      })
                      .join("");
                    return `
              <div class="py-3 border-t" data-dynamic-attr-section="${attr.code}"
                style="border-color: var(--filter-divider-color, #e5e7eb);">
                <button type="button"
                  class="flex items-center justify-between w-full mb-2 cursor-pointer bg-transparent border-0 p-0"
                  @click="toggle && toggle('${sectionId}')">
                  <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--filter-heading-color, #111827);">${attr.label}</span>
                  <svg class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="flex flex-col gap-0.5">
                  ${optionsHtml}
                </div>
              </div>
            `;
                  })
                  .join("");

                // Insert attribute sections at end of filter sections container
                container.insertAdjacentHTML("beforeend", sectionsHtml);
              });
          }

          // Update certification sections (management + product)
          const certSections = [
            { key: "mgmt-certifications", data: facets.managementCertifications || [] },
            { key: "product-certifications", data: facets.productCertifications || [] },
          ];
          for (const { key, data } of certSections) {
            document
              .querySelectorAll<HTMLElement>(`[data-filter-dynamic="${key}"]`)
              .forEach((container) => {
                if (data.length === 0) {
                  container.innerHTML = "";
                  return;
                }
                const idPrefix =
                  container.closest("[data-filter-prefix]")?.getAttribute("data-filter-prefix") ||
                  "";
                container.innerHTML = data
                  .map((c: any) => {
                    const checkboxId = `filter-${idPrefix ? idPrefix + "-" : ""}${key}-cert-${c.value.toLowerCase().replace(/\s+/g, "-")}`;
                    return `
              <label for="${checkboxId}" class="flex items-center gap-2 cursor-pointer group py-1 filter-searchable-item">
                <div class="relative flex items-center justify-center w-4 h-4">
                  <input type="checkbox" id="${checkboxId}" name="${key}" value="${c.value}"
                    class="peer sr-only" data-filter-section="${key}" data-filter-value="${c.value}"
                    @change="$dispatch('filter-change')" />
                  <div class="absolute inset-0 border rounded transition-colors duration-150
                    peer-checked:bg-primary-500 peer-checked:border-primary-500
                    peer-focus:ring-2 peer-focus:ring-primary-200"
                    style="border-color: var(--filter-checkbox-border, #d1d5db);"></div>
                  <span class="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                  </span>
                </div>
                <span class="text-[13px] leading-tight group-hover:text-primary-600 transition-colors duration-150" style="color: var(--filter-text-color, #374151);">${c.label}</span>
                <span class="text-[11px] ml-auto" style="color: var(--filter-count-color, #9ca3af);">(${c.count})</span>
              </label>
            `;
                  })
                  .join("");
              });
          }
        })
        .catch((err) => {
          console.warn("[FilterSidebar] getFilterFacets failed:", err);
          // Replace skeleton with "no results" so user knows the load finished
          document.querySelectorAll<HTMLElement>("[data-filter-dynamic]").forEach((container) => {
            container.innerHTML = `<p class="text-xs" style="color:#9ca3af">${t("products.noResults")}</p>`;
          });
        });
    })
    .catch((err) => {
      console.warn("[FilterSidebar] listingService import failed:", err);
      document.querySelectorAll<HTMLElement>("[data-filter-dynamic]").forEach((container) => {
        container.innerHTML = `<p class="text-xs" style="color:#9ca3af">${t("products.noResults")}</p>`;
      });
    });
}

/**
 * Get default filter sections for use by other components
 */
export function getDefaultFilterSections(): FilterSection[] {
  return buildDefaultFilterSections();
}
