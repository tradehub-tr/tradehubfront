/**
 * ProductCard Shared Component
 * Anchor element with lazy-loaded image, price range, and min order text.
 */

import type { ProductCardProps } from "../../types/buyerDashboard";
import { localizePriceString } from "../../utils/currency";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

export function ProductCard({ image, price, currency, minOrder, href }: ProductCardProps): string {
  return `
    <a href="${escapeHtml(sanitizeUrl(href))}" class="pc-mini block w-full min-w-0 max-w-[169.5px] flex-shrink-0 overflow-hidden [@media(hover:hover)and(pointer:fine)]:hover:shadow-md transition-shadow cursor-pointer">
      <div class="w-full aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <img
          src="${escapeHtml(sanitizeUrl(image))}"
          alt=""
          loading="lazy"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="p-(--space-card-padding) min-w-0">
        <p class="text-(length:--text-product-price) font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">${escapeHtml(localizePriceString(currency + price))}</p>
        <p class="text-(length:--text-product-meta) text-gray-400 dark:text-gray-500 mt-0.5 truncate">${escapeHtml(minOrder)}</p>
      </div>
    </a>
  `;
}
