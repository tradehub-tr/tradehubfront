/**
 * AttributesTabContent Component
 * Renders the "Ozellikler" tab content with Key Attributes and Packaging tables.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import { ProductSalesRank } from "./ProductSalesRank";
// Product loaded lazily via getCurrentProduct() inside functions

// Referans düzenden ölçülen hücre değerleri (Alibaba "Öne çıkan özellikler"):
//   etiket → 14px/18px, weight 400, #222, p-4 (16px), zemin #f8f8f8
//   değer  → 14px/18px, weight 500, #222, p-4 (16px), zemin beyaz
//   hücre yüksekliği 50px = 18px satır + 2×16px padding — birebir tutuyor.
// Ayraç yalnızca yatay (referansta dikey çizgi yok).
const CELL_BASE =
  "p-4 text-[14px] leading-[18px] text-[#222] border-b border-[var(--pd-spec-border,#e5e5e5)] align-middle";
const KEY_CLS = `pd-attrs-key ${CELL_BASE} w-1/4 font-normal bg-[#f8f8f8]`;
const VAL_CLS = `pd-attrs-val ${CELL_BASE} w-1/4 font-medium`;

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

// ── Gruplu tablo — yukarıdaki referans ölçülerinin aynısı ──
const N_CELL = CELL_BASE;
const N_KEY = `pd-attrs-key ${N_CELL} font-normal bg-[#f8f8f8]`;
const N_VAL = `pd-attrs-val ${N_CELL} font-medium`;

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

export function AttributesTabContent(): string {
  const p = getCurrentProduct();

  const specGroups = p.specGroups;
  const flat =
    specGroups && specGroups.length > 0
      ? specGroups.flatMap((g) => g.items.map((it) => ({ key: it.label, value: it.value })))
      : p.specs;

  // Referans düzende grup başlığı satırı YOK — tüm özellikler tek düz tabloda
  // akar (2026-07-28). `flat` zaten specGroups'u düzleştirilmiş halde tutuyor;
  // gruplar sadece backend'in veri organizasyonu, görsel bir ayrım değil.
  const tableBody = specTableRows(flat);

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
      <h3 class="text-[20px] leading-[28px] font-bold text-[#222] mb-4">${t("product.keyAttributes")}</h3>
      ${keyAttrsTable}`
    : "";

  const packagingSection = hasPackaging
    ? `
      <h3 class="text-[20px] leading-[28px] font-bold text-[#222] mb-4 ${hasSpecs ? "mt-8" : ""}">${t("product.packagingDelivery")}</h3>
      <div class="rounded-md overflow-hidden">
        <table class="pd-attrs-table w-full table-fixed border-collapse">
          <tbody>${buildTableRows(p.packagingSpecs)}</tbody>
        </table>
      </div>`
    : "";

  const leadTimeSection = hasLeadTime
    ? `
      <div class="${hasAbove ? "mt-8 border-t border-[var(--pd-spec-border,#e5e5e5)]" : ""}">
        <button type="button" class="pd-section-collapsible th-no-press open flex items-center justify-between w-full py-4 border-0 bg-transparent text-[20px] leading-[28px] font-bold text-[#222] cursor-pointer [&_svg]:transition-transform [&_svg]:duration-200 [&.open_svg]:rotate-180" id="pd-leadtime-toggle">
          <span>${t("product.leadTime")}</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <!-- Diğer tablolarla aynı hücre dili (KEY/VAL) — eski tasarımın gri
             başlık satırı + dış çerçevesi bölümü sayfanın geri kalanından
             koparıyordu. Varsayılan AÇIK; chevron ile katlanabilir. -->
        <div id="pd-leadtime-content">
          <div class="rounded-md overflow-hidden">
            <table class="pd-attrs-table w-full table-fixed border-collapse text-sm">
              <tbody>
                <tr>
                  <td class="${KEY_CLS}">${t("product.leadTimeQty")}</td>
                  ${p.leadTimeRanges.map((r) => `<td class="${VAL_CLS}">${escapeHtml(r.quantityRange)}</td>`).join("")}
                </tr>
                <tr class="[&>td]:border-b-0">
                  <td class="${KEY_CLS}">${t("product.leadTimeDays")}</td>
                  ${p.leadTimeRanges.map((r) => `<td class="${VAL_CLS}">${escapeHtml(r.days)}</td>`).join("")}
                </tr>
              </tbody>
            </table>
          </div>
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
