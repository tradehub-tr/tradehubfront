/**
 * FilterChips Component
 * Renders active filter chips/tags above the product grid.
 * Each chip shows which filter is active, with an X button to remove it.
 * Uses Alpine.js @click on remove buttons within x-data="filterChips" scope.
 */

import type { FilterState } from "./filterEngine";
import { getCurrencySymbol } from "../../utils/currency";
import { t } from "../../i18n";
import { getCountryDisplayName } from "../../utils/country";

/**
 * Create a single chip HTML
 * Remove buttons use @click to call removeChipFilter() on the parent
 * filterChips Alpine component (registered in alpine.ts).
 */
/** Masaüstünde (≥1024px) daraltılmış durumda görünen etiket sayısı. */
export const CHIPS_DESKTOP_LIMIT = 6;
/** Mobilde etiketler + "+N daha" + Temizle için satır üst sınırı. */
export const CHIPS_MOBILE_MAX_ROWS = 2;
const DESKTOP_QUERY = "(min-width: 1024px)";

function makeChip(label: string, section: string, value: string): string {
  // Escape single quotes for Alpine expression safety
  const safeSection = section.replace(/'/g, "\\'");
  const safeValue = value.replace(/'/g, "\\'");

  // Tasarım E: küçük, nötr etiket — gri zemin, #222 metin; turuncu vurgu yok.
  // Görünürlüğü layoutChips yönetir (masaüstü: 6 sabit; mobil: 2 satır ölçümü).
  return `
    <span data-chip class="inline-flex items-center gap-1 px-2.5 py-[3px] text-[11px] leading-4 font-medium rounded-full border bg-[var(--color-surface-raised,#f5f5f5)] border-[var(--color-border-default,#e5e5e5)] text-[#222] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
      <span>${label}</span>
      <button
        type="button"
        class="ms-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-500 hover:bg-gray-200 hover:text-[#222] dark:hover:bg-gray-700 transition-colors cursor-pointer"
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
  const items: { label: string; section: string; value: string }[] = [];
  const add = (label: string, section: string, value: string) =>
    items.push({ label, section, value });

  if (state.priceMin !== null || state.priceMax !== null) {
    const label = `${getCurrencySymbol()}${state.priceMin ?? "0"} \u2013 ${getCurrencySymbol()}${state.priceMax ?? "\u221E"}`;
    add(label, "price", "range");
  }
  if (state.minOrder !== null) {
    add(
      t("products.filterChipMinOrder", { count: state.minOrder }),
      "min-order",
      String(state.minOrder)
    );
  }
  state.supplierCountries.forEach((c) => {
    // c = ISO kodu (TR) ya da backend Country adı ("Turkey"). İkisi de sözlükteki
    // resmî ada çevrilir (TR → "Türkiye", İngilizce arayüzde de); karşılığı yoksa raw kalır.
    add(getCountryDisplayName(c) || c, "supplier-country", c);
  });
  if (state.verifiedSupplier) {
    add(t("products.filterChipVerifiedSupplier"), "verified-supplier", "1");
  }
  state.brands.forEach((v) => add(labelFromDom("brands", v), "brands", v));
  state.mgmtCertifications.forEach((v) =>
    add(labelFromDom("mgmt-certifications", v), "mgmt-certifications", v)
  );
  state.productCertifications.forEach((v) =>
    add(labelFromDom("product-certifications", v), "product-certifications", v)
  );
  // Dinamik attribute'ler: state.attributes = { COLOR: ["Kırmızı"], SIZE: ["M"] }
  for (const [code, values] of Object.entries(state.attributes)) {
    const section = `attr-${code.toLowerCase()}`;
    values.forEach((v) => add(labelFromDom(section, v), section, v));
  }

  if (items.length === 0) return "";

  const chips = items.map((c) => makeChip(c.label, c.section, c.value)).join("");

  // "+N daha" — turuncu tonlu tek etiket; metnini ve görünürlüğünü layoutChips yazar.
  const toggle = `<button type="button" data-chips-toggle aria-expanded="false" style="display:none"
      class="inline-flex items-center px-2.5 py-[3px] text-[11px] leading-4 font-semibold rounded-full border bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 transition-colors cursor-pointer dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700/50"></button>`;

  // "Temizle" — satır sonunda sade bağlantı; tüm filtreleri kaldırır (filterEngine clear-all).
  const clear = `<button type="button" data-chips-clear data-filter-action="clear-all"
      class="inline-flex items-center px-1 text-[11px] leading-4 font-medium text-gray-500 underline underline-offset-2 hover:text-[#222] transition-colors cursor-pointer">${t("common.clear")}</button>`;

  return `
    <div data-chips-list class="flex flex-wrap items-center gap-1.5">
      ${chips}
      ${toggle}
      ${clear}
    </div>
  `;
}

/** Ölçüm kancası: o anki görünür yerleşim için eleman → offsetTop (testte simüle edilir). */
type MeasureFactory = () => (el: Element) => number;
const measureOffsetTop: MeasureFactory = () => (el) => (el as HTMLElement).offsetTop;

/**
 * Etiket görünürlüğünü uygular. Kapalıyken:
 *  - masaüstü (≥1024px): ilk CHIPS_DESKTOP_LIMIT etiket;
 *  - mobil: etiketler + "+N daha" + Temizle en fazla CHIPS_MOBILE_MAX_ROWS satır —
 *    sondan etiket gizlenerek ölçülür, "+N daha" son satırın sonunda kalır.
 * Açıkken (container.dataset.chipsExpanded = "1") hepsi görünür.
 */
export function layoutChips(
  container: HTMLElement,
  measure: MeasureFactory = measureOffsetTop
): void {
  const list = container.querySelector<HTMLElement>("[data-chips-list]");
  const toggle = container.querySelector<HTMLElement>("[data-chips-toggle]");
  if (!list || !toggle) return;
  const chips = [...list.querySelectorAll<HTMLElement>("[data-chip]")];
  const expanded = container.dataset.chipsExpanded === "1";
  const setVisible = (n: number) =>
    chips.forEach((c, i) => {
      c.style.display = i < n ? "" : "none";
    });
  // Satır sayımı: aynı satırdaki elemanlar farklı yükseklikte olabilir (Temizle
  // bağlantısı etiketten kısa, ortalanınca birkaç px aşağıda) → offsetTop'ları
  // ROW_TOLERANCE içinde kümele; yeni satır ancak belirgin bir sıçramada başlar.
  const ROW_TOLERANCE = 12;
  const rows = (): number => {
    const top = measure();
    const tops: number[] = [];
    for (const el of [...list.children] as HTMLElement[]) {
      if (el.style.display !== "none") tops.push(top(el));
    }
    tops.sort((a, b) => a - b);
    let count = 0;
    let rowTop = Number.NEGATIVE_INFINITY;
    for (const t of tops) {
      if (t - rowTop > ROW_TOLERANCE) {
        count++;
        rowTop = t;
      }
    }
    return count;
  };

  let visible = chips.length;
  if (!expanded) {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      visible = Math.min(chips.length, CHIPS_DESKTOP_LIMIT);
    } else {
      // Ölçüm düğmenin gerçek genişliğiyle yapılmalı: metin henüz boşsa dar ölçülür
      // ve gerçek metin yazılınca satır taşar. En geniş olası etiketi ("+<toplam> daha") yaz.
      toggle.textContent = t("products.chipsShowMore", { count: chips.length });
      // Önce hepsi görünür, düğme gizli: sığıyorsa gizlenecek bir şey yok.
      setVisible(chips.length);
      toggle.style.display = "none";
      if (rows() > CHIPS_MOBILE_MAX_ROWS) {
        // Düğme yer kaplayacak: göster ve sondan etiket eksilterek sığdır.
        toggle.style.display = "";
        for (let n = chips.length - 1; n >= 0; n--) {
          setVisible(n);
          visible = n;
          if (rows() <= CHIPS_MOBILE_MAX_ROWS) break;
        }
      }
    }
  }
  setVisible(visible);
  const hidden = chips.length - visible;
  toggle.style.display = hidden > 0 || expanded ? "" : "none";
  toggle.textContent = expanded
    ? t("products.chipsShowLess")
    : t("products.chipsShowMore", { count: hidden });
  toggle.setAttribute("aria-expanded", String(expanded));
}

let chipsHandlersBound = false;

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
  layoutChips(container);
  if (!chipsHandlersBound) {
    chipsHandlersBound = true;
    // Açma/kapama: durum konteynerde tutulur (innerHTML yenilense de kalır).
    container.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement | null)?.closest("[data-chips-toggle]");
      if (!btn) return;
      container.dataset.chipsExpanded = container.dataset.chipsExpanded === "1" ? "" : "1";
      layoutChips(container);
    });
    window.addEventListener("resize", () => requestAnimationFrame(() => layoutChips(container)), {
      passive: true,
    });
  }
}

/**
 * Initialize chip removal via event delegation.
 * No-op — Alpine.js handles clicks via @click directives on remove buttons
 * within the x-data="filterChips" scope on the #active-filter-chips container.
 */
export function initFilterChips(): void {
  // Alpine.js handles chip removal via @click directives
}
