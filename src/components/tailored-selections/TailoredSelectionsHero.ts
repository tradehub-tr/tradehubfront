/**
 * TailoredSelectionsHero Component
 * Dark hero section with Swiper coverflow carousel of category cards.
 * Dimensions match the iSTOC referansı exactly:
 *   – Section height: ~419px (desktop)
 *   – Title wrapper: 1440px max-width, ~100px height
 *   – Swiper coverflow height: 291px
 *   – Center card: ~520×291, padding 16px
 *   – Side cards: ~442×247, scaled down via coverflow
 */

import Swiper from 'swiper';
import { Navigation, EffectCoverflow } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { t } from '../../i18n';
import type { TailoredCategory } from '../../types/tailoredSelections';

const BADGE_ICONS: Record<string, string> = {
  personal: '<svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.049 9.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.673z"/></svg>',
  trend:    '<svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>',
  quality:  '<svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>',
};

const BADGE_LABELS: Record<string, string> = {
  personal: 'İlgi Alanın',
  trend:    'Trend',
  quality:  'Kalite',
};

function renderBadge(badge?: string | null): string {
  if (!badge) return '';
  const icon = BADGE_ICONS[badge];
  const label = BADGE_LABELS[badge];
  if (!icon || !label) return '';
  return `
    <div class="ts-hero-badge absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm"
         style="background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.4); color: #fbbf24; font-size: 10px; font-weight: 800; letter-spacing: 0.3px;">
      ${icon}<span>${label}</span>
    </div>
  `;
}

function renderCategorySlide(category: TailoredCategory, index: number): string {
  const slug = category.slug || category.id;
  return `
    <div class="swiper-slide" style="height: auto;" data-bg-color="${category.bgColor}" data-category-slug="${slug}">
      <div
        class="ts-hero-card list-card-container relative rounded-md overflow-hidden h-full group cursor-pointer"
        style="--list-card-background-color: ${category.bgColor}; --list-card-border-color: #6a6145; --list-card-description-max-lines: 2; background-color: var(--list-card-background-color); border: 1px solid var(--list-card-border-color); padding: 16px;"
      >
        ${renderBadge(category.badge)}
        <!-- Background image -->
        <img
          src="${category.imageSrc}"
          alt="${category.title}"
          loading="${index <= 2 ? 'eager' : 'lazy'}"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <!-- Dynamic Gradient overlay -->
        <div
          class="absolute inset-0"
          style="background: linear-gradient(to top, var(--list-card-background-color) 10%, transparent 80%);"
        ></div>

        <!-- Content overlay -->
        <div class="relative z-10 flex flex-col justify-end h-full">
          <h3 class="list-card-header-title text-white font-bold text-base sm:text-lg leading-tight mb-1">
            ${category.title}
          </h3>
          <p class="list-card-content text-white/80 text-[13px] leading-[1.4]" style="display:-webkit-box;-webkit-line-clamp:var(--list-card-description-max-lines, 2);-webkit-box-orient:vertical;overflow:hidden;">
            ${category.description}
          </p>
        </div>
      </div>
    </div>
  `;
}

/** Standalone renderer — called from the page to refresh hero cards only. */
export function renderTailoredHeroCategories(categories: TailoredCategory[]): string {
  return categories.map((c, i) => renderCategorySlide(c, i)).join('');
}

export function initTailoredSelectionsHero(options?: { onCategoryChange?: (slug: string) => void }): void {
  const el = document.querySelector<HTMLElement>('.ts-hero-swiper');
  if (!el) return;

  // Loop + coverflow'un sağ/sol sarmalaması için Swiper yeterli clone ihtiyaç
  // duyar. < 3 slaytta "sağ ok stuck" oluyor. O durumda loop'u ve ok butonlarını
  // kapatıyoruz; ≥ 3 slaytta iki yönde de sorunsuz çalışır.
  const slideCount = el.querySelectorAll('.swiper-slide').length;
  const enableLoop = slideCount >= 3;

  const prevBtn = document.querySelector<HTMLElement>('.ts-hero-prev');
  const nextBtn = document.querySelector<HTMLElement>('.ts-hero-next');
  if (prevBtn) prevBtn.style.display = enableLoop ? '' : 'none';
  if (nextBtn) nextBtn.style.display = enableLoop ? '' : 'none';

  new Swiper(el, {
    modules: [Navigation, EffectCoverflow],
    effect: 'coverflow',
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
      scale: 0.85,
    },
    centeredSlides: true,
    loop: enableLoop,
    slideToClickedSlide: true,
    navigation: enableLoop ? {
      nextEl: '.ts-hero-next',
      prevEl: '.ts-hero-prev',
    } : false,
    on: {
      slideChange: function (swiper) {
        const activeSlide = swiper.slides[swiper.activeIndex];
        if (!activeSlide) return;
        const bgColor = activeSlide.getAttribute('data-bg-color');
        if (bgColor) {
          const heroSection = document.getElementById('ts-hero-section');
          if (heroSection) {
            heroSection.style.setProperty('--floor-background-color', bgColor);
          }
        }
        const slug = activeSlide.getAttribute('data-category-slug');
        if (slug && options?.onCategoryChange) {
          options.onCategoryChange(slug);
        }
      },
    },
    breakpoints: {
      0: { slidesPerView: 1.15 },
      480: { slidesPerView: 1.3 },
      768: { slidesPerView: 1.6 },
      1024: { slidesPerView: 2.2 },
      1200: { slidesPerView: 2.6 },
      1440: { slidesPerView: 2.8 },
    },
  });
}

export function TailoredSelectionsHero(categories: TailoredCategory[]): string {
  const initialBg = categories.length > 0 ? categories[0].bgColor : '#373224';
  return `
    <section
      id="ts-hero-section"
      class="alimod-sourcing-list-switch-floor relative overflow-hidden h-[320px] sm:h-[350px] md:h-[380px] xl:h-[419px]"
      style="--floor-background-color: ${initialBg}; --list-card-border-color: #6a6145; background-color: var(--floor-background-color); transition: background-color 0.5s ease;"
    >

      <!-- Title wrapper: max-width 1440px -->
      <div class="page-title-wrapper flex items-center justify-center mx-auto h-[60px] sm:h-[70px] xl:h-[100px]" style="max-width: 1440px; margin: 0 auto;">
        <h1 class="page-title text-white text-center font-semibold whitespace-nowrap hidden xl:block" style="font-size: 32px; line-height: 42px;">
          <span data-i18n="tailoredPage.title">${t('tailoredPage.title')}</span>
        </h1>
      </div>

      <!-- Coverflow Slider -->
      <div class="hugo5-coverflow-slider relative flex mx-auto overflow-hidden" style="max-width: 1440px; min-width: 0;">
        <div class="group/hero relative w-full">
          <div class="swiper ts-hero-swiper overflow-hidden h-[230px] sm:h-[250px] md:h-[270px] xl:h-[291px]" aria-label="Tailored selection categories">
            <div class="swiper-wrapper" style="align-items: stretch;">
              ${categories.map((c, i) => renderCategorySlide(c, i)).join('')}
            </div>
          </div>

          <!-- Navigation arrows (hidden on mobile — swipe works) -->
          <button
            aria-label="Previous categories"
            class="ts-hero-prev swiper-button absolute left-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 hidden md:flex items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition-all duration-200 hover:bg-white hover:text-gray-900 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <button
            aria-label="Next categories"
            class="ts-hero-next swiper-button absolute right-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 hidden md:flex items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition-all duration-200 hover:bg-white hover:text-gray-900 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>


      <!-- Triangle indicator -->
      <div class="triangle-indicator absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end">
        <svg fill="none" height="15" viewBox="0 0 32 15" width="32" xmlns="http://www.w3.org/2000/svg" class="block">
          <path d="M14.683 1.25513C15.437 0.595339 16.5631 0.595338 17.317 1.25513L30.9322 13.1683C32.115 14.2033 31.396 16.1423 29.8322 16.1423H2.16788C0.604044 16.1423 -0.114946 14.2033 1.0678 13.1683L14.683 1.25513Z" fill="white"/>
        </svg>
      </div>
    </section>
  `;
}
