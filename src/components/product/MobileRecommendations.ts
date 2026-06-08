/**
 * MobileRecommendations Component
 * Mobile-only "Önerilen" carousels modeled after Alibaba's app product page:
 *   1. Bu tedarikçiden benzer ürünler  → searchListings({ supplier })
 *   2. Bu mağazanın çok satanları       → searchListings({ supplier, is_best_seller })
 *   3. Size benzer alıcıların aldığı     → getFeaturedListings()
 *
 * Each row is a lightweight CSS scroll-snap carousel (no Swiper) to match the
 * native gallery pattern already used in MobileLayout. Rows whose fetch returns
 * nothing are removed so empty headers never show.
 */

import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { getCurrentProduct } from "../../alpine/product";
import { searchListings, getFeaturedListings } from "../../services/listingService";
import type { ProductListingCard } from "../../types/productListing";

interface RecRow {
  key: string;
  title: string;
  fetch: (supplierId: string, currentId: string) => Promise<ProductListingCard[]>;
}

const ROWS: RecRow[] = [
  {
    key: "similar",
    title: "similarFromSupplier",
    fetch: (supplierId) =>
      supplierId
        ? searchListings({ supplier: supplierId, page_size: 10 }).then((r) => r.products)
        : Promise.resolve([]),
  },
  {
    key: "bestsellers",
    title: "storeBestSellers",
    fetch: (supplierId) =>
      supplierId
        ? searchListings({ supplier: supplierId, is_best_seller: true, page_size: 10 }).then(
            (r) => r.products
          )
        : Promise.resolve([]),
  },
  {
    key: "featured",
    title: "buyersAlsoBought",
    fetch: () => getFeaturedListings(10),
  },
];

function recCard(card: ProductListingCard): string {
  const safeName = escapeHtml(card.name);
  return `
    <a href="${escapeHtml(sanitizeUrl(card.href))}" class="mrec-card shrink-0 basis-[42%] max-[374px]:basis-[46%] [scroll-snap-align:start] no-underline text-inherit" aria-label="${safeName}">
      <div class="aspect-square w-full overflow-hidden rounded-lg bg-surface-raised">
        ${
          card.imageSrc
            ? `<img src="${escapeHtml(sanitizeUrl(card.imageSrc))}" alt="${safeName}" class="w-full h-full object-cover" loading="lazy" />`
            : `<div class="w-full h-full flex items-center justify-center text-text-placeholder">
                <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </div>`
        }
      </div>
      <div class="mt-1.5">
        <div class="text-sm font-bold text-text-heading leading-tight">${escapeHtml(card.price)}</div>
        <div class="text-[11px] text-text-muted mt-0.5 truncate">${escapeHtml(card.moq)}${card.stats ? ` &middot; ${escapeHtml(card.stats)}` : ""}</div>
      </div>
    </a>
  `;
}

function recRow(row: RecRow): string {
  return `
    <div class="mrec-row hidden" data-mrec-row="${row.key}">
      <div class="pdm-section-divider h-2 bg-surface-raised"></div>
      <div class="bg-surface px-4 pt-4 pb-1 max-[374px]:px-3">
        <h2 class="text-[15px] font-bold text-text-heading m-0">${t(`product.${row.title}`)}</h2>
      </div>
      <div class="mrec-track flex gap-3 overflow-x-auto px-4 pb-4 pt-2 max-[374px]:px-3 [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-mrec-track="${row.key}"></div>
    </div>
  `;
}

export function MobileRecommendations(): string {
  return `
    <div id="pdm-recommendations">
      ${ROWS.map(recRow).join("")}
    </div>
  `;
}

export function initMobileRecommendations(): void {
  if (window.matchMedia("(min-width: 1024px)").matches) return;

  const product = getCurrentProduct();
  const supplierId = product.supplier?.id ?? "";
  const currentId = product.id ?? "";

  ROWS.forEach((row) => {
    const track = document.querySelector<HTMLElement>(`[data-mrec-track="${row.key}"]`);
    const rowEl = document.querySelector<HTMLElement>(`[data-mrec-row="${row.key}"]`);
    if (!track || !rowEl) return;

    row
      .fetch(supplierId, currentId)
      .then((cards) => {
        // Drop the current product from its own recommendation rows.
        const filtered = cards.filter((c) => c.id !== currentId);
        if (filtered.length === 0) {
          rowEl.remove();
          return;
        }
        track.innerHTML = filtered.map(recCard).join("");
        rowEl.classList.remove("hidden");
      })
      .catch(() => rowEl.remove());
  });
}
