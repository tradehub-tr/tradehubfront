/**
 * FooterPolicy Component
 * Bottom bar with logo, policy links, and copyright notice
 * Layout: stacked on mobile, horizontal three-column on xl+
 */

import type { NavLink } from "../../types/navigation";
import { t } from "../../i18n";

/**
 * Policy links configuration with i18n keys
 */
interface PolicyLink {
  i18nKey: string;
  href: string;
}

const policyLinksDef: PolicyLink[] = [
  { i18nKey: "footer.legalNotice", href: "/yasal-uyari" },
  { i18nKey: "footer.privacyPolicy", href: "/gizlilik" },
  { i18nKey: "footer.productListing", href: "/urun-listeleme-kurallari" },
  { i18nKey: "footer.termsOfUse", href: "/kullanim-kosullari" },
  { i18nKey: "footer.cookiePolicy", href: "/cerezler" },
  { i18nKey: "footer.returnPolicy", href: "/iade-kosullari" },
  { i18nKey: "footer.distanceSales", href: "/mesafeli-satis" },
  { i18nKey: "footer.kvkk", href: "/kvkk" },
  { i18nKey: "footer.intellectualProperty", href: "/fikri-mulkiyet" },
  { i18nKey: "footer.accessibility", href: "/erisilebilirlik" },
];

/**
 * FooterPolicy Component
 * Renders the footer bottom bar with logo, policy links, and copyright.
 */
export function FooterPolicy(): string {
  return `
    <section class="dark:bg-gray-800/80 border-t dark:border-gray-700 py-5" style="background-color:var(--footer-bg);border-color:var(--footer-border-color)" aria-label="Policy links and copyright">
      <div class="container-boxed px-3 sm:px-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <!-- Policy Links -->
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[10px] sm:text-xs dark:text-gray-400" style="color:var(--footer-text-color)">
            ${policyLinksDef
              .map(
                (link) => `
              <a href="${link.href}" class="th-footer-link dark:hover:text-gray-200 transition-colors duration-200" data-i18n="${link.i18nKey}">${t(link.i18nKey)}</a>
            `
              )
              .join("")}
          </div>

          <!-- Operator + Copyright -->
          <div class="text-[10px] sm:text-xs dark:text-gray-500 text-center md:text-end whitespace-normal" style="color:var(--footer-text-color)">
            <p class="mb-0.5" data-i18n="footer.operatedBy">${t("footer.operatedBy")}</p>
            <p data-i18n="footer.copyright">${t("footer.copyright")}</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Get policy links data for use by other components
 */
export function getPolicyLinksData(): NavLink[] {
  return policyLinksDef.map((link) => ({
    label: t(link.i18nKey),
    href: link.href,
  }));
}
