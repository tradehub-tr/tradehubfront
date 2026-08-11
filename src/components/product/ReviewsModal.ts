/**
 * ReviewsModal Component
 * Full-screen overlay modal showing all store reviews with filters,
 * mention tags, language toggle, and scrollable review cards.
 * Opened by the "Tümünü Göster" button in the Store Reviews panel.
 *
 * Reactivity handled by Alpine.js via x-data="reviewsModal".
 * Alpine.data('reviewsModal') is registered in src/alpine.ts.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import {
  renderReviewCard,
  CHIP_CLASS,
  MENU_ITEM_CLASS,
  MENU_PANEL_CLASS,
} from "./ProductReviews";

/* ── Modal HTML ──────────────────────────────────────── */

export function ReviewsModal(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;
  const photoReviewCount = p.reviews.filter((r) => r.images && r.images.length > 0).length;

  return `
    <div
      id="rv-reviews-modal"
      x-data="reviewsModal"
      x-show="open"
      x-cloak
      x-transition:enter="transition ease-out duration-300"
      x-transition:enter-start="opacity-0"
      x-transition:enter-end="opacity-100"
      x-transition:leave="transition ease-out duration-200"
      x-transition:leave-start="opacity-100"
      x-transition:leave-end="opacity-0"
      @click.self="close()"
      @keydown.escape.window="if (open) { close() }"
      @reviews-modal-show.window="show($event.detail && $event.detail.mode)"
      :data-open="open"
      class="rv-modal-overlay fixed inset-0 bg-black/50 z-[var(--z-backdrop,40)] flex items-center justify-center"
    >
      <div
        x-show="open"
        x-transition:enter="transition ease-out duration-300 motion-reduce:transition-none"
        x-transition:enter-start="opacity-0 scale-95 motion-reduce:scale-100"
        x-transition:enter-end="opacity-100 scale-100"
        x-transition:leave="transition ease-out duration-200 motion-reduce:transition-none"
        x-transition:leave-start="opacity-100 scale-100"
        x-transition:leave-end="opacity-0 scale-95 motion-reduce:scale-100"
        class="rv-modal bg-[var(--color-surface,#ffffff)] max-w-[800px] w-[95%] max-h-[85vh] rounded-[var(--radius-modal,16px)] shadow-[var(--shadow-modal)] flex flex-col z-[var(--z-modal,50)] max-sm:!w-full max-sm:!h-full max-sm:!max-h-[100vh] max-sm:!rounded-none"
      >
        <!-- Fixed Header — referans: 20px bold başlık, sekmeye göre değişir -->
        <div class="rv-modal-header flex justify-between items-center px-6 py-5 shrink-0 max-sm:!px-4 max-sm:!py-3">
          <span class="rv-modal-title text-[20px] leading-[28px] font-bold text-[#222] max-sm:!text-[16px]" id="rv-modal-title" x-text="titleText">${t("product.storeReviewsTab", { count: String(p.storeReviewCount) })}</span>
          <button type="button" @click="close()" class="rv-modal-close w-8 h-8 flex items-center justify-center rounded-full border-none bg-none cursor-pointer text-[var(--pd-rating-text-color,#6b7280)] transition-[background] duration-150 hover:bg-[var(--pd-spec-header-bg,#f9fafb)] hover:text-[var(--pd-title-color,#111827)] max-sm:!w-7 max-sm:!h-7 shrink-0" id="rv-modal-close">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="max-sm:!w-4 max-sm:!h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="rv-modal-body overflow-y-auto px-6 pb-6 flex-1 max-sm:!px-4 max-sm:!pb-4" @click="ratingOpen = false; sortOpen = false" @scroll="onBodyScroll($event)">
          <!-- Filter Row — panel ile aynı chip/menü dili -->
          <div class="rv-filter-row flex items-center gap-2 flex-wrap mb-4 pt-1">
            <button type="button" class="rv-filter-pill ${CHIP_CLASS}" :class="{ active: filterType === 'all' }" @click="setFilter('all')">${t("product.allFilter")}</button>
            <button type="button" class="rv-filter-pill ${CHIP_CLASS}" id="rv-modal-photo-filter" data-rv-filter="photo" :class="{ active: filterType === 'photo' }" @click="setFilter('photo')">${t("product.withPhotos", { count: String(photoReviewCount) })}</button>

            <!-- Rating Dropdown — yıldız satırları + checkbox (panel ile aynı) -->
            <div class="rv-rating-dropdown relative inline-block [&.open_.rv-rating-dropdown-panel]:block [&.open_.rv-rating-chevron]:rotate-180" id="rv-modal-rating-dropdown" :class="{ open: ratingOpen }" @click.outside="ratingOpen = false">
              <button type="button" class="rv-rating-dropdown-trigger ${CHIP_CLASS} inline-flex items-center gap-[6px]" @click.stop="ratingOpen = !ratingOpen; sortOpen = false" :class="{ active: ratingFilter !== 'all' }">
                <span x-text="ratingLabel()"></span>
                <svg class="rv-rating-chevron transition-transform duration-150" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rv-rating-dropdown-panel ${MENU_PANEL_CLASS} start-0 min-w-[236px]">
                ${[5, 4, 3, 2, 1]
                  .map(
                    (n) => `
                <button type="button" data-rv-rating="${n}" class="rv-rating-dropdown-item ${MENU_ITEM_CLASS} [&.active]:font-semibold [&.active_.rv-check]:border-[#222] [&.active_.rv-check]:bg-[#222] [&.active_.rv-check_svg]:opacity-100" :class="{ active: ratingFilter === ${n} }" @click="setRating('${n}')">
                  <span>${t("product.starLabel", { count: String(n) })}</span>
                  <span class="rv-star-count">(0)</span>
                  <span class="rv-check ms-auto inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] border border-[#c4c4c4] bg-white transition-colors duration-100">
                    <svg class="opacity-0" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </span>
                </button>`
                  )
                  .join("")}
              </div>
            </div>

            <!-- Sort Dropdown — metin-stil trigger (panel ile aynı) -->
            <div class="rv-sort-dropdown relative inline-block ms-auto [&.open_.rv-sort-dropdown-panel]:block [&.open_.rv-sort-chevron]:rotate-180 max-sm:!ms-0" id="rv-modal-sort-dropdown" :class="{ open: sortOpen }" @click.outside="sortOpen = false">
              <button type="button" class="rv-sort-dropdown-trigger th-no-press appearance-none focus:outline-none flex items-center gap-[6px] bg-transparent border-0 p-0 text-[14px] font-semibold text-[#222] cursor-pointer whitespace-nowrap" @click.stop="sortOpen = !sortOpen; ratingOpen = false">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m3 16 4 4 4-4M7 20V4m14 4-4-4-4 4m4-4v16"/></svg>
                <span x-text="'${t("product.sortLabel")}: ' + sortLabel()"></span>
                <svg class="rv-sort-chevron transition-transform duration-150" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rv-sort-dropdown-panel ${MENU_PANEL_CLASS} end-0 min-w-[158px] max-sm:!left-0 max-sm:!right-auto">
                <button type="button" class="rv-sort-dropdown-item ${MENU_ITEM_CLASS} [&.active]:font-bold" :class="{ active: sortBy === 'relevant' }" @click="setSort('relevant')">${t("product.sortRelevant")}</button>
                <button type="button" class="rv-sort-dropdown-item ${MENU_ITEM_CLASS} [&.active]:font-bold" :class="{ active: sortBy === 'newest' }" @click="setSort('newest')">${t("product.sortNewest")}</button>
              </div>
            </div>
          </div>

          <!-- Mention Tags -->
          <div class="flex gap-1.5 sm:gap-2 flex-wrap mb-3 sm:mb-5">
            <span class="text-[11px] sm:text-[12px] self-center" style="color: var(--pd-rating-text-color, #6b7280);">${t("product.frequentMentions")}</span>
            ${p.reviewMentionTags
              .map(
                (tag) => `
              <button type="button" class="rv-mention-tag th-no-press py-1 px-3 text-[12px] rounded bg-[var(--pd-spec-header-bg,#f9fafb)] text-[var(--pd-rating-text-color,#6b7280)] border border-[var(--pd-spec-border,#e5e5e5)] cursor-pointer transition-colors duration-150 hover:border-[var(--color-border-medium,#d1d5db)] [&.active]:border-[var(--pd-tab-active-border,#cc6b00)] [&.active]:text-[var(--pd-tab-active-color,#cc6b00)] [&.active]:bg-[var(--pd-price-tier-active-bg,#fef9e7)] [&.active]:font-semibold" :class="{ active: mentionFilter === ${escapeHtml(JSON.stringify(tag.label))} }" @click="toggleMention(${escapeHtml(JSON.stringify(tag.label))})">${escapeHtml(tag.label)} (${tag.count})</button>
            `
              )
              .join("")}
          </div>

          <!-- Language Toggle — panel ile aynı 14px/#222 dili -->
          <div class="rv-lang-row flex items-center gap-2 mt-2 mb-3">
            <svg class="w-[18px] h-[18px] shrink-0 text-[#222]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clip-rule="evenodd"/></svg>
            <span class="text-[14px] leading-[1.5] text-[#222]">${t("product.langNote")} <a class="rv-lang-toggle-link underline cursor-pointer hover:text-black" href="javascript:void(0)">${t("product.showOriginal")}</a></span>
          </div>

          <!-- Review Cards (with product thumbnails) -->
          <div id="rv-modal-reviews-list" x-ref="reviewsList">
            ${p.reviews.map((r) => renderReviewCard(r, true)).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── Init logic ──────────────────────────────────────── */

/**
 * @deprecated Replaced by Alpine.js x-data="reviewsModal" directives.
 * Alpine handles show/hide, filters, dropdowns, mention tags, Escape key,
 * and body scroll lock. This function only binds the show-all button
 * (which lives outside the Alpine component in ProductReviews) as a
 * transitional bridge until ProductReviews is also migrated.
 * Remove this call from page entry files and use startAlpine() instead.
 */
export function initReviewsModal(): void {
  // Bind the show-all button (outside the Alpine component) to dispatch
  // the custom event that the Alpine reviewsModal component listens for.
  const showAllBtn = document.querySelector<HTMLButtonElement>(".rv-show-all-btn");
  if (showAllBtn) {
    showAllBtn.addEventListener("click", showReviewsModal);
  }
}

/**
 * Show the reviews modal.
 * Dispatches a custom event that the Alpine reviewsModal component listens for.
 */
export function showReviewsModal(): void {
  window.dispatchEvent(new CustomEvent("reviews-modal-show"));
}
