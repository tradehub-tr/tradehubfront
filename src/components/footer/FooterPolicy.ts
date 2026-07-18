/**
 * FooterPolicy Component (Siyah Bant)
 * Near-black kapanış bandı: sosyal ikonlar solda, app rozetleri sağda,
 * altta hairline ile ayrılmış TEK satır telif metni.
 * Politika linkleri artık ana bölgedeki politika satırında (FooterLinks).
 */

import type { NavLink } from "../../types/navigation";
import { t } from "../../i18n";

interface SocialLink {
  platform: string;
  href: string;
  ariaLabel: string;
}

const socialLinks: SocialLink[] = [
  { platform: "instagram", href: "https://www.instagram.com/istoc_com", ariaLabel: "Follow us on Instagram" },
  { platform: "facebook", href: "https://www.facebook.com/istoccom", ariaLabel: "Follow us on Facebook" },
  { platform: "twitter", href: "https://x.com/istoc_com", ariaLabel: "Follow us on X (Twitter)" },
  { platform: "linkedin", href: "https://www.linkedin.com/company/istoc-com", ariaLabel: "Connect with us on LinkedIn" },
  { platform: "youtube", href: "https://youtube.com/@istoccom", ariaLabel: "Subscribe to our YouTube channel" },
];

function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    facebook: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd" />
    </svg>`,
    instagram: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 4.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" />
    </svg>`,
    twitter: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>`,
    linkedin: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>`,
    youtube: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fill-rule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clip-rule="evenodd" />
    </svg>`,
  };
  return icons[platform] || "";
}

function renderSocialRow(): string {
  return `
    <div class="flex items-center gap-2.5">
      ${socialLinks
        .map(
          (link) => `
        <a
          href="${link.href}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center w-9 h-9 rounded-full border border-neutral-700 text-neutral-400 transition-colors duration-200 hover:bg-primary-500 hover:border-primary-500 hover:text-secondary-900"
          aria-label="${link.ariaLabel}"
        >
          ${getSocialIcon(link.platform)}
        </a>
      `
        )
        .join("")}
    </div>
  `;
}

function renderStoreBadges(): string {
  const badge =
    "th-no-press inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-black px-3 py-1.5 text-white transition-colors duration-200 hover:border-neutral-500";
  return `
    <div class="flex flex-wrap items-center justify-center gap-2">
      <a href="#" class="${badge}" aria-label="App Store">
        <svg class="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
        <span class="text-left leading-none">
          <span class="block text-[8px] text-neutral-400" data-i18n="footer.downloadOn">${t("footer.downloadOn")}</span>
          <span class="block text-[12px] font-semibold mt-0.5">App Store</span>
        </span>
      </a>
      <a href="#" class="${badge}" aria-label="Google Play">
        <svg class="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.59.69.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5 2.27 1.31zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/></svg>
        <span class="text-left leading-none">
          <span class="block text-[8px] text-neutral-400" data-i18n="footer.downloadOn">${t("footer.downloadOn")}</span>
          <span class="block text-[12px] font-semibold mt-0.5">Google Play</span>
        </span>
      </a>
    </div>
  `;
}

/**
 * FooterPolicy Component — siyah kapanış bandı.
 */
export function FooterPolicy(): string {
  return `
    <section class="bg-secondary-800" aria-label="Social media, apps and copyright">
      <div class="container-boxed px-3 sm:px-4">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-5">
          ${renderSocialRow()}
          ${renderStoreBadges()}
        </div>
        <div class="border-t border-neutral-800 py-3.5 text-center">
          <p class="text-[11px] sm:text-[12px] text-neutral-400" data-i18n="footer.copyright">${t("footer.copyright")}</p>
        </div>
      </div>
    </section>
  `;
}

/**
 * Get policy links data for use by other components
 * @deprecated Politika linkleri FooterLinks içindeki politika satırına taşındı.
 */
export function getPolicyLinksData(): NavLink[] {
  return [];
}
