/**
 * TopDeals Component (Homepage)
 * Alibaba-style "Top Deals" section: a fixed 6-product grid with no slider.
 * Layout: 2 cols mobile / 3 cols tablet / 6 cols desktop.
 * Products are loaded from the API filtered by is_deal=1 (sorted by biggest
 * discount first).
 */

import { t } from '../../i18n';
import { formatStartingPrice } from '../../utils/currency';
import { searchListings } from '../../services/listingService';
import { initCurrency } from '../../services/currencyService';

interface TopDealCard {
  name: string;
  href: string;
  price: string;
  imageSrc: string;
  moqCount: number;
  moqUnitKey: string;
  /** Already converted starting price (e.g. "₺123,00") */
  startingPrice?: string;
  /** Original (pre-discount) price as currency-formatted string, e.g. "₺1.000,00" */
  originalPrice?: string;
  /** Numeric discount percent for the corner badge (0-100) */
  discountPercent?: number;
}

const FIXED_GRID_COUNT = 6;

function lightningBoltIcon(): string {
  return `
    <svg class="h-4 w-auto flex-shrink-0" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5948 30.1888L0.735054 19.2232C0.221831 18.5826 0.604285 17.5239 1.34894 17.5239L6.20746 17.5239C6.77424 10.7461 10.1716 2.20349 20.7371 0.585977C21.9772 0.396125 23.4376 0.585405 24.5 0.585787C16.6194 3.93595 16.33 12.2572 16.2123 17.5239L21.5078 17.5239C22.2623 17.5239 22.6405 18.6069 22.1072 19.2408L11.8082 30.2064C11.4715 30.6066 10.9232 30.5987 10.5948 30.1888Z" fill="url(#paint0_linear_topdeals)"/>
      <defs>
        <linearGradient id="paint0_linear_topdeals" x1="11.4284" y1="30.5016" x2="11.2898" y2="-0.282995" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF988C"/>
          <stop offset="1" stop-color="#FFECEB"/>
        </linearGradient>
      </defs>
    </svg>
  `;
}

function renderDealImage(card: TopDealCard): string {
  if (!card.imageSrc) {
    return `
      <div class="w-full h-full flex items-center justify-center bg-gray-100">
        <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/>
        </svg>
      </div>
    `;
  }
  return `
    <img
      src="${card.imageSrc}"
      alt="${card.name}"
      loading="lazy"
      class="w-full h-full object-cover transition-transform duration-300 group-hover/deal:scale-110"
    />
  `;
}

function renderDealCard(card: TopDealCard): string {
  const moqI18nOptions = JSON.stringify({ count: card.moqCount, unit: t(card.moqUnitKey) });
  const moqText = t('topDeals.moq', { count: card.moqCount, unit: t(card.moqUnitKey) });

  // Discount badge — top-left of image, only when we have a positive percent.
  const discountBadge = card.discountPercent && card.discountPercent > 0
    ? `<span
         class="absolute top-2 left-2 z-10 inline-flex items-center rounded-sm font-bold leading-none text-white"
         style="background-color: var(--topdeals-badge-bg, #DE0505); padding: 3px 5px; font-size: 10px;"
       >%${card.discountPercent}</span>`
    : '';

  // Strikethrough original price — only when present and different from current.
  const originalPriceLabel = card.originalPrice
    ? `<span
         class="line-through shrink-0"
         style="color: var(--topdeals-original-price-color, #9ca3af); font-size: 11px;"
       >${card.originalPrice}</span>`
    : '';

  return `
    <a
      href="${card.href}"
      class="group/deal relative flex flex-col min-w-0"
      aria-label="${card.name}"
    >
      <!-- Image with discount badge overlay -->
      <div class="relative aspect-square w-full mb-2 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        ${discountBadge}
        ${renderDealImage(card)}
      </div>

      <!-- Product name: 2-line truncate, fixed height so card heights stay aligned -->
      <p
        class="leading-snug line-clamp-2"
        style="color: var(--topdeals-name-color, #6b7280); font-size: 13px; min-height: 2.6em;"
        title="${card.name}"
      >${card.name}</p>

      <!-- Price row: deal price + strikethrough original (no MOQ here) -->
      <div class="mt-1.5 flex items-center gap-1.5 min-w-0">
        <span
          class="inline-flex items-center gap-0.5 rounded-sm shrink-0"
          style="background: var(--topdeals-price-bg, #FFEDED); padding: 2px 8px 2px 4px;"
        >
          ${lightningBoltIcon()}
          <span
            class="font-bold leading-none"
            style="color: var(--topdeals-price-color, #dc2626); font-size: var(--text-product-price, 15px);"
          >${card.startingPrice || card.price}</span>
        </span>
        ${originalPriceLabel}
      </div>

      <!-- MOQ on its own row, always below the price row -->
      <p
        class="mt-1 leading-none truncate"
        style="color: var(--topdeals-moq-color, #9ca3af); font-size: 11px;"
      ><span data-i18n="topDeals.moq" data-i18n-options='${moqI18nOptions}'>${moqText}</span></p>
    </a>
  `;
}

/** Skeleton placeholder used while the API request is in flight. */
function renderSkeletonCard(): string {
  return `
    <div class="flex flex-col min-w-0 animate-pulse">
      <div class="aspect-square w-full mb-2 rounded-md bg-gray-200"></div>
      <div class="h-3 w-full rounded bg-gray-200 mb-1"></div>
      <div class="h-3 w-3/4 rounded bg-gray-200 mb-2"></div>
      <div class="flex items-center gap-2">
        <div class="h-5 w-16 rounded bg-gray-200"></div>
        <div class="h-3 w-10 rounded bg-gray-200"></div>
      </div>
    </div>
  `;
}

export function initTopDeals(): void {
  const grid = document.getElementById('top-deals-grid');
  if (!grid) return;

  // Render skeletons while loading so layout doesn't jump
  grid.innerHTML = Array.from({ length: FIXED_GRID_COUNT }).map(renderSkeletonCard).join('');

  initCurrency()
    .then(() => searchListings({ is_deal: true, page_size: FIXED_GRID_COUNT, sort_by: 'discount' }))
    .then(result => {
      const empty = document.getElementById('top-deals-empty');
      if (result.products.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.style.display = '';
        return;
      }
      if (empty) empty.style.display = 'none';

      const cards: TopDealCard[] = result.products.slice(0, FIXED_GRID_COUNT).map(p => ({
        name: p.name,
        href: p.href || `/pages/product-detail.html?id=${p.id}`,
        price: p.price,
        startingPrice: formatStartingPrice(p.price),
        // p.originalPrice is already currency-formatted by mapListingCard
        originalPrice: p.originalPrice || undefined,
        discountPercent: p.discountPercentage && p.discountPercentage > 0
          ? Math.round(p.discountPercentage)
          : undefined,
        imageSrc: p.imageSrc || '',
        moqCount: parseInt(p.moq) || 1,
        moqUnitKey: 'topDeals.pieces',
      }));
      grid.innerHTML = cards.map(renderDealCard).join('');
    })
    .catch(err => {
      console.warn('[TopDeals] API load failed:', err);
      grid.innerHTML = '';
      const empty = document.getElementById('top-deals-empty');
      if (empty) empty.style.display = '';
    });
}

export function TopDeals(): string {
  return `
    <section class="py-4 lg:py-6" aria-label="Top Deals" style="margin-top: 28px;">
      <div class="container-boxed">
        <div class="rounded-md" style="background-color: var(--topdeals-bg, #F8F8F8); padding: var(--space-card-padding, 16px);">
          <!-- Section header -->
          <div class="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2
                class="text-[20px] sm:text-[22px] font-bold leading-tight"
                style="color: var(--topdeals-title-color, #111827);"
              ><span data-i18n="topDeals.title">${t('topDeals.title')}</span></h2>
              <p
                class="mt-0.5 text-[13px]"
                style="color: var(--topdeals-subtitle-color, #6b7280);"
              ><span data-i18n="topDeals.subtitle">${t('topDeals.subtitle')}</span></p>
            </div>
            <a
              href="/pages/top-deals.html"
              class="flex-shrink-0 text-[13px] font-semibold transition-colors duration-150 hover:underline"
              style="color: var(--topdeals-link-color, #111827);"
            ><span data-i18n="common.viewMore">${t('common.viewMore')}</span> &gt;</a>
          </div>

          <!-- Fixed 6-product grid -->
          <div
            id="top-deals-grid"
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4"
            aria-label="Top deal products"
          ></div>

          <!-- Empty state (hidden by default; shown when API returns no products) -->
          <div id="top-deals-empty" class="flex items-center justify-center py-12" style="display:none;">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="text-sm text-gray-400" data-i18n="topDeals.empty">${t('topDeals.empty')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
