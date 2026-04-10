/**
 * OperationSlider Component
 * Dynamic Swiper-based banner slider. Fetches banners from API via Alpine.
 * If no banners exist, the entire slider area is hidden.
 */

import { t } from '../../i18n';

export function OperationSlider(): string {
  return `
    <div x-data="dashboardBanners" x-show="banners.length > 0" x-cloak
         class="operation-slider group/opslider px-3 pb-3" aria-label="${t('dashboard.notifications')}">
      <div class="relative overflow-hidden bg-(--color-surface-raised,#f5f5f5) rounded-lg">
        <div class="swiper operation-slider__swiper overflow-hidden">
          <div class="swiper-wrapper">
            <template x-for="banner in banners" :key="banner.title">
              <div class="swiper-slide">
                <div class="flex items-center justify-between px-[clamp(0.75rem,0.5rem+1vw,1.25rem)] py-3 min-h-[44px] gap-2 sm:gap-4">
                  <span class="text-[clamp(0.75rem,0.7rem+0.2vw,0.875rem)] font-normal text-(--color-text-heading,#111827) whitespace-nowrap overflow-hidden text-ellipsis min-w-0" x-text="banner.title"></span>
                  <a :href="banner.link_href" class="text-[clamp(0.75rem,0.7rem+0.2vw,0.875rem)] text-(--color-text-heading,#111827) no-underline inline-flex items-center whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-(--color-cta-primary,#333333)">
                    <span x-text="banner.link_text"></span>
                    <svg class="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Custom Navigation Arrows (shown when multiple banners) -->
        <template x-if="banners.length > 1">
          <div>
            <button
              aria-label="${t('dashboard.prevNotification')}"
              class="operation-slider__prev absolute top-1/2 -translate-y-1/2 left-1 z-10 w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm border-none text-(--color-text-muted,#666666) cursor-pointer opacity-0 pointer-events-none transition-all duration-200 group-hover/opslider:opacity-100 group-hover/opslider:pointer-events-auto hover:text-(--color-text-heading,#111827)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              aria-label="${t('dashboard.nextNotification')}"
              class="operation-slider__next absolute top-1/2 -translate-y-1/2 right-1 z-10 w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm border-none text-(--color-text-muted,#666666) cursor-pointer opacity-0 pointer-events-none transition-all duration-200 group-hover/opslider:opacity-100 group-hover/opslider:pointer-events-auto hover:text-(--color-text-heading,#111827)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </template>
      </div>

      <!-- Custom Pagination (shown when multiple banners) -->
      <template x-if="banners.length > 1">
        <div class="operation-slider__pagination flex justify-center gap-1.5 pt-2 pb-1"></div>
      </template>
    </div>
  `;
}
