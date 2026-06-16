/**
 * PromotionBanner Shared Component
 * Colored card with title, subtitle, and image.
 */

import type { PromotionBannerProps } from "../../types/buyerDashboard";
import { escapeHtml, sanitizeUrl, safeHexColor } from "../../utils/sanitize";

export function PromotionBanner({
  title,
  subtitle,
  image,
  bgColor,
  href,
}: PromotionBannerProps): string {
  return `
    <a href="${escapeHtml(sanitizeUrl(href))}" class="block rounded-lg overflow-hidden [@media(hover:hover)and(pointer:fine)]:hover:shadow-sm transition-shadow" style="background-color: ${safeHexColor(bgColor, "#ffffff")}">
      <div class="flex items-center justify-between p-3 xs:p-4">
        <div class="flex-1 min-w-0 pe-2 xs:pe-3">
          <p class="text-xs xs:text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">${escapeHtml(title)}</p>
          <p class="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 mt-0.5 xs:mt-1">${escapeHtml(subtitle)}</p>
        </div>
        <img
          src="${escapeHtml(sanitizeUrl(image))}"
          alt="${escapeHtml(title)}"
          loading="lazy"
          class="w-12 h-12 xs:w-16 xs:h-16 object-cover rounded-md flex-shrink-0"
        />
      </div>
    </a>
  `;
}
