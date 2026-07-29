/**
 * Shared Breadcrumb Component
 * Reusable breadcrumb navigation for all pages (except homepage).
 * Always starts with "Home" (translated) -> ... -> current page.
 */

import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { getLucideIcon } from "../icons/lucideIcons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Render a breadcrumb navigation bar.
 * @param items - Array of breadcrumb items. Last item is rendered as plain text (current page).
 *                "Home" is automatically prepended using i18n.
 */
export function Breadcrumb(items: BreadcrumbItem[]): string {
  const allItems: BreadcrumbItem[] = [{ label: t("shared.home"), href: "/" }, ...items];
  // Referans ölçüler: kırıntılar 12px/regular/#222222, hover yalnız renk
  // koyulaşması (layout shift yok); ayraç sprite'taki lucide chevron-right.
  const separatorIcon = getLucideIcon(
    "chevron-right",
    "h-3.5 w-3.5 flex-shrink-0 text-gray-400"
  );
  const LINK_CLS =
    "text-[12px] leading-[16px] text-[#222] transition-colors hover:text-black hover:underline whitespace-nowrap truncate max-w-[60px] xs:max-w-[80px] sm:max-w-none";

  const crumbs = allItems.map((item, i) => {
    const isLast = i === allItems.length - 1;
    const isHome = i === 0;

    if (isLast) {
      // Referans davranış: son kırıntı da tıklanabilir (kategori sayfasına gider);
      // href yoksa düz metin olarak kalır.
      return item.href
        ? `<a href="${escapeHtml(sanitizeUrl(item.href))}" class="text-[12px] leading-[16px] text-[#222] transition-colors hover:text-black hover:underline truncate max-w-[140px] sm:max-w-[240px]">${escapeHtml(item.label)}</a>`
        : `<span class="text-[12px] leading-[16px] text-[#222] truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[240px]">${escapeHtml(item.label)}</span>`;
    }

    if (isHome) {
      return `
        <a href="${escapeHtml(sanitizeUrl(item.href ?? "#"))}" class="${LINK_CLS}"><span data-i18n="shared.home">${item.label}</span></a>
        ${separatorIcon}
      `;
    }

    return `
      <a href="${escapeHtml(sanitizeUrl(item.href ?? "#"))}" class="${LINK_CLS}">${escapeHtml(item.label)}</a>
      ${separatorIcon}
    `;
  });

  return `
    <nav aria-label="Breadcrumb" class="py-2 sm:py-3">
      <ol class="flex flex-wrap items-center gap-[4px]">
        ${crumbs.map((c) => `<li class="flex items-center gap-[4px] min-w-0">${c}</li>`).join("")}
      </ol>
    </nav>
  `;
}
