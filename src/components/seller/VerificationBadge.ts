/**
 * VerificationBadge — Satıcı saha doğrulama rozeti
 *
 * İki variant:
 *   - VerificationBadge(verifications[]) — statik render (SupplierCard, loadProduct sonrası)
 *   - VerificationBadgeTemplate(scopeExpr) — Alpine template / x-for içi (ManufacturerList, StoreHeader)
 *
 * Spec: docs/superpowers/specs/2026-06-30-seller-verification-design.md §4
 */

import { t } from "../../i18n";
import { sanitizeUrl } from "../../utils/sanitize";
import verifiedminilogoUrl from "../../assets/images/verifiedminilogo.png";
import istocLogoUrl from "../../assets/images/istoc-logo.png";

export interface VerificationItem {
  source_name: string;
  icon?: string;
  description?: string;
  document_url?: string;
}

/** window.__verifiedByText ve __downloadReportText'i kurar.
 *  startAlpine()'dan ÖNCE çağrılmalı. */
export function initVerificationHelpers(): void {
  window.__verifiedByText = (name: string): string =>
    t("verification.verifiedBySupplier").replace("{{name}}", name);
  window.__downloadReportText = t("verification.downloadReport");
}

// ── Yardımcı parçalar ─────────────────────────────────────────────────────

function infoIconSvg(): string {
  return `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.3"/>
    <path d="M8 7v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="8" cy="5.2" r="0.8" fill="currentColor"/>
  </svg>`;
}

function infoButton(ariaLabel: string): string {
  return `<button
      type="button"
      class="th-no-press inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer appearance-none border-none bg-transparent p-0 ms-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
      @mouseenter="vOpen=true"
      @mouseleave="vOpen=false"
      @click.stop="vOpen=!vOpen"
      :aria-expanded="vOpen"
      aria-label="${ariaLabel}"
    >${infoIconSvg()}</button>`;
}

/** Tooltip iç satırları. itemsExpr: Alpine expression ile rows verisine erişim. */
function tooltipRows(itemsExpr: string): string {
  const downloadFallback = t("verification.downloadReport");
  return `
    <template x-for="v in (${itemsExpr})" :key="v.source_name">
      <div class="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0">
        <template x-if="v.source_name === 'İstoç' || v.icon">
          <img :src="v.source_name === 'İstoç' ? '${istocLogoUrl}' : v.icon" :alt="v.source_name" class="w-5 h-5 object-contain rounded-md shrink-0 mt-0.5" />
        </template>
        <div class="min-w-0">
          <p class="text-[12px] font-semibold text-gray-800 leading-snug"
             x-text="window.__verifiedByText ? window.__verifiedByText(v.source_name) : v.source_name"></p>
          <template x-if="v.description">
            <p class="text-[11px] text-gray-500 mt-0.5 leading-snug" x-text="v.description"></p>
          </template>
          <template x-if="v.document_url">
            <a :href="v.document_url"
               target="_blank"
               rel="noopener noreferrer"
               class="th-no-press text-[11px] text-primary-600 hover:underline mt-1 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
               x-text="window.__downloadReportText || '${downloadFallback}'"></a>
          </template>
        </div>
      </div>
    </template>`;
}

function tooltipPanel(itemsExpr: string): string {
  return `<div
      x-show="vOpen"
      style="display:none;"
      x-transition:enter="transition-opacity duration-150 motion-reduce:transition-none"
      x-transition:enter-start="opacity-0"
      x-transition:enter-end="opacity-100"
      x-transition:leave="transition-opacity duration-100 motion-reduce:transition-none"
      x-transition:leave-start="opacity-100"
      x-transition:leave-end="opacity-0"
      @click.outside="vOpen=false"
      class="absolute start-0 top-full mt-1.5 z-50 min-w-[220px] max-w-[280px] bg-white rounded-md shadow-lg border border-gray-100 p-3 text-left"
      role="tooltip">
      ${tooltipRows(itemsExpr)}
    </div>`;
}

// ── Statik versiyon ───────────────────────────────────────────────────────

/**
 * Statik render context için rozet (SupplierCard vb.).
 * Verifications array'i JSON olarak x-data'ya gömülür; tooltip Alpine ile çalışır.
 * Boş array → "" döner.
 */
export function VerificationBadge(verifications: VerificationItem[]): string {
  if (!verifications.length) return "";

  const first = verifications[0];
  const extra = verifications.length - 1;
  const badgeInfoLabel = t("verification.badgeInfo");
  const labelSuffix = extra > 0 ? ` +${extra}` : "";
  // KYB→İstoç sanal kaynağında backend icon boş; "İstoç" metni yerine mini logo göster.
  const firstLogo = first.source_name === "İstoç" ? istocLogoUrl : sanitizeUrl(first.icon ?? "");

  // Sanitize before serializing; x-text handles display (no innerHTML risk)
  const safeItems: Array<{
    source_name: string;
    icon: string;
    description: string;
    document_url: string;
  }> = verifications.map((v) => ({
    source_name: v.source_name,
    icon: sanitizeUrl(v.icon ?? ""),
    description: v.description ?? "",
    document_url: sanitizeUrl(v.document_url ?? ""),
  }));
  const serialized = JSON.stringify(safeItems).replace(/'/g, "&#39;");

  return `
    <div class="relative inline-flex items-center gap-1 text-[12px] text-gray-700"
         x-data='{ vOpen: false, vItems: ${serialized} }'>
      <img src="${verifiedminilogoUrl}"
           alt=""
           class="h-3 w-auto shrink-0"
           aria-hidden="true" />
      ${firstLogo ? `<img src="${firstLogo}" alt="${first.source_name}" class="h-3 w-auto shrink-0 object-contain" />` : ""}
      <span class="font-semibold whitespace-nowrap">${firstLogo ? "" : first.source_name}${labelSuffix}</span>
      ${infoButton(badgeInfoLabel)}
      ${tooltipPanel("vItems")}
    </div>`;
}

// ── Alpine scope versiyonu ────────────────────────────────────────────────

/**
 * Alpine template (runtime) context için rozet.
 * scopeExpr: Alpine expression olarak verifications array'ine erişim yolu.
 *
 * Örnekler:
 *   ManufacturerList x-for içi : VerificationBadgeTemplate("seller.verifications || []")
 *   StoreHeader sellerStorefront: VerificationBadgeTemplate("seller?.verifications || []")
 */
export function VerificationBadgeTemplate(scopeExpr: string): string {
  const badgeInfoLabel = t("verification.badgeInfo");

  return `
    <template x-if="(${scopeExpr}).length > 0">
      <div class="relative inline-flex items-center gap-1 text-[12px] text-gray-700"
           x-data="{ vOpen: false }">
        <img src="${verifiedminilogoUrl}"
             alt=""
             class="h-3 w-auto shrink-0"
             aria-hidden="true" />
        <template x-if="(${scopeExpr})[0]?.source_name === 'İstoç' || (${scopeExpr})[0]?.icon">
          <img :src="(${scopeExpr})[0]?.source_name === 'İstoç' ? '${istocLogoUrl}' : (${scopeExpr})[0]?.icon"
               :alt="(${scopeExpr})[0]?.source_name"
               class="h-3 w-auto shrink-0 object-contain" />
        </template>
        <span class="font-semibold whitespace-nowrap"
              x-text="(((${scopeExpr})[0]?.source_name === 'İstoç' || (${scopeExpr})[0]?.icon) ? '' : (${scopeExpr})[0]?.source_name) + ((${scopeExpr}).length > 1 ? ' +' + ((${scopeExpr}).length - 1) : '')"></span>
        ${infoButton(badgeInfoLabel)}
        ${tooltipPanel(scopeExpr)}
      </div>
    </template>`;
}
