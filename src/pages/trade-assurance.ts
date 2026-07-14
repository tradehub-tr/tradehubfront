/**
 * Trade Assurance — Ana Landing Page
 * Varyant 1 "Marka Klasiği" (onaylanan mock) — koyu hero, sarı bant ritmi
 */
import '../style.css'
import { t } from '../i18n'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { TradeAssuranceFooterCards } from '../components/shared/TradeAssuranceFooterCards'

import limanImg from '../assets/images/liman.avif'
import escrowVideo from '../assets/video/güvenliödeme video.mp4'
import kargoVideo from '../assets/video/kargo.mp4'
import serviceVideo from '../assets/video/service.mp4'

/* ═══════════════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════════════ */

const heroBadgeIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z"/></svg>`

const shieldCheckIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`

const dollarIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`

const truckIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`

const wrenchIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437"/></svg>`

/* Kargo/lojistik süreç şeridi ikonları (24px, sade çizgi) */
const processIconProduction = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v18M3 8h18"/></svg>`
const processIconShipping = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="15" height="12" rx="1"/><path d="M16 10h4l3 3v5h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`
const processIconCustoms = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>`
const processIconDelivery = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l4-8h10l4 8"/><path d="M3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/><path d="M3 12h18"/></svg>`

/* ═══════════════════════════════════════════════════════════════
   SECTION: HERO BANNER (koyu degrade + sarı rozet)
   ═══════════════════════════════════════════════════════════════ */

function HeroBanner(): string {
  return `
    <section class="relative overflow-hidden" style="background:radial-gradient(60% 60% at 20% 15%, rgba(255,194,0,.16) 0%, rgba(255,194,0,0) 65%), linear-gradient(160deg, #0a0a0a 0%, #1f1f1f 100%)">
      <div class="relative z-10 container-boxed px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div class="max-w-[720px]">
          <span class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold mb-5" style="background:rgba(255,194,0,.14);border:1px solid rgba(255,194,0,.35);color:#FFC200">
            ${heroBadgeIcon}
            ${t("tradeAssurance.tradeAssuranceLabel")}
          </span>
          <h1 class="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white leading-tight mb-5">
            ${t("tradeAssurance.heroTitle")}
          </h1>
          <p class="text-base sm:text-lg text-gray-300 max-w-[560px] mb-8">
            ${t("tradeAssurance.heroSubtitle")}
          </p>
          <div class="flex flex-wrap gap-3.5">
            <a href="#how-it-works" class="th-btn inline-flex items-center gap-2 font-semibold px-7 py-3.5 text-base">
              ${t("tradeAssurance.heroCtaPrimary")}
            </a>
            <a href="#coverage" class="th-no-press appearance-none focus:outline-none inline-flex items-center gap-2 font-semibold px-7 py-3.5 text-base rounded-[var(--radius-button,8px)] border border-white/40 text-white hover:bg-white/10 transition-colors duration-150">
              ${t("tradeAssurance.heroCtaSecondary")}
            </a>
          </div>
        </div>
      </div>
      <!-- Yellow bottom bar -->
      <div class="absolute bottom-0 start-0 end-0 h-2 bg-[#FFC200]"></div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: STATS BAND (tam genişlik sarı, 4 istatistik)
   ═══════════════════════════════════════════════════════════════ */

function stat(value: string, key: string): string {
  return `
    <div class="border-s-4 border-red-600 ps-5">
      <div class="text-3xl sm:text-4xl xl:text-5xl font-bold text-gray-900">${value}</div>
      <div class="text-gray-800 text-sm font-medium mt-1.5">${t(key)}</div>
    </div>
  `
}

function StatsBandSection(): string {
  return `
    <section class="bg-[#FFC200]">
      <div class="container-boxed px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-8 sm:gap-x-10">
          ${stat('160M+', 'tradeAssurance.statOrders')}
          ${stat('37M+', 'tradeAssurance.statBought')}
          ${stat('200B+', 'tradeAssurance.statSuppliers')}
          ${stat('280M+', 'tradeAssurance.statProducts')}
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: HOW IT WORKS (4 adım) + KAPSAM BANDI
   ═══════════════════════════════════════════════════════════════ */

function HowItWorks(): string {
  return `
    <!-- White part: title + steps -->
    <section id="how-it-works" class="bg-white pt-16 sm:pt-20 lg:pt-24 pb-8">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-4">
          ${t("tradeAssurance.howProtectTitle")}
        </h2>
        <p class="text-gray-600 text-base sm:text-lg text-center max-w-[800px] mx-auto mb-14">
          ${t("tradeAssurance.howProtectIntro")}
        </p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mb-12">
          ${stepCard('01', t("tradeAssurance.step1Title"), t("tradeAssurance.step1Desc"))}
          ${stepCard('02', t("tradeAssurance.step2Title"), t("tradeAssurance.step2Desc"))}
          ${stepCard('03', t("tradeAssurance.step3Title"), t("tradeAssurance.step3Desc"))}
          ${stepCard('04', t("tradeAssurance.step4Title"), t("tradeAssurance.step4Desc"))}
        </div>
        <!-- Escrow Video -->
        <div class="max-w-[1000px] mx-auto rounded-md overflow-hidden">
          <video class="w-full object-cover auto-play-video aspect-[1200/362]" muted loop playsinline preload="metadata">
            <source src="${escrowVideo}" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>

    <!-- Yellow part: Kapsamdakiler -->
    <section id="coverage" class="py-14 sm:py-16 bg-[#FFC200]">
      <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">${t("tradeAssurance.whatsCovered")}</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          ${coverageCard(shieldCheckIcon, t("tradeAssurance.coveragePayments"), '#section-payments')}
          ${coverageCard(dollarIcon, t("tradeAssurance.coverageRefund"), '#section-refund')}
          ${coverageCard(truckIcon, t("tradeAssurance.coverageShipping"), '#section-shipping')}
          ${coverageCard(wrenchIcon, t("tradeAssurance.coverageAfterSales"), '#section-after-sales')}
        </div>
      </div>
    </section>
  `
}

function stepCard(num: string, title: string, desc: string): string {
  return `
    <div class="flex gap-5">
      <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-base font-bold bg-[#FFF3C4] text-[#92400e]">
        ${num}
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">${title}</h3>
        <p class="text-gray-600 text-sm leading-relaxed">${desc}</p>
      </div>
    </div>
  `
}

function coverageCard(icon: string, title: string, href: string): string {
  return `
    <a href="${href}" class="bg-white rounded-md [@media(hover:hover)and(pointer:fine)]:hover:shadow-md transition-shadow duration-200 ease-out motion-reduce:transition-none group block" style="padding:26px 26px 38px">
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-6 bg-[#FFF3C4] text-[#92400e]">
        ${icon}
      </div>
      <h3 class="text-sm sm:text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors motion-reduce:transition-none leading-snug">${title}</h3>
    </a>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: GÜVENLI ÖDEME (metin + temiz ödeme kartı)
   ═══════════════════════════════════════════════════════════════ */

function paymentBadge(label: string): string {
  return `<span class="flex items-center justify-center h-11 rounded-md border border-gray-200 text-xs font-bold text-gray-900">${label}</span>`
}

function currencyPill(label: string): string {
  return `<span class="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-600">${label}</span>`
}

function SecurePaymentsSection(): string {
  return `
    <section id="section-payments" class="bg-white py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <!-- Left: Text -->
          <div class="lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              ${t("tradeAssurance.paymentsTitle")}
            </h2>
            <p class="text-gray-600 text-base leading-relaxed mb-4">
              ${t("tradeAssurance.paymentsDesc1")}
            </p>
            <p class="text-gray-600 text-base leading-relaxed mb-8">
              ${t("tradeAssurance.paymentsDesc2")}
            </p>
            <div class="flex flex-wrap gap-3 mb-4">
              <a href="/pages/info/payments" class="th-btn inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                ${t("tradeAssurance.sourceProducts")}
              </a>
              <a href="/pages/info/payments" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                ${t("tradeAssurance.learnHow")}
              </a>
            </div>
            <p class="text-xs text-gray-400 mt-2">${t("tradeAssurance.eligibleBuyersNote")}</p>
          </div>
          <!-- Right: Clean payment card -->
          <div class="lg:w-1/2 w-full">
            <div class="bg-white border border-gray-200 rounded-md p-6 sm:p-8 shadow-sm">
              <h3 class="text-base font-bold text-gray-900 mb-5">${t("tradeAssurance.paymentsMethodsTitle")}</h3>
              <div class="grid grid-cols-3 gap-3 mb-7">
                ${paymentBadge('VISA')}
                ${paymentBadge('Mastercard')}
                ${paymentBadge('AMEX')}
                ${paymentBadge('PayPal')}
                ${paymentBadge('TROY')}
                ${paymentBadge('Havale/EFT')}
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-4">${t("tradeAssurance.paymentsCurrenciesTitle")}</h3>
              <div class="flex flex-wrap gap-2">
                ${currencyPill('TRY ₺')}
                ${currencyPill('USD $')}
                ${currencyPill('EUR €')}
                ${currencyPill('GBP £')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: PARA İADE POLİTİKASI
   ═══════════════════════════════════════════════════════════════ */

function RefundPolicySection(): string {
  return `
    <section id="section-refund" class="py-16 sm:py-20 lg:py-24 bg-[#f7f7f7]">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <!-- Left: Video (autoplay on scroll) -->
          <div class="lg:w-1/2 order-2 lg:order-1">
            <div class="rounded-md overflow-hidden shadow-xl">
              <video class="w-full object-cover auto-play-video aspect-[528/564]" muted loop playsinline preload="metadata">
                <source src="${kargoVideo}" type="video/mp4" />
              </video>
            </div>
          </div>
          <!-- Right: Text -->
          <div class="lg:w-1/2 order-1 lg:order-2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              ${t("tradeAssurance.refundTitle")}
            </h2>
            <p class="text-gray-600 text-base leading-relaxed mb-4">
              ${t("tradeAssurance.refundDesc1")}
            </p>
            <p class="text-gray-600 text-base leading-relaxed mb-8">
              ${t("tradeAssurance.refundDesc2")}
            </p>
            <div class="flex flex-wrap gap-3 mb-4">
              <a href="/pages/info/refund-policy" class="th-btn inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                ${t("tradeAssurance.sourceProducts")}
              </a>
              <a href="/pages/info/refund-policy" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                ${t("tradeAssurance.learnHow")}
              </a>
            </div>
            <p class="text-xs text-gray-400">${t("tradeAssurance.eligibleCountriesNote")} <a href="/pages/info/refund-policy" class="underline hover:no-underline">${t("tradeAssurance.here")}</a> ${t("tradeAssurance.clickSuffix")}</p>
          </div>
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: GÖNDERİM VE LOJİSTİK HİZMETLERİ + SÜREÇ ŞERİDİ
   ═══════════════════════════════════════════════════════════════ */

function processStep(icon: string, label: string): string {
  return `
    <div class="lg:flex-1 flex flex-col items-center text-center bg-[#f7f7f7] border border-gray-200 rounded-md px-4 py-6">
      <div class="w-11 h-11 rounded-full flex items-center justify-center mb-3 bg-[#FFF3C4] text-[#92400e]">
        ${icon}
      </div>
      <span class="text-sm font-bold text-gray-900">${label}</span>
    </div>
  `
}

function processConnector(): string {
  return `
    <div class="hidden lg:flex lg:items-center w-10">
      <div class="w-full border-t-2 border-dashed border-gray-200"></div>
    </div>
  `
}

function ShippingSection(): string {
  return `
    <section id="section-shipping" class="bg-white py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="max-w-[900px]">
          <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
            ${t("tradeAssurance.coverageShipping")}
          </h2>
          <p class="text-gray-600 text-base leading-relaxed mb-4">
            ${t("tradeAssurance.shippingDesc1")}
          </p>
          <p class="text-gray-600 text-base leading-relaxed mb-8">
            ${t("tradeAssurance.shippingDesc2")}
          </p>
          <a href="/pages/info/shipping-logistics" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
            ${t("tradeAssurance.learnHow")}
          </a>
        </div>
        <!-- Süreç şeridi: Üretim → Kargo → Gümrük → Teslimat -->
        <div class="mt-12 grid grid-cols-2 gap-4 lg:flex lg:gap-0 lg:items-stretch">
          ${processStep(processIconProduction, t("tradeAssurance.logisticsStepProduction"))}
          ${processConnector()}
          ${processStep(processIconShipping, t("tradeAssurance.logisticsStepShipping"))}
          ${processConnector()}
          ${processStep(processIconCustoms, t("tradeAssurance.logisticsStepCustoms"))}
          ${processConnector()}
          ${processStep(processIconDelivery, t("tradeAssurance.logisticsStepDelivery"))}
        </div>
        <!-- Liman Görseli -->
        <div class="mt-12 rounded-md overflow-hidden shadow-lg">
          <img src="${limanImg}" alt="${t("tradeAssurance.logisticsAlt")}" class="w-full h-auto max-h-[500px] object-cover" />
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: SATIŞ SONRASI KORUMALARI
   ═══════════════════════════════════════════════════════════════ */

function AfterSalesSection(): string {
  return `
    <section id="section-after-sales" class="py-16 sm:py-20 lg:py-24 bg-[#f7f7f7]">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <!-- Left: Video (autoplay on scroll) -->
          <div class="lg:w-1/2">
            <div class="rounded-md overflow-hidden shadow-xl">
              <video class="w-full object-cover auto-play-video aspect-[528/564]" muted loop playsinline preload="metadata">
                <source src="${serviceVideo}" type="video/mp4" />
              </video>
            </div>
          </div>
          <!-- Right: Text -->
          <div class="lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              ${t("tradeAssurance.coverageAfterSales")}
            </h2>
            <p class="text-gray-600 text-base leading-relaxed mb-8">
              ${t("tradeAssurance.afterSalesDesc")}
            </p>
            <div class="flex flex-wrap gap-3">
              <a href="/pages/info/after-sales" class="th-btn inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                ${t("tradeAssurance.sourceProducts")}
              </a>
              <a href="/pages/info/after-sales" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                ${t("tradeAssurance.learnHow")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: ALICI SESLERİ (statik 3 kart)
   ═══════════════════════════════════════════════════════════════ */

function testimonialCard(quote: string, name: string, company: string): string {
  const initials = name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
  return `
    <div class="bg-white rounded-md p-7 flex flex-col gap-4">
      <p class="text-gray-900 text-sm leading-relaxed">${quote}</p>
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-[#FFF3C4] text-[#92400e]">${initials}</div>
        <div>
          <div class="text-sm font-bold text-gray-900">${name}</div>
          <div class="text-xs text-gray-600">${company}</div>
        </div>
      </div>
    </div>
  `
}

function TestimonialsSection(): string {
  return `
    <section class="py-16 sm:py-20 bg-[#FFC200]">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">${t("tradeAssurance.testimonialsTitle")}</h2>
        <p class="text-gray-800 text-base text-center mb-12">
          ${t("tradeAssurance.testimonialsIntro")}
        </p>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          ${testimonialCard(t("tradeAssurance.testimonial1"), 'Brandon Cubina', 'Nodnal')}
          ${testimonialCard(t("tradeAssurance.testimonial2"), 'Darren Tang', 'LifeToo')}
          ${testimonialCard(t("tradeAssurance.testimonial3"), 'Ayşe Kılıç', 'TechImport')}
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: ALT CTA BANDI
   ═══════════════════════════════════════════════════════════════ */

function FinalCtaSection(): string {
  return `
    <section class="py-16 text-center bg-[#0a0a0a]">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8">
          ${t("tradeAssurance.finalCtaTitle")}
        </h2>
        <a href="/pages/auth/register" class="th-btn inline-flex items-center gap-2 font-semibold px-7 py-3.5 text-base">
          ${t("tradeAssurance.finalCtaButton")}
        </a>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ASSEMBLY
   ═══════════════════════════════════════════════════════════════ */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.classList.add('relative')
appEl.innerHTML = `
  <!-- Sticky Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0">
    ${HeroBanner()}
    ${StatsBandSection()}
    ${HowItWorks()}
    ${SecurePaymentsSection()}
    ${RefundPolicySection()}
    ${ShippingSection()}
    ${AfterSalesSection()}
    ${TestimonialsSection()}
    ${FinalCtaSection()}
    ${TradeAssuranceFooterCards()}
  </main>

  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */

initMegaMenu()
initFlowbite()
mountChatPopup();
initChatTriggers();
startAlpine()
initStickyHeaderSearch()
initLanguageSelector()

// Auto-play videos when they scroll into view (IntersectionObserver)
const autoPlayVideos = document.querySelectorAll<HTMLVideoElement>('.auto-play-video')
if (autoPlayVideos.length) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target as HTMLVideoElement
      if (entry.isIntersecting) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, { threshold: 0.3 })
  autoPlayVideos.forEach(v => videoObserver.observe(v))
}
