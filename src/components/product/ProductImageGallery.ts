/**
 * ProductImageGallery Component
 * iSTOC-style: vertical scrollable thumbnail strip (left) + large main image (right).
 * Thumbnails change main image on HOVER. Up/down scroll arrows on thumbnail strip.
 * Prev/next arrows on main image. Favorite + camera icons top-right.
 * Gallery container uses aspect-ratio 16/10 matching iSTOC layout.
 *
 * Interactivity powered by Alpine.js (imageGallery component registered in alpine.ts).
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { ProductAttributes } from "./ProductAttributes";

interface GalleryVisual {
  background: string;
  accent: string;
  stroke: string;
  icon: string;
}

export const ZOOM_SCALE = 1.85;

export const defaultVisual: GalleryVisual = {
  background: "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)",
  accent: "rgba(156, 163, 175, 0.2)",
  stroke: "#9ca3af",
  icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`,
};

function renderPlaceholder(visual: GalleryVisual, size: "large" | "thumb"): string {
  const svgSize = size === "large" ? 'width="64" height="64"' : 'width="24" height="24"';
  return `
    <div class="w-full h-full flex items-center justify-center" style="background: ${visual.background};" data-gallery-main-media="true" aria-hidden="true">
      <svg ${svgSize} fill="none" stroke-width="1.4" viewBox="0 0 24 24" style="stroke: ${visual.stroke};">
        ${visual.icon}
      </svg>
    </div>
  `;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderGalleryMedia(
  src: string | undefined,
  alt: string,
  visual: GalleryVisual,
  size: "large" | "thumb"
): string {
  if (src) {
    const safeAlt = escapeHtmlAttr(alt);
    return `
      <img
        src="${src}"
        alt="${safeAlt}"
        data-gallery-main-media="true"
        class="gallery-media-asset gallery-media-asset--${size} w-full h-full object-cover select-none pointer-events-none"
        loading="${size === "thumb" ? "lazy" : "eager"}"
        decoding="${size === "thumb" ? "async" : "sync"}"
        draggable="false"
      />
    `;
  }

  return renderPlaceholder(visual, size);
}

export const THUMB_SIZE = 60;
export const THUMB_GAP = 6;
export const LIGHTBOX_THUMB_SIZE = 76;
export const LIGHTBOX_THUMB_GAP = 10;

export function ProductImageGallery(): string {
  const mockProduct = getCurrentProduct();
  const images = mockProduct.images;
  const needsScroll = images.length > 4;
  const firstImage = images[0];
  const needsLightboxThumbScroll = images.length > 6;

  const thumbsHtml = images
    .map((img, i) => {
      if (img.isVideo) {
        return `
        <div
          class="gallery-thumb gallery-thumb-video relative w-[60px] h-[60px] rounded-md overflow-hidden shrink-0 border-2 border-[var(--color-border-default,#e5e5e5)] cursor-pointer transition-colors duration-150 [&.active]:border-[var(--color-text-heading)] [&:hover:not(.active)]:border-[var(--color-border-strong)]"
          :class="{ 'active': currentIndex === ${i} }"
          data-index="${i}"
          aria-label="Video"
          @mouseenter="goToSlide(${i})"
          @click="goToSlide(${i})"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] font-bold px-1 rounded">VIDEO</span>
        </div>
      `;
      }
      return `
      <div
        class="gallery-thumb w-[60px] h-[60px] rounded-md overflow-hidden shrink-0 border-2 border-[var(--color-border-default,#e5e5e5)] cursor-pointer transition-colors duration-150 [&.active]:border-[var(--color-text-heading)] [&:hover:not(.active)]:border-[var(--color-border-strong)]"
        :class="{ 'active': currentIndex === ${i} }"
        data-index="${i}"
        aria-label="${img.alt}"
        @mouseenter="goToSlide(${i})"
        @click="goToSlide(${i})"
      >${renderGalleryMedia(img.src, img.alt, defaultVisual, "thumb")}</div>
    `;
    })
    .join("");

  // Attributes thumbnail — last slide
  const attrThumbHtml = `
    <div
      class="gallery-thumb gallery-thumb-attrs w-[60px] h-[60px] rounded-md overflow-hidden shrink-0 border-2 border-[var(--color-border-default,#e5e5e5)] cursor-pointer transition-colors duration-150 [&.active]:border-[var(--color-text-heading)] [&:hover:not(.active)]:border-[var(--color-border-strong)]"
      :class="{ 'active': currentIndex === ${images.length} }"
      data-index="${images.length}"
      aria-label="${t("product.attributesTab")}"
      @mouseenter="goToSlide(${images.length})"
      @click="goToSlide(${images.length})"
    >
      <div class="relative w-full h-full overflow-hidden flex items-center justify-center" style="background: linear-gradient(180deg, #f0f4f8 0%, #e2e8f0 100%);" aria-hidden="true">
        <svg width="24" height="24" fill="none" stroke="#64748b" stroke-width="1.4" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </div>
    </div>
  `;

  const lightboxThumbsHtml = images
    .map((img, i) => {
      if (img.isVideo) {
        return `
        <button
          type="button"
          class="gallery-lightbox-thumb relative w-[76px] h-[76px] border-2 border-white/30 rounded-md bg-white/10 p-0 overflow-hidden cursor-pointer shrink-0 transition-colors duration-150 ease-in-out [&.active]:border-[var(--color-surface)] max-[960px]:!w-[68px] max-[960px]:!h-[68px]"
          :class="{ 'active': lightboxIndex === ${i} }"
          data-index="${i}"
          aria-label="Video"
          @click="selectLightboxThumb(${i})"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] font-bold px-1 rounded">VIDEO</span>
        </button>
      `;
      }
      return `
      <button
        type="button"
        class="gallery-lightbox-thumb w-[76px] h-[76px] border-2 border-white/30 rounded-md bg-white/10 p-0 overflow-hidden cursor-pointer shrink-0 transition-colors duration-150 ease-in-out [&.active]:border-[var(--color-surface)] max-[960px]:!w-[68px] max-[960px]:!h-[68px]"
        :class="{ 'active': lightboxIndex === ${i} }"
        data-index="${i}"
        aria-label="${img.alt}"
        @click="selectLightboxThumb(${i})"
      >${renderGalleryMedia(img.src, img.alt, defaultVisual, "thumb")}</button>
    `;
    })
    .join("");

  // ──────────────────────────────────────────────────────────────
  // DISABLED: "Find similar" (visual search) button - lightbox toolbar
  // İleride tekrar etkinleştirmek için aşağıdaki findSimilarButtonHtml'i
  // aktif et ve return template'inde `gallery-lightbox-actions` div'i
  // içinde Favorite butonundan sonra ${'$'}{findSimilarButtonHtml} olarak ekle.
  //
  // const findSimilarButtonHtml = `
  //   <button type="button" class="gallery-lightbox-action-btn max-[960px]:!text-[15px] max-[960px]:!gap-[5px]" aria-label="${t('product.findSimilar')}">
  //     <svg width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
  //       <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h2A2.5 2.5 0 0 1 10 7.5v2A2.5 2.5 0 0 1 7.5 12h-2A2.5 2.5 0 0 1 3 9.5v-2zm11 0A2.5 2.5 0 0 1 16.5 5h2A2.5 2.5 0 0 1 21 7.5v2a2.5 2.5 0 0 1-2.5 2.5h-2A2.5 2.5 0 0 1 14 9.5v-2zm-11 9A2.5 2.5 0 0 1 5.5 14h2A2.5 2.5 0 0 1 10 16.5v2A2.5 2.5 0 0 1 7.5 21h-2A2.5 2.5 0 0 1 3 18.5v-2zm13.5-2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 2.5v2l1.6 1"/>
  //     </svg>
  //     <span class="max-[960px]:hidden">Find similar</span>
  //   </button>
  // `;
  // ──────────────────────────────────────────────────────────────

  return `
    <div x-data="imageGallery">
    <div id="product-gallery" class="flex gap-2.5 items-stretch aspect-[16/10] w-full relative overflow-hidden">

      <!-- LEFT: Vertical Thumbnail Strip (hidden on narrow desktop, shown on wider) -->
      <div id="pd-thumb-strip" class="hidden 2xl:flex flex-col items-center shrink-0 w-[68px]">

        ${
          needsScroll
            ? `
        <button type="button" id="thumb-scroll-up" class="pd-thumb-arrow flex items-center justify-center w-[56px] h-[28px] rounded-md border cursor-pointer flex-shrink-0 transition-colors hover:text-[var(--color-text-body,#333)] hover:border-[var(--color-border-medium,#d1d5db)]" style="background: var(--color-surface, #ffffff); border-color: var(--color-border-default, #e5e5e5); color: var(--color-text-tertiary);" aria-label="${t("product.scrollUp")}" @click="scrollThumbs(-1)">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        </button>
        `
            : ""
        }

        <div id="gallery-thumb-list" x-ref="thumbList" class="flex flex-col gap-1.5 overflow-hidden flex-1 py-1.5">
          ${thumbsHtml}
          ${attrThumbHtml}
        </div>

        ${
          needsScroll
            ? `
        <button type="button" id="thumb-scroll-down" class="pd-thumb-arrow flex items-center justify-center w-[56px] h-[28px] rounded-md border cursor-pointer flex-shrink-0 transition-colors hover:text-[var(--color-text-body,#333)] hover:border-[var(--color-border-medium,#d1d5db)]" style="background: var(--color-surface, #ffffff); border-color: var(--color-border-default, #e5e5e5); color: var(--color-text-tertiary);" aria-label="${t("product.scrollDown")}" @click="scrollThumbs(1)">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        `
            : ""
        }

      </div>

      <!-- RIGHT: Main Image Area (content only) -->
      <div id="gallery-main-image"
        class="flex-1 min-w-0 relative rounded overflow-hidden bg-[var(--color-surface-raised,#f5f5f5)] pointer-coarse:cursor-default [&.zoom-enabled]:cursor-zoom-in [&.zoom-enabled>[data-gallery-main-media=true]]:transition-transform [&.zoom-enabled>[data-gallery-main-media=true]]:duration-[180ms] [&.zoom-enabled>[data-gallery-main-media=true]]:ease-out [&.zoom-enabled>[data-gallery-main-media=true]]:origin-center [&.zoom-enabled>[data-gallery-main-media=true]]:will-change-transform [&.is-zooming>[data-gallery-main-media=true]]:transition-transform [&.is-zooming>[data-gallery-main-media=true]]:duration-[30ms] [&.is-zooming>[data-gallery-main-media=true]]:ease-linear"
        x-ref="mainImage"
        :class="{ 'hidden': currentIndex === attrsIndex, 'zoom-enabled': supportsHoverZoom && !isVideoSlide(), 'is-zooming': isZooming && !isVideoSlide() }"
        @pointermove="!isVideoSlide() && handleZoomMove($event)"
        @pointerleave="resetZoom()"
        @click="currentIndex !== attrsIndex && !isVideoSlide() && openLightbox(currentIndex)"
      >
        ${renderGalleryMedia(firstImage?.src, firstImage?.alt ?? t("product.productImage"), defaultVisual, "large")}
      </div>

      <!-- RIGHT: Attributes Card (hidden by default, replaces main image) -->
      ${ProductAttributes()}

      <!-- Navigation arrows — always visible on all slides -->
      <button type="button" id="gallery-prev" class="gallery-nav-btn absolute top-1/2 -translate-y-1/2 z-[5] w-9 h-9 rounded-full bg-[var(--color-surface,#fff)] shadow-[0_1px_6px_rgba(0,0,0,0.12)] flex items-center justify-center border-0 cursor-pointer transition-shadow duration-150 hover:shadow-[0_2px_10px_rgba(0,0,0,0.18)] left-2.5 2xl:left-[88px]" aria-label="${t("product.previous")}" @click.stop="goToSlide(currentIndex - 1)">
        <svg width="16" height="16" fill="none" stroke="#333" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button type="button" id="gallery-next" class="gallery-nav-btn absolute top-1/2 -translate-y-1/2 z-[5] w-9 h-9 rounded-full bg-[var(--color-surface,#fff)] shadow-[0_1px_6px_rgba(0,0,0,0.12)] flex items-center justify-center border-0 cursor-pointer transition-shadow duration-150 hover:shadow-[0_2px_10px_rgba(0,0,0,0.18)] right-2.5" aria-label="${t("product.nextLabel")}" @click.stop="goToSlide(currentIndex + 1)">
        <svg width="16" height="16" fill="none" stroke="#333" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>

      <!-- Action buttons — always visible -->
      <div class="absolute top-3 right-3 z-5 flex flex-col gap-2">
        <button type="button" data-favorite-btn class="gallery-action-btn w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer transition-colors hover:text-[var(--color-text-body,#333)]" style="background: var(--color-surface, #ffffff); box-shadow: 0 1px 6px rgba(0,0,0,.12); color: var(--color-text-tertiary);" aria-label="${t("product.addToFavorites")}">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </button>
        <!-- Gorsel arama (kamera) butonu — DISABLED, ileride tekrar etkinlestirilecek -->
        <!--
        <button type="button" class="gallery-action-btn w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer transition-colors" style="background: var(--color-surface, #ffffff); box-shadow: 0 1px 6px rgba(0,0,0,.12); color: var(--color-text-tertiary);" aria-label="${t("product.imageSearchLabel")}">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h2l1-2h8l1 2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
        </button>
        -->
      </div>

    </div>

    <!-- Photos / Attributes tabs -->
    <div id="pd-gallery-tabs" class="inline-flex gap-0.5 mt-3 rounded-full p-[3px]" style="background: var(--color-border-light);">
      <button type="button" class="gallery-view-tab th-no-press px-5 py-1.5 text-[13px] font-medium rounded-[20px] bg-transparent text-[var(--color-text-muted,#666)] border-0 cursor-pointer transition-all duration-150 [&.active]:bg-[var(--color-surface,#fff)] [&.active]:text-[var(--color-text-primary)] [&.active]:font-bold [&.active]:shadow-[0_1px_3px_rgba(0,0,0,0.1)]" :class="{ 'active': currentIndex !== attrsIndex }" @click="goToSlide(0)">${t("product.photosTab")}</button>
      <button type="button" class="gallery-view-tab th-no-press px-5 py-1.5 text-[13px] font-medium rounded-[20px] bg-transparent text-[var(--color-text-muted,#666)] border-0 cursor-pointer transition-all duration-150 [&.active]:bg-[var(--color-surface,#fff)] [&.active]:text-[var(--color-text-primary)] [&.active]:font-bold [&.active]:shadow-[0_1px_3px_rgba(0,0,0,0.1)]" :class="{ 'active': currentIndex === attrsIndex }" @click="goToSlide(attrsIndex)">${t("product.attributesTab")}</button>
    </div>

    <div id="gallery-lightbox" x-show="isLightboxOpen" x-cloak :aria-hidden="(!isLightboxOpen).toString()" @click.self="closeLightbox()" class="fixed inset-0 z-[var(--z-spotlight,90)] bg-[rgba(7,10,16,0.84)] flex items-center justify-center pt-[90px] px-5 pb-5 max-[960px]:!p-[72px_12px_12px]"
      @keydown.escape.window="isLightboxOpen && closeLightbox()"
      @keydown.left.window="isLightboxOpen && lightboxPrev()"
      @keydown.right.window="isLightboxOpen && lightboxNext()"
    >
      <div id="gallery-lightbox-toolbar" class="fixed top-0 left-0 right-0 h-[72px] z-[3] flex items-center justify-between px-[18px] bg-transparent max-[960px]:!h-[58px] max-[960px]:!px-2.5">
        <div id="gallery-lightbox-actions" class="flex items-center gap-4 max-[960px]:!gap-2">
          <button type="button" data-favorite-btn class="gallery-lightbox-action-btn border-0 bg-transparent text-[var(--color-text-inverse)] opacity-[0.94] inline-flex items-center gap-2 text-sm font-medium leading-none cursor-pointer p-0 hover:opacity-100 max-[960px]:!text-[15px] max-[960px]:!gap-[5px]" aria-label="${t("product.addToFavorites")}">
            <svg width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span class="max-[960px]:hidden">Favorite</span>
          </button>
          <!-- Find similar button - DISABLED: see findSimilarButtonHtml above renderer -->
        </div>

        <div id="gallery-lightbox-count" class="text-[var(--color-text-inverse)] text-base font-medium tracking-normal max-[960px]:!text-sm" x-text="(lightboxIndex + 1) + '/${images.length}'">${images.length > 0 ? `1/${images.length}` : "0/0"}</div>

        <button type="button" id="gallery-lightbox-close" class="w-11 h-11 border-0 bg-transparent text-[var(--color-text-inverse)] opacity-95 flex items-center justify-center cursor-pointer p-0 transition-opacity duration-150 ease-in-out hover:opacity-100 max-[960px]:!w-[34px] max-[960px]:!h-[34px]" aria-label="${t("product.closeGallery")}" @click="closeLightbox()">
          <svg class="max-[960px]:!w-[22px] max-[960px]:!h-[22px]" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6l-12 12"/>
          </svg>
        </button>
      </div>

      <div id="gallery-lightbox-inner" class="w-[min(1150px,100%)] h-[min(82vh,720px)] grid grid-cols-[90px_minmax(0,1fr)] gap-4 items-center max-[960px]:!h-[min(86vh,760px)] max-[960px]:!grid-cols-1 max-[960px]:!grid-rows-[minmax(0,1fr)_82px] max-[960px]:!gap-3" role="dialog" aria-modal="true" aria-label="${t("product.productGallery")}">
        <div id="gallery-lightbox-sidebar" class="h-full min-h-0 flex flex-col items-center gap-2.5 max-[960px]:!order-2 max-[960px]:!w-full max-[960px]:!h-auto max-[960px]:!min-h-0">
          ${
            needsLightboxThumbScroll
              ? `
          <button type="button" id="gallery-lightbox-thumb-up" class="gallery-lightbox-scroll w-[42px] h-[34px] border-0 rounded-full bg-[rgba(255,255,255,0.94)] text-[var(--color-text-heading,#111827)] flex items-center justify-center cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[var(--color-surface,#fff)] max-[960px]:!hidden" aria-label="${t("product.scrollUp")}" @click="scrollLightboxThumbs(-1)">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
          </button>
          `
              : ""
          }

          <div id="gallery-lightbox-thumb-list" x-ref="lightboxThumbList" class="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden scrollbar-hide py-0.5 max-[960px]:!w-full max-[960px]:!flex-row max-[960px]:!overflow-x-auto max-[960px]:!overflow-y-hidden max-[960px]:!px-0.5">
            ${lightboxThumbsHtml}
          </div>

          ${
            needsLightboxThumbScroll
              ? `
          <button type="button" id="gallery-lightbox-thumb-down" class="gallery-lightbox-scroll w-[42px] h-[34px] border-0 rounded-full bg-[rgba(255,255,255,0.94)] text-[var(--color-text-heading,#111827)] flex items-center justify-center cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[var(--color-surface,#fff)] max-[960px]:!hidden" aria-label="${t("product.scrollDown")}" @click="scrollLightboxThumbs(1)">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          `
              : ""
          }
        </div>

        <div id="gallery-lightbox-stage" class="relative w-full h-full min-h-0 rounded-xl overflow-hidden bg-black/[0.18] flex items-center justify-center">
          <div id="gallery-lightbox-image" class="w-full h-full [&>.gallery-media-asset]:object-contain [&>[data-gallery-main-media=true]]:w-full [&>[data-gallery-main-media=true]]:h-full" x-ref="lightboxImage">
            ${renderGalleryMedia(firstImage?.src, firstImage?.alt ?? t("product.productImage"), defaultVisual, "large")}
          </div>

          <div id="gallery-lightbox-vertical-nav" class="absolute right-[14px] top-1/2 -translate-y-1/2 z-[2] w-11 rounded-3xl bg-white/[0.94] shadow-[0_2px_10px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col max-[960px]:!w-10 max-[960px]:!right-2.5" aria-label="${t("product.productGallery")}">
            <button type="button" id="gallery-lightbox-prev" class="gallery-lightbox-nav-btn w-11 h-11 border-0 bg-transparent text-[var(--color-text-heading,#111827)] flex items-center justify-center cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[rgba(17,24,39,0.06)] max-[960px]:!w-10 max-[960px]:!h-10" aria-label="${t("product.previousImage")}" @click="lightboxPrev()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7-7-7 7"/></svg>
            </button>
            <button type="button" id="gallery-lightbox-next" class="gallery-lightbox-nav-btn w-11 h-11 border-0 bg-transparent text-[var(--color-text-heading,#111827)] flex items-center justify-center cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[rgba(17,24,39,0.06)] border-t border-[rgba(17,24,39,0.12)] max-[960px]:!w-10 max-[960px]:!h-10" aria-label="${t("product.nextImage")}" @click="lightboxNext()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7 7 7-7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    </div>
  `;
}

export function initImageGallery(): void {
  // All gallery interactivity is now handled by Alpine.js (imageGallery component in alpine.ts).
  // - Thumbnail hover/click navigation
  // - Prev/next arrow navigation
  // - Lightbox open/close with keyboard nav (Escape, Left, Right)
  // - View tab switching (Photos / Attributes)
  // - Zoom on hover
  // - Custom events: gallery-slide-change (dispatch) and gallery-go-to (listen)
}
