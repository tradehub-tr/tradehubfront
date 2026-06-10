/**
 * Kargo ve Lojistik Hizmetleri Landing Page
 */
import kargoImg from "../../assets/images/kargo.avif";
import logisticsPattern from "../../assets/images/svgviewer-output.svg";
import { TradeAssuranceFooterCards } from "../shared/TradeAssuranceFooterCards";
import { TradeAssuranceBadge } from "../shared/TradeAssuranceBadge";
import { t } from "../../i18n";

/* ════════════════════════════════════════════════════
   ICONS (inline SVG)
   ════════════════════════════════════════════════════ */

const iconExpress = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>`;

const iconAir = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5"/></svg>`;

const iconSea = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M3 12c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M3 7.5c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/></svg>`;

const iconLand = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`;

const iconBox = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>`;

const iconTracking = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>`;

const iconFreeShipping = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>`;

/* ════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════ */

function yellowIcon(svgContent: string): string {
  return `<div class="w-[48px] h-[48px] rounded-full bg-[#FFE285] flex items-center justify-center shrink-0">${svgContent}</div>`;
}

function shippingTypeCard(icon: string, title: string, description: string): string {
  return `
    <div class="border border-gray-200 rounded-md p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      ${yellowIcon(icon)}
      <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
      <p class="text-sm text-gray-600 leading-relaxed">${description}</p>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   SECTION BUILDERS
   ════════════════════════════════════════════════════ */

function heroSection(): string {
  return `
    <section class="relative w-full min-h-[400px] flex items-center" style="background-image: url('${kargoImg}'); background-size: cover; background-position: center;">
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 container-boxed w-full py-16 sm:py-20">
        ${TradeAssuranceBadge({ className: "mb-6" })}
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
          ${t("infoPages.shippingHeroTitle")}
        </h1>
        <p class="text-base sm:text-lg text-white/90 max-w-2xl leading-relaxed">
          ${t("infoPages.shippingHeroSubtitle")}
        </p>
      </div>
    </section>
  `;
}

function breadcrumbSection(): string {
  return `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <nav class="flex text-sm text-gray-500" aria-label="Breadcrumb">
        <ol class="flex items-center gap-1.5">
          <li><a href="/ticaret-guvencesi/detay" class="hover:text-[#FFC800] transition-colors">${t("infoPages.tradeAssurance")}</a></li>
          <li class="text-gray-400">&gt;</li>
          <li class="text-gray-900 font-medium">${t("infoPages.shippingHeroTitle")}</li>
        </ol>
      </nav>
    </div>
  `;
}

function shippingTypesSection(): string {
  return `
    <section class="bg-white py-12 sm:py-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">${t("infoPages.shippingTypesTitle")}</h2>
        <p class="text-gray-600 leading-relaxed max-w-3xl mb-10">
          ${t("infoPages.shippingTypesIntro")}
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${shippingTypeCard(
            iconExpress,
            t("infoPages.shippingExpressTitle"),
            t("infoPages.shippingExpressDesc")
          )}
          ${shippingTypeCard(
            iconAir,
            t("infoPages.shippingAirTitle"),
            t("infoPages.shippingAirDesc")
          )}
          ${shippingTypeCard(
            iconSea,
            t("infoPages.shippingSeaTitle"),
            t("infoPages.shippingSeaDesc")
          )}
          ${shippingTypeCard(
            iconLand,
            t("infoPages.shippingLandTitle"),
            t("infoPages.shippingLandDesc")
          )}
          ${shippingTypeCard(
            iconBox,
            t("infoPages.shippingStandardTitle"),
            t("infoPages.shippingStandardDesc")
          )}
          ${shippingTypeCard(
            iconFreeShipping,
            t("infoPages.shippingFreeTitle"),
            t("infoPages.shippingFreeDesc")
          )}
        </div>
      </div>
    </section>
  `;
}

function trackingSection(): string {
  return `
    <section class="py-12 sm:py-16" style="background: #F4F4F4 url('${logisticsPattern}') center/cover no-repeat">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-start gap-10">
          <div class="flex-1">
            <div class="inline-flex items-center gap-2 mb-4">
              ${yellowIcon(iconTracking)}
            </div>
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">${t("infoPages.trackingTitle")}</h2>
            <p class="text-gray-600 leading-relaxed max-w-2xl mb-4">
              ${t("infoPages.trackingPara1Before")}<strong>${t("infoPages.trackingNumber")}</strong>${t("infoPages.trackingPara1Mid")}<strong>${t("infoPages.trackingCarrierInfo")}</strong>${t("infoPages.trackingPara1After")}
            </p>
            <p class="text-gray-600 leading-relaxed max-w-2xl mb-6">
              ${t("infoPages.trackingPara2")}
            </p>
            <div class="bg-white border border-gray-200 rounded-md p-4 inline-flex items-center gap-3">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <span class="text-sm text-gray-700">${t("infoPages.trackingAutoNote")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function timelineSection(): string {
  const steps = [
    {
      num: "01",
      title: t("infoPages.timelineStep1Title"),
      description: t("infoPages.timelineStep1Desc"),
    },
    {
      num: "02",
      title: t("infoPages.timelineStep2Title"),
      description: t("infoPages.timelineStep2Desc"),
    },
    {
      num: "03",
      title: t("infoPages.timelineStep3Title"),
      description: t("infoPages.timelineStep3Desc"),
    },
    {
      num: "04",
      title: t("infoPages.timelineStep4Title"),
      description: t("infoPages.timelineStep4Desc"),
    },
  ];

  return `
    <section class="bg-white py-12 sm:py-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">${t("infoPages.orderProcessTitle")}</h2>
        <p class="text-gray-600 leading-relaxed max-w-3xl mb-10">
          ${t("infoPages.orderProcessIntro")}
        </p>
        <div class="relative ps-8 sm:ps-12">
          <div class="absolute start-[19px] sm:start-[23px] top-6 bottom-6 w-[2px] bg-gray-200"></div>

          ${steps
            .map(
              (step, i) => `
            <div class="relative mb-10 ${i === steps.length - 1 ? "mb-0" : ""}">
              <div class="absolute -start-8 sm:-start-12 top-0 w-[38px] h-[38px] sm:w-[46px] sm:h-[46px] rounded-full border-2 border-[#FFC800] bg-white flex items-center justify-center z-10">
                <span class="text-sm sm:text-base font-bold text-gray-900">${step.num}</span>
              </div>
              <div class="pt-1 sm:pt-2">
                <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-1">${step.title}</h3>
                ${step.description ? `<p class="text-sm text-gray-600 leading-relaxed max-w-2xl">${step.description}</p>` : ""}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

/* ════════════════════════════════════════════════════
   EXPORTS
   ════════════════════════════════════════════════════ */

export function ShippingLogisticsPage(): string {
  return `
    ${heroSection()}
    ${breadcrumbSection()}
    ${shippingTypesSection()}
    ${trackingSection()}
    ${timelineSection()}
    ${TradeAssuranceFooterCards()}
  `;
}

export function initShippingLogisticsPage(): void {
  // future interactivity hooks
}
