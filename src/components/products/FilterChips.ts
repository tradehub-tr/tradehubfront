/**
 * FilterChips Component
 * Renders active filter chips/tags above the product grid.
 * Each chip shows which filter is active, with an X button to remove it.
 * Uses Alpine.js @click on remove buttons within x-data="filterChips" scope.
 */

import type { FilterState } from "./filterEngine";
import { getCurrencySymbol } from "../../utils/currency";
import { t } from "../../i18n";

/**
 * Create a single chip HTML
 * Remove buttons use @click to call removeChipFilter() on the parent
 * filterChips Alpine component (registered in alpine.ts).
 */
function makeChip(label: string, section: string, value: string): string {
  // Escape single quotes for Alpine expression safety
  const safeSection = section.replace(/'/g, "\\'");
  const safeValue = value.replace(/'/g, "\\'");

  return `
    <span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 rounded-full dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700/50">
      <span>${label}</span>
      <button
        type="button"
        class="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
        @click="removeChipFilter('${safeSection}', '${safeValue}')"
        aria-label="Kaldir: ${label}"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </span>
  `;
}

/**
 * Render all active filter chips from the current FilterState
 */
export function renderFilterChips(state: FilterState): string {
  const chips: string[] = [];

  if (state.priceMin !== null || state.priceMax !== null) {
    const label = `${getCurrencySymbol()}${state.priceMin ?? "0"} \u2013 ${getCurrencySymbol()}${state.priceMax ?? "\u221E"}`;
    chips.push(makeChip(label, "price", "range"));
  }
  if (state.minOrder !== null) {
    chips.push(
      makeChip(
        t("products.filterChipMinOrder", { count: state.minOrder }),
        "min-order",
        String(state.minOrder)
      )
    );
  }
  state.supplierCountries.forEach((c) => {
    // c = ISO ülke kodu (TR/US/...) ya da raw value. Locale'de karşılığı varsa onu göster,
    // yoksa raw'ı koru — chip label'ı sidebar'daki ülke etiketiyle tutarlı olsun.
    const key = `countries.${c}`;
    const translated = t(key);
    const label = translated !== key ? translated : c;
    chips.push(makeChip(label, "supplier-country", c));
  });
  if (state.verifiedSupplier) {
    chips.push(makeChip(t("products.filterChipVerifiedSupplier"), "verified-supplier", "1"));
  }
  state.brands.forEach((v) => chips.push(makeChip(labelFromDom("brands", v), "brands", v)));
  state.mgmtCertifications.forEach((v) =>
    chips.push(makeChip(labelFromDom("mgmt-certifications", v), "mgmt-certifications", v))
  );
  state.productCertifications.forEach((v) =>
    chips.push(makeChip(labelFromDom("product-certifications", v), "product-certifications", v))
  );
  // Dinamik attribute'ler: state.attributes = { COLOR: ["Kırmızı"], SIZE: ["M"] }
  for (const [code, values] of Object.entries(state.attributes)) {
    const section = `attr-${code.toLowerCase()}`;
    values.forEach((v) => chips.push(makeChip(labelFromDom(section, v), section, v)));
  }

  return chips.join("");
}

/**
 * Sidebar'daki checkbox label'ını DOM'dan oku — chip için raw value yerine human-readable
 * etiket göster (örn. "ISO9001" yerine "ISO 9001"). Bulamazsa value fallback.
 */
function labelFromDom(section: string, value: string): string {
  const input = document.querySelector<HTMLInputElement>(
    `input[data-filter-section="${CSS.escape(section)}"][data-filter-value="${CSS.escape(value)}"]`
  );
  const labelEl = input?.closest("label");
  // <label> içinde label text taşıyan span — renderCheckbox/renderCertCheckbox'taki
  // `text-[13px]` class'lı span'i hedefliyoruz; bulamazsak fallback.
  const textSpan = labelEl?.querySelector<HTMLSpanElement>('span[class*="text-\\[13px\\]"]');
  return (textSpan?.textContent || input?.value || value).trim();
}

/**
 * Update the #active-filter-chips container in the DOM.
 * The container must have x-data="filterChips" for @click directives to work.
 * Alpine's MutationObserver processes new @click directives on innerHTML change.
 */
export function updateFilterChips(state: FilterState): void {
  const container = document.getElementById("active-filter-chips");
  if (!container) return;
  container.innerHTML = renderFilterChips(state);
}

/**
 * Initialize chip removal via event delegation.
 * No-op — Alpine.js handles clicks via @click directives on remove buttons
 * within the x-data="filterChips" scope on the #active-filter-chips container.
 */
export function initFilterChips(): void {
  // Alpine.js handles chip removal via @click directives
}
