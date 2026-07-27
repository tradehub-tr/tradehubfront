/**
 * ProductSellerPanel — ürün detay SOL sütununda, galerinin altında duran
 * dikey satıcı kartı. Kimlik + güven metrikleri + ana pazarlar + aksiyonlar.
 *
 * Metrik hücreleri veri yoksa HİÇ basılmaz (boş kutu / "—" gösterilmez);
 * ızgara kalan hücrelerle doldurulur.
 *
 * Mağaza puanı (supplier.rating) ÜRÜN puanından ayrıdır — ürün puanı orta
 * sütunda, başlığın altında durur.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { getSellerUrl } from "../../utils/sellerUrl";
import { getCountryCode } from "../../utils/country";
import { getFlagSvg } from "../../utils/flags";
import { VerificationBadge } from "../seller/VerificationBadge";
import { chatTriggerAttrs } from "../chat-popup/chatTriggerAttrs";

interface SellerMetric {
  key: string;
  value: string;
  label: string;
}

function metricCell(m: SellerMetric): string {
  return `
    <div data-seller-metric="${m.key}" class="min-w-0">
      <div class="text-[15px] font-bold leading-tight text-[var(--pd-title-color,#111827)] truncate">${m.value}</div>
      <div class="mt-0.5 text-[11px] leading-tight text-[var(--color-text-tertiary,#737373)]">${m.label}</div>
    </div>
  `;
}

export function ProductSellerPanel(): string {
  const p = getCurrentProduct();
  const s = p.supplier;

  const sellerUrl = escapeHtml(sanitizeUrl(getSellerUrl({ id: s.id })));
  const sellerInitial = escapeHtml((s.name || "?").trim().charAt(0).toUpperCase() || "?");

  const metrics: SellerMetric[] = [];
  // Hem `rating > 0` hem `reorderRate` (backend falsy 0'ı None'a çeviriyor —
  // api/listing.py) kasıtlı olarak "falsy olanı gizle" davranışındadır: %0 /
  // 0.0 puan pratikte "veri yok" demek, güven metriğini sıfırla reklamlamayız.
  if (typeof s.rating === "number" && s.rating > 0) {
    const count = s.reviewCount ? ` (${s.reviewCount})` : "";
    metrics.push({
      key: "storeRating",
      value: `${s.rating.toFixed(1)}/5${count}`,
      label: t("product.storeRating", { defaultValue: "Mağaza puanı" }),
    });
  }
  if (s.responseTime) {
    metrics.push({
      key: "responseTime",
      value: escapeHtml(s.responseTime),
      label: t("product.responseTime"),
    });
  }
  if (s.onTimeDelivery) {
    metrics.push({
      key: "onTimeDelivery",
      value: escapeHtml(s.onTimeDelivery),
      label: t("product.onTimeDelivery"),
    });
  }
  if (typeof s.reorderRate === "number") {
    metrics.push({
      key: "reorderRate",
      value: `${s.reorderRate}%`,
      label: t("product.reorderRate", { defaultValue: "Tekrar sipariş" }),
    });
  }

  const metricsHtml = metrics.length
    ? `<div class="grid grid-cols-4 gap-3 border-t border-[var(--color-border-default,#e5e5e5)] pt-3">
         ${metrics.map(metricCell).join("")}
       </div>`
    : "";

  const markets = (s.mainMarkets || []).filter(Boolean);
  const marketsHtml = markets.length
    ? `<div data-seller-markets class="flex items-start gap-1.5 border-t border-[var(--color-border-default,#e5e5e5)] pt-3 text-xs text-[var(--color-text-secondary,#525252)]">
         <svg class="mt-px h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary,#737373)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/></svg>
         <span class="line-clamp-2"><span class="text-[var(--color-text-tertiary,#737373)]">${t("product.mainMarkets", { defaultValue: "Ana pazarlar" })}:</span> <strong class="font-semibold text-[var(--pd-title-color,#111827)]">${escapeHtml(markets.join(", "))}</strong></span>
       </div>`
    : "";

  return `
    <section id="pd-seller-panel" class="mt-4 flex flex-col gap-3 rounded-md border border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)] p-4">
      <!-- Kimlik -->
      <div class="flex items-start gap-3 min-w-0">
        <span class="shrink-0 w-11 h-11 rounded-md bg-gradient-to-br from-[#3b3b3b] to-[#111111] text-white text-base font-extrabold inline-flex items-center justify-center" aria-hidden="true">${sellerInitial}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <a href="${sellerUrl}" class="truncate text-sm font-bold underline underline-offset-2 text-[var(--pd-title-color,#111827)]">${escapeHtml(s.name)}</a>
            ${VerificationBadge(s.verifications ?? [])}
          </div>
          <span class="mt-0.5 flex items-center gap-1.5 flex-wrap text-xs text-[var(--color-text-tertiary,#737373)]">
            ${s.country ? `<span class="inline-flex items-center gap-1.5">${getFlagSvg(getCountryCode(s.country))}${escapeHtml(getCountryCode(s.country))}</span>` : ""}
            ${s.yearsInBusiness > 0 ? `<span class="text-gray-300">·</span><span>${t("product.yearsLabel", { count: String(s.yearsInBusiness) })}</span>` : ""}
          </span>
        </div>
      </div>

      ${metricsHtml}
      ${marketsHtml}

      <!-- Aksiyonlar -->
      <div class="grid grid-cols-2 gap-2 border-t border-[var(--color-border-default,#e5e5e5)] pt-3">
        <a href="${sellerUrl}" class="th-btn-outline th-btn-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          <svg class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9l1-5h14l1 5M4 9v10h16V9M4 9a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0M9 19v-5h6v5"/></svg>
          ${t("product.visitStore", { defaultValue: "Mağazayı Ziyaret Et" })}
        </a>
        <button type="button" ${chatTriggerAttrs(p)} class="th-btn-outline th-btn-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer">
          <svg class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5z"/></svg>
          ${t("chat.chatWithSeller")}
        </button>
      </div>
    </section>
  `;
}
