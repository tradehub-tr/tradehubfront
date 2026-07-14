/**
 * Satış Sonrası Değerlendirme ve Destek Landing Page — "Taşan Kartlar" (5D) düzeni:
 * koyu hero + hero'ya taşan 2 özellik kartı ve KPI kartı + destek CTA bandı.
 */
import { t } from "../../i18n";
import { TradeAssuranceFooterCards } from "../shared/TradeAssuranceFooterCards";
import { TradeAssuranceBadge } from "../shared/TradeAssuranceBadge";

/* ════════════════════════════════════════════════════
   ICONS (inline SVG)
   ════════════════════════════════════════════════════ */

const iconStar = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>`;

const iconMessage = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>`;

/* ════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════ */

function featureCard(icon: string, titleKey: string, descKey: string, linkHref: string, linkKey: string): string {
  return `
    <div class="bg-white border border-[#ECEAE6] rounded-md p-6 flex flex-col gap-3.5 shadow-[0_18px_44px_-24px_rgba(28,12,5,0.35)]">
      <div class="size-12 rounded-full bg-[#FFE285] flex items-center justify-center shrink-0">${icon}</div>
      <h3 class="text-lg font-bold text-gray-900">${t(titleKey)}</h3>
      <p class="text-sm text-gray-600 leading-relaxed flex-1">${t(descKey)}</p>
      <a href="${linkHref}" class="text-[13.5px] font-bold text-amber-700 [@media(hover:hover)]:hover:underline">${t(linkKey)} &rarr;</a>
    </div>
  `;
}

function kpiItem(valueKey: string, labelKey: string): string {
  return `
    <div class="py-2 border-t border-white/10 first:border-t-0 md:border-t-0 lg:border-t lg:first:border-t-0">
      <b class="block text-[#FFC200] text-[26px] font-extrabold tabular-nums tracking-tight">${t(valueKey)}</b>
      <span class="text-white/65 text-[11px] font-semibold tracking-wider uppercase">${t(labelKey)}</span>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   SECTION BUILDERS
   ════════════════════════════════════════════════════ */

function heroSection(): string {
  return `
    <section class="bg-[#1C0C05] bg-[radial-gradient(90%_130%_at_15%_-30%,rgba(255,194,0,0.32),transparent_55%)] pt-10 pb-28 sm:pt-12 sm:pb-32">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex text-sm text-white/55 mb-8" aria-label="Breadcrumb">
          <ol class="flex items-center gap-1.5">
            <li><a href="/ticaret-guvencesi/detay" class="transition-colors [@media(hover:hover)]:hover:text-[#FFC800]">${t("infoMisc.tradeAssurance")}</a></li>
            <li class="text-white/30">&gt;</li>
            <li class="text-white font-medium">${t("infoMisc.afterSalesSupport")}</li>
          </ol>
        </nav>
        ${TradeAssuranceBadge({ className: "mb-6" })}
        <h1 class="text-3xl sm:text-4xl xl:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
          ${t("infoMisc.afterSalesHeroTitle")}
        </h1>
        <p class="text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed">
          ${t("infoMisc.afterSalesHeroSubtitle")}
        </p>
      </div>
    </section>
  `;
}

function overlapSection(): string {
  return `
    <section class="pb-14 lg:pb-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Hero'ya taşan kart şeridi: 2 özellik kartı + KPI kartı -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr] gap-4 lg:gap-5 -mt-16 sm:-mt-20">
          ${featureCard(iconStar, "infoMisc.sellerRatingTitle", "infoMisc.sellerRatingDesc", "/pages/dashboard/orders.html", "infoMisc.asReviewLink")}
          ${featureCard(iconMessage, "infoMisc.directContactTitle", "infoMisc.directContactDesc", "/pages/dashboard/messages.html", "infoMisc.asMessageLink")}
          <div class="bg-[#1C0C05] border border-[#33190B] rounded-md p-6 shadow-[0_18px_44px_-24px_rgba(28,12,5,0.5)] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-2 md:col-span-2 lg:col-span-1">
            ${kpiItem("infoMisc.asKpiResolutionValue", "infoMisc.asKpiResolutionLabel")}
            ${kpiItem("infoMisc.asKpiResponseValue", "infoMisc.asKpiResponseLabel")}
            ${kpiItem("infoMisc.asKpiReviewsValue", "infoMisc.asKpiReviewsLabel")}
          </div>
        </div>

        <!-- Destek CTA bandı -->
        <div class="mt-10 lg:mt-12 bg-[#FFFBEB] border border-[#FDE68A] rounded-md p-6 lg:px-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="text-lg font-bold text-[#1C0C05] mb-1.5">${t("infoMisc.asCtaTitle")}</h3>
            <p class="text-[13.5px] text-gray-500">${t("infoMisc.asCtaDesc")}</p>
          </div>
          <a href="/pages/help/help-ticket-new.html" class="th-btn-dark shrink-0 self-start lg:self-auto">${t("infoMisc.asCtaBtn")}</a>
        </div>

      </div>
    </section>
  `;
}

/* ════════════════════════════════════════════════════
   EXPORTS
   ════════════════════════════════════════════════════ */

export function AfterSalesPage(): string {
  return `
    ${heroSection()}
    ${overlapSection()}
    ${TradeAssuranceFooterCards()}
  `;
}
