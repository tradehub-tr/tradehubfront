/**
 * ProductReviews Component
 * iSTOC-style reviews: sub-tabs, rating summary, category bars,
 * filter/mention pills, review cards with badges & supplier replies.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import type { ProductReview } from "../../types/product";
import { openLoginModal } from "./LoginModal";
import { isLoggedIn as isUserLoggedIn } from "../../utils/auth";
import {
  getReviewEligibility,
  voteReviewHelpful,
  getProductReviews,
  updateOwnReview,
} from "../../services/listingService";
import { openWriteReviewModal } from "./WriteReviewModal";
import { openReportAbuseModal } from "./ReportAbuseModal";
import { showToast } from "../../utils/toast";

/* ── Utility helpers ─────────────────────────────────── */

function starIcon(filled: boolean, small = false): string {
  const size = small ? "h-3.5 w-3.5" : "h-4 w-4";
  return filled
    ? `<svg class="${size}" viewBox="0 0 20 20" fill="currentColor" style="color: var(--pd-review-star-color, #f59e0b);"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`
    : `<svg class="${size}" viewBox="0 0 20 20" fill="currentColor" style="color: #d1d5db;"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
}

export function renderStars(rating: number, small = false): string {
  return Array.from({ length: 5 }, (_, i) => starIcon(i < Math.round(rating), small)).join("");
}

function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    TR: "\u{1F1F9}\u{1F1F7}",
    DE: "\u{1F1E9}\u{1F1EA}",
    US: "\u{1F1FA}\u{1F1F8}",
    IT: "\u{1F1EE}\u{1F1F9}",
    CN: "\u{1F1E8}\u{1F1F3}",
    UK: "\u{1F1EC}\u{1F1E7}",
    FR: "\u{1F1EB}\u{1F1F7}",
  };
  return flags[country] || "\u{1F310}";
}

function anonymizeName(name: string): string {
  // "Ahmet Y." → "A***t Y."
  const parts = name.split(" ");
  const first = parts[0];
  if (first.length <= 2) return name;
  const anonymized = first.charAt(0) + "***" + first.charAt(first.length - 1);
  return [anonymized, ...parts.slice(1)].join(" ");
}

const avatarColors = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function satisfactionLabel(score: number): string {
  if (score >= 4.5) return t("product.verySatisfied");
  if (score >= 3.5) return t("product.satisfied");
  if (score >= 2.5) return t("product.neutral");
  if (score >= 1.5) return t("product.dissatisfied");
  return t("product.veryDissatisfied");
}

/* ── Review card renderer ────────────────────────────── */

export function renderReviewCard(review: ProductReview, showProductThumb = false): string {
  const badges: string[] = [];
  if (review.isOwnPending) {
    badges.push(
      `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-700">⏳ Onay bekliyor</span>`
    );
  }
  if (review.verified) {
    badges.push(`<span class="rv-badge inline-flex items-center gap-[3px] px-2 py-0.5 text-[11px] font-semibold rounded-[3px] bg-[#f0fdf4] text-[#15803d]">${t("product.verifiedPurchase")}</span>`);
  }
  if (review.repeatBuyer) {
    badges.push(`<span class="rv-badge inline-flex items-center gap-[3px] px-2 py-0.5 text-[11px] font-semibold rounded-[3px] bg-[var(--color-primary-50,#fef9e7)] text-[var(--color-cta-primary,#cc9900)]">${t("product.repeatBuyer")}</span>`);
  }
  // Reviewer reputation tier — Top/Trusted/Verified (B2B güven göstergesi)
  if (review.reviewerTier) {
    const tierLabels: Record<string, string> = {
      Top: "⭐ Üst Düzey Değerlendirici",
      Trusted: "🛡 Güvenilir Değerlendirici",
      Verified: "✓ Doğrulanmış Değerlendirici",
    };
    const tierClasses: Record<string, string> = {
      Top: "bg-purple-100 text-purple-700",
      Trusted: "bg-indigo-100 text-indigo-700",
      Verified: "bg-emerald-100 text-emerald-700",
    };
    const cls = tierClasses[review.reviewerTier] || "bg-gray-100 text-gray-700";
    const label = tierLabels[review.reviewerTier] || review.reviewerTier;
    badges.push(
      `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cls}">${label}</span>`
    );
  }

  const supplierReplyHtml = review.supplierReply
    ? `<div class="rv-supplier-reply bg-[var(--pd-spec-header-bg,#f9fafb)] rounded-md px-3.5 py-3 mb-3">
        <div class="rv-supplier-reply-label text-[12px] font-semibold text-[var(--pd-rating-text-color,#6b7280)] mb-1">${t("product.supplierReply")}</div>
        <div class="rv-supplier-reply-text text-[13px] text-[var(--pd-spec-value-color,#111827)] leading-[1.5]">${review.supplierReply}</div>
      </div>`
    : "";

  const imagesHtml =
    Array.isArray(review.images) && review.images.length > 0
      ? `<div class="flex gap-2 flex-wrap mt-3">
          ${review.images
            .map(
              (src) => `
            <button
              type="button"
              class="rv-image-thumb shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border-default/60 hover:border-primary-500 transition-colors cursor-zoom-in bg-secondary-50"
              data-image-url="${src}"
              aria-label="${t("product.productImage")}"
            >
              <img src="${src}" class="w-full h-full object-cover" loading="lazy" alt="" />
            </button>`
            )
            .join("")}
        </div>`
      : "";

  const productThumbHtml =
    showProductThumb && review.productTitle
      ? `<div class="rv-product-card flex items-center gap-3 rounded-lg p-3 mt-3 bg-[var(--color-surface-raised,#f5f5f5)]">
        <img class="rv-product-card-img w-12 h-12 rounded object-cover shrink-0 bg-[var(--pd-spec-header-bg,#f9fafb)]" src="${review.productImage || ""}" alt="${t("product.productImage")}">
        <div class="flex-1 min-w-0">
          <span class="rv-product-card-title block text-[13px] text-[var(--color-text-body,#333333)] overflow-hidden text-ellipsis whitespace-nowrap">${review.productTitle}</span>
          <span class="rv-product-card-price block text-[13px] font-semibold text-[var(--pd-title-color,#111827)] mt-0.5">${review.productPrice || ""}</span>
        </div>
        <a class="rv-product-card-link text-[12px] text-[var(--color-text-body,#333333)] whitespace-nowrap shrink-0 no-underline hover:underline" href="javascript:void(0)">${t("product.viewProductDetails")} ›</a>
      </div>`
      : "";

  return `
    <div class="rv-card py-5 border-b border-[var(--pd-spec-border,#e5e5e5)] last-of-type:border-b-0 max-[374px]:px-3 max-[374px]:py-3">
      <div class="flex items-start gap-3 mb-2.5 max-[374px]:gap-2 max-[374px]:mb-2">
        <div class="rv-avatar w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 text-[var(--color-text-inverse,#fff)] max-[374px]:w-8 max-[374px]:h-8 max-[374px]:text-xs" style="background: ${avatarColor(review.author)};">
          ${review.author.charAt(0)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap max-[374px]:gap-1">
            <span class="rv-card-name text-[13px] font-semibold text-[var(--pd-title-color,#111827)] max-[374px]:text-[13px]">${anonymizeName(review.author)}</span>
            <span class="rv-card-country text-[12px] text-[var(--pd-rating-text-color,#6b7280)] flex items-center gap-1 max-[374px]:text-[11px]">${countryFlag(review.country)} ${review.countryName || review.country}</span>
            ${badges.join("")}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="flex items-center gap-0.5">${renderStars(review.rating, true)}</div>
            <span class="rv-card-date text-[12px] text-[var(--pd-rating-text-color,#6b7280)]">${review.date}</span>
          </div>
        </div>
      </div>
      <div class="rv-card-comment text-[13px] leading-[1.6] text-[var(--pd-spec-value-color,#111827)] mb-3 max-[374px]:text-[13px] max-[374px]:leading-[1.5]">${review.comment}</div>
      ${imagesHtml}
      ${supplierReplyHtml}
      ${productThumbHtml}
      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" class="rv-helpful-btn flex items-center gap-1.5 text-[12px] text-[var(--pd-rating-text-color,#6b7280)] bg-none border border-[var(--pd-spec-border,#e5e5e5)] rounded px-2.5 py-1 cursor-pointer transition-all duration-150 hover:border-[var(--color-border-medium,#d1d5db)] hover:text-[var(--pd-title-color,#111827)] [&.voted]:border-[var(--pd-tab-active-border,#cc9900)] [&.voted]:text-[var(--pd-tab-active-color,#cc9900)]" data-review-id="${review.id}" data-vote="helpful">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
          </svg>
          ${t("product.helpful", { count: String(review.helpful) })}
        </button>
        <button
          type="button"
          class="rv-helpful-btn flex items-center gap-1.5 text-[12px] text-[var(--pd-rating-text-color,#6b7280)] bg-none border border-[var(--pd-spec-border,#e5e5e5)] rounded px-2.5 py-1 cursor-pointer transition-all duration-150 hover:border-[var(--color-border-medium,#d1d5db)] hover:text-[var(--pd-title-color,#111827)] [&.voted]:border-[var(--pd-tab-active-border,#cc9900)] [&.voted]:text-[var(--pd-tab-active-color,#cc9900)]"
          data-review-id="${review.id}"
          data-vote="not_helpful"
          title="Faydalı değildi"
          aria-label="Faydalı değildi"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transform: rotate(180deg);">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
          </svg>
        </button>
        ${
          review.canEdit
            ? `<button type="button" class="rv-edit-own-btn text-[12px] text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1 ml-auto" data-review-id="${review.id}" title="Yorumumu düzenle (24 saat içinde)">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.032 2.032 0 112.872 2.872L7.5 21.613H4v-3.5L16.862 4.487z"/></svg>
                Düzenle
              </button>`
            : ""
        }
        <button type="button" class="rv-report-btn text-[12px] text-secondary-400 hover:text-red-600 transition-colors inline-flex items-center gap-1 ${review.canEdit ? "" : "ml-auto"}" data-review-id="${review.id}" title="Şikayet et">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
          Şikayet
        </button>
      </div>
    </div>
  `;
}

/* ── Shared sub-component helpers ─────────────────────── */

function ratingDropdownHtml(idPrefix: string): string {
  return `
    <div class="rv-rating-dropdown relative inline-block [&.open_.rv-rating-dropdown-panel]:block" id="${idPrefix}-rating-dropdown">
      <button type="button" class="rv-rating-dropdown-trigger px-3.5 py-1.5 text-[12px] font-medium rounded-full border border-[var(--pd-spec-border,#e5e5e5)] bg-[var(--color-surface,#ffffff)] text-[var(--pd-rating-text-color,#6b7280)] cursor-pointer flex items-center gap-1.5 transition-all duration-150 whitespace-nowrap hover:border-[var(--color-border-medium,#d1d5db)] [&.active]:border-[var(--pd-tab-active-border,#cc9900)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:bg-[var(--pd-price-tier-active-bg,#fef9e7)]">
        ${t("product.ratingLabel")}
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="rv-rating-dropdown-panel hidden absolute top-[calc(100%+4px)] left-0 min-w-[180px] bg-[var(--color-surface,#ffffff)] border border-[var(--pd-spec-border,#e5e5e5)] rounded-lg shadow-[var(--shadow-dropdown)] z-10 overflow-hidden max-sm:!min-w-[160px]">
        <button type="button" class="rv-rating-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold active" data-rv-rating="all">${t("product.allRatings")}</button>
        <button type="button" class="rv-rating-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold" data-rv-rating="5">${renderStars(5, true)} ${t("product.starLabel", { count: "5" })}</button>
        <button type="button" class="rv-rating-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold" data-rv-rating="4">${renderStars(4, true)} ${t("product.starLabel", { count: "4" })}</button>
        <button type="button" class="rv-rating-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold" data-rv-rating="3">${renderStars(3, true)} ${t("product.starLabel", { count: "3" })}</button>
        <button type="button" class="rv-rating-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold" data-rv-rating="2">${renderStars(2, true)} ${t("product.starLabel", { count: "2" })}</button>
        <button type="button" class="rv-rating-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold" data-rv-rating="1">${renderStars(1, true)} ${t("product.starLabel", { count: "1" })}</button>
      </div>
    </div>`;
}

function sortDropdownHtml(idPrefix: string): string {
  return `
    <div class="rv-sort-dropdown relative inline-block ml-auto [&.open_.rv-sort-dropdown-panel]:block max-sm:!ml-0 max-sm:!w-full" id="${idPrefix}-sort-dropdown">
      <button type="button" class="rv-sort-dropdown-trigger px-3.5 py-1.5 text-[12px] font-medium rounded-full border border-[var(--pd-spec-border,#e5e5e5)] bg-[var(--color-surface,#ffffff)] text-[var(--pd-rating-text-color,#6b7280)] cursor-pointer flex items-center gap-1 transition-all duration-150 whitespace-nowrap hover:border-[var(--color-border-medium,#d1d5db)] max-sm:!w-full max-sm:!justify-between">
        ${t("product.sortLabel")}: ${t("product.sortRelevant")}
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="rv-sort-dropdown-panel hidden absolute top-[calc(100%+4px)] right-0 min-w-[160px] bg-[var(--color-surface,#ffffff)] border border-[var(--pd-spec-border,#e5e5e5)] rounded-lg shadow-[var(--shadow-dropdown)] z-10 overflow-hidden max-sm:!left-0 max-sm:!right-0">
        <button type="button" class="rv-sort-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold active" data-rv-sort="relevant">${t("product.sortRelevant")}</button>
        <button type="button" class="rv-sort-dropdown-item flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--pd-spec-value-color,#111827)] cursor-pointer transition-[background] duration-100 border-none bg-none w-full text-left hover:bg-[var(--pd-spec-header-bg,#f9fafb)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:font-semibold" data-rv-sort="newest">${t("product.sortNewest")}</button>
      </div>
    </div>`;
}

function langToggleHtml(): string {
  return `
    <div class="rv-lang-row flex items-center gap-2 mt-2 mb-3">
      <svg class="w-3.5 h-3.5 shrink-0 text-[var(--pd-rating-text-color,#6b7280)]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clip-rule="evenodd"/></svg>
      <span class="text-[13px] text-[var(--pd-rating-text-color,#6b7280)]">${t("product.langNote")}</span>
      <a class="rv-lang-toggle-link text-[13px] font-medium text-[var(--pd-rating-text-color,#6b7280)] underline cursor-pointer hover:text-[var(--pd-title-color,#111827)]" href="javascript:void(0)">${t("product.showOriginal")}</a>
    </div>`;
}

/* ── Main component ──────────────────────────────────── */

export function ProductReviews(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;
  const photoReviewCount = p.reviews.filter((r) => r.images && r.images.length > 0).length;

  return `
    <div class="py-6 max-[374px]:py-4">
      <!-- Sub-tabs + Yorum Yaz CTA -->
      <div class="flex items-center justify-between gap-3 border-b-2 border-border-default mb-6 max-[374px]:mb-4 flex-wrap">
        <div class="flex">
          <button type="button" class="rv-sub-tab px-5 py-2.5 text-[14px] font-medium text-[var(--pd-rating-text-color,#6b7280)] bg-none border-none cursor-pointer relative whitespace-nowrap transition-colors duration-150 [&.active]:text-[var(--pd-title-color,#111827)] [&.active]:font-bold [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:bottom-[-2px] [&.active]:after:left-0 [&.active]:after:right-0 [&.active]:after:h-[2px] [&.active]:after:bg-[var(--pd-tab-active-border,#cc9900)] max-[374px]:text-[13px] max-[374px]:px-2 max-[374px]:py-2 active" data-rv-panel="rv-product-panel">${t("product.productReviewsTab", { count: String(p.reviewCount) })}</button>
          <button type="button" class="rv-sub-tab px-5 py-2.5 text-[14px] font-medium text-[var(--pd-rating-text-color,#6b7280)] bg-none border-none cursor-pointer relative whitespace-nowrap transition-colors duration-150 [&.active]:text-[var(--pd-title-color,#111827)] [&.active]:font-bold [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:bottom-[-2px] [&.active]:after:left-0 [&.active]:after:right-0 [&.active]:after:h-[2px] [&.active]:after:bg-[var(--pd-tab-active-border,#cc9900)] max-[374px]:text-[13px] max-[374px]:px-2 max-[374px]:py-2" data-rv-panel="rv-store-panel">${t("product.storeReviewsTab", { count: String(p.storeReviewCount) })}</button>
          <button type="button" class="rv-sub-tab px-5 py-2.5 text-[14px] font-medium text-[var(--pd-rating-text-color,#6b7280)] bg-none border-none cursor-pointer relative whitespace-nowrap transition-colors duration-150 [&.active]:text-[var(--pd-title-color,#111827)] [&.active]:font-bold [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:bottom-[-2px] [&.active]:after:left-0 [&.active]:after:right-0 [&.active]:after:h-[2px] [&.active]:after:bg-[var(--pd-tab-active-border,#cc9900)] max-[374px]:text-[13px] max-[374px]:px-2 max-[374px]:py-2" data-rv-panel="rv-qa-panel" id="rv-qa-tab-btn">Soru &amp; Cevap <span id="rv-qa-count">(0)</span></button>
        </div>
        <button
          type="button"
          id="rv-write-review-btn"
          class="th-btn-dark h-9 px-4 rounded-md text-[13px] font-semibold inline-flex items-center gap-1.5 mb-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
          title="Bu ürünü yorumlayabilmek için doğrulanmış bir siparişiniz olmalı"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.032 2.032 0 112.872 2.872L7.5 21.613H4v-3.5L16.862 4.487z"/></svg>
          <span>Yorum Yaz</span>
        </button>
      </div>

      <!-- Product Reviews Panel -->
      <div id="rv-product-panel">
        <!-- Info text -->
        <p style="font-size: 13px; color: var(--pd-rating-text-color, #6b7280); padding: 16px 0 12px; border-bottom: 1px solid var(--pd-spec-border, #e5e5e5); margin-bottom: 16px;">
          ${t("product.noRatingNote")}
        </p>

        <!-- Filter Row -->
        <div class="rv-filter-row flex items-center gap-2 flex-wrap mb-4">
          <button type="button" class="rv-filter-pill px-3.5 py-1.5 text-[12px] font-medium rounded-full border border-[var(--pd-spec-border,#e5e5e5)] bg-[var(--color-surface,#ffffff)] text-[var(--pd-rating-text-color,#6b7280)] cursor-pointer transition-all duration-150 whitespace-nowrap [&.active]:border-[var(--pd-tab-active-border,#cc9900)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:bg-[var(--pd-price-tier-active-bg,#fef9e7)] [&:hover:not(.active)]:border-[var(--color-border-medium,#d1d5db)] active" data-rv-filter="all">${t("product.allFilter")}</button>
          ${ratingDropdownHtml("rv-product")}
          ${sortDropdownHtml("rv-product")}
        </div>

        <!-- Language Toggle -->
        ${langToggleHtml()}

        <!-- Review Cards -->
        ${p.reviews.map((r) => renderReviewCard(r, false)).join("")}
      </div>

      <!-- Store Reviews Panel (hidden) -->
      <div id="rv-store-panel" class="hidden">
        <!-- Rating Summary -->
        <div class="rv-rating-summary flex gap-8 pb-6 mb-5 border-b border-[var(--pd-spec-border,#e5e5e5)] max-sm:flex-col max-sm:gap-5 max-[374px]:gap-3 max-[374px]:pb-4 max-[374px]:mb-3">
          <div class="flex flex-col items-center justify-center min-w-[140px] max-[374px]:min-w-0">
            <span class="rv-rating-number text-[48px] font-extrabold leading-none text-[var(--pd-title-color,#111827)]">${p.rating}</span>
            <div class="flex items-center gap-0.5 mt-1">${renderStars(p.rating)}</div>
            <span class="rv-rating-label text-[13px] font-semibold text-[var(--pd-review-star-color,#f59e0b)] mt-1">${satisfactionLabel(p.rating)}</span>
            <span class="rv-rating-subtitle text-[12px] text-[var(--pd-rating-text-color,#6b7280)] mt-1.5 text-center">${t("product.basedOnReviews", { count: String(p.storeReviewCount) })}</span>
          </div>
          <div class="flex-1 flex flex-col gap-2.5 justify-center">
            ${p.reviewCategoryRatings
              .map(
                (cat) => `
              <div class="flex items-center gap-2.5">
                <span class="rv-category-label text-[13px] text-[var(--pd-rating-text-color,#6b7280)] min-w-[140px] shrink-0 max-sm:!min-w-[100px]">${cat.label}</span>
                <div class="rv-category-bar-track flex-1 h-[6px] rounded-[3px] bg-[var(--pd-review-bar-bg,#e5e5e5)] overflow-hidden">
                  <div class="rv-category-bar-fill h-full rounded-[3px] bg-[var(--pd-review-bar-fill,#f59e0b)] transition-[width] duration-300 ease-[ease]" style="width: ${(cat.score / 5) * 100}%;"></div>
                </div>
                <span class="rv-category-score text-[13px] font-bold text-[var(--pd-title-color,#111827)] min-w-[28px] text-right">${cat.score}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Filter Row -->
        <div class="rv-filter-row flex items-center gap-2 flex-wrap mb-4">
          <button type="button" class="rv-filter-pill px-3.5 py-1.5 text-[12px] font-medium rounded-full border border-[var(--pd-spec-border,#e5e5e5)] bg-[var(--color-surface,#ffffff)] text-[var(--pd-rating-text-color,#6b7280)] cursor-pointer transition-all duration-150 whitespace-nowrap [&.active]:border-[var(--pd-tab-active-border,#cc9900)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:bg-[var(--pd-price-tier-active-bg,#fef9e7)] [&:hover:not(.active)]:border-[var(--color-border-medium,#d1d5db)] active" data-rv-filter="all">${t("product.allFilter")}</button>
          <button type="button" class="rv-filter-pill px-3.5 py-1.5 text-[12px] font-medium rounded-full border border-[var(--pd-spec-border,#e5e5e5)] bg-[var(--color-surface,#ffffff)] text-[var(--pd-rating-text-color,#6b7280)] cursor-pointer transition-all duration-150 whitespace-nowrap [&.active]:border-[var(--pd-tab-active-border,#cc9900)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:bg-[var(--pd-price-tier-active-bg,#fef9e7)] [&:hover:not(.active)]:border-[var(--color-border-medium,#d1d5db)]" data-rv-filter="photo">${t("product.withPhotos", { count: String(photoReviewCount) })}</button>
          ${ratingDropdownHtml("rv-store")}
          ${sortDropdownHtml("rv-store")}
        </div>

        <!-- Mention Tags -->
        <div class="flex gap-2 flex-wrap mb-5">
          <span style="font-size: 12px; color: var(--pd-rating-text-color, #6b7280); align-self: center;">${t("product.frequentMentions")}</span>
          ${p.reviewMentionTags
            .map(
              (tag) => `
            <button type="button" class="rv-mention-tag py-1 px-3 text-[12px] rounded bg-[var(--pd-spec-header-bg,#f9fafb)] text-[var(--pd-rating-text-color,#6b7280)] border border-[var(--pd-spec-border,#e5e5e5)] cursor-pointer transition-all duration-150 hover:border-[var(--color-border-medium,#d1d5db)] [&.active]:border-[var(--pd-tab-active-border,#cc9900)] [&.active]:text-[var(--pd-tab-active-color,#cc9900)] [&.active]:bg-[var(--pd-price-tier-active-bg,#fef9e7)] [&.active]:font-semibold" data-rv-mention="${tag.label}">${tag.label} (${tag.count})</button>
          `
            )
            .join("")}
        </div>

        <!-- Language Toggle -->
        ${langToggleHtml()}

        <!-- Review Cards (with product thumbnails) -->
        ${p.reviews.map((r) => renderReviewCard(r, true)).join("")}

        <!-- Show All Button -->
        <button type="button" class="rv-show-all-btn block w-full p-3 mt-5 text-[14px] font-semibold text-center border border-[var(--pd-spec-border,#e5e5e5)] rounded-lg bg-[var(--color-surface,#ffffff)] text-[var(--pd-title-color,#111827)] cursor-pointer transition-all duration-150 hover:border-[var(--color-border-medium,#d1d5db)] hover:bg-[var(--pd-spec-header-bg,#f9fafb)]">${t("product.showAll")}</button>
      </div>

      <!-- Q&A Panel (hidden by default) -->
      <div id="rv-qa-panel" class="hidden"></div>
    </div>
  `;
}

/* ── Init logic ──────────────────────────────────────── */

/** Eligibility state — yüklenince güncellenir */
interface EligibilityState {
  can_review: boolean;
  order_items: Array<{
    name: string;
    order: string;
    order_date: string | null;
    quantity: number;
  }>;
  loaded: boolean;
}

let eligibilityCache: EligibilityState = {
  can_review: false,
  order_items: [],
  loaded: false,
};

/** Hem desktop hem mobile "Yorum Yaz" butonlarını yakala (ID'ler ayrı). */
function getWriteReviewButtons(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>("#rv-write-review-btn, #pdm-write-review-btn")
  );
}

function attachWriteReviewButton(listingId: string): void {
  const btns = getWriteReviewButtons();
  if (btns.length === 0) return;
  const handler = () => {
    if (!isUserLoggedIn()) {
      openLoginModal();
      return;
    }
    if (!eligibilityCache.loaded) {
      showToast({ message: "Sipariş bilgisi yükleniyor…", type: "info" });
      return;
    }
    if (!eligibilityCache.can_review) {
      showToast({
        message: "Bu ürünü yorumlayabilmek için onaylı/teslim alınmış bir siparişiniz olmalı.",
        type: "warning",
      });
      return;
    }
    openWriteReviewModal({
      listingId,
      orderItems: eligibilityCache.order_items,
    });
  };
  btns.forEach((btn) => btn.addEventListener("click", handler));
}

async function loadEligibilityAndEnableBtn(listingId: string): Promise<void> {
  const btns = getWriteReviewButtons();
  if (!isUserLoggedIn()) {
    btns.forEach((btn) => {
      btn.disabled = false;
      btn.title = "Yorum yapabilmek için giriş yapın";
    });
    return;
  }
  try {
    const elig = await getReviewEligibility(listingId);
    eligibilityCache = {
      can_review: elig.can_review,
      order_items: elig.order_items,
      loaded: true,
    };
    const title = elig.can_review
      ? "Bu ürünü değerlendir"
      : elig.reason === "already_reviewed"
        ? "Bu ürünü zaten yorumladınız"
        : elig.reason === "own_listing"
          ? "Kendi sattığınız ürünü yorumlayamazsınız"
          : "Bu ürünü yorumlayabilmek için onaylı bir siparişiniz olmalı";
    btns.forEach((btn) => {
      btn.disabled = !elig.can_review;
      btn.title = title;
    });
  } catch (err) {
    console.warn("[reviews] Eligibility load failed:", err);
  }
}

export type SortMode = "relevant" | "newest" | "highest" | "lowest";

export interface ReviewFilterState {
  filterType: "all" | "photo";
  ratingFilter: "all" | number;
  mentionFilter: string | null;
  sortBy: SortMode;
}

export const SORT_LABELS: Record<SortMode, string> = {
  relevant: t("product.sortRelevant"),
  newest: t("product.sortNewest"),
  highest: t("product.sortHighest"),
  lowest: t("product.sortLowest"),
};

export function filterAndSortReviews(state: ReviewFilterState): ProductReview[] {
  const mockProduct = getCurrentProduct();
  let results = [...mockProduct.reviews];

  // Filter by photo/video
  if (state.filterType === "photo") {
    results = results.filter((r) => r.images && r.images.length > 0);
  }

  // Filter by rating
  if (state.ratingFilter !== "all") {
    const target =
      typeof state.ratingFilter === "number"
        ? state.ratingFilter
        : parseInt(String(state.ratingFilter), 10);
    results = results.filter((r) => r.rating === target);
  }

  // Filter by mention tag (match against review tags array)
  if (state.mentionFilter) {
    const keyword = state.mentionFilter.toLowerCase();
    results = results.filter((r) => r.tags?.some((t) => t.toLowerCase() === keyword));
  }

  // Sort
  switch (state.sortBy) {
    case "relevant":
      results.sort((a, b) => b.helpful - a.helpful);
      break;
    case "newest":
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case "highest":
      results.sort((a, b) => b.rating - a.rating || b.helpful - a.helpful);
      break;
    case "lowest":
      results.sort((a, b) => a.rating - b.rating || b.helpful - a.helpful);
      break;
  }

  return results;
}

export function bindHelpfulButtons(container: HTMLElement): void {
  const btns = container.querySelectorAll<HTMLButtonElement>(".rv-helpful-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (btn.classList.contains("voted") || btn.disabled) return;
      if (!isUserLoggedIn()) {
        openLoginModal();
        return;
      }
      const reviewId = btn.dataset.reviewId || "";
      if (!reviewId) return;
      const voteType = (btn.dataset.vote as "helpful" | "not_helpful") || "helpful";

      // Aynı review'a ait helpful + not_helpful butonlarını birlikte kilitle
      // (mutex: ikisine birden basılamasın; backend tek vote tutuyor zaten).
      const siblings = container.querySelectorAll<HTMLButtonElement>(
        `.rv-helpful-btn[data-review-id="${CSS.escape(reviewId)}"]`
      );
      siblings.forEach((b) => {
        b.disabled = true;
      });
      try {
        const res = await voteReviewHelpful(reviewId, voteType);
        // Sadece bu butona "voted" stili ver, diğeri locked-out kalır.
        btn.classList.add("voted");
        if (voteType === "helpful") {
          const count = res.helpful_count ?? 0;
          btn.innerHTML = `
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
            </svg>
            ${t("product.helpful", { count: String(count) })}
          `;
        } else {
          showToast({ message: "Geri bildiriminiz alındı.", type: "success" });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Oy verilemedi";
        showToast({ message: msg, type: "error" });
        // Hata olduysa kardeşleri serbest bırak — kullanıcı yeniden deneyebilsin
        siblings.forEach((b) => {
          if (!b.classList.contains("voted")) b.disabled = false;
        });
      }
    });
  });

  // Şikayet butonları
  const reportBtns = container.querySelectorAll<HTMLButtonElement>(".rv-report-btn");
  reportBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isUserLoggedIn()) {
        openLoginModal();
        return;
      }
      const reviewId = btn.dataset.reviewId || "";
      if (reviewId) openReportAbuseModal(reviewId);
    });
  });

  // Image thumbnail → lightbox
  const imageThumbs = container.querySelectorAll<HTMLButtonElement>(".rv-image-thumb");
  imageThumbs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.imageUrl || "";
      if (url) openImageLightbox(url);
    });
  });

  // Edit own review — 24h içinde, prompt-based mini flow
  const editBtns = container.querySelectorAll<HTMLButtonElement>(".rv-edit-own-btn");
  editBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const reviewId = btn.dataset.reviewId || "";
      if (!reviewId) return;
      // Mevcut yorumun body'sini kart'tan oku (DOM lookup)
      const card = btn.closest(".rv-card") as HTMLElement | null;
      const commentEl = card?.querySelector(".rv-card-comment");
      const oldBody = commentEl?.textContent?.trim() || "";
      const newBody = window.prompt(
        "Yorumunuzu düzenleyin (sadece bir kez, 24 saat içinde):",
        oldBody
      );
      if (newBody == null || newBody.trim() === "" || newBody.trim() === oldBody) {
        return; // İptal veya değişiklik yok
      }
      if (newBody.trim().length < 20) {
        showToast({
          message: "Yorum metni en az 20 karakter olmalı.",
          type: "warning",
        });
        return;
      }
      btn.disabled = true;
      try {
        await updateOwnReview({ name: reviewId, body: newBody.trim() });
        showToast({
          message: "Yorumunuz güncellendi.",
          type: "success",
        });
        // Listeyi yenile (reload event listener tetikler)
        window.dispatchEvent(new CustomEvent("review-submitted"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Düzenleme başarısız";
        showToast({ message: msg, type: "error" });
        btn.disabled = false;
      }
    });
  });
}

/** Basit fullscreen image lightbox — overlay click veya ESC ile kapanır */
function openImageLightbox(url: string): void {
  // Mevcut lightbox varsa önce kapat
  document.getElementById("rv-image-lightbox")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "rv-image-lightbox";
  overlay.className =
    "fixed inset-0 bg-black/85 z-[80] flex items-center justify-center p-4 cursor-zoom-out";
  overlay.innerHTML = `
    <button type="button" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors" aria-label="Kapat">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <img src="${url}" class="max-w-[95vw] max-h-[90vh] object-contain shadow-2xl rounded-lg" alt="" />
  `;
  const onEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  const close = () => {
    // ESC dinleyicisini her zaman temizle — overlay click ile kapatılsa bile
    // listener bellekte kalmasın (memory leak fix).
    window.removeEventListener("keydown", onEsc);
    overlay.remove();
  };
  overlay.addEventListener("click", close);
  // İmajın kendisine tıklayınca kapatma
  overlay.querySelector("img")?.addEventListener("click", (e) => e.stopPropagation());
  window.addEventListener("keydown", onEsc);
  document.body.appendChild(overlay);
}

/**
 * Initialise a scoped review panel (Product tab, Store tab, or Modal).
 * Each scope gets its own independent filter state and re-render pipeline.
 *
 * @param panel            Root DOM element of the scope
 * @param idPrefix         ID namespace – 'rv-product' | 'rv-store' | 'rv-modal'
 * @param dataPrefix       Data-attribute namespace – 'rv' for tabs, 'rv-modal' for modal
 * @param showProductThumb Whether review cards show the product thumbnail
 */
function initScopedReviewPanel(
  panel: HTMLElement,
  idPrefix: string,
  dataPrefix: string,
  showProductThumb: boolean
): void {
  const state: ReviewFilterState = {
    filterType: "all",
    ratingFilter: "all",
    mentionFilter: null,
    sortBy: "relevant",
  };

  // ── Cards container ────────────────────────────────
  // Modal already has #rv-modal-reviews-list; tab panels get a wrapper on the fly.
  let cardsContainer = panel.querySelector<HTMLElement>(`#${idPrefix}-reviews-list`);
  if (!cardsContainer) {
    const showAllBtn = panel.querySelector<HTMLButtonElement>(".rv-show-all-btn");
    const existingCards = panel.querySelectorAll<HTMLElement>(".rv-card");
    cardsContainer = document.createElement("div");
    cardsContainer.id = `${idPrefix}-reviews-list`;
    existingCards.forEach((card) => cardsContainer!.appendChild(card));
    if (showAllBtn) {
      panel.insertBefore(cardsContainer, showAllBtn);
    } else {
      panel.appendChild(cardsContainer);
    }
  }

  function renderFilteredReviews(): void {
    if (!cardsContainer) return;
    const filtered = filterAndSortReviews(state);

    if (filtered.length === 0) {
      cardsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: var(--pd-rating-text-color, #6b7280); font-size: 14px;">
          ${t("product.noReviewsForFilter")}
        </div>
      `;
    } else {
      cardsContainer.innerHTML = filtered
        .map((r) => renderReviewCard(r, showProductThumb))
        .join("");
    }
    bindHelpfulButtons(cardsContainer);
  }

  // ── Filter pills (Tümü / Fotoğraflı) ──────────────
  const filterAttr = `data-${dataPrefix}-filter`;
  const filterPills = panel.querySelectorAll<HTMLButtonElement>(`[${filterAttr}]`);
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const val = pill.getAttribute(filterAttr);
      state.filterType = val === "photo" ? "photo" : "all";
      renderFilteredReviews();
    });
  });

  // ── Rating dropdown ────────────────────────────────
  const ratingDropdown = document.getElementById(`${idPrefix}-rating-dropdown`);
  const sortDropdown = document.getElementById(`${idPrefix}-sort-dropdown`);
  const ratingAttr = `data-${dataPrefix}-rating`;

  if (ratingDropdown) {
    const trigger = ratingDropdown.querySelector<HTMLButtonElement>(".rv-rating-dropdown-trigger");
    const items = ratingDropdown.querySelectorAll<HTMLButtonElement>(`[${ratingAttr}]`);

    trigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      ratingDropdown.classList.toggle("open");
      sortDropdown?.classList.remove("open");
    });

    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        ratingDropdown.classList.remove("open");

        const rating = item.getAttribute(ratingAttr);
        state.ratingFilter = rating === "all" ? "all" : parseInt(rating || "0", 10);

        if (trigger) {
          const label =
            rating === "all" ? t("product.ratingLabel") : `${rating} ${t("product.starSuffix")}`;
          trigger.innerHTML = `${label} <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>`;
          trigger.classList.toggle("active", rating !== "all");
        }
        renderFilteredReviews();
      });
    });
  }

  // ── Sort dropdown ──────────────────────────────────
  const sortAttr = `data-${dataPrefix}-sort`;

  if (sortDropdown) {
    const trigger = sortDropdown.querySelector<HTMLButtonElement>(".rv-sort-dropdown-trigger");
    const items = sortDropdown.querySelectorAll<HTMLButtonElement>(`[${sortAttr}]`);

    trigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      sortDropdown.classList.toggle("open");
      ratingDropdown?.classList.remove("open");
    });

    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        sortDropdown.classList.remove("open");

        const sortVal = item.getAttribute(sortAttr) as SortMode | null;
        if (sortVal && sortVal in SORT_LABELS) {
          state.sortBy = sortVal;
        }

        if (trigger) {
          trigger.innerHTML = `${t("product.sortLabel")}: ${SORT_LABELS[state.sortBy]} <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>`;
        }
        renderFilteredReviews();
      });
    });
  }

  // ── Mention tags ───────────────────────────────────
  const mentionAttr = `data-${dataPrefix}-mention`;
  const mentionTags = panel.querySelectorAll<HTMLButtonElement>(`[${mentionAttr}]`);
  mentionTags.forEach((tag) => {
    tag.addEventListener("click", () => {
      const label = tag.getAttribute(mentionAttr);
      const wasActive = tag.classList.contains("active");

      // Deactivate all, then toggle the clicked one
      mentionTags.forEach((t) => t.classList.remove("active"));
      if (!wasActive) {
        tag.classList.add("active");
        state.mentionFilter = label;
      } else {
        state.mentionFilter = null;
      }
      renderFilteredReviews();
    });
  });

  // ── Helpful buttons (initial binding) ──────────────
  bindHelpfulButtons(panel);
}

export function initReviews(): void {
  const productPanel = document.getElementById("rv-product-panel");
  const storePanel = document.getElementById("rv-store-panel");
  const qaPanel = document.getElementById("rv-qa-panel");
  if (!productPanel) return;

  const product = getCurrentProduct();
  const listingId = product.id;

  // ── Sub-tab switching ──────────────────────────────
  const subTabs = document.querySelectorAll<HTMLButtonElement>(".rv-sub-tab");
  subTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      subTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.dataset.rvPanel;
      if (productPanel) productPanel.classList.toggle("hidden", targetId !== "rv-product-panel");
      if (storePanel) storePanel.classList.toggle("hidden", targetId !== "rv-store-panel");
      if (qaPanel) {
        qaPanel.classList.toggle("hidden", targetId !== "rv-qa-panel");
        if (targetId === "rv-qa-panel" && !qaPanel.dataset.loaded) {
          // İlk açılışta Q&A panel mount edilir
          void mountQAPanel(qaPanel, listingId);
        }
      }
    });
  });

  // ── Init scoped panels ─────────────────────────────
  initScopedReviewPanel(productPanel, "rv-product", "rv", false);
  if (storePanel) {
    initScopedReviewPanel(storePanel, "rv-store", "rv", true);
  }

  // ── Write Review button + eligibility ───────────────
  if (listingId) {
    attachWriteReviewButton(listingId);
    void loadEligibilityAndEnableBtn(listingId);

    // Kullanıcı modal'dan giriş yaptığında "Yorum Yaz" butonu disabled
    // kalıyordu — sayfa refresh gerekiyordu. Event ile eligibility'yi
    // yeniden çek ve butonu güncelle.
    window.addEventListener("login-success", () => {
      void loadEligibilityAndEnableBtn(listingId);
      // Storefront listesi de yeniden yüklensin — kullanıcının kendi
      // Pending yorumu varsa şimdi görünsün.
      void reloadReviewsAndRerender(listingId);
    });

    // Yorum gönderildiğinde listeyi yenile
    window.addEventListener("review-submitted", () => {
      void reloadReviewsAndRerender(listingId);
    });

    // İlk render sırasında reviews boş array ile basıldı; loadProductReviews()
    // backend'den verileri çekince bu event fire eder — panel'leri burada
    // rebuild ediyoruz (gereksiz ikinci API çağrısı yapmadan).
    document.addEventListener("product-reviews-loaded", (e: Event) => {
      const ce = e as CustomEvent<{
        reviews: ProductReview[];
        summary: { review_count: number; weighted_rating?: number; average_rating?: number };
        total: number;
      }>;
      if (!ce.detail) return;
      applyReviewsToPanels({
        reviews: ce.detail.reviews || [],
        reviewCount: ce.detail.summary?.review_count ?? 0,
        storeReviewCount: ce.detail.total ?? 0,
        rating: ce.detail.summary?.weighted_rating || ce.detail.summary?.average_rating || 0,
      });
    });
    // Abuse report sonrası ek bir aksiyon yok (sessizce kaydedildi toast'ı gösteriliyor)
  }

  // ── Q&A count update ────────────────────────────────
  if (listingId) {
    void updateQACount(listingId);
    window.addEventListener("qa-submitted", () => {
      void updateQACount(listingId);
    });
  }

  // ── Click-outside to close all dropdowns ───────────
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".rv-rating-dropdown.open")
      .forEach((el) => el.classList.remove("open"));
    document
      .querySelectorAll(".rv-sort-dropdown.open")
      .forEach((el) => el.classList.remove("open"));
  });
}

async function mountQAPanel(panel: HTMLElement, _listingId: string): Promise<void> {
  panel.dataset.loaded = "1";
  const { ProductQA } = await import("./ProductQA");
  panel.innerHTML = ProductQA();
  // Alpine zaten startAlpine() ile global olarak başlatıldı; manuel yeniden başlatma
  // gerekli değil çünkü Alpine, dinamik eklenen `x-data` node'larını otomatik tarar
  // (yalnızca window.Alpine.initTree çağrısı ile garanti edilir).
  const Alpine = (window as unknown as { Alpine?: { initTree(el: HTMLElement): void } }).Alpine;
  if (Alpine) Alpine.initTree(panel);
}

async function updateQACount(listingId: string): Promise<void> {
  try {
    const { getProductQA: _get } = await import("../../services/listingService");
    const data = await _get(listingId, 1);
    const el = document.getElementById("rv-qa-count");
    if (el) el.textContent = `(${data.total || 0})`;
  } catch {
    /* sessizce yut */
  }
}

/** DOM-only güncelleme — panel'leri, rating özetlerini ve tab başlıklarını rebuild eder.
 * API çağrısı yapmaz; veri zaten elde olduğunda kullanılır.
 */
function applyReviewsToPanels(payload: {
  reviews: ProductReview[];
  reviewCount: number;
  storeReviewCount: number;
  rating?: number;
}): void {
  const productPanel = document.getElementById("rv-product-panel");
  const storePanel = document.getElementById("rv-store-panel");
  const photoCount = payload.reviews.filter((r) => r.images && r.images.length > 0).length;

  if (productPanel) {
    const list = productPanel.querySelector<HTMLElement>("#rv-product-reviews-list");
    if (list) {
      list.innerHTML = payload.reviews.length
        ? payload.reviews.map((r) => renderReviewCard(r, false)).join("")
        : `<div style="text-align: center; padding: 40px 0; color: var(--pd-rating-text-color, #6b7280); font-size: 14px;">${t("product.noReviewsForFilter")}</div>`;
      bindHelpfulButtons(list);
    }
  }
  if (storePanel) {
    const list = storePanel.querySelector<HTMLElement>("#rv-store-reviews-list");
    if (list) {
      list.innerHTML = payload.reviews.length
        ? payload.reviews.map((r) => renderReviewCard(r, true)).join("")
        : `<div style="text-align: center; padding: 40px 0; color: var(--pd-rating-text-color, #6b7280); font-size: 14px;">${t("product.noReviewsForFilter")}</div>`;
      bindHelpfulButtons(list);
    }

    // Rating özet bloğu
    const ratingNum = storePanel.querySelector<HTMLElement>(".rv-rating-number");
    const ratingLabel = storePanel.querySelector<HTMLElement>(".rv-rating-label");
    const ratingSubtitle = storePanel.querySelector<HTMLElement>(".rv-rating-subtitle");
    const ratingStars = storePanel.querySelector<HTMLElement>(
      ".rv-rating-summary .flex.items-center.gap-0\\.5"
    );
    if (payload.rating != null && ratingNum) {
      ratingNum.textContent = String(payload.rating);
    }
    if (payload.rating != null && ratingLabel) {
      ratingLabel.textContent = satisfactionLabel(payload.rating);
    }
    if (ratingSubtitle) {
      ratingSubtitle.textContent = t("product.basedOnReviews", {
        count: String(payload.storeReviewCount),
      });
    }
    if (payload.rating != null && ratingStars) {
      ratingStars.innerHTML = renderStars(payload.rating);
    }

    // Fotoğraflı filter pill — "Fotoğraflı (N)"
    const photoPill = storePanel.querySelector<HTMLButtonElement>('[data-rv-filter="photo"]');
    if (photoPill) {
      photoPill.textContent = t("product.withPhotos", { count: String(photoCount) });
    }
  }
  const tabs = document.querySelectorAll<HTMLButtonElement>(".rv-sub-tab");
  if (tabs[0])
    tabs[0].textContent = t("product.productReviewsTab", {
      count: String(payload.reviewCount),
    });
  if (tabs[1])
    tabs[1].textContent = t("product.storeReviewsTab", {
      count: String(payload.storeReviewCount),
    });

  // "Tümünü Göster" modal'ı (ReviewsModal) — başlık, foto filter ve liste
  const modal = document.getElementById("rv-reviews-modal");
  if (modal) {
    const modalTitle = modal.querySelector<HTMLElement>("#rv-modal-title");
    if (modalTitle) {
      modalTitle.textContent = t("product.storeReviewsTitle", {
        count: String(payload.storeReviewCount),
      });
    }
    const modalPhotoPill = modal.querySelector<HTMLButtonElement>("#rv-modal-photo-filter");
    if (modalPhotoPill) {
      modalPhotoPill.textContent = t("product.withPhotos", {
        count: String(photoCount),
      });
    }
    const modalList = modal.querySelector<HTMLElement>("#rv-modal-reviews-list");
    if (modalList) {
      modalList.innerHTML = payload.reviews.length
        ? payload.reviews.map((r) => renderReviewCard(r, true)).join("")
        : `<div style="text-align: center; padding: 40px 0; color: var(--pd-rating-text-color, #6b7280); font-size: 14px;">${t("product.noReviewsForFilter")}</div>`;
      bindHelpfulButtons(modalList);
    }
  }
}

async function reloadReviewsAndRerender(listingId: string): Promise<void> {
  try {
    const data = await getProductReviews(listingId, { pageSize: 50 });
    const product = getCurrentProduct();
    product.reviews = data.reviews;
    product.reviewCount = data.summary.review_count;
    product.rating = data.summary.weighted_rating || data.summary.average_rating;
    product.storeReviewCount = data.total;

    applyReviewsToPanels({
      reviews: data.reviews,
      reviewCount: data.summary.review_count,
      storeReviewCount: data.total,
      rating: data.summary.weighted_rating || data.summary.average_rating,
    });

    // Eligibility yeniden çek (yorum yapıldığı için artık reviewed sayılır)
    void loadEligibilityAndEnableBtn(listingId);
  } catch (err) {
    console.warn("[reviews] reload failed:", err);
  }
}
