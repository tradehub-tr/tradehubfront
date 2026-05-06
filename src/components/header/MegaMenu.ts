/**
 * MegaMenu Component — Dynamic multi-view iSTOC-style
 * Each SubHeader nav item triggers a different mega menu view:
 * - "All Categories" → category sidebar + product panels
 * - "Featured Selections" → featured cards + quick links
 * - "Order Protections" → trade assurance info
 *
 * Uses opacity/pointer-events for show/hide (no display:none)
 * Fixed position overlay below SubHeader nav
 */

import { t, getCurrentLang } from "../../i18n";
import { loadCategories } from "../../services/categoryService";
import type { ApiCategory } from "../../services/categoryService";
import { searchListings } from "../../services/listingService";
import { getLucideIcon, getLucideIconByCategoryName } from "../icons/lucideIcons";

/* ════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════ */

/**
 * @deprecated Kullanmayın — categoryService.ts kullanın.
 * Geriye dönük uyumluluk için boş dizi olarak bırakıldı.
 */
export interface MegaMenuCategory {
  id: string;
  name: string;
  icon: string;
  products: { name: string; href: string; badge?: boolean }[];
}

/** @deprecated Kullanmayın — categoryService.getCategories() kullanın. */
export const megaCategories: MegaMenuCategory[] = [];

/* ──── Featured Selections data ──── */

interface FeatureCard {
  titleKey: string;
  descKey: string;
  metaKey: string;
  metaSource?: "best-seller-count";
  href: string;
  icon: string;
}

const featureCards: FeatureCard[] = [
  {
    titleKey: "mega.topRanking",
    descKey: "mega.topRankingDesc",
    metaKey: "mega.topRankingMeta",
    metaSource: "best-seller-count",
    href: "/pages/top-ranking.html",
    icon: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
  },
  {
    titleKey: "mega.tailoredSelections",
    descKey: "mega.tailoredSelectionsDesc",
    metaKey: "mega.tailoredSelectionsMeta",
    href: "/pages/tailored-selections.html",
    icon: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/></svg>`,
  },
  {
    titleKey: "mega.topDeals",
    descKey: "mega.topDealsDesc",
    metaKey: "mega.topDealsMeta",
    href: "/pages/top-deals.html",
    icon: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.6" fill="currentColor"/></svg>`,
  },
];

/* ──── Order Protections data ──── */

const protectionCards = [
  {
    titleKey: "mega.safePayments",
    descKey: "mega.safePaymentsDesc",
    href: "/pages/info/payments.html",
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>`,
  },
  {
    titleKey: "mega.moneyBack",
    descKey: "mega.moneyBackDesc",
    href: "/pages/info/refund-policy.html",
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  },
  {
    titleKey: "mega.shippingLogistics",
    descKey: "mega.shippingLogisticsDesc",
    href: "/pages/info/shipping-logistics.html",
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`,
  },
  {
    titleKey: "mega.afterSales",
    descKey: "mega.afterSalesDesc",
    href: "/pages/info/after-sales.html",
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"/></svg>`,
  },
];

/* ════════════════════════════════════════════════════
   ICON MAP
   ════════════════════════════════════════════════════ */

/**
 * Eski API koruma haritası: Bu projede başka yerlerden çağrılan
 * getCategoryIcon("textile"), getCategoryIcon("chip") gibi anahtarları
 * Lucide karşılıklarına bağlar. Yeni kategori için lucideIcons.ts'i kullan.
 */
const LEGACY_TO_LUCIDE: Record<string, string> = {
  star: "star",
  shirt: "shirt",
  chip: "cpu",
  trophy: "trophy",
  running: "footprints",
  shoe: "footprints",
  home: "home",
  sparkles: "sparkles",
  diamond: "gem",
  bag: "backpack",
  box: "boxes",
  baby: "baby",
  food: "utensils-crossed",
  textile: "scissors",
  chemistry: "flask-conical",
  agriculture: "sprout",
  health: "heart-pulse",
  building: "building",
  machinery: "cog",
  tools: "wrench",
  car: "car",
  paper: "briefcase",
  electrical: "cpu",
  furniture: "sofa",
  shopping: "shopping-bag",
};

export function getCategoryIcon(iconName: string): string {
  const lucideName = LEGACY_TO_LUCIDE[iconName] ?? iconName;
  return getLucideIcon(lucideName);
}

/**
 * Kategori adındaki anahtar kelimelere göre otomatik Lucide icon seçer.
 * Backend `icon_class` boş bırakıldığında devreye girer.
 */
export function getIconByName(name: string): string {
  return getLucideIconByCategoryName(name);
}

/* ════════════════════════════════════════════════════
   VIEW: Categories (sidebar + panels)
   ════════════════════════════════════════════════════ */

function renderCategoriesView(): string {
  return `
    <div data-mega-view="categories" class="hidden">
      <div class="flex flex-col lg:flex-row">
        <!-- Sidebar -->
        <div class="w-full overflow-y-auto overflow-x-hidden border-b border-gray-200 bg-gray-50 lg:w-72 lg:flex-shrink-0 lg:border-b-0 lg:border-r xl:w-80 dark:border-gray-700 dark:bg-gray-900" style="max-height:min(520px, 60vh);-webkit-overflow-scrolling:touch" id="mega-sidebar">
          <ul class="py-1">
            <li class="px-4 py-6 text-center" id="mega-sidebar-loading">
              <svg class="w-5 h-5 animate-spin text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            </li>
          </ul>
        </div>
        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6" style="max-height:min(520px, 60vh);-webkit-overflow-scrolling:touch" id="mega-content">
        </div>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   VIEW: Featured Selections
   ════════════════════════════════════════════════════ */

function renderFeaturedView(): string {
  const arrowSvg = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
  const ctaArrowSvg = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
  const producerImg = new URL("../../assets/images/liman.avif", import.meta.url).href;
  return `
    <div data-mega-view="featured" class="hidden py-4 lg:py-5 xl:py-6 2xl:py-7">
      <div class="grid items-stretch gap-5 lg:gap-8 xl:gap-12 2xl:gap-20 grid-cols-[minmax(0,1fr)_200px] lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <!-- Left column: heading + cards -->
        <div class="self-start">
          <div class="mb-3 lg:mb-4 xl:mb-5">
            <h3 class="text-[18px] lg:text-[20px] xl:text-[22px] 2xl:text-[24px] font-bold text-gray-900 leading-tight tracking-[-0.01em]" data-i18n="mega.featuredHeroTitle">${t("mega.featuredHeroTitle")}</h3>
            <p class="text-[12px] lg:text-[12.5px] xl:text-[13px] text-gray-500 leading-snug mt-1 xl:mt-1.5" data-i18n="mega.featuredHeroSub">${t("mega.featuredHeroSub")}</p>
          </div>
          <div class="grid grid-cols-3 gap-2 lg:gap-2.5 xl:gap-3">
          ${featureCards
            .map(
              (card) => `
            <a href="${card.href}" class="feat-card-mm group relative isolate overflow-hidden flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 pb-2.5 shadow-[0_1px_2px_rgba(20,20,18,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_8px_24px_rgba(213,156,0,0.14),0_1px_3px_rgba(20,20,18,0.04)]">
              <span class="feat-card-mm-halo pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style="background:radial-gradient(circle, rgba(245,184,0,0.22), transparent 70%);"></span>
              <span class="pointer-events-none absolute inset-px rounded-[11px] border border-transparent transition-colors group-hover:border-amber-400/25"></span>
              <span class="relative flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 border border-amber-300/60 text-amber-700 transition-colors group-hover:bg-amber-400 group-hover:text-gray-900 group-hover:border-amber-500">
                ${card.icon}
              </span>
              <div class="relative min-w-0">
                <div class="text-[13px] font-bold text-gray-900 leading-tight tracking-[-0.005em] mb-0.5" data-i18n="${card.titleKey}">${t(card.titleKey)}</div>
                <div class="text-[11.5px] text-gray-500 leading-snug line-clamp-2" data-i18n="${card.descKey}">${t(card.descKey)}</div>
              </div>
              <div class="relative flex items-center justify-between border-t border-dashed border-gray-200 pt-2.5 mt-1">
                <span class="text-[11.5px] font-semibold text-amber-700 uppercase tracking-wider" data-i18n="${card.metaKey}"${card.metaSource ? ` data-meta-source="${card.metaSource}"` : ""}>${t(card.metaKey)}</span>
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 transition-all group-hover:bg-amber-400 group-hover:text-gray-900 group-hover:border-amber-500 group-hover:translate-x-1">
                  ${arrowSvg}
                </span>
              </div>
            </a>
          `
            )
            .join("")}
          </div>
        </div>

        <!-- Producers banner -->
        <a href="/pages/manufacturers.html" class="group relative isolate block overflow-hidden rounded-xl bg-[#1a1a1a] shadow-[0_2px_6px_rgba(20,20,18,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(20,20,18,0.18)] min-h-[150px] lg:min-h-[180px] xl:min-h-[230px] 2xl:min-h-[280px]" aria-label="${t("mega.discoverProducers")}">
          <img src="${producerImg}" alt="" loading="lazy" decoding="async" class="absolute inset-0 z-0 block w-full h-full object-cover" />
          <div class="absolute inset-0 z-10" style="background:linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.85) 100%);"></div>
          <span class="absolute top-3 left-3 lg:top-3.5 lg:left-3.5 z-20 inline-block rounded-full bg-amber-400 px-2 py-0.5 text-[10px] lg:text-[10.5px] font-bold uppercase tracking-wider text-gray-900" data-i18n="mega.bannerTagNew">${t("mega.bannerTagNew")}</span>
          <div class="relative z-20 flex h-full min-h-[150px] lg:min-h-[180px] xl:min-h-[230px] 2xl:min-h-[280px] flex-col justify-end gap-1 lg:gap-1.5 xl:gap-2 p-3 lg:p-4 xl:p-5 2xl:p-6 text-white">
            <div class="text-[13px] lg:text-[15px] xl:text-[17px] 2xl:text-[19px] font-bold leading-tight tracking-[-0.01em] text-white" data-i18n="mega.discoverProducers">${t("mega.discoverProducers")}</div>
            <div class="hidden lg:block text-[10.5px] lg:text-[11px] xl:text-[11.5px] leading-snug text-white/80 mb-1 lg:mb-1.5 line-clamp-2" data-i18n="mega.discoverProducersDesc">${t("mega.discoverProducersDesc")}</div>
            <span class="inline-flex items-center gap-1 lg:gap-1.5 self-start text-[11px] lg:text-[11.5px] xl:text-[12px] font-semibold text-amber-400 transition-all group-hover:gap-2.5">
              <span data-i18n="mega.findSupplier">${t("mega.findSupplier")}</span>
              ${ctaArrowSvg}
            </span>
          </div>
        </a>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   VIEW: Order Protections
   ════════════════════════════════════════════════════ */

function renderProtectionsView(): string {
  const tasLogo = new URL("../../assets/images/tas_logo.png", import.meta.url).href;
  return `
    <div data-mega-view="protections" class="hidden py-6 sm:py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <!-- Left: Branding + CTA + stats -->
        <div class="lg:col-span-5 lg:border-r lg:border-gray-200 lg:pr-8 flex flex-col">
          <div class="flex items-center gap-2 mb-3">
            <img src="${tasLogo}" alt="${t("mega.tradeAssuranceTitle")}" class="w-7 h-7 object-contain" />
            <span class="text-sm font-semibold text-gray-900" data-i18n="mega.tradeAssuranceTitle">${t("mega.tradeAssuranceTitle")}</span>
          </div>
          <h3 class="text-2xl xl:text-[28px] font-bold text-gray-900 leading-tight mb-3" data-i18n="mega.tradeAssuranceSubtitle">${t("mega.tradeAssuranceSubtitle")}</h3>
          <p class="text-sm text-gray-500 leading-relaxed mb-6" data-i18n="mega.tradeAssuranceLead">${t("mega.tradeAssuranceLead")}</p>

          <div class="flex items-center gap-4">
            <a href="/pages/info/trade-assurance-detail.html" class="th-btn" data-i18n="common.learnMore">
              ${t("common.learnMore")}
            </a>
            <a href="/pages/info/trade-assurance-detail.html#how-it-works" class="inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors">
              <span data-i18n="mega.tradeAssuranceHowItWorks">${t("mega.tradeAssuranceHowItWorks")}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
            </a>
          </div>
        </div>

        <!-- Right: 2x2 cards -->
        <div class="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-min content-start">
          ${protectionCards
            .map(
              (card) => `
            <a href="${card.href}" class="group flex flex-col gap-2 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors" style="padding:12px 16px 16px">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                ${card.icon}
              </span>
              <div class="text-sm font-bold text-primary-700 leading-snug" data-i18n="${card.titleKey}">${t(card.titleKey)}</div>
              <div class="text-xs text-gray-600 leading-snug line-clamp-2" data-i18n="${card.descKey}">${t(card.descKey)}</div>
            </a>
          `
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   VIEW: Buyer Central
   ════════════════════════════════════════════════════ */

interface BuyerCentralColumn {
  titleKey: string;
  links: { labelKey: string; href: string }[];
}

const buyerCentralColumns: BuyerCentralColumn[] = [
  {
    titleKey: "mega.whyIstoc",
    links: [
      { labelKey: "mega.howSourcingWorks", href: "/how-sourcing-works" },
      { labelKey: "mega.membershipProgram", href: "/membership" },
    ],
  },
  {
    titleKey: "mega.tradeServices",
    links: [
      { labelKey: "mega.orderProtections", href: "/pages/info/payments" },
      { labelKey: "mega.letterOfCredit", href: "/letter-of-credit" },
      { labelKey: "mega.productionMonitoring", href: "/pages/info/monitoring" },
      { labelKey: "mega.taxCompliance", href: "/pages/info/tax" },
    ],
  },
  {
    titleKey: "mega.resources",
    links: [
      { labelKey: "mega.successStories", href: "/success-stories" },
      { labelKey: "mega.blogs", href: "/blogs" },
      { labelKey: "mega.industryReports", href: "/reports" },
      { labelKey: "mega.helpCenter", href: "/pages/help/help-center.html" },
    ],
  },
  {
    titleKey: "mega.webinars",
    links: [
      { labelKey: "mega.overview", href: "/webinars" },
      { labelKey: "mega.meetThePeers", href: "/webinars/peers" },
      { labelKey: "mega.ecommerceAcademy", href: "/ecommerce-academy" },
      { labelKey: "mega.howToSource", href: "/how-to-source" },
    ],
  },
];

function renderBuyerCentralView(): string {
  return `
    <div data-mega-view="buyer-central" class="hidden py-4 sm:py-8 px-2 sm:px-4">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-8">
        ${buyerCentralColumns
          .map(
            (col) => `
          <div>
            <h4 class="mb-4 text-sm font-bold text-gray-900" data-i18n="${col.titleKey}">${t(col.titleKey)}</h4>
            <ul class="space-y-3">
              ${col.links
                .map(
                  (link) => `
                <li>
                  <a href="${link.href}" class="text-sm text-black transition-colors hover:text-primary-600" data-i18n="${link.labelKey}">
                    ${t(link.labelKey)}
                  </a>
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   VIEW: Help Center
   ════════════════════════════════════════════════════ */

function renderHelpCenterView(): string {
  return `
    <div data-mega-view="help-center" class="hidden py-8 px-4">
      <div class="flex flex-col md:flex-row gap-6 md:gap-8">
        <!-- Left: Two cards -->
        <div class="flex gap-6 flex-1">
          <a href="/help/buyers" class="group flex flex-1 flex-col items-center justify-center gap-4 rounded-md border border-dashed border-gray-200 p-8 transition-all">
            <span class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 transition-colors">
              <svg class="h-7 w-7 text-gray-500 transition-colors" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
              </svg>
            </span>
            <span class="text-sm font-semibold text-gray-900 transition-colors" data-i18n="mega.forBuyers">${t("mega.forBuyers")}</span>
          </a>
          <a href="/help/suppliers" class="group flex flex-1 flex-col items-center justify-center gap-4 rounded-md border border-dashed border-gray-200 p-8 transition-all">
            <span class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 transition-colors">
              <svg class="h-7 w-7 text-gray-500 transition-colors" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/>
              </svg>
            </span>
            <span class="text-sm font-semibold text-gray-900 transition-colors" data-i18n="mega.forSuppliers">${t("mega.forSuppliers")}</span>
          </a>
        </div>
        <!-- Right: Links -->
        <div class="w-full md:w-56 flex flex-col justify-center">
          <ul class="space-y-4">
            <li>
              <a href="/help/dispute" class="text-sm text-black transition-colors hover:text-primary-600" data-i18n="mega.openDispute">
                ${t("mega.openDispute")}
              </a>
            </li>
            <li>
              <a href="/help/ipr" class="text-sm text-black transition-colors hover:text-primary-600" data-i18n="mega.reportIpr">
                ${t("mega.reportIpr")}
              </a>
            </li>
            <li>
              <a href="/help/abuse" class="text-sm text-black transition-colors hover:text-primary-600" data-i18n="mega.reportAbuse">
                ${t("mega.reportAbuse")}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   VIEW: App & Extension
   ════════════════════════════════════════════════════ */

function renderAppExtensionView(): string {
  return `
    <div data-mega-view="app-extension" class="hidden py-8 px-4">
      <div class="flex flex-col md:flex-row">
        <!-- Left: Get the app -->
        <div class="flex-1 md:pr-10">
          <h4 class="mb-2 text-lg font-bold text-gray-900" data-i18n="mega.getApp">${t("mega.getApp")}</h4>
          <p class="mb-5 max-w-sm text-sm text-gray-500" data-i18n="mega.appDesc">${t("mega.appDesc")}</p>
          <div class="flex items-center gap-5">
            <!-- App badges -->
            <div class="flex flex-col gap-2.5">
              <a href="/app/ios" class="inline-flex items-center gap-2 bg-black text-white rounded-md px-4 py-2 hover:bg-gray-800 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z"/></svg>
                <div class="flex flex-col">
                  <span class="text-[10px] leading-none opacity-80" data-i18n="mega.downloadOn">${t("mega.downloadOn")}</span>
                  <span class="text-sm font-semibold leading-tight" data-i18n="mega.appStore">${t("mega.appStore")}</span>
                </div>
              </a>
              <a href="/app/android" class="inline-flex items-center gap-2 bg-black text-white rounded-md px-4 py-2 hover:bg-gray-800 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="m3.18 23.96.02.02c.04-.06.06-.12.09-.19l4.58-9.81a.3.3 0 0 0-.13-.39L.56 9.42a.3.3 0 0 0-.41.13L.02 9.8A11.94 11.94 0 0 0 0 12.09c0 4.5 2.04 7.6 3.18 11.87Z"/><path d="m8.44 12.96-.37.79-4.58 9.81c-.02.05-.04.11-.07.16l.02.02c3.71-2.2 13.08-7.74 22.54-13.25a.1.1 0 0 0 .02-.17l-4.09-3.55a.3.3 0 0 0-.33-.04l-13.14 6.23Z"/><path d="M8.07 11.03 21.21 4.8a.3.3 0 0 0 .05-.51L17.54 1.3a.3.3 0 0 0-.27-.05L3.4.01A.3.3 0 0 0 3.12.2l-.1.2a.3.3 0 0 0 .05.31l4.66 4.69.12.13.21.24 4.59 4.87a.3.3 0 0 1-.58.39Z"/></svg>
                <div class="flex flex-col">
                  <span class="text-[10px] leading-none opacity-80" data-i18n="mega.getItOn">${t("mega.getItOn")}</span>
                  <span class="text-sm font-semibold leading-tight" data-i18n="mega.googlePlay">${t("mega.googlePlay")}</span>
                </div>
              </a>
            </div>
            <!-- QR Code placeholder -->
            <div class="flex h-24 w-24 items-center justify-center rounded-md border border-gray-200 bg-gray-100">
              <svg class="h-10 w-10 text-gray-500" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"/>
              </svg>
            </div>
          </div>
        </div>
        <!-- Right: Discover Lens -->
        <div class="flex-1 border-t border-gray-200 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-10">
          <h4 class="mb-2 text-lg font-bold text-gray-900" data-i18n="mega.discoverLens">${t("mega.discoverLens")}</h4>
          <p class="mb-5 max-w-md text-sm text-gray-500" data-i18n="mega.lensDesc">${t("mega.lensDesc")}</p>
          <div class="flex flex-col items-start gap-3">
            <a href="/lens" class="text-sm text-black underline underline-offset-2 transition-colors hover:text-primary-600" data-i18n="common.learnMore">
              ${t("common.learnMore")}
            </a>
            <a href="/lens/chrome" class="th-btn inline-flex items-center gap-2 px-6 py-2.5 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.73-3.558"/></svg>
              <span data-i18n="mega.addToChrome">${t("mega.addToChrome")}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */

export function MegaMenu(): string {
  return `
    <div id="istoc-mega-overlay"
      style="position:fixed;left:0;right:0;bottom:0;z-index:var(--z-backdrop);background:rgba(0,0,0,0.5);opacity:0;pointer-events:none;transition:opacity 0.2s ease;"
    ></div>
    <div id="istoc-mega-panel"
      style="position:fixed;left:0;width:100%;z-index:var(--z-modal);opacity:0;pointer-events:none;transform:translateY(-8px);transition:opacity 0.2s ease, transform 0.2s ease;max-height:100vh"
      class="max-h-[85vh] overflow-y-auto overscroll-contain border-b border-gray-200 bg-white sm:max-h-[100vh] lg:!max-h-[80vh] dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="container-boxed">
        ${renderCategoriesView()}
        ${renderFeaturedView()}
        ${renderProtectionsView()}
        ${renderBuyerCentralView()}
        ${renderHelpCenterView()}
        ${renderAppExtensionView()}
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   Lazy data loaders for featured view metadata
   ════════════════════════════════════════════════════ */

let featuredCountsLoaded = false;

async function loadFeaturedCounts(): Promise<void> {
  if (featuredCountsLoaded) return;
  featuredCountsLoaded = true;
  try {
    const result = await searchListings({ is_best_seller: true, page_size: 1 });
    const count = result.searchHeader.totalProducts;
    if (count > 0) {
      const locale = getCurrentLang() === "en" ? "en-US" : "tr-TR";
      const formatted = count.toLocaleString(locale);
      const suffix = t("mega.productCountSuffix");
      document
        .querySelectorAll<HTMLElement>('[data-meta-source="best-seller-count"]')
        .forEach((el) => {
          el.textContent = `${formatted}+ ${suffix}`;
          el.removeAttribute("data-i18n");
        });
    }
  } catch {
    featuredCountsLoaded = false;
  }
}

/* ════════════════════════════════════════════════════
   INIT — Hover & sidebar interaction
   ════════════════════════════════════════════════════ */

export function initMegaMenu(): void {
  const megaMenu = document.getElementById("istoc-mega-panel");
  const overlay = document.getElementById("istoc-mega-overlay");
  const triggers = document.querySelectorAll<HTMLElement>(".mega-trigger");
  const views = megaMenu?.querySelectorAll<HTMLElement>("[data-mega-view]");

  if (!megaMenu || triggers.length === 0 || !views) return;

  // Mark the trigger whose mega view contains the current page as persistently active.
  // Uses the `.active` class (not `--active`) so close() does not strip it.
  const pageToTarget: Record<string, string> = {};
  featureCards.forEach((c) => {
    pageToTarget[c.href] = "featured";
  });
  protectionCards.forEach((c) => {
    pageToTarget[c.href] = "protections";
  });
  pageToTarget["/pages/info/trade-assurance-detail.html"] = "protections";
  buyerCentralColumns.forEach((col) => {
    col.links.forEach((l) => {
      pageToTarget[l.href] = "buyer-central";
    });
  });
  const currentPath = window.location.pathname;
  const activeTarget = pageToTarget[currentPath];
  if (activeTarget) {
    triggers.forEach((t) => {
      if (t.getAttribute("data-mega-target") === activeTarget) {
        t.classList.add("active");
      }
    });
  }

  let isOpen = false;
  let closeTimer: number | null = null;
  let activeView: string | null = null;
  let activeTrigger: HTMLElement | null = null;

  function positionMenu(): void {
    // Position below the SubHeader nav
    const nav = triggers[0]?.closest("nav");
    if (!nav) return;
    const bottom = nav.getBoundingClientRect().bottom;
    megaMenu!.style.top = bottom + "px";
    if (overlay) overlay.style.top = bottom + "px";
  }

  function showView(viewName: string): void {
    views!.forEach((v) => {
      v.classList.toggle("hidden", v.getAttribute("data-mega-view") !== viewName);
    });
    activeView = viewName;
    if (viewName === "featured") {
      void loadFeaturedCounts();
    }
  }

  function open(trigger: HTMLElement): void {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    const viewName = trigger.getAttribute("data-mega-target");
    if (!viewName) return;

    // Highlight active trigger
    if (activeTrigger && activeTrigger !== trigger) {
      activeTrigger.classList.remove("subheader-link--active");
    }
    trigger.classList.add("subheader-link--active");
    activeTrigger = trigger;

    positionMenu();
    showView(viewName);

    // Dispatch event to close search dropdowns when mega menu opens
    document.dispatchEvent(new CustomEvent("istoc:close-search"));

    if (!isOpen) {
      isOpen = true;
      megaMenu!.style.opacity = "1";
      megaMenu!.style.pointerEvents = "auto";
      megaMenu!.style.transform = "translateY(0)";
      if (overlay) {
        overlay.style.opacity = "1";
        overlay.style.pointerEvents = "auto";
      }
      // Solid header while mega menu is open (remove gradient)
      const sh = document.getElementById("sticky-header");
      const go = document.getElementById("gradient-overlay");
      if (sh) {
        if (go) go.style.display = "none";
        sh.style.backgroundColor = "#ffffff";
        sh.style.borderBottom = "1px solid #e5e5e5";
      }
    }

    trigger.setAttribute("aria-expanded", "true");
  }

  function close(): void {
    isOpen = false;
    activeView = null;
    closeTimer = null;

    megaMenu!.style.opacity = "0";
    megaMenu!.style.pointerEvents = "none";
    megaMenu!.style.transform = "translateY(-8px)";
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    }
    // Restore header gradient if not scrolled
    const sh = document.getElementById("sticky-header");
    const go = document.getElementById("gradient-overlay");
    if (sh) {
      if (window.scrollY <= 10) {
        if (go) go.style.display = "";
        sh.style.backgroundColor = "";
        sh.style.borderBottom = "";
      }
    }

    // Reset trigger states
    triggers.forEach((t) => {
      t.setAttribute("aria-expanded", "false");
      t.classList.remove("subheader-link--active");
    });
    if (activeTrigger) {
      activeTrigger.classList.remove("subheader-link--active");
      activeTrigger = null;
    }
  }

  function scheduleClose(): void {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = window.setTimeout(close, 300);
  }

  function cancelClose(): void {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  // ──── Attach events to ALL triggers ────
  triggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", () => open(trigger));
    trigger.addEventListener("mouseleave", scheduleClose);
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const viewName = trigger.getAttribute("data-mega-target");
      if (isOpen && activeView === viewName) {
        cancelClose();
        close();
      } else {
        open(trigger);
      }
    });
  });

  // Keep open when hovering mega menu
  megaMenu.addEventListener("mouseenter", cancelClose);
  megaMenu.addEventListener("mouseleave", scheduleClose);

  // Overlay click closes
  if (overlay)
    overlay.addEventListener("click", () => {
      cancelClose();
      close();
    });

  // Escape key closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      cancelClose();
      close();
    }
  });

  // ──── Categories view: sidebar click → scroll to section ────
  const ACT = ["th-mega-sidebar-item--active"];
  const INACT = ["border-transparent"];

  function bindCategoryInteractions(): void {
    const catBtns = megaMenu!.querySelectorAll<HTMLElement>(".mega-cat-btn");
    const contentEl = document.getElementById("mega-content");
    let isScrollingFromClick = false;

    function highlightSidebarBtn(categoryId: string): void {
      catBtns.forEach((b) => {
        b.classList.remove(...ACT);
        b.classList.add(...INACT);
      });
      const target = megaMenu!.querySelector<HTMLElement>(
        `.mega-cat-btn[data-category="${categoryId}"]`
      );
      if (target) {
        target.classList.remove(...INACT);
        target.classList.add(...ACT);
      }
    }

    catBtns.forEach((btn) => {
      btn.addEventListener("click", (e: Event) => {
        e.preventDefault();
        const id = btn.getAttribute("data-category");
        if (!id || !contentEl) return;
        highlightSidebarBtn(id);
        const section = document.getElementById(`mega-section-${id}`);
        if (section) {
          isScrollingFromClick = true;
          section.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            isScrollingFromClick = false;
          }, 500);
        }
      });
    });

    if (contentEl) {
      const sections = contentEl.querySelectorAll<HTMLElement>(".mega-cat-section");
      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrollingFromClick) return;
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const sectionId = entry.target.id.replace("mega-section-", "");
              highlightSidebarBtn(sectionId);
              break;
            }
          }
        },
        { root: contentEl, threshold: 0.3 }
      );
      sections.forEach((section) => observer.observe(section));
    }
  }

  bindCategoryInteractions();

  // ──── Load dynamic categories from categoryService (shared cache) ────
  (async () => {
    try {
      const cats = (await loadCategories()) as ApiCategory[];
      if (!cats || cats.length === 0) return;

      const sidebarUl = document.querySelector<HTMLElement>("#mega-sidebar ul");
      const megaContent = document.getElementById("mega-content");
      if (!sidebarUl || !megaContent) return;

      const viewAllSvg = `<svg class="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>`;

      function renderDynCatCard(
        name: string,
        slug: string,
        image?: string,
        isViewAll = false
      ): string {
        const iconFallback = `<span class="text-gray-500 dark:text-gray-300 [&>svg]:w-8 [&>svg]:h-8 sm:[&>svg]:w-10 sm:[&>svg]:h-10 lg:[&>svg]:w-12 lg:[&>svg]:h-12">${getIconByName(name)}</span>`;
        const inner = isViewAll
          ? viewAllSvg
          : image
            ? `<img src="${image}" alt="${name}" class="w-full h-full object-cover" loading="lazy" onerror="this.outerHTML=this.dataset.fallback" data-fallback='${iconFallback.replace(/'/g, "&apos;")}' />`
            : iconFallback;
        const borderStyle = isViewAll ? "border:2px dashed #e5e7eb;" : "";
        const href = isViewAll
          ? `/pages/categories.html?cat=${encodeURIComponent(slug)}`
          : `/pages/products.html?cat=${slug}`;
        return `
          <a href="${href}" class="flex flex-col items-center gap-1.5 sm:gap-2 group/product min-h-[44px]">
            <div class="relative w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center overflow-hidden group-hover/product:ring-2 transition-all" style="background:var(--product-card-bg, var(--card-bg));--tw-ring-color:var(--nav-hover-color);${borderStyle}">
              ${inner}
            </div>
            <span class="th-nav-link max-w-[4rem] text-center text-[13px] leading-tight transition-colors sm:max-w-[5rem] lg:max-w-[6rem]">${name}</span>
          </a>`;
      }

      sidebarUl.innerHTML = cats
        .map(
          (cat, index) => `
        <li>
          <a
            href="/pages/products.html?cat=${cat.slug}"
            class="th-mega-sidebar-item mega-cat-btn flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-3 sm:py-2.5 text-sm text-left transition-colors border-l-2 border-transparent ${index === 0 ? "th-mega-sidebar-item--active" : ""}"
            data-category="${cat.id}"
          >
            ${
              cat.image
                ? `<img src="${cat.image}" alt="${cat.name}" class="w-5 h-5 rounded-full object-cover flex-shrink-0" loading="lazy" />`
                : `<span class="flex-shrink-0 text-gray-400">${cat.icon_class ? getCategoryIcon(cat.icon_class) : getIconByName(cat.name)}</span>`
            }
            <span class="flex-1 truncate">${cat.name}</span>
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>
          </a>
        </li>
      `
        )
        .join("");

      megaContent.innerHTML = cats
        .map(
          (cat) => `
        <div class="mega-cat-section mb-8" id="mega-section-${cat.id}">
          <div class="flex items-center gap-4 mb-5 lg:mb-6">
            <h3 class="text-base font-bold text-gray-900 lg:text-lg dark:text-white">${cat.name}</h3>
            <a href="/pages/categories.html?cat=${encodeURIComponent(cat.slug)}" class="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700">Tümünü Gör</a>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-y-4 gap-x-2 sm:gap-y-5 sm:gap-x-4 lg:gap-y-8 lg:gap-x-6">
            ${cat.children.map((ch) => renderDynCatCard(ch.name, ch.slug, ch.image)).join("")}
            ${renderDynCatCard("Tümünü gör", cat.slug, undefined, true)}
          </div>
        </div>
      `
        )
        .join("");

      bindCategoryInteractions();
    } catch (_) {
      // API başarısız olursa loading spinner kalır
    }
  })();
}
