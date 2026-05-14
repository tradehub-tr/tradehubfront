/**
 * AttributesTabContent Component
 * Renders the "Ozellikler" tab content with Key Attributes and Packaging tables.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
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
        `<tr class="last:[&>td]:border-b-0"><td class="${KEY_CLS}">${left.key}</td><td class="${VAL_CLS}">${left.value}</td><td class="${KEY_CLS}">${right.key}</td><td class="${VAL_CLS}">${right.value}</td></tr>`
      );
    } else {
      rows.push(
        `<tr class="last:[&>td]:border-b-0"><td class="${KEY_CLS}">${left.key}</td><td class="${VAL_CLS}" colspan="3">${left.value}</td></tr>`
      );
    }
  }
  return rows.join("");
}

export function AttributesTabContent(): string {
  const p = getCurrentProduct();

  // Build grouped specs HTML when backend provided specGroups,
  // otherwise fall back to flat specs table.
  const specGroups = (p as any).specGroups as
    | Array<{ code: string; label: string; items: { label: string; value: string }[] }>
    | undefined;
  const groupedHtml =
    specGroups && specGroups.length > 0
      ? specGroups
          .map(
            (g) => `
        <div class="mb-6">
          <h4 class="text-sm font-semibold uppercase tracking-wider mb-2" style="color: var(--pd-spec-key-color, #6b7280);">${g.label}</h4>
          <table class="pd-attrs-table w-full border-separate border-spacing-0 border border-[var(--pd-spec-border,#e5e5e5)] rounded-md overflow-hidden text-sm [&_th]:px-4 [&_th]:py-3 [&_th]:text-[13px] [&_th]:font-semibold [&_th]:text-[var(--pd-spec-key-color,#6b7280)] [&_th]:bg-[var(--pd-spec-header-bg,#f9fafb)] [&_th]:border-b [&_th]:border-[var(--pd-spec-border,#e5e5e5)] [&_th]:text-left">
            <tbody>
              ${buildTableRows(g.items.map((it) => ({ key: it.label, value: it.value })))}
            </tbody>
          </table>
        </div>`
          )
          .join("")
      : `<table class="pd-attrs-table">
         <tbody>
           ${buildTableRows(p.specs)}
         </tbody>
       </table>`;

  return `
    <div id="pd-tab-attributes">
      <h3 class="text-lg font-bold mb-4" style="color: var(--pd-title-color, #111827);">${t("product.keyAttributes")}</h3>
      ${groupedHtml}

      <h3 class="text-lg font-bold mb-4 mt-8" style="color: var(--pd-title-color, #111827);">${t("product.packagingDelivery")}</h3>
      <table class="pd-attrs-table">
        <tbody>
          ${buildTableRows(p.packagingSpecs)}
        </tbody>
      </table>

      <!-- Lead Time — collapsible -->
      <div class="mt-8" style="border-top: 1px solid var(--pd-spec-border, #e5e5e5);">
        <button type="button" class="pd-section-collapsible th-no-press flex items-center justify-between w-full py-4 border-0 bg-transparent text-lg font-bold cursor-pointer [&_svg]:transition-transform [&_svg]:duration-200 [&.open_svg]:rotate-180" id="pd-leadtime-toggle" style="color: var(--pd-title-color, #111827);">
          <span>${t("product.leadTime")}</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="pd-leadtime-content" class="hidden">
          <table class="pd-attrs-table w-full border-separate border-spacing-0 border border-[var(--pd-spec-border,#e5e5e5)] rounded-md overflow-hidden text-sm [&_th]:px-4 [&_th]:py-3 [&_th]:text-[13px] [&_th]:font-semibold [&_th]:text-[var(--pd-spec-key-color,#6b7280)] [&_th]:bg-[var(--pd-spec-header-bg,#f9fafb)] [&_th]:border-b [&_th]:border-[var(--pd-spec-border,#e5e5e5)] [&_th]:text-left">
            <thead>
              <tr>
                <th>${t("product.leadTimeQty")}</th>
                ${p.leadTimeRanges.map((r) => `<th>${r.quantityRange}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="${KEY_CLS}">${t("product.leadTimeDays")}</td>
                ${p.leadTimeRanges.map((r) => `<td class="${VAL_CLS}">${r.days}</td>`).join("")}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
