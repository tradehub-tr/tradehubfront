/**
 * FooterLinks Component (iSTOC Tam Footer — F1 "Trendyol Klasik")
 * Kompozisyon (yukarıdan aşağıya):
 * - FooterSeo: SEO üst bölgesi (Popüler Üreticiler + Popüler Sayfalar)
 * - Ana bölge: 5 link kolonu + güven kolonu (Ülke Değiştir, Güvenli Alışveriş,
 *   Güvenlik Sertifikası) + politika linkleri satırı
 * - FooterPolicy: siyah bant (sosyal + app rozetleri + yalnız telif satırı)
 *
 * Mobil kuralı: accordion/dropdown YOK — tüm linkler 2 kolonlu ızgarada görünür
 * (bkz. memory: footer-mobil-accordion-yasak).
 */

import type { FooterColumn } from "../../types/navigation";
import { t } from "../../i18n";
import { FooterSeo } from "./FooterSeo";
import { FooterPolicy } from "./FooterPolicy";

interface FooterColumnI18n {
  titleKey: string;
  links: { labelKey: string; href: string }[];
}

const footerColumnsI18n: FooterColumnI18n[] = [
  {
    titleKey: "footer.getSupport",
    links: [
      { labelKey: "footer.helpCenter", href: "/yardim-merkezi" },
      { labelKey: "footer.liveSupport", href: "/pages/help/help-tickets.html" },
      { labelKey: "footer.checkOrder", href: "/pages/dashboard/orders.html" },
      { labelKey: "footer.shippingDelivery", href: "/pages/info/shipping-logistics.html" },
      { labelKey: "footer.refunds", href: "/iade-kosullari" },
      { labelKey: "footer.reportAbuse", href: "/destek/yeni" },
    ],
  },
  {
    titleKey: "footer.paymentsProtections",
    links: [
      { labelKey: "footer.safePayments", href: "/odeme-secenekleri" },
      { labelKey: "footer.paymentOptions", href: "/pages/info/payments.html" },
      { labelKey: "footer.moneyBack", href: "/iade-politikasi" },
      { labelKey: "footer.afterSales", href: "/pages/info/after-sales.html" },
      { labelKey: "footer.buyerProtection", href: "/pages/info/trade-assurance-detail.html" },
    ],
  },
  {
    titleKey: "footer.sourceOnIstoc",
    links: [
      { labelKey: "footer.rfq", href: "/pages/dashboard/rfq.html" },
      { labelKey: "footer.verifiedSuppliers", href: "/pages/manufacturers.html" },
      { labelKey: "footer.allCategories", href: "/pages/categories.html" },
      { labelKey: "footer.weeklyDeals", href: "/pages/top-deals.html" },
      { labelKey: "footer.newProducts", href: "/pages/products.html?sort=newest" },
    ],
  },
  {
    titleKey: "footer.sellOnIstoc",
    links: [
      { labelKey: "footer.startSelling", href: "/satici-ol" },
      { labelKey: "footer.sellerCentral", href: "/panel/" },
      { labelKey: "footer.verifiedSupplier", href: "/pages/seller/verification.html" },
      { labelKey: "footer.commissionFees", href: "/pages/seller/sell-pricing.html" },
      { labelKey: "footer.sellerAcademy", href: "/satici-akademisi" },
    ],
  },
  {
    titleKey: "footer.corporate",
    links: [
      { labelKey: "footer.aboutUs", href: "/hakkimizda" },
      { labelKey: "footer.careers", href: "/kariyer" },
      { labelKey: "footer.contact", href: "/iletisim" },
      { labelKey: "footer.pressRoom", href: "/basin" },
      { labelKey: "footer.securityAtIstoc", href: "/guvenlik" },
      { labelKey: "footer.sustainability", href: "/surdurulebilirlik" },
    ],
  },
];

const policyLinksI18n: { labelKey: string; href: string }[] = [
  { labelKey: "footer.cookiePrefs", href: "/cerezler" },
  { labelKey: "footer.privacyPolicy", href: "/gizlilik" },
  { labelKey: "footer.termsOfUse", href: "/kullanim-kosullari" },
  { labelKey: "footer.kvkk", href: "/kvkk" },
  { labelKey: "footer.distanceSales", href: "/mesafeli-satis" },
];

function getFooterColumns(): FooterColumn[] {
  return footerColumnsI18n.map((col) => ({
    title: t(col.titleKey),
    links: col.links.map((link) => ({ label: t(link.labelKey), href: link.href })),
  }));
}

/**
 * Türk bayrağı — emoji bayrak (🇹🇷) Windows/Chromium'da render olmadığı için
 * inline SVG kullanılır.
 */
function turkishFlagSvg(): string {
  return `<svg class="w-5 h-3.5 rounded-[2px] shrink-0" viewBox="0 0 24 16" aria-hidden="true">
    <rect width="24" height="16" fill="#E30A17"/>
    <circle cx="9.4" cy="8" r="4" fill="#fff"/>
    <circle cx="10.4" cy="8" r="3.2" fill="#E30A17"/>
    <path fill="#fff" d="M15.4 8l-2.7-.9 1.7 2.3V6.6l-1.7 2.3z"/>
    <path fill="#fff" d="M15.9 6.1l.44 1.36h1.43l-1.16.84.44 1.36-1.15-.84-1.16.84.44-1.36-1.15-.84h1.43z"/>
  </svg>`;
}

function renderColumn(column: FooterColumnI18n): string {
  return `
    <div class="min-w-0">
      <h3
        class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide mb-2 sm:mb-3.5 text-balance"
        style="color: var(--footer-heading-color, #0a0a0a);"
      ><span data-i18n="${column.titleKey}">${t(column.titleKey)}</span></h3>
      <ul>
        ${column.links
          .map(
            (link) => `
          <li>
            <a
              href="${link.href}"
              class="th-footer-link block text-[13px] sm:text-[13.5px] xl:text-[13px] leading-snug py-1.5 xl:py-[5px]"
            ><span data-i18n="${link.labelKey}">${t(link.labelKey)}</span></a>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;
}

/**
 * Güven kolonu: Ülke Değiştir + Güvenli Alışveriş + Güvenlik Sertifikası
 * Mobilde tam genişlik ve ortalanmış; masaüstünde sağ kolon.
 */
function renderTrustColumn(): string {
  const chip =
    "inline-flex items-center justify-center h-[30px] min-w-12 px-2 rounded-md bg-white border border-gray-200 dark:bg-gray-700 dark:border-gray-600";
  const cert =
    "grid place-items-center w-12 h-12 rounded-md bg-white border border-gray-200 dark:bg-gray-700 dark:border-gray-600 text-center text-[8px] font-extrabold leading-tight text-gray-700 dark:text-gray-200";
  return `
    <div class="col-span-2 md:col-span-3 xl:col-span-1 flex flex-col items-center xl:items-start gap-5 pt-2 xl:pt-0 min-w-0">
      <div class="w-full xl:w-auto">
        <h3
          class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide mb-2.5 text-center xl:text-left"
          style="color: var(--footer-heading-color, #0a0a0a);"
        ><span data-i18n="footer.changeCountry">${t("footer.changeCountry")}</span></h3>
        <button
          type="button"
          class="th-no-press flex items-center gap-2.5 w-full xl:w-auto xl:min-w-[210px] max-w-[320px] mx-auto xl:mx-0 rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-3 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white cursor-pointer transition-colors duration-200 hover:border-primary-500"
        >
          ${turkishFlagSvg()}
          <span class="truncate" data-i18n="footer.countryValue">${t("footer.countryValue")}</span>
          <svg class="w-4 h-4 ml-auto shrink-0 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div>
        <h3
          class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide mb-2.5 text-center xl:text-left"
          style="color: var(--footer-heading-color, #0a0a0a);"
        ><span data-i18n="footer.safeShopping">${t("footer.safeShopping")}</span></h3>
        <div class="flex flex-wrap items-center justify-center xl:justify-start gap-2">
          <span class="${chip} font-extrabold italic text-[11px] text-blue-900 dark:text-blue-300">VISA</span>
          <span class="${chip}">
            <svg class="w-[26px] h-4" viewBox="0 0 32 20" aria-label="Mastercard">
              <circle cx="12" cy="10" r="8" fill="#EB001B"/>
              <circle cx="20" cy="10" r="8" fill="#F79E1B"/>
              <path d="M16 3.9a8 8 0 0 1 0 12.2 8 8 0 0 1 0-12.2z" fill="#FF5F00"/>
            </svg>
          </span>
          <span class="${chip}">
            <img src="${new URL("../../assets/images/amex.svg", import.meta.url).href}" alt="American Express" width="26" height="16" />
          </span>
          <span class="${chip} font-extrabold italic text-[11px] text-[#003764] dark:text-blue-200">troy</span>
        </div>
      </div>
      <div>
        <h3
          class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide mb-2.5 text-center xl:text-left"
          style="color: var(--footer-heading-color, #0a0a0a);"
        ><span data-i18n="footer.securityCert">${t("footer.securityCert")}</span></h3>
        <div class="flex items-center justify-center xl:justify-start gap-2.5">
          <span class="${cert}">PCI<span class="block text-[7px] font-semibold text-gray-500 dark:text-gray-400">DSS</span></span>
          <span class="${cert}">ISO<span class="block text-[7px] font-semibold text-gray-500 dark:text-gray-400">27001</span></span>
          <span class="${cert}">ETBİS<span class="block text-[7px] font-semibold text-gray-500 dark:text-gray-400">Kayıtlı</span></span>
        </div>
      </div>
    </div>
  `;
}

function renderPolicyRow(): string {
  return `
    <nav
      class="flex flex-wrap items-center justify-center xl:justify-start gap-x-5 gap-y-2 border-t pt-3.5 pb-1 mt-6"
      style="border-color: var(--footer-border-color, #e5e7eb);"
      aria-label="Policies"
    >
      ${policyLinksI18n
        .map(
          (link) => `
        <a href="${link.href}" class="th-footer-link text-[12px]" data-i18n="${link.labelKey}">${t(link.labelKey)}</a>
      `
        )
        .join("")}
    </nav>
  `;
}

/**
 * FooterLinks Component — tam footer'ı render eden tek giriş noktası.
 */
export function FooterLinks(): string {
  return `
    ${FooterSeo()}
    <section
      class="border-t"
      style="background-color: var(--footer-zone-bg, #fafafa); border-color: var(--footer-border-color, #e5e7eb);"
      aria-label="Footer navigation"
    >
      <div class="container-boxed px-3 sm:px-4 py-6 sm:py-9">
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(225px,1.3fr)] gap-x-5 gap-y-7 xl:gap-x-6">
          ${footerColumnsI18n.map((col) => renderColumn(col)).join("")}
          ${renderTrustColumn()}
        </div>
        ${renderPolicyRow()}
      </div>
    </section>

    ${FooterPolicy()}
  `;
}

/**
 * Get footer columns data for use by other components
 */
export function getFooterColumnsData(): FooterColumn[] {
  return getFooterColumns();
}
