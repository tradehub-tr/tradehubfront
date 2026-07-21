/**
 * FooterLinks Component (iSTOC Tam Footer — F1 "Trendyol Klasik")
 * Kompozisyon (yukarıdan aşağıya):
 * - Ana bölge: 5 link kolonu (Kurumsal kolonunda politika linkleri) +
 *   Dil/Para Birimi seçici kolonu
 * - FooterPolicy: siyah bant (sosyal + app rozetleri + telif)
 *
 * Mobil kuralı: accordion/dropdown YOK — tüm linkler 2 kolonlu ızgarada görünür
 * (bkz. memory: footer-mobil-accordion-yasak).
 */

import type { FooterColumn } from "../../types/navigation";
import { t, getCurrentLang } from "../../i18n";
import { getSelectedCurrency, setSelectedCurrency } from "../../utils/currency";
import { getSupportedCurrencies } from "../../services/currencyService";
import { FooterPolicy } from "./FooterPolicy";

/** Footer bölge seçicisinde sunulan UI dilleri (BottomNav ile tutarlı: tr/en). */
const FOOTER_LANG_LABELS: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  ar: "العربية",
  ru: "Русский",
};
const FOOTER_LANGS: { code: string; label: string }[] = [
  { code: "tr", label: FOOTER_LANG_LABELS.tr },
  { code: "en", label: FOOTER_LANG_LABELS.en },
];

/** currencyService yüklenmişse desteklenen para birimleri, yoksa fallback. */
function getFooterCurrencyCodes(): string[] {
  const list = getSupportedCurrencies();
  if (list.length) return list.map((c) => c.code);
  return ["TRY", "USD", "EUR"];
}

/** Buton etiketi — statik değil, seçili dil + para birimini yansıtır. */
function renderRegionLabel(): string {
  const lang = getCurrentLang();
  const cur = getSelectedCurrency().code;
  return `${FOOTER_LANG_LABELS[lang] || "English"} · ${cur}`;
}

/** Dil/para birimi seçicisi için globe ikonu (ülke bayrağı değil). */
function globeIconSvg(): string {
  return `<svg class="w-[18px] h-[18px] shrink-0 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/>
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
  </svg>`;
}

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
      // Global-standart hukuki linkler (her ülkede görünür). Bölgesel
      // zorunluluklar (KVKK/GDPR/CCPA) ayrı link değil, belgelerin içinde bölüm.
      // TR'ye özgü KVKK/Mesafeli Satış kaldırıldı; ileride bölge=TR koşullu.
      { labelKey: "footer.cookiePrefs", href: "/cerezler" },
      { labelKey: "footer.privacyPolicy", href: "/gizlilik" },
      { labelKey: "footer.termsOfUse", href: "/kullanim-kosullari" },
      // Kaldırıldı (düşük öncelik, kolon dengesi): pressRoom, securityAtIstoc,
      // sustainability — i18n anahtarları locale'lerde korunuyor.
    ],
  },
];

function getFooterColumns(): FooterColumn[] {
  return footerColumnsI18n.map((col) => ({
    title: t(col.titleKey),
    links: col.links.map((link) => ({ label: t(link.labelKey), href: link.href })),
  }));
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
 * Güven kolonu: Dil ve Para Birimi seçicisi.
 * Mobilde tam genişlik ve ortalanmış; masaüstünde sağ kolon.
 */
function renderTrustColumn(): string {
  return `
    <div class="col-span-2 md:col-span-3 xl:col-span-1 flex flex-col items-center xl:items-start gap-5 pt-2 xl:pt-0 min-w-0">
      <div class="relative w-full xl:w-auto max-w-[320px] mx-auto xl:mx-0">
        <h3
          class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide mb-2.5 text-center xl:text-left"
          style="color: var(--footer-heading-color, #0a0a0a);"
        ><span data-i18n="footer.changeCountry">${t("footer.changeCountry")}</span></h3>
        <button
          id="footer-region-btn"
          type="button"
          aria-haspopup="true"
          aria-expanded="false"
          class="th-no-press flex items-center gap-2.5 w-full xl:w-auto xl:min-w-[210px] rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-3 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white cursor-pointer transition-colors duration-200 hover:border-primary-500"
        >
          ${globeIconSvg()}
          <span id="footer-region-label" class="truncate">${renderRegionLabel()}</span>
          <svg class="w-4 h-4 ml-auto shrink-0 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>
        </button>

        <!-- Dil + Para Birimi seçici (gizli, tıklayınca açılır) -->
        <div
          id="footer-region-menu"
          class="hidden absolute z-40 bottom-full mb-2 left-0 w-full xl:w-[260px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-4"
        >
          <label class="block text-[12px] font-semibold text-gray-900 dark:text-white mb-1.5" data-i18n="header.language">${t("header.language")}</label>
          <select id="footer-lang-select" class="th-input th-input-md cursor-pointer mb-3">
            ${FOOTER_LANGS.map((l) => `<option value="${l.code}">${l.label}</option>`).join("")}
          </select>
          <label class="block text-[12px] font-semibold text-gray-900 dark:text-white mb-1.5" data-i18n="header.currency">${t("header.currency")}</label>
          <select id="footer-currency-select" class="th-input th-input-md cursor-pointer mb-4">
            ${getFooterCurrencyCodes().map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
          <button id="footer-region-apply" type="button" class="th-btn w-full px-4 py-2 text-sm font-medium transition-colors">
            <span data-i18n="common.save">${t("common.save")}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * FooterLinks Component — tam footer'ı render eden tek giriş noktası.
 */
export function FooterLinks(): string {
  return `
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

/**
 * Footer dil/para birimi seçicisi.
 * Header'daki dil/para birimi popover'ıyla aynı mekanizmayı kullanır:
 * i18nextLng localStorage + setSelectedCurrency + reload.
 *
 * Footer birçok sayfada (multi-entry) render edildiği için handler,
 * her sayfaya init eklemek yerine document üzerinde tek sefer delegasyonla
 * bağlanır ve modül import edildiğinde otomatik başlatılır.
 */
let _footerRegionInit = false;

function populateFooterRegion(): void {
  const langSel = document.getElementById("footer-lang-select") as HTMLSelectElement | null;
  const curSel = document.getElementById("footer-currency-select") as HTMLSelectElement | null;
  if (langSel) langSel.value = getCurrentLang();
  if (curSel) {
    curSel.innerHTML = getFooterCurrencyCodes()
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");
    curSel.value = getSelectedCurrency().code;
  }
}

function applyFooterRegion(): void {
  const langSel = document.getElementById("footer-lang-select") as HTMLSelectElement | null;
  const curSel = document.getElementById("footer-currency-select") as HTMLSelectElement | null;
  const lang = langSel?.value || getCurrentLang();
  localStorage.setItem("i18nextLng", lang);
  if (curSel?.value) setSelectedCurrency(curSel.value);
  window.location.reload();
}

export function initFooterRegionSwitcher(): void {
  if (_footerRegionInit) return;
  _footerRegionInit = true;

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const menu = document.getElementById("footer-region-menu");
    if (!menu) return;

    // Buton: aç/kapat
    if (target.closest("#footer-region-btn")) {
      const willOpen = menu.classList.contains("hidden");
      if (willOpen) populateFooterRegion();
      menu.classList.toggle("hidden");
      document
        .getElementById("footer-region-btn")
        ?.setAttribute("aria-expanded", String(willOpen));
      return;
    }

    // Uygula
    if (target.closest("#footer-region-apply")) {
      applyFooterRegion();
      return;
    }

    // Menü dışına tıklama: kapat
    if (!target.closest("#footer-region-menu")) {
      menu.classList.add("hidden");
      document.getElementById("footer-region-btn")?.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const menu = document.getElementById("footer-region-menu");
    if (menu && !menu.classList.contains("hidden")) {
      menu.classList.add("hidden");
      document.getElementById("footer-region-btn")?.setAttribute("aria-expanded", "false");
    }
  });
}

// Multi-entry sayfalar footer'ı init çağırmadan render eder; import anında bağla.
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initFooterRegionSwitcher());
  } else {
    initFooterRegionSwitcher();
  }
}
