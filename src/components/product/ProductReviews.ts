/**
 * ProductReviews Component
 * iSTOC-style reviews: sub-tabs, rating summary, category bars,
 * filter/mention pills, review cards with badges & supplier replies.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t, getCurrentLang } from "../../i18n";
import type { ProductReview } from "../../types/product";
import { openLoginModal } from "./LoginModal";
import { isLoggedIn as isUserLoggedIn } from "../../utils/auth";
import {
  getReviewEligibility,
  voteReviewHelpful,
  getProductReviews,
} from "../../services/listingService";
import { openWriteReviewModal } from "./WriteReviewModal";
import { openEditReviewModal } from "./EditReviewModal";
import { openReportAbuseModal } from "./ReportAbuseModal";
import { showToast } from "../../utils/toast";
import { escapeHtml, sanitizeHtml } from "../../utils/sanitize";
import { getFlagSvg } from "../../utils/flags";
import { formatPriceRange } from "../../services/currencyService";

/* ── Utility helpers ─────────────────────────────────── */

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

function starIconPartial(fillPercent: number, small = false): string {
  // Kart yıldızı referans ölçüsü 16×16 — h-4 kök font 18px'te 18px'e şişer.
  const size = small ? "h-[16px] w-[16px]" : "h-4 w-4";
  const pct = Math.max(0, Math.min(100, fillPercent));
  if (pct === 0) {
    return `<svg class="${size} text-[#d1d5db]" viewBox="0 0 20 20" fill="currentColor"><path d="${STAR_PATH}"/></svg>`;
  }
  if (pct === 100) {
    return `<svg class="${size} text-[var(--pd-review-star-color,#f59e0b)]" viewBox="0 0 20 20" fill="currentColor"><path d="${STAR_PATH}"/></svg>`;
  }
  // Dinamik clip-path: kırpılacak sağ tarafı CSS variable ile geçir,
  // utility ise [clip-path:inset(0_var(--star-fill)_0_0)] olarak yazılır.
  return (
    `<span class="relative inline-flex" style="--star-fill:${100 - pct}%">` +
    `<svg class="${size} text-[#d1d5db]" viewBox="0 0 20 20" fill="currentColor"><path d="${STAR_PATH}"/></svg>` +
    `<svg class="${size} absolute inset-0 pointer-events-none text-[var(--pd-review-star-color,#f59e0b)] [clip-path:inset(0_var(--star-fill)_0_0)]" viewBox="0 0 20 20" fill="currentColor"><path d="${STAR_PATH}"/></svg>` +
    `</span>`
  );
}

export function renderStars(rating: number, small = false): string {
  return Array.from({ length: 5 }, (_, i) => {
    const fill = Math.max(0, Math.min(1, rating - i)) * 100;
    return starIconPartial(fill, small);
  }).join("");
}

/** Puanı gösterim skoruna çevirir: tam sayıysa "5", değilse tek ondalık "4.9". */
export function formatScore(rating: number | undefined): string {
  return rating ? Number(rating).toFixed(rating % 1 === 0 ? 0 : 1) : "0";
}

interface ReviewLike {
  rating: number;
  aspects?: {
    product_quality?: number | null;
    service?: number | null;
    shipping?: number | null;
    spec_match?: number | null;
    documentation?: number | null;
  } | null;
}

/**
 * Yorum kartı için gösterilecek puanı, aspect ortalamasından (varsa) hesaplar.
 * Backend `rating` Int olduğu için 3.5 → 4 olarak saklanır; gerçek ortalamayı
 * detay puanlarından yeniden üretiyoruz ki kısmi yıldız doğru render edilsin.
 */
export function displayRating(r: ReviewLike): number {
  const a = r.aspects;
  if (a) {
    const vals = [a.product_quality, a.service, a.shipping, a.spec_match].filter(
      (v): v is number => typeof v === "number" && v > 0
    );
    if (vals.length > 0) {
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    }
  }
  return r.rating;
}

/**
 * Ortalama puanı tek ondalıkla, aktif dile göre biçimlendirir.
 * Backend/aspect ortalaması 4.1875 gibi ham değer üretebilir → "4,2" (TR) gösterilir.
 */
function formatRating(rating: number): string {
  return rating.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function anonymizeName(name: string): string {
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

/* ── Buyer photo strip (Alıcı fotoğrafları vitrini) ───── */

/**
 * Tüm yorumlardaki görselleri tek bir kaydırılabilir şeritte toplar.
 * Görsel yoksa boş string döner (bölüm gizlenir). Thumbnail'ler
 * `.rv-image-thumb` sınıfıyla mevcut lightbox binding'ine otomatik bağlanır;
 * "Tümünü gör" / "+N" öğeleri `.rv-photos-more` ile show-all modalını açar.
 */
function photoStripSection(reviews: ProductReview[]): string {
  const imgs: Array<{ src: string; rating: number }> = [];
  for (const r of reviews) {
    if (Array.isArray(r.images)) {
      for (const src of r.images) imgs.push({ src, rating: Math.round(displayRating(r)) });
    }
  }
  if (imgs.length === 0) return "";

  const MAX = 6;
  const shown = imgs.slice(0, MAX);
  const remaining = imgs.length - shown.length;

  const thumbs = shown
    .map(
      (im) => `
      <button type="button" class="rv-image-thumb relative shrink-0 w-[108px] h-[108px] rounded-md overflow-hidden border border-[var(--pd-spec-border,#e5e5e5)] cursor-zoom-in bg-[var(--color-surface-raised,#f5f5f5)] transition-transform duration-150 hover:-translate-y-0.5 [scroll-snap-align:start] max-[374px]:w-[88px] max-[374px]:h-[88px]" data-image-url="${escapeHtml(im.src)}" aria-label="${t("product.buyerPhoto", { count: String(im.rating) })}">
        <img src="${escapeHtml(im.src)}" width="96" height="96" decoding="async" class="w-full h-full object-cover" loading="lazy" alt="" />
        <span class="absolute start-1.5 bottom-1.5 inline-flex items-center gap-0.5 bg-[rgba(20,23,28,0.78)] text-white rounded-[6px] px-1.5 py-0.5 text-[11px] font-bold">
          <svg class="w-3 h-3 text-[var(--color-primary-500,#ff8600)]" viewBox="0 0 20 20" fill="currentColor"><path d="${STAR_PATH}"/></svg>${im.rating}
        </span>
      </button>`
    )
    .join("");

  const moreTile =
    remaining > 0
      ? `<button type="button" class="rv-photos-more shrink-0 w-[108px] h-[108px] rounded-md bg-[var(--color-surface-inverse,#0a0a0a)] text-white font-bold text-[16px] grid place-items-center cursor-pointer max-[374px]:w-[88px] max-[374px]:h-[88px]">+${remaining}</button>`
      : "";

  return `
    <div class="mb-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-[15px] font-bold text-[var(--pd-title-color,#111827)] flex items-center gap-2">
          <svg class="w-[17px] h-[17px] text-[var(--pd-rating-text-color,#6b7280)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          ${t("product.buyerPhotos")}
        </h3>
        <button type="button" class="rv-photos-more text-[13px] font-semibold text-[var(--pd-rating-text-color,#6b7280)] hover:text-[var(--pd-title-color,#111827)] transition-colors">${t("product.viewAllPhotos", { count: String(imgs.length) })}</button>
      </div>
      <div class="flex gap-2.5 overflow-x-auto pb-1.5 [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--color-border-medium,#d1d5db)] [&::-webkit-scrollbar-thumb]:rounded-full">
        ${thumbs}${moreTile}
      </div>
    </div>`;
}

/* ── Review card renderer ────────────────────────────── */

export function renderReviewCard(review: ProductReview, showProductThumb = false): string {
  // Sol kolonda alt alta dizilen kimlik satırları (referans düzen).
  const sideRows: string[] = [];
  const countryLabel = review.countryName || review.country;
  if (countryLabel) {
    sideRows.push(
      `<span class="flex max-w-full items-center gap-[6px]">${getFlagSvg(review.country)}<span class="min-w-0 truncate text-[12px] leading-[16px] text-[#222]">${escapeHtml(countryLabel)}</span></span>`
    );
  }
  if (review.verified) {
    // Üst özetteki "Doğrulanmış Siparişler" rozetinin aynısı, 11×11 (referans ölçü).
    sideRows.push(
      `<span class="flex items-center gap-[4px] text-[12px] leading-[16px] text-[#22891F]"><img src="/images/dogrulanmis-siparis.png" alt="" width="11" height="11" class="h-[11px] w-[11px] shrink-0" aria-hidden="true" />${t("product.verifiedPurchase")}</span>`
    );
  }
  if (review.repeatBuyer) {
    sideRows.push(
      `<span class="inline-block scale-[0.9] origin-left rounded-[2px] bg-[#F4F4F4] p-[4px] text-[12px] leading-[16px] text-[#444444]">${t("product.repeatBuyer")}</span>`
    );
  }
  if (review.isOwnPending) {
    sideRows.push(
      `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-700">${t("prodUi.pendingApproval")}</span>`
    );
  }
  // Reviewer reputation tier — Top/Trusted/Verified (B2B güven göstergesi)
  if (review.reviewerTier) {
    const tierLabels: Record<string, string> = {
      Top: t("product.reviewWrite.reviewerTop"),
      Trusted: t("product.reviewWrite.reviewerTrusted"),
      Verified: t("product.reviewWrite.reviewerVerified"),
    };
    const tierClasses: Record<string, string> = {
      Top: "bg-purple-100 text-purple-700",
      Trusted: "bg-indigo-100 text-indigo-700",
      Verified: "bg-emerald-100 text-emerald-700",
    };
    const cls = tierClasses[review.reviewerTier] || "bg-gray-100 text-gray-700";
    const label = tierLabels[review.reviewerTier] || review.reviewerTier;
    sideRows.push(
      `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cls}">${label}</span>`
    );
  }

  // Referans format: "18 Oca 2026". Ham string parse edilemezse olduğu gibi kalır.
  const parsedDate = new Date(review.date);
  const dateLabel = isNaN(parsedDate.getTime())
    ? review.date
    : parsedDate.toLocaleDateString(getCurrentLang(), {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  // Backend "trust" yetersiz: satıcı/alıcı kontrollü tüm metin alanları XSS
  // riski taşır. Reply zengin metin barındırabildiği için sanitizeHtml ile
  // izinli tag whitelist'inden geçir; diğer kısa metinler düz escape.
  const supplierReplyHtml = review.supplierReply
    ? `<div class="rv-supplier-reply bg-[var(--pd-spec-header-bg,#f9fafb)] rounded-md px-3.5 py-3 mb-3">
        <div class="rv-supplier-reply-label text-[12px] font-semibold text-[var(--pd-rating-text-color,#6b7280)] mb-1">${t("product.supplierReply")}</div>
        <div class="rv-supplier-reply-text text-[13px] text-[var(--pd-spec-value-color,#111827)] leading-[1.5]">${sanitizeHtml(review.supplierReply)}</div>
      </div>`
    : "";

  const imagesHtml =
    Array.isArray(review.images) && review.images.length > 0
      ? `<div class="flex gap-[6px] flex-wrap mb-[8px]">
          ${review.images
            .map(
              (src) => `
            <button
              type="button"
              class="rv-image-thumb th-no-press shrink-0 w-[72px] h-[72px] rounded-[4px] overflow-hidden bg-[#f5f5f5] cursor-zoom-in appearance-none focus:outline-none border-0 p-0"
              data-image-url="${escapeHtml(src)}"
              aria-label="${t("product.productImage")}"
            >
              <img src="${escapeHtml(src)}" width="72" height="72" decoding="async" class="w-full h-full object-contain" loading="lazy" alt="" />
            </button>`
            )
            .join("")}
        </div>`
      : "";

  // Referans ürün barı ölçüleri: bar bg #f4f4f4, p 4px, rounded 4px; görsel
  // 32×32; iç satır px 8px; fiyat 14px/#222; sağda "Ürün detaylarına göz atın ›".
  // Yorum payload'ında ürün bilgisi yoksa sayfadaki üründen türet — mağaza
  // sekmesindeki kartlar zaten bu ürünün yorumları. formatPriceRange min===max
  // halini içeride ele alır, ayrı formatPrice dalı gerekmez.
  let productThumbHtml = "";
  if (showProductThumb) {
    const cp = getCurrentProduct();
    const tierPrices = cp.priceTiers.map((ti) => ti.basePrice ?? ti.price);
    const barPrice =
      review.productPrice ||
      (tierPrices.length
        ? formatPriceRange(Math.min(...tierPrices), Math.max(...tierPrices), cp.baseCurrency)
        : "");
    const barImage = review.productImage || cp.images.find((im) => !im.isVideo)?.src || "";
    if (barPrice) {
      productThumbHtml = `<div class="rv-product-card mb-[8px] flex items-center rounded-[4px] bg-[#f4f4f4] p-[4px]">
        <img class="rv-product-card-img h-[32px] w-[32px] shrink-0 rounded-[2px] object-cover" src="${escapeHtml(barImage)}" alt="${t("product.productImage")}" width="32" height="32" decoding="async">
        <div class="flex flex-1 items-center justify-between gap-2 overflow-hidden px-[8px]">
          <span class="rv-product-card-price truncate text-[14px] font-semibold text-[#222]">${escapeHtml(barPrice)}</span>
          <a class="rv-product-card-link flex shrink-0 items-center gap-[2px] whitespace-nowrap text-[14px] text-[#222] no-underline hover:underline" href="javascript:void(0)">${t("product.viewProductDetails")} ›</a>
        </div>
      </div>`;
    }
  }

  // Referans kart düzeni: sol kimlik kolonu + orta içerik + sağ üstte tarih.
  // Ölçüler DevTools'tan: kart pt 20 + border-b #E8E8E8, kolon gap 12,
  // sol kolon 200px, kimlik satırları arası 8px, avatar satırı mb 16 / gap 4.
  return `
    <!-- Referans kart ölçüsü: padding 20px 0px (dikey iki yönde). -->
    <div class="rv-card relative flex gap-[12px] py-[20px] border-b border-[#E8E8E8] last-of-type:border-b-0 max-sm:flex-col max-sm:gap-3 max-[374px]:py-3">
      <span class="rv-card-date absolute top-[20px] end-0 text-[12px] leading-[16px] text-[#767676] max-[374px]:top-3">${escapeHtml(dateLabel)}</span>

      <div class="w-[200px] shrink-0 max-sm:w-full">
        <div class="flex items-center gap-[4px] mb-[16px]">
          <div class="rv-avatar w-[28px] h-[28px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 text-[var(--color-text-inverse,#fff)]" style="background: ${avatarColor(review.author)};">
            ${escapeHtml(review.author.charAt(0))}
          </div>
          <span class="rv-card-name min-w-0 truncate text-[14px] font-semibold text-[#222]">${escapeHtml(anonymizeName(review.author))}</span>
        </div>
        <div class="flex flex-col items-start gap-[8px]">
          ${sideRows.join("")}
        </div>
      </div>

      <div class="flex-1 min-w-0 pe-[90px] max-sm:pe-0">
        <div class="flex items-center gap-0.5">${renderStars(displayRating(review), true)}</div>
        <div class="rv-card-comment mt-[4px] mb-[8px] text-[14px] leading-[1.5] text-[#222] max-[374px]:text-[13px]">${escapeHtml(review.comment)}</div>
        ${imagesHtml}
        ${supplierReplyHtml}
        ${productThumbHtml}
        <div class="flex items-center gap-3 flex-wrap">
          <button type="button" class="rv-helpful-btn th-no-press appearance-none focus:outline-none flex items-center gap-1 text-[11px] leading-[16px] text-[#767676] bg-transparent border-0 p-0 cursor-pointer transition-colors duration-150 hover:text-[#222] [&.voted]:text-[var(--pd-tab-active-color,#cc6b00)]" data-review-id="${review.id}" data-vote="helpful">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
            </svg>
            <span class="rv-helpful-label">${t("product.helpful", { count: String(review.helpful) })}</span>
          </button>
          <button
            type="button"
            class="rv-helpful-btn th-no-press appearance-none focus:outline-none flex items-center gap-1 text-[11px] leading-[16px] text-[#767676] bg-transparent border-0 p-0 cursor-pointer transition-colors duration-150 hover:text-[#222] [&.voted]:text-[var(--pd-tab-active-color,#cc6b00)]"
            data-review-id="${review.id}"
            data-vote="not_helpful"
            title="${t("prodUi.notHelpful")}"
            aria-label="${t("prodUi.notHelpful")}"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" style="transform: rotate(180deg);">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
            </svg>
          </button>
          ${
            review.canEdit
              ? `<button type="button" class="rv-edit-own-btn th-no-press appearance-none focus:outline-none inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[11px] leading-[16px] text-[#767676] cursor-pointer transition-colors hover:text-[#222]" data-review-id="${review.id}" title="${t("product.reviewWrite.editMyReviewHint")}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.032 2.032 0 112.872 2.872L7.5 21.613H4v-3.5L16.862 4.487z"/></svg>
                  ${t("prodUi.edit")}
                </button>`
              : ""
          }
          <button type="button" class="rv-report-btn th-no-press appearance-none focus:outline-none inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[11px] leading-[16px] text-[#767676] cursor-pointer transition-colors hover:text-[#222]" data-review-id="${review.id}" title="${t("prodUi.reportAction")}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
            ${t("prodUi.reportShort")}
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ── Shared sub-component helpers ─────────────────────── */

// Alibaba referans PDP'den DevTools ile ölçülen chip değerleri (2026-07-29):
// 14px/32px metin, #222; aktif chip 600 + koyu kalın kenarlık. Kalın kenarlık
// border-2 yerine inset ring ile — genişlik değişip layout shift yapmasın.
// Filtre toggle'ları olduğundan global press efekti th-no-press ile kapalı.
/** Sayfada gösterilen yorum sayısı sınırı — fazlası "Tümünü göster" modalında. */
export const INLINE_REVIEW_LIMIT = 4;

/** Boş liste durumu — 4 ayrı listede aynı blok kullanılıyor, tek kaynak. */
export const emptyListHtml = (msg: string): string =>
  `<div class="py-10 text-center text-[14px] text-[var(--pd-rating-text-color,#6b7280)]">${msg}</div>`;

export const CHIP_CLASS =
  "th-no-press appearance-none focus:outline-none px-[20px] py-[5px] text-[14px] leading-[32px] font-normal rounded-full border border-[#dddddd] bg-white text-[#222] cursor-pointer transition-colors duration-150 whitespace-nowrap [&.active]:font-semibold [&.active]:border-[#222] [&.active]:shadow-[inset_0_0_0_1px_#222] [&:hover:not(.active)]:border-[#999]";

// Dropdown menü öğesi — referans ölçüler: 14px metin, 12×20 padding, #222.
export const MENU_ITEM_CLASS =
  "th-no-press appearance-none focus:outline-none flex items-center w-full text-start gap-[8px] px-[20px] py-[12px] text-[14px] leading-[20px] text-[#222] bg-transparent border-0 cursor-pointer transition-colors duration-100 hover:bg-[#f5f5f5]";

export const MENU_PANEL_CLASS =
  "hidden absolute top-[calc(100%+8px)] z-10 rounded-lg bg-white py-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.14)]";

function ratingDropdownHtml(idPrefix: string): string {
  const reviews = getCurrentProduct().reviews;
  const rows = [5, 4, 3, 2, 1]
    .map((n) => {
      const count = reviews.filter((r) => r.rating === n).length;
      return `
        <button type="button" class="rv-rating-dropdown-item ${MENU_ITEM_CLASS} [&.active]:font-semibold [&.active_.rv-check]:border-[#222] [&.active_.rv-check]:bg-[#222] [&.active_.rv-check_svg]:opacity-100" data-rv-rating="${n}">
          <span>${t("product.starLabel", { count: String(n) })}</span>
          <span class="rv-star-count">(${count})</span>
          <span class="rv-check ms-auto inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] border border-[#c4c4c4] bg-white transition-colors duration-100">
            <svg class="opacity-0" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </span>
        </button>`;
    })
    .join("");
  return `
    <div class="rv-rating-dropdown relative inline-block [&.open_.rv-rating-dropdown-panel]:block [&.open_.rv-rating-chevron]:rotate-180" id="${idPrefix}-rating-dropdown">
      <button type="button" class="rv-rating-dropdown-trigger ${CHIP_CLASS} inline-flex items-center gap-[6px]">
        <span class="rv-rating-trigger-label">${t("product.ratingLabel")}</span>
        <svg class="rv-rating-chevron transition-transform duration-150" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="rv-rating-dropdown-panel ${MENU_PANEL_CLASS} start-0 min-w-[236px]">
        ${rows}
      </div>
    </div>`;
}

function sortDropdownHtml(idPrefix: string): string {
  return `
    <div class="rv-sort-dropdown relative inline-block ms-auto [&.open_.rv-sort-dropdown-panel]:block [&.open_.rv-sort-chevron]:rotate-180 max-sm:!ms-0" id="${idPrefix}-sort-dropdown">
      <button type="button" class="rv-sort-dropdown-trigger th-no-press appearance-none focus:outline-none flex items-center gap-[6px] bg-transparent border-0 p-0 text-[14px] font-semibold text-[#222] cursor-pointer whitespace-nowrap">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m3 16 4 4 4-4M7 20V4m14 4-4-4-4 4m4-4v16"/></svg>
        <span class="rv-sort-trigger-label">${t("product.sortLabel")}: ${t("product.sortRelevant")}</span>
        <svg class="rv-sort-chevron transition-transform duration-150" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="rv-sort-dropdown-panel ${MENU_PANEL_CLASS} end-0 min-w-[158px] max-sm:!left-0 max-sm:!right-auto">
        <button type="button" class="rv-sort-dropdown-item ${MENU_ITEM_CLASS} [&.active]:font-bold active" data-rv-sort="relevant">${t("product.sortRelevant")}</button>
        <button type="button" class="rv-sort-dropdown-item ${MENU_ITEM_CLASS} [&.active]:font-bold" data-rv-sort="newest">${t("product.sortNewest")}</button>
      </div>
    </div>`;
}

function categoryRowHtml(cats: Array<{ label: string; score: string | number }>): string {
  return cats
    .map(
      (cat, i) => `
      ${i > 0 ? '<span class="mx-3 h-[14px] w-px bg-[#e5e5e5]" aria-hidden="true"></span>' : ""}
      <span class="rv-category-label text-[14px] text-[#222]">${cat.label}</span>
      <span class="rv-category-score ms-1.5 text-[16px] font-bold text-[#222]">${cat.score}</span>`
    )
    .join("");
}

/**
 * Puan özeti — referans düzende hem Ürün hem Mağaza sekmesinin başında aynı
 * blok durur; yalnız Mağaza'da altına kategori skorları satırı eklenir.
 * Ölçüler: sarmalayıcı pt-24/mb-12 · puan 48px/700/#222 (sağdan 12px) ·
 * yıldız 26px · "Doğrulanmış Siparişler" #22891F, 1.5px alt çizgi.
 */
function ratingSummaryHtml(rating: number, countText: string, categoriesHtml = ""): string {
  return `
    <div class="rv-rating-summary pt-[24px] mb-[12px]">
      <div class="mb-[4px] flex items-center flex-wrap gap-y-1">
        <span class="rv-rating-number me-[12px] text-[48px] font-bold leading-[30px] text-[#222]">${formatRating(rating)}</span>
        <span class="rv-rating-stars flex items-center [&_svg]:h-[26px] [&_svg]:w-[26px]">${renderStars(rating)}</span>
        <span class="rv-rating-label ps-[4px] text-[14px] leading-[18px] font-semibold text-[#222]">${satisfactionLabel(rating)}</span>
        <span class="rv-rating-subtitle ms-3 text-[14px] text-[#666]">${countText}</span>
        <span class="rv-verified-orders group relative ms-[4px] inline-flex items-center">
          <span class="border-b-[1.5px] border-[#22891F] pb-[1px] text-[14px] text-[#22891F] cursor-default">${t("product.verifiedOrders")}</span>
          <img src="/images/dogrulanmis-siparis.png" alt="" width="18" height="18" class="ms-1 h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <!-- Referans davranış: etikete hover'da siyah açıklama balonu. -->
          <span class="rv-verified-tooltip invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute top-[calc(100%+12px)] start-[-40px] z-30 w-[min(620px,88vw)] rounded-[10px] bg-black p-[20px] text-[15px] leading-[1.6] font-normal text-white before:content-[''] before:absolute before:-top-[6px] before:start-[60px] before:size-[12px] before:rotate-45 before:bg-black">${t("product.verifiedOrdersTooltip")}</span>
        </span>
      </div>
      <div class="rv-category-row flex items-center flex-wrap gap-x-1 gap-y-1 empty:hidden">${categoriesHtml}</div>
    </div>`;
}

/**
 * "Tümünü göster" — referans ölçüler: 364×48 pill, 16px #09090B, mt 8.
 * Sınırdan az yorum varsa gizli; sayıya göre applyReviewsToPanels de toggle eder.
 * data-rv-modal-mode modal başlığını/kart tipini belirler (ürün | mağaza).
 */
function showAllButtonHtml(mode: "product" | "store", total: number): string {
  return `<button type="button" data-rv-modal-mode="${mode}" class="rv-show-all-btn ${total > INLINE_REVIEW_LIMIT ? "" : "hidden "}mt-[8px] inline-flex h-[48px] w-[364px] max-w-full items-center justify-center whitespace-nowrap rounded-full border border-[#09090B] bg-white text-[16px] text-[#09090B] cursor-pointer transition-colors duration-150 hover:bg-[#f5f5f5]">${t("product.showAll")}</button>`;
}

function langToggleHtml(): string {
  return `
    <div class="rv-lang-row flex items-center gap-2 mt-2 mb-3">
      <svg class="w-[18px] h-[18px] shrink-0 text-[#222]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clip-rule="evenodd"/></svg>
      <span class="text-[14px] leading-[1.5] text-[#222]">${t("product.langNote")}</span>
      <a class="rv-lang-toggle-link text-[14px] leading-[1.5] text-[#222] underline cursor-pointer hover:text-black" href="javascript:void(0)">${t("product.showOriginal")}</a>
    </div>`;
}

/* ── Main component ──────────────────────────────────── */

export function ProductReviews(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;
  const photoReviewCount = p.reviews.filter((r) => r.images && r.images.length > 0).length;

  return `
    <!-- Üst boşluk ProductTabs panelinden gelir (pt-6 + border-t); panel h2'si
         reviews için basılmaz — başlık buradaki reviewsSectionTitle'dır. -->
    <div id="review-layout">
      <h2 class="m-0 mb-[20px] text-[20px] leading-[26px] font-bold text-[#222]">${t("product.reviewsSectionTitle")}</h2>
      <!-- Sub-tabs + Yorum Yaz CTA -->
      <div class="flex items-center justify-between gap-3 border-b-2 border-border-default mb-6 max-[374px]:mb-4 flex-wrap">
        <div class="flex">
          <button type="button" class="rv-sub-tab px-3 py-6 me-8 last:me-0 text-[16px] font-medium text-[#71717A] bg-none border-none cursor-pointer relative whitespace-nowrap transition-colors duration-150 [&.active]:text-[#222] [&.active]:font-bold [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:bottom-[-2px] [&.active]:after:start-0 [&.active]:after:end-0 [&.active]:after:h-[2px] [&.active]:after:bg-[#222] max-[374px]:text-[13px] max-[374px]:px-2 max-[374px]:py-2 max-[374px]:me-3 active" data-rv-panel="rv-product-panel">${t("product.productReviewsTab", { count: String(p.reviewCount) })}</button>
          <button type="button" class="rv-sub-tab px-3 py-6 me-8 last:me-0 text-[16px] font-medium text-[#71717A] bg-none border-none cursor-pointer relative whitespace-nowrap transition-colors duration-150 [&.active]:text-[#222] [&.active]:font-bold [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:bottom-[-2px] [&.active]:after:start-0 [&.active]:after:end-0 [&.active]:after:h-[2px] [&.active]:after:bg-[#222] max-[374px]:text-[13px] max-[374px]:px-2 max-[374px]:py-2 max-[374px]:me-3" data-rv-panel="rv-store-panel">${t("product.storeReviewsTab", { count: String(p.storeReviewCount) })}</button>
          <button type="button" class="rv-sub-tab px-3 py-6 me-8 last:me-0 text-[16px] font-medium text-[#71717A] bg-none border-none cursor-pointer relative whitespace-nowrap transition-colors duration-150 [&.active]:text-[#222] [&.active]:font-bold [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:bottom-[-2px] [&.active]:after:start-0 [&.active]:after:end-0 [&.active]:after:h-[2px] [&.active]:after:bg-[#222] max-[374px]:text-[13px] max-[374px]:px-2 max-[374px]:py-2 max-[374px]:me-3" data-rv-panel="rv-qa-panel" id="rv-qa-tab-btn">${t("product.reviewWrite.qaTab")} <span id="rv-qa-count">(0)</span></button>
        </div>
        <button
          type="button"
          id="rv-write-review-btn"
          class="th-btn-dark h-9 px-4 rounded-md text-[13px] font-semibold inline-flex items-center gap-1.5 mb-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
          title="${t("product.reviewWrite.writeReviewDisabledHint")}"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.032 2.032 0 112.872 2.872L7.5 21.613H4v-3.5L16.862 4.487z"/></svg>
          <span>${t("product.reviewWrite.writeReviewBtn")}</span>
        </button>
      </div>

      <!-- Product Reviews Panel -->
      <div id="rv-product-panel">
        ${ratingSummaryHtml(p.rating, t("product.basedOnReviews", { count: String(p.reviewCount) }))}

        <!-- Filter Row -->
        <div class="rv-filter-row flex items-center gap-2 flex-wrap mb-4">
          <button type="button" class="rv-filter-pill ${CHIP_CLASS} active" data-rv-filter="all">${t("product.allFilter")}</button>
          <button type="button" class="rv-filter-pill ${CHIP_CLASS}" data-rv-filter="photo">${t("product.withPhotos", { count: String(photoReviewCount) })}</button>
          ${ratingDropdownHtml("rv-product")}
          ${sortDropdownHtml("rv-product")}
        </div>

        <!-- Language Toggle -->
        ${langToggleHtml()}

        <!-- Review Cards (sayfada ilk ${INLINE_REVIEW_LIMIT}; tamamı modalda) -->
        ${p.reviews.slice(0, INLINE_REVIEW_LIMIT).map((r) => renderReviewCard(r, false)).join("")}

        ${showAllButtonHtml("product", p.reviews.length)}
      </div>

      <!-- Store Reviews Panel (hidden) -->
      <div id="rv-store-panel" class="hidden">
        ${ratingSummaryHtml(
          p.rating,
          t("product.basedOnReviews", { count: String(p.storeReviewCount) }),
          categoryRowHtml(p.reviewCategoryRatings)
        )}

        <!-- Buyer Photos Strip -->
        <div id="rv-store-photos">${photoStripSection(p.reviews)}</div>

        <!-- Filter Row -->
        <div class="rv-filter-row flex items-center gap-2 flex-wrap mb-4">
          <button type="button" class="rv-filter-pill ${CHIP_CLASS} active" data-rv-filter="all">${t("product.allFilter")}</button>
          <button type="button" class="rv-filter-pill ${CHIP_CLASS}" data-rv-filter="photo">${t("product.withPhotos", { count: String(photoReviewCount) })}</button>
          ${ratingDropdownHtml("rv-store")}
          ${sortDropdownHtml("rv-store")}
        </div>

        <!-- Mention Tags -->
        <div class="flex gap-2 flex-wrap mb-5">
          <span style="font-size: 12px; color: var(--pd-rating-text-color, #6b7280); align-self: center;">${t("product.frequentMentions")}</span>
          ${p.reviewMentionTags
            .map(
              (tag) => `
            <button type="button" class="rv-mention-tag py-1 px-3 text-[12px] rounded bg-[var(--pd-spec-header-bg,#f9fafb)] text-[var(--pd-rating-text-color,#6b7280)] border border-[var(--pd-spec-border,#e5e5e5)] cursor-pointer transition-colors duration-150 hover:border-[var(--color-border-medium,#d1d5db)] [&.active]:border-[var(--pd-tab-active-border,#cc6b00)] [&.active]:text-[var(--pd-tab-active-color,#cc6b00)] [&.active]:bg-[var(--pd-price-tier-active-bg,#fef9e7)] [&.active]:font-semibold" data-rv-mention="${tag.label}">${tag.label} (${tag.count})</button>
          `
            )
            .join("")}
        </div>

        <!-- Language Toggle -->
        ${langToggleHtml()}

        <!-- Review Cards (with product thumbnails; sayfada ilk ${INLINE_REVIEW_LIMIT}) -->
        ${p.reviews.slice(0, INLINE_REVIEW_LIMIT).map((r) => renderReviewCard(r, true)).join("")}

        ${showAllButtonHtml("store", p.reviews.length)}
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
      showToast({ message: t("prodUi.orderInfoLoading"), type: "info" });
      return;
    }
    if (!eligibilityCache.can_review) {
      showToast({
        message: t("prodUi.reviewRequiresOrder"),
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
      btn.title = t("prodUi.loginToReview");
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
      ? t("prodUi.reviewThisProduct")
      : elig.reason === "already_reviewed"
        ? t("prodUi.alreadyReviewed")
        : elig.reason === "own_listing"
          ? t("prodUi.cannotReviewOwn")
          : t("prodUi.reviewRequiresApprovedOrder");
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
          // Sadece sayı değişiyor — SVG'yi yeniden basmak yerine label güncellenir.
          const labelEl = btn.querySelector<HTMLElement>(".rv-helpful-label");
          if (labelEl) {
            labelEl.textContent = t("product.helpful", { count: String(res.helpful_count ?? 0) });
          }
        } else {
          showToast({ message: t("prodUi.feedbackReceived"), type: "success" });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("prodUi.voteFailed");
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

  // Edit own review — 24h içinde, modal tabanlı düzenleme akışı
  const editBtns = container.querySelectorAll<HTMLButtonElement>(".rv-edit-own-btn");
  editBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const reviewId = btn.dataset.reviewId || "";
      if (!reviewId) return;
      // Mevcut yorum metnini + fotoğrafları kart'tan oku (modal ön-dolum için)
      const card = btn.closest(".rv-card") as HTMLElement | null;
      const commentEl = card?.querySelector(".rv-card-comment");
      const oldBody = commentEl?.textContent?.trim() || "";
      const images = Array.from(
        card?.querySelectorAll<HTMLElement>(".rv-image-thumb") ?? []
      )
        .map((el) => el.dataset.imageUrl || "")
        .filter(Boolean);
      openEditReviewModal({ reviewId, body: oldBody, images });
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
    <button type="button" class="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors" aria-label="${t("prodUi.close")}">

      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <img src="${escapeHtml(url)}" width="800" height="800" decoding="async" class="max-w-[95vw] max-h-[90vh] object-contain shadow-2xl rounded-lg" alt="Büyütülmüş inceleme görseli" />
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
      cardsContainer.innerHTML = emptyListHtml(t("product.noReviewsForFilter"));
    } else {
      cardsContainer.innerHTML = filtered
        .slice(0, INLINE_REVIEW_LIMIT)
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
        // Referans davranış: seçili satıra tekrar tıklamak filtreyi kaldırır
        // (panelde ayrıca "tümü" satırı yok).
        const wasActive = item.classList.contains("active");
        items.forEach((i) => i.classList.remove("active"));
        if (!wasActive) item.classList.add("active");
        ratingDropdown.classList.remove("open");

        const rating = wasActive ? null : item.getAttribute(ratingAttr);
        state.ratingFilter = rating ? parseInt(rating, 10) : "all";

        const labelEl = trigger?.querySelector<HTMLElement>(".rv-rating-trigger-label");
        if (labelEl) {
          labelEl.textContent = rating
            ? `${rating} ${t("product.starSuffix")}`
            : t("product.ratingLabel");
        }
        trigger?.classList.toggle("active", !!rating);
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

        const labelEl = trigger?.querySelector<HTMLElement>(".rv-sort-trigger-label");
        if (labelEl) {
          labelEl.textContent = `${t("product.sortLabel")}: ${SORT_LABELS[state.sortBy]}`;
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

export function initReviews(options: { signal?: AbortSignal } = {}): void {
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

  // ── "Tümünü göster" → modal köprüsü ────────────────
  // Delegasyon: listeler canlı veriyle yeniden kurulsa da dinleyici kalır.
  // mode, modal başlığını ve kart tipini belirler (ürün | mağaza).
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".rv-show-all-btn");
    if (!btn) return;
    window.dispatchEvent(
      new CustomEvent("reviews-modal-show", {
        detail: { mode: btn.dataset.rvModalMode === "product" ? "product" : "store" },
      })
    );
  }, options);

  // ── Init scoped panels ─────────────────────────────
  initScopedReviewPanel(productPanel, "rv-product", "rv", false);
  if (storePanel) {
    initScopedReviewPanel(storePanel, "rv-store", "rv", true);

    // Fotoğraf vitrinindeki "Tümünü gör" / "+N" → mevcut show-all modalını aç.
    // Delegasyon: strip innerHTML canlı veriyle yeniden kurulsa da dinleyici kalır.
    storePanel.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".rv-photos-more")) {
        storePanel.querySelector<HTMLButtonElement>(".rv-show-all-btn")?.click();
      }
    });
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
    }, options);

    // Yorum gönderildiğinde listeyi yenile
    window.addEventListener("review-submitted", () => {
      void reloadReviewsAndRerender(listingId);
    }, options);

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
      // Yorum sayısı: backend summary'den (Approved-only).
      // Ortalama puan: backend rating Int olduğu için 3.5 → 4 yuvarlanır;
      // gerçek değeri Approved yorumların aspect ortalamasından hesapla.
      const reviews = ce.detail.reviews || [];
      const approvedReviews = reviews.filter((r) => r.status === "Approved");
      const ratings = approvedReviews.map((r) => displayRating(r)).filter((v) => v > 0);
      const computedAvg = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
      applyReviewsToPanels({
        reviews,
        reviewCount: ce.detail.summary?.review_count ?? 0,
        storeReviewCount: ce.detail.total ?? 0,
        rating:
          computedAvg ||
          ce.detail.summary?.weighted_rating ||
          ce.detail.summary?.average_rating ||
          0,
      });
    }, options);
    // Abuse report sonrası ek bir aksiyon yok (sessizce kaydedildi toast'ı gösteriliyor)
  }

  // ── Q&A count update ────────────────────────────────
  if (listingId) {
    void updateQACount(listingId);
    window.addEventListener("qa-submitted", () => {
      void updateQACount(listingId);
    }, options);
  }

  // ── Click-outside to close all dropdowns ───────────
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".rv-rating-dropdown.open")
      .forEach((el) => el.classList.remove("open"));
    document
      .querySelectorAll(".rv-sort-dropdown.open")
      .forEach((el) => el.classList.remove("open"));
  }, options);
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

  // Filtre chip'i, yıldız-dropdown sayaçları ve puan özeti — iki panelde de
  // canlı veriyle güncelle (ilk render'da reviews boş dizi olduğundan
  // sayaçlar (0) basılmıştı). Özet sayısı panele göre değişir: ürün sekmesi
  // reviewCount, mağaza sekmesi storeReviewCount gösterir.
  const starCounts: Record<number, number> = {};
  payload.reviews.forEach((r) => (starCounts[r.rating] = (starCounts[r.rating] ?? 0) + 1));
  (
    [
      { pnl: productPanel, count: payload.reviewCount },
      { pnl: storePanel, count: payload.storeReviewCount },
      // Modal da aynı sayaçları taşır (fotoğraf chip'i + yıldız satırları).
      { pnl: document.getElementById("rv-reviews-modal"), count: payload.storeReviewCount },
    ] as const
  ).forEach(({ pnl, count }) => {
    if (!pnl) return;
    const pill = pnl.querySelector<HTMLButtonElement>('[data-rv-filter="photo"]');
    if (pill) pill.textContent = t("product.withPhotos", { count: String(photoCount) });
    // Sorgu panel-scoped kalmalı — ReviewsModal'ın Alpine dropdown'ı etkilenmesin.
    pnl.querySelectorAll<HTMLElement>("[data-rv-rating] .rv-star-count").forEach((el) => {
      const n = Number(el.closest<HTMLElement>("[data-rv-rating]")?.dataset.rvRating);
      el.textContent = `(${starCounts[n] ?? 0})`;
    });

    const showAll = pnl.querySelector<HTMLElement>(".rv-show-all-btn");
    if (showAll) showAll.classList.toggle("hidden", payload.reviews.length <= INLINE_REVIEW_LIMIT);

    const subtitle = pnl.querySelector<HTMLElement>(".rv-rating-subtitle");
    if (subtitle) subtitle.textContent = t("product.basedOnReviews", { count: String(count) });
    if (payload.rating != null) {
      const num = pnl.querySelector<HTMLElement>(".rv-rating-number");
      if (num) num.textContent = formatRating(payload.rating);
      const label = pnl.querySelector<HTMLElement>(".rv-rating-label");
      if (label) label.textContent = satisfactionLabel(payload.rating);
      const stars = pnl.querySelector<HTMLElement>(".rv-rating-stars");
      if (stars) stars.innerHTML = renderStars(payload.rating);
    }
  });

  if (productPanel) {
    const list = productPanel.querySelector<HTMLElement>("#rv-product-reviews-list");
    if (list) {
      list.innerHTML = payload.reviews.length
        ? payload.reviews.slice(0, INLINE_REVIEW_LIMIT).map((r) => renderReviewCard(r, false)).join("")
        : emptyListHtml(t("product.noReviewsForFilter"));
      bindHelpfulButtons(list);
    }
  }
  if (storePanel) {
    const list = storePanel.querySelector<HTMLElement>("#rv-store-reviews-list");
    if (list) {
      list.innerHTML = payload.reviews.length
        ? payload.reviews.slice(0, INLINE_REVIEW_LIMIT).map((r) => renderReviewCard(r, true)).join("")
        : emptyListHtml(t("product.noReviewsForFilter"));
      bindHelpfulButtons(list);
    }

    // Kategori skorları (Hizmet/Teslimat/Kalite) — yorumların aspect
    // ortalamalarından hesaplanır; hiç aspect verisi yoksa satır gizli kalır.
    const catDefs: Array<{
      label: string;
      pick: (a: NonNullable<ProductReview["aspects"]>) => number | null | undefined;
    }> = [
      { label: t("product.catService"), pick: (a) => a.service },
      { label: t("product.catShipping"), pick: (a) => a.shipping },
      { label: t("product.catQuality"), pick: (a) => a.product_quality },
    ];
    const cats = catDefs.flatMap((d) => {
      const vals = payload.reviews
        .map((r) => (r.aspects ? d.pick(r.aspects) : null))
        .filter((v): v is number => typeof v === "number" && v > 0);
      return vals.length
        ? [{ label: d.label, score: (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) }]
        : [];
    });
    const catRow = storePanel.querySelector<HTMLElement>(".rv-category-row");
    if (catRow) catRow.innerHTML = categoryRowHtml(cats);

    // Alıcı fotoğrafları vitrini — canlı görsellerle yeniden kur
    const photoStrip = storePanel.querySelector<HTMLElement>("#rv-store-photos");
    if (photoStrip) {
      photoStrip.innerHTML = photoStripSection(payload.reviews);
      bindHelpfulButtons(photoStrip); // yeni thumbnail'lere lightbox binding
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

  // NOT: Modal listesi/başlığı burada GÜNCELLENMEZ — foto chip'i ve yıldız
  // sayaçlarını yukarıdaki panel dizisi (modal dahil) günceller; listeyi
  // reviewsModal.show() açılışta canlı veriyle kurar. Buradan da yazmak
  // gizli modala her yüklemede boşa render + açık modalda sayfalama/filtre
  // durumunu ezme demekti.
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
