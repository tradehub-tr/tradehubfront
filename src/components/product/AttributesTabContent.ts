/**
 * AttributesTabContent Component
 * Renders the "Ozellikler" tab content with Key Attributes and Packaging tables.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import { ProductSalesRank } from "./ProductSalesRank";
// Product loaded lazily via getCurrentProduct() inside functions

const KEY_CLS =
  "pd-attrs-key text-[var(--pd-spec-key-color,#6b7280)] w-1/4 bg-[var(--pd-spec-header-bg,#f9fafb)] px-4 py-3 border-b border-[var(--pd-spec-border,#e5e5e5)] align-top";
const VAL_CLS =
  "pd-attrs-val text-[var(--pd-spec-value-color,#111827)] font-semibold w-1/4 px-4 py-3 border-b border-[var(--pd-spec-border,#e5e5e5)] align-top";

function buildTableRows(specs: { key: string; value: string }[]): string {
  const rows: string[] = [];
  for (let i = 0; i < specs.length; i += 2) {
    const left = specs[i];
    const right = specs[i + 1];
    if (right) {
      rows.push(
        `<tr class="last:[&>td]:border-b-0"><td class="${KEY_CLS}">${escapeHtml(left.key)}</td><td class="${VAL_CLS}">${escapeHtml(left.value)}</td><td class="${KEY_CLS}">${escapeHtml(right.key)}</td><td class="${VAL_CLS}">${escapeHtml(right.value)}</td></tr>`
      );
    } else {
      rows.push(
        `<tr class="last:[&>td]:border-b-0"><td class="${KEY_CLS}">${escapeHtml(left.key)}</td><td class="${VAL_CLS}" colspan="3">${escapeHtml(left.value)}</td></tr>`
      );
    }
  }
  return rows.join("");
}

// ── Simetrik gruplu tablo (variant B) — tam-kenarlıklı, tint anahtar, AAA ──
const N_CELL =
  "px-4 py-3 border border-[var(--pd-spec-border,#e5e5e5)] align-top leading-snug";
const N_KEY = `pd-attrs-key ${N_CELL} font-medium text-[#374151] bg-[var(--pd-spec-header-bg,#f9fafb)]`;
const N_VAL = `pd-attrs-val ${N_CELL} font-semibold text-[var(--pd-spec-value-color,#111827)]`;
const N_CAT = `${N_CELL} bg-[var(--color-surface-raised,#f1f5f9)] text-[13px] font-bold text-[#1f2937]`;

function specTableRows(items: { key: string; value: string }[]): string {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const l = items[i];
    const r = items[i + 1];
    if (r) {
      rows.push(
        `<tr><td class="${N_KEY}">${escapeHtml(l.key)}</td><td class="${N_VAL}">${escapeHtml(l.value)}</td><td class="${N_KEY}">${escapeHtml(r.key)}</td><td class="${N_VAL}">${escapeHtml(r.value)}</td></tr>`
      );
    } else {
      rows.push(
        `<tr><td class="${N_KEY}">${escapeHtml(l.key)}</td><td class="${N_VAL}" colspan="3">${escapeHtml(l.value)}</td></tr>`
      );
    }
  }
  return rows.join("");
}

/** Öne çıkan band verisi: kısa değerli spec'lerden 1 feature + ≤4 stat seç. */
function pickHighlights(
  flat: { key: string; value: string }[]
): { feature: { key: string; value: string }; stats: { key: string; value: string }[] } | null {
  const short = flat.filter((s) => s.value && s.value.trim().length > 0 && s.value.length <= 26);
  if (short.length < 3) return null;
  const heroRe = /malzeme|material|öne ç|featured|model|ürün tipi/i;
  const feature = short.find((s) => heroRe.test(s.key)) ?? short[0];
  const stats = short.filter((s) => s !== feature).slice(0, 4);
  if (stats.length < 2) return null;
  return { feature, stats };
}

function highlightBand(hl: {
  feature: { key: string; value: string };
  stats: { key: string; value: string }[];
}): string {
  return `
    <div class="mb-6 grid grid-cols-1 xl:grid-cols-[1.1fr_2fr] rounded-lg overflow-hidden bg-gradient-to-br from-[#1c2027] to-[#14171c] text-white">
      <div class="p-6 flex flex-col justify-center">
        <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-500,#f5b800)] mb-2.5">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19.5 9l-4.8 3.1L16 18l-4-3.3L8 18l1.3-5.9L4.5 9l5.7-1.4z"/></svg>
          ${t("product.featured", { defaultValue: "Öne Çıkan" })}
        </span>
        <div class="text-xl font-extrabold leading-tight tracking-[-0.01em]">${escapeHtml(hl.feature.value)}</div>
        <div class="mt-1.5 text-[13px] text-[#c7ccd4]">${escapeHtml(hl.feature.key)}</div>
      </div>
      <div class="grid gap-px bg-white/10" style="grid-template-columns:repeat(${hl.stats.length},minmax(0,1fr))">
        ${hl.stats
          .map(
            (s) =>
              `<div class="bg-[#14171c] px-4 py-4"><div class="text-[15px] font-extrabold text-white leading-tight">${escapeHtml(s.value)}</div><div class="mt-1 text-[12px] text-[#aeb4bf]">${escapeHtml(s.key)}</div></div>`
          )
          .join("")}
      </div>
    </div>`;
}

export function AttributesTabContent(): string {
  const p = getCurrentProduct();

  const specGroups = p.specGroups;
  const flat =
    specGroups && specGroups.length > 0
      ? specGroups.flatMap((g) => g.items.map((it) => ({ key: it.label, value: it.value })))
      : p.specs;

  const hl = pickHighlights(flat);
  const bandHtml = hl ? highlightBand(hl) : "";

  const tableBody =
    specGroups && specGroups.length > 0
      ? specGroups
          .map(
            (g) =>
              `<tr><td class="${N_CAT}" colspan="4">${escapeHtml(g.label)}</td></tr>${specTableRows(
                g.items.map((it) => ({ key: it.label, value: it.value }))
              )}`
          )
          .join("")
      : specTableRows(p.specs);

  const keyAttrsTable = `
    <div class="rounded-md overflow-hidden">
      <table class="pd-attrs-table w-full table-fixed border-collapse text-sm">
        <colgroup><col class="w-[18%]" /><col class="w-[32%]" /><col class="w-[18%]" /><col class="w-[32%]" /></colgroup>
        <tbody>${tableBody}</tbody>
      </table>
    </div>`;

  // ── Boş bölümleri gizle: yalnızca verisi olan bölümler render edilir ──
  const hasSpecs = flat.length > 0;
  const hasPackaging = (p.packagingSpecs?.length ?? 0) > 0;
  const hasLeadTime = (p.leadTimeRanges?.length ?? 0) > 0;
  const ranks = p.categoryRanks ?? [];
  const hasRanks = ranks.length > 0;
  const hasAbove = hasSpecs || hasPackaging;

  const keyAttrsSection = hasSpecs
    ? `
      ${bandHtml}
      <h3 class="text-lg font-bold mb-4" style="color: var(--pd-title-color, #111827);">${t("product.keyAttributes")}</h3>
      ${keyAttrsTable}`
    : "";

  const packagingSection = hasPackaging
    ? `
      <h3 class="text-lg font-bold mb-4 ${hasSpecs ? "mt-8" : ""}" style="color: var(--pd-title-color, #111827);">${t("product.packagingDelivery")}</h3>
      <table class="pd-attrs-table">
        <tbody>${buildTableRows(p.packagingSpecs)}</tbody>
      </table>`
    : "";

  const leadTimeSection = hasLeadTime
    ? `
      <div class="${hasAbove ? "mt-8 border-t border-[var(--pd-spec-border,#e5e5e5)]" : ""}">
        <button type="button" class="pd-section-collapsible th-no-press flex items-center justify-between w-full py-4 border-0 bg-transparent text-lg font-bold cursor-pointer [&_svg]:transition-transform [&_svg]:duration-200 [&.open_svg]:rotate-180" id="pd-leadtime-toggle" style="color: var(--pd-title-color, #111827);">
          <span>${t("product.leadTime")}</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="pd-leadtime-content" class="hidden">
          <table class="pd-attrs-table w-full border-separate border-spacing-0 border border-[var(--pd-spec-border,#e5e5e5)] rounded-md overflow-hidden text-sm [&_th]:px-4 [&_th]:py-3 [&_th]:text-[13px] [&_th]:font-semibold [&_th]:text-[var(--pd-spec-key-color,#6b7280)] [&_th]:bg-[var(--pd-spec-header-bg,#f9fafb)] [&_th]:border-b [&_th]:border-[var(--pd-spec-border,#e5e5e5)] [&_th]:text-start">
            <thead>
              <tr>
                <th>${t("product.leadTimeQty")}</th>
                ${p.leadTimeRanges.map((r) => `<th>${escapeHtml(r.quantityRange)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="${KEY_CLS}">${t("product.leadTimeDays")}</td>
                ${p.leadTimeRanges.map((r) => `<td class="${VAL_CLS}">${escapeHtml(r.days)}</td>`).join("")}
              </tr>
            </tbody>
          </table>
        </div>
      </div>`
    : "";

  const salesRankSection = hasRanks ? ProductSalesRank(ranks) : "";

  const emptyState =
    hasSpecs || hasPackaging || hasLeadTime || hasRanks
      ? ""
      : `<div class="py-12 text-center text-sm text-[var(--color-text-tertiary,#737373)]">${t("product.noSpecs", { defaultValue: "Bu ürün için özellik bilgisi henüz eklenmemiş." })}</div>`;

  return `
    <div id="pd-tab-attributes">
      ${keyAttrsSection}
      ${packagingSection}
      ${leadTimeSection}
      ${salesRankSection}
      ${emptyState}
    </div>
  `;
}

export function initAttributesTab(): void {
  const toggle = document.getElementById("pd-leadtime-toggle");
  const content = document.getElementById("pd-leadtime-content");

  if (toggle && content) {
    toggle.addEventListener("click", () => {
      content.classList.toggle("hidden");
      toggle.classList.toggle("open");
    });
  }
}
