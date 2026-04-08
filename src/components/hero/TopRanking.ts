/**
 * TopRanking Component
 * En çok satan ürünleri gösterir — API'den order_count DESC sırasıyla çeker.
 */

import topBadgeUrl from '../../assets/images/top.avif';
import { t } from '../../i18n';
import { searchListings } from '../../services/listingService';
import { initCurrency } from '../../services/currencyService';
import { formatPrice } from '../../utils/currency';

/* ── Skeleton card ── */
function renderSkeletonCard(): string {
  return `
    <div class="flex-shrink-0 flex flex-col w-[156px] sm:w-[188px] h-[230px] sm:h-[262px] rounded-md border border-gray-100 animate-pulse"
         style="background: var(--topranking-card-bg, #ffffff); padding: var(--space-card-padding, 12px);">
      <div class="flex-1 rounded-md bg-gray-200"></div>
      <div class="mt-7 space-y-1.5">
        <div class="h-3.5 w-4/5 rounded bg-gray-200"></div>
        <div class="h-3 w-3/5 rounded bg-gray-200"></div>
        <div class="h-3 w-2/5 rounded bg-gray-200"></div>
      </div>
    </div>
  `;
}

/* ── Product card ── */
function renderProductCard(p: {
  id: string;
  name: string;
  href: string;
  price: string;
  stats: string;
  imageSrc?: string;
}): string {
  const safeName = p.name.replace(/"/g, '&quot;');
  const imgHtml = p.imageSrc
    ? `<img src="${p.imageSrc}" alt="${safeName}" loading="lazy"
            class="w-full h-full object-cover transition-transform duration-300 group-hover/rank:scale-110" />`
    : `<div class="w-full h-full flex items-center justify-center">
         <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
             d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
         </svg>
       </div>`;

  return `
    <a
      href="${p.href}"
      class="group/rank relative flex-shrink-0 flex flex-col w-[156px] sm:w-[188px] h-[230px] sm:h-[262px] rounded-md border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md no-underline"
      style="background: var(--topranking-card-bg, #ffffff); border-color: var(--topranking-card-border, #e5e7eb); padding: var(--space-card-padding, 12px);"
      aria-label="${safeName}"
    >
      <!-- Image area -->
      <div class="relative w-full flex-1 min-h-0">
        <div class="absolute inset-0 overflow-hidden rounded-md bg-gray-100">
          ${imgHtml}
        </div>
        <!-- TOP badge -->
        <div class="absolute -bottom-5 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <img src="${topBadgeUrl}" alt="" class="h-[48px] w-[48px] object-contain drop-shadow" loading="lazy" />
        </div>
      </div>

      <!-- Info area -->
      <div class="flex flex-col min-w-0" style="margin-top: 28px;">
        <p class="truncate font-semibold leading-tight text-sm"
           style="color: var(--topranking-name-color, #222222);"
           title="${safeName}">${p.name}</p>
        <p class="truncate text-xs font-semibold mt-0.5"
           style="color: var(--topranking-label-color, #111827);">${formatPrice(p.price)}</p>
      </div>
    </a>
  `;
}

/** Render skeleton rows while API loads */
export function TopRanking(): string {
  const skeletons = Array.from({ length: 8 }, () => `<div role="listitem">${renderSkeletonCard()}</div>`).join('');

  return `
    <section class="py-4 lg:py-6" aria-label="Top Ranking" style="margin-top: 28px;">
      <div class="container-boxed">
        <div class="relative overflow-hidden rounded-md" style="background-color: var(--topranking-bg, #F5F5F5);">
          <div style="padding: var(--space-card-padding, 20px);">
            <!-- Section header -->
            <div class="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 class="text-[20px] sm:text-[22px] font-bold leading-tight"
                    style="color: var(--topranking-title-color, #111827);">
                  <span data-i18n="topRanking.title">${t('topRanking.title')}</span>
                </h2>
                <p class="mt-0.5 text-[13px]" style="color: var(--topranking-subtitle-color, #6b7280);">
                  <span data-i18n="topRanking.subtitle">${t('topRanking.subtitle')}</span>
                </p>
              </div>
              <a href="/pages/top-ranking.html"
                 class="flex-shrink-0 text-[13px] font-semibold transition-colors duration-150 hover:underline no-underline"
                 style="color: var(--topranking-link-color, #111827);">
                <span data-i18n="common.viewMore">${t('common.viewMore')}</span> &gt;
              </a>
            </div>

            <!-- Cards row -->
            <div id="top-ranking-cards"
                 class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                 role="list"
                 aria-label="Top ranking products">
              ${skeletons}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/** Fetch best-sellers from API and replace skeletons */
export function initTopRanking(): void {
  initCurrency()
    .then(() => searchListings({ sort_by: 'orders', page_size: 12 }))
    .then(result => {
      const container = document.getElementById('top-ranking-cards');
      if (!container) return;

      const products = result.products;
      if (!products.length) {
        container.innerHTML = `
          <div class="flex items-center justify-center py-12 w-full">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="text-sm text-gray-400">Yakında yeni ürünler eklenecek</p>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = products
        .map(p => `<div role="listitem">${renderProductCard({
          id: p.id,
          name: p.name,
          href: p.href || `/pages/product-detail.html?id=${p.id}`,
          price: p.price,
          stats: p.stats || '',
          imageSrc: p.imageSrc,
        })}</div>`)
        .join('');
    })
    .catch(err => {
      console.warn('[TopRanking] API load failed:', err);
      const container = document.getElementById('top-ranking-cards');
      if (container) container.innerHTML = '';
    });
}
