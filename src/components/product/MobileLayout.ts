/**
 * MobileLayout Component
 * Mobile-only product detail layout for TradeHub B2B e-commerce,
 * styled after iSTOC's mobile product detail page.
 * Uses reusable collapsibleSection() and bottomSheet() builders
 * with data-attribute-driven JS initialization.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import { tierQtyLabel } from "./variantPrice";
import type { ProductReview } from "../../types/product";
import { openShippingModal } from "./CartDrawer";
import { renderStars, displayRating, anonymizeName, formatScore } from "./ProductReviews";
import { showReviewsModal } from "./ReviewsModal";
import { showQAModal } from "./QAModal";
import { RelatedProducts } from "./RelatedProducts";
import { MobileRecommendations, initMobileRecommendations } from "./MobileRecommendations";
import { SocialProofBadge } from "./SocialProofBadge";
import { SalesRankCards } from "./ProductSalesRank";
import { VerificationBadge, resolveVerifications } from "../seller/VerificationBadge";
import { getSellerUrl } from "../../utils/sellerUrl";
import { getCountryCode } from "../../utils/country";
import { getFlagSvg } from "../../utils/flags";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { OptionsSheet, initOptionsSheet } from "./OptionsSheet";
import { MediaViewer, initMediaViewer, openMediaViewer, collectVideoUrls } from "./MediaViewer";

// Product loaded lazily — getCurrentProduct() called inside functions

/* ── Reusable SVG fragments ──────────────────────────── */

const chevronSvg = `<svg class="pdm-chevron transition-transform duration-200 ease-linear" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>`;

const closeSvg = `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 6l12 12M18 6l-12 12"/></svg>`;

/** Galeri overlay chip'lerinin ortak class zinciri (aktif-durum eklerini çağıran verir). */
const galleryChipCls =
  "th-no-press appearance-none focus:outline-none px-2.5 py-[5px] rounded-full text-[11px] max-[374px]:text-[10px] font-semibold text-white/90 whitespace-nowrap leading-tight transition-colors duration-150";

/** Başlık altındaki yıldız + puan + "(N)" + "N+ sipariş" satırı — hem ilk render
 *  hem de `product-reviews-loaded` event'inde (reviews backend'den gelince)
 *  yeniden çağrılır (bkz. initReviewsRow). */
function mobileRatingRowHtml(): string {
  const p = getCurrentProduct();
  const score = formatScore(p.rating);
  const parts = [
    `<span class="pdm-stars flex gap-0.5 text-[#f5a623] [&_svg]:w-3.5 [&_svg]:h-3.5">${renderStars(p.rating)}</span>`,
    `<span class="font-bold text-text-heading">${score}</span>`,
    `<button type="button" id="pdm-review-count-link" class="th-no-press appearance-none focus:outline-none underline text-text-muted">(${p.reviewCount})</button>`,
  ];
  if (p.orderCount && p.orderCount !== "0") {
    parts.push(`<span class="text-border-medium">&middot;</span>`);
    parts.push(`<span>${t("product.ordersLabel", { count: p.orderCount })}</span>`);
  }
  return parts.join("");
}

/* ── Reusable component builders ─────────────────────── */

interface CollapsibleConfig {
  id: string;
  title: string;
  previewHtml?: string;
  bodyHtml?: string;
  sheetId?: string; // if set, header click opens this bottom sheet
  sectionClass?: string; // extra class on the wrapper (e.g. 'pdm-shipping-section')
}

/** Renders a collapsible section with divider.
 *  - If `sheetId` is provided, clicking the header opens a bottom sheet.
 *  - If `bodyHtml` is provided, clicking the header toggles an inline body.
 *  - `previewHtml` is always visible below the header. */
function collapsibleSection(cfg: CollapsibleConfig): string {
  const headerAttr = cfg.sheetId
    ? `data-pdm-sheet="${cfg.sheetId}"`
    : cfg.bodyHtml
      ? `data-pdm-target="${cfg.id}-body"`
      : "";

  return `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div class="pdm-collapsible-section bg-surface${cfg.sectionClass ? " " + cfg.sectionClass : ""}" id="${cfg.id}">
      <button type="button" class="pdm-collapsible-header w-full flex items-center justify-between px-4 py-3.5 max-[374px]:px-3 max-[374px]:py-3 border-none bg-none text-sm max-[374px]:text-[13px] font-semibold text-text-heading cursor-pointer text-start [&_em]:not-italic [&_em]:font-normal [&_em]:text-[var(--color-text-placeholder,#999)] [&_em]:ms-1 [&.pdm-collapsible-open_svg]:rotate-180" ${headerAttr}>
        <span>${cfg.title}</span>
        ${chevronSvg}
      </button>
      ${cfg.previewHtml ?? ""}
      ${cfg.bodyHtml ? `<div class="pdm-collapsible-body pdm-hidden [&.pdm-hidden]:hidden px-4 pb-3.5 max-[374px]:px-3 max-[374px]:pb-3" id="${cfg.id}-body">${cfg.bodyHtml}</div>` : ""}
    </div>
  `;
}

/** Renders a bottom sheet modal with handle, header, close button, and body.
 *  Exported for reuse by other mobile-only sheets (e.g. OptionsSheet) that need
 *  the same open/close animation + drag-to-dismiss infra as this file's own sheets. */
export function bottomSheet(id: string, title: string, bodyHtml: string): string {
  return `
    <div id="${id}" class="pdm-bottom-sheet pdm-hidden [&.pdm-hidden]:hidden fixed inset-0 z-[200] bg-black/0 flex items-end transition-[background] duration-[250ms] motion-reduce:transition-none pointer-events-none [&.pdm-sheet-visible]:bg-black/50 [&.pdm-sheet-visible]:pointer-events-auto" aria-hidden="true">
      <div class="pdm-sheet-inner w-full max-w-[100vw] box-border bg-[var(--color-surface,#fff)] rounded-t-[16px] max-h-[85vh] overflow-y-auto overflow-x-hidden translate-y-full transition-transform duration-[300ms] [cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none motion-reduce:translate-y-0 [-webkit-overflow-scrolling:touch] [.pdm-sheet-visible_&]:translate-y-0">
        <div class="pdm-sheet-handle w-10 h-1 bg-[#e0e0e0] rounded-[2px] mx-auto mt-3 mb-2"></div>
        <div class="pdm-sheet-header flex items-center justify-between px-4 pb-4 pt-1 text-base font-bold text-[var(--color-text-heading,#111827)] max-[374px]:px-2.5 max-[374px]:py-1 max-[374px]:pb-2.5 max-[374px]:text-sm">
          <span>${title}</span>
          <button type="button" class="pdm-sheet-close w-8 h-8 border-0 bg-none cursor-pointer text-[var(--color-text-muted,#666)] flex items-center justify-center p-0" data-pdm-close="${id}" aria-label="${t("prodUi.close")}">${closeSvg}</button>
        </div>
        <div class="pdm-sheet-body px-4 pb-6 max-[374px]:px-2.5 max-[374px]:pb-4">${bodyHtml}</div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════
   Main Layout HTML
   ══════════════════════════════════════════════════════ */

export function MobileProductLayout(): string {
  const p = getCurrentProduct();

  // Sprint 2.6: KYB Verified DEĞİL → OptionsSheet render edilmez; gallery
  // chip'lerinin "Seçenekler"i de bu durumda açılacak sheet'i bulamaz —
  // bu yüzden kybBlocked burada, gallerySection'dan ÖNCE hesaplanır.
  const kybBlocked = p.sellerKybVerified === false;
  const hasVideo = collectVideoUrls(p).length > 0;

  // Saha doğrulama rozeti — Verified Tedarikçi satırı (madde 3) VE tedarikçi
  // kartı (madde 7) ikisi de kullanır; en üstte tek sefer hesaplanır.
  const si = p.supplier;
  const supplierVerifiedBadge = VerificationBadge(
    resolveVerifications(si.verifications, si.verified)
  );

  // ── Sections 1-5: Gallery, Badges, Price, Sample, Title ──

  const gallerySection = `
    <div id="pdm-gallery-wrap" class="relative w-full aspect-square overflow-hidden bg-surface-raised">
      <div id="pdm-gallery-track" class="flex w-full h-full overflow-x-auto overflow-y-hidden [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        ${p.images
          .map(
            (img, i) => `
          <div class="pdm-gallery-slide shrink-0 basis-full w-full h-full [scroll-snap-align:start] [scroll-snap-stop:always]" data-slide-index="${i}">
            ${
              img.src
                ? `<img class="w-full h-full object-contain select-none" src="${escapeHtml(sanitizeUrl(img.src))}" alt="${escapeHtml(img.alt)}" width="800" height="800" decoding="async" draggable="false" loading="${i === 0 ? "eager" : "lazy"}">`
                : `<div class="pdm-gallery-placeholder w-full h-full flex items-center justify-center bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef]">
                  <svg width="64" height="64" fill="none" stroke="#9ca3af" stroke-width="1.4" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>`
            }
          </div>
        `
          )
          .join("")}
      </div>
      <!-- Action buttons -->
      <div id="pdm-gallery-actions" class="absolute top-3 end-3 flex flex-col gap-2 z-[6]">
        <button type="button" data-favorite-btn class="pdm-gallery-action-btn w-9 h-9 rounded-full bg-white/85 border-none flex items-center justify-center text-text-muted cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-[background] duration-150 active:bg-white" aria-label="${t("product.addToFavorites")}">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </button>
        <!-- Mobile product gallery gorsel arama (kamera) butonu — DISABLED -->
        <!--
        <button type="button" class="pdm-gallery-action-btn w-9 h-9 rounded-full bg-white/85 border-none flex items-center justify-center text-text-muted cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.12)]" aria-label="${t("product.imageSearchLabel")}">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h2l1-2h8l1 2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
        </button>
        -->
      </div>
      <!-- Chip'ler: Fotoğraflar (sayaç) · Seçenekler · Video -->
      <div id="pdm-gallery-chips" class="absolute bottom-3.5 inset-x-0 mx-auto w-fit max-w-[calc(100%-24px)] z-5 flex gap-0.5 bg-black/50 rounded-full p-[3px] [backdrop-filter:blur(2px)]">
        <button type="button" id="pdm-gallery-chip-photos" class="pdm-gallery-chip-active ${galleryChipCls} [&.pdm-gallery-chip-active]:bg-white [&.pdm-gallery-chip-active]:text-[#111827]">
          ${t("product.mobilePhotosCounter")} <span id="pdm-gallery-chip-counter">1/${p.images.length}</span>
        </button>
        ${
          kybBlocked
            ? ""
            : `<button type="button" data-pdm-sheet="pdm-sheet-options" class="${galleryChipCls}">${t("product.optionsSheetTitle")}</button>`
        }
        ${
          hasVideo
            ? `<button type="button" id="pdm-gallery-chip-video" class="${galleryChipCls}">${t("product.videoTab")}</button>`
            : ""
        }
      </div>
    </div>
  `;

  // ── Küçük görsel şeridi — ilk 5 görsel + "Daha fazla" (Faz 2) ──
  // Tek görselli üründe şerit anlamsız, render edilmez.
  const thumbStripSection =
    p.images.length > 1
      ? `
    <div id="pdm-thumb-strip" class="flex items-center gap-1.5 px-3.5 py-3 bg-surface">
      ${p.images
        .slice(0, 5)
        .map(
          (img, i) => `
        <button type="button" data-thumb-index="${i}" class="${i === 0 ? "pdm-thumb-active " : ""}th-no-press appearance-none focus:outline-none shrink-0 w-[49px] h-[49px] rounded-md overflow-hidden border-2 border-transparent p-0 bg-none [&.pdm-thumb-active]:border-[var(--color-text-heading,#111827)]" aria-label="${escapeHtml(t("product.imageNumberLabel", { count: String(i + 1) }))}">
          ${img.src ? `<img class="w-full h-full object-cover" src="${escapeHtml(sanitizeUrl(img.src))}" alt="${escapeHtml(img.alt)}" width="80" height="80" decoding="async" loading="lazy">` : ""}
        </button>
      `
        )
        .join("")}
      <button type="button" id="pdm-thumbs-more" class="th-no-press appearance-none focus:outline-none flex-1 inline-flex items-center justify-end gap-1 text-[13px] font-bold underline text-text-heading whitespace-nowrap">
        ${t("common.more")}
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  `
      : "";

  // "Sevkiyata Hazır" / "Özelleştirilebilir" rozetleri kaldırıldı; alan
  // yalnızca stok-yok uyarısı olarak yaşar (updateReadyBadge gizler/gösterir).
  const badgesSection = `
    <div id="pdm-badges" class="hidden gap-2 pt-3 px-4 max-[374px]:pt-2.5 max-[374px]:px-3 bg-surface [&:not(.hidden)]:flex">
      <span data-ready-badge="mobile" class="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded bg-[#dc2626] text-white leading-[1.4]">${t("cart.outOfStock")}</span>
    </div>
  `;

  // Sprint 2.6: KYB Verified DEĞİL → fiyat tier'larını render etme,
  // yerine sarı amber banner göster (mobil, kybBlocked yukarıda hesaplandı)
  const kybBannerSection = kybBlocked
    ? `
    <div class="pdm-kyb-banner-large flex items-start gap-3 mx-4 mt-3 max-[374px]:mx-3 max-[374px]:mt-2.5 px-4 py-3.5 bg-amber-50 border border-amber-300 rounded-lg" role="alert">
      <svg class="shrink-0 mt-0.5 text-amber-700" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div class="text-sm leading-[1.5] text-amber-800 flex-1 min-w-0">
        <div class="font-semibold mb-1">${t("common.kybGateBannerTitle")}</div>
        <div class="text-xs">${t("common.kybGateBannerBody")}</div>
      </div>
    </div>
  `
    : "";

  // Alibaba app deseni: aktif kademe (OptionsSheet toplam adedine göre) sarı-sis
  // zemin + amber fiyat alır. Kolonlara data-tier-index verilir; senkron
  // syncPriceTiersPanel() (OptionsSheet.render() tarafından çağrılır) yapar.
  // Sheet hiç açılmadıysa varsayılan aktif = ilk kademe (server-render'da da işaretli).
  const priceTiersSection = kybBlocked
    ? ""
    : `
    <div id="pdm-price-tiers-panel" class="grid grid-cols-3 bg-surface-raised rounded-md mx-4 mt-3 overflow-hidden max-[374px]:mx-3 max-[374px]:mt-2.5">
      ${p.priceTiers
        .map(
          (tier, i) => `
        <div class="pdm-tier-col flex flex-col items-center px-3 py-3.5 border-e border-border-default last:border-e-0 transition-colors duration-150 [&.pdm-tier-active]:bg-[#fff8e1]${i === 0 ? " pdm-tier-active" : ""}" data-tier-index="${i}">
          <span class="pdm-tier-price text-lg max-[374px]:text-[15px] font-bold text-[#111] leading-[1.3] [.pdm-tier-active_&]:text-[#b45309]">${formatCurrency(tier.price, getSelectedCurrency())}</span>
          <span class="pdm-tier-qty text-[11px] max-[374px]:text-[10px] text-text-placeholder mt-[3px] text-center [.pdm-tier-active_&]:text-[#92700c] [.pdm-tier-active_&]:font-medium">${tierQtyLabel(tier)}</span>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  const socialProofSection = SocialProofBadge({
    listingId: p.id,
    supplierId: p.supplier?.id ?? "",
    wrapperClass: "mx-4 mt-3 max-[374px]:mx-3 max-[374px]:mt-2.5",
  });

  const sampleSection = p.samplePrice
    ? `
    <div id="pdm-sample-row" class="flex items-center justify-between px-4 py-2.5 max-[374px]:px-3 max-[374px]:py-2 bg-surface text-[13px] max-[374px]:text-xs text-text-body">
      <span>${t("product.samplePrice")}: <strong>${formatCurrency(p.samplePrice, getSelectedCurrency())}</strong></span>
      <button type="button" data-order-sample="${escapeHtml(p.id)}" class="pdm-sample-btn th-btn-outline px-[18px] py-1.5 max-[374px]:px-3.5 max-[374px]:py-[5px] text-[13px] max-[374px]:text-xs font-medium cursor-pointer transition-[background] duration-150 active:bg-[var(--btn-outline-hover-bg,var(--color-surface-raised,#f5f5f5))]">${t("cart.orderSample")}</button>
    </div>
  `
    : "";

  // Paylaş — Web Share API destekleniyorsa göster (yoksa buton hiç render
  // edilmez, sonradan JS ile gizlemek yerine baştan atlanır).
  const shareButtonHtml =
    typeof navigator !== "undefined" && typeof navigator.share === "function"
      ? `
    <button type="button" id="pdm-share-btn" class="th-no-press appearance-none focus:outline-none shrink-0 w-7 h-7 flex items-center justify-center text-text-muted" aria-label="${t("product.share")}">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
    </button>`
      : "";

  const titleSection = `
    <div id="pdm-title-section" class="flex flex-col gap-2 pt-3.5 px-4 pb-3 max-[374px]:pt-3 max-[374px]:px-3 max-[374px]:pb-2.5 bg-surface">
      <div id="pdm-title-row" class="flex items-start gap-2">
        <h2 id="pdm-product-title" class="pdm-title-text line-clamp-2 [&.pdm-title-expanded]:line-clamp-none flex-1 min-w-0 text-[15px] max-[374px]:text-sm font-semibold leading-[1.45] text-text-heading m-0">${escapeHtml(p.title)}</h2>
        <button type="button" id="pdm-title-expand" class="th-no-press appearance-none focus:outline-none shrink-0 w-7 h-7 flex items-center justify-center text-text-muted [&.pdm-collapsible-open_svg]:rotate-180" aria-label="${t("aria.expand")}">
          ${chevronSvg}
        </button>
        ${shareButtonHtml}
      </div>

      <div id="pdm-rating-row" class="flex items-center gap-1.5 flex-wrap text-[13px] max-[374px]:text-xs text-text-muted">
        ${mobileRatingRowHtml()}
      </div>
    </div>
  `;

  // ── Verified Tedarikçi satırı (madde 3) — rozet ⓘ butonu için ayrı sibling,
  // dış <button> içine gömülmez (iç içe interactive element yasak). ──
  const supplierRowHtml = si.name
    ? `
    <div id="pdm-verified-row" class="flex items-center gap-2 px-4 py-3 max-[374px]:px-3 border-t border-border-default bg-surface">
      ${supplierVerifiedBadge ? `<span class="pdm-verified-badge-wrap shrink-0">${supplierVerifiedBadge}</span>` : ""}
      <button type="button" data-pdm-scroll-supplier class="th-no-press appearance-none focus:outline-none flex-1 min-w-0 flex items-center gap-2 text-start">
        <span class="flex-1 min-w-0 truncate text-[13.5px] font-semibold text-text-heading">${t("product.supplier")}: ${escapeHtml(si.name)}</span>
        <svg class="shrink-0 text-text-tertiary" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>`
    : "";

  // ── "Seçenekler" özet satırı (madde 8) — eski varyant pill bölümlerinin
  // yerine geçer; dokununca aynı OptionsSheet'i açar (data-pdm-sheet). ──
  const variantSummary = p.variants
    .map(
      (v) =>
        `${escapeHtml(v.displayLabel || v.label)} (${v.options.length})`
    )
    .join(" &middot; ");

  const optionsSummarySection =
    !kybBlocked && p.variants.length
      ? collapsibleSection({
          id: "pdm-options-summary-section",
          title: `${t("product.optionsSheetTitle")} <em>${variantSummary}</em>`,
          sheetId: "pdm-sheet-options",
        })
      : "";

  // ── Sections 7-10: Collapsible info sections (all use collapsibleSection) ──

  // Yöntem belli değilse sevkiyat bölümü hiç render edilmez
  const shippingSection = p.shipping[0]?.method
    ? collapsibleSection({
        id: "pdm-ship-section",
        title: t("product.shippingSection"),
        sectionClass: "pdm-shipping-section bg-[#f0fdf4]",
        sheetId: "shipping-modal", // special: opens existing ShippingModal
        previewHtml: `
      <div id="pdm-ship-preview" class="px-4 pb-3.5 text-[13px] text-text-body leading-[1.6]">
        <div class="pdm-ship-method font-semibold text-text-heading">${escapeHtml(p.shipping[0].method)}</div>
        <div class="pdm-ship-detail flex gap-4 mt-1">
          <span class="text-text-muted">${t("product.estimatedCost")}: <strong>${escapeHtml(p.shipping[0].cost)}</strong></span>
          <span class="text-text-muted">${t("product.duration")}: <strong>${escapeHtml(p.shipping[0].estimatedDays)}</strong></span>
        </div>
      </div>
    `,
      })
    : "";

  // Alibaba app deseni: 2-kolon gri panel, hücre = kalın DEĞER üstte + soluk
  // anahtar altta (mock `.attrs/.attr`). İlk 6 spec; tam liste sheet'te kalır.
  const keyAttrsSection = p.specs.length
    ? collapsibleSection({
        id: "pdm-keyattrs-section",
        title: `${t("product.keyFeaturesTitle")}:`,
        sheetId: "pdm-sheet-keyattrs",
        previewHtml: `
      <div id="pdm-keyattrs-preview" class="px-4 pb-3.5">
        <div class="pdm-attrs-grid grid grid-cols-2 rounded-md bg-surface-raised overflow-hidden [&>*:nth-child(odd)]:border-e [&>*:nth-child(odd)]:border-border-default [&>*:not(:nth-child(-n+2))]:border-t [&>*:not(:nth-child(-n+2))]:border-border-default">
          ${p.specs
            .slice(0, 6)
            .map(
              (s) => `
            <div class="pdm-attr-item flex flex-col px-3.5 py-2.5">
              <span class="pdm-attr-val text-[13px] text-text-heading font-bold">${escapeHtml(s.value)}</span>
              <span class="pdm-attr-key text-[11px] text-text-placeholder mt-0.5">${escapeHtml(s.key)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `,
      })
    : "";

  // ── Section: Order protection (static assurance, istoc-branded) ──
  // Sprint note: backend yok — bu blok platform güvence bilgisini özetleyen
  // STATİK içeriktir, listing-level veri çekmez.

  // ── Section: Processing time + delivery address (Alibaba app pattern) ──
  // p.leadTimeRanges → her aralık bir kolon (gün üstte, miktar altta).

  const processingTimeSection = p.leadTimeRanges.length
    ? `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div id="pdm-processing-time" class="bg-surface px-4 py-4 max-[374px]:px-3">
      <h2 class="text-[15px] font-bold text-text-heading m-0 mb-3">
        ${t("product.deliveryAddressLabel")}: <span class="underline">TR</span>
      </h2>
      <div class="bg-surface-raised rounded-md p-3.5">
        <div class="text-xs text-text-muted mb-2">${t("product.processingTime")}</div>
        <div class="grid grid-flow-col auto-cols-fr gap-3">
          ${p.leadTimeRanges
            .map(
              (lt) => `
            <div class="flex flex-col">
              <span class="text-base max-[374px]:text-sm font-bold text-text-heading leading-tight">${escapeHtml(lt.days)}</span>
              <span class="text-[11px] text-text-placeholder mt-0.5">${escapeHtml(lt.quantityRange)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      <p class="text-xs text-text-muted leading-[1.6] mt-3">${t("product.processingTimeNote")}</p>
    </div>
  `
    : "";

  // ── Section: Inline Yorumlar (madde 6) — details bölümünün sonu, salesRank'tan
  // önce. `product-reviews-loaded` event'inde gövdesi (#pdm-inline-reviews-body)
  // yeniden render edilir (bkz. initInlineReviewsSection). ──
  const inlineReviewsSection = inlineReviewsSectionHtml();

  // ── Section: Sales Rank (kategori bazlı satış sıralaması) ──
  // Masaüstüyle aynı "Defne Çelengi" kart şeridi (SalesRankCards) — dar
  // ekranda yatay kaydırılır. categoryRanks boşsa render edilmez.

  const ranks = p.categoryRanks ?? [];
  const salesRankSection = ranks.length
    ? `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div id="pdm-sales-rank" class="bg-surface px-4 py-4 max-[374px]:px-3">
      <div class="flex items-center gap-2 mb-1">
        <svg class="shrink-0 text-amber-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3"/></svg>
        <h2 class="text-[15px] font-bold text-text-heading m-0">${t("product.salesRank")}</h2>
      </div>
      <p class="text-xs text-text-muted leading-[1.5] mb-3">${t("product.salesRankSubtitle")}</p>
      ${SalesRankCards(ranks)}
    </div>
  `
    : "";

  // ── Section 11: Supplier Card ──

  const sellerProfileUrl = getSellerUrl({ id: si.id });
  const sellerProductsUrl = `${sellerProfileUrl}#products`;
  // Değeri olmayan metrik kolonu render edilmez; grid dolu kolon sayısına
  // daralır, hepsi boşsa ray ve başlığı tamamen düşer.
  const supplierStats = [
    { val: si.onTimeDelivery, label: t("product.onTimeDelivery") },
    { val: si.responseTime, label: t("product.responseTime") },
    { val: si.responseRate, label: t("product.responseRate") },
  ].filter((s) => s.val);

  const supplierStatsRail = supplierStats.length
    ? `
      <div class="text-[13px] font-bold text-text-heading mb-2">${t("product.companyOverview")}</div>
      <div class="pdm-supplier-stats grid ${["grid-cols-1", "grid-cols-2", "grid-cols-3"][supplierStats.length - 1]} border border-border-default rounded-md overflow-hidden">
        ${supplierStats
          .map(
            (s) => `
          <div class="pdm-supplier-stat flex flex-col items-center py-2.5 px-1 border-e border-border-default last:border-e-0 text-center">
            <strong class="text-[15px] max-[374px]:text-[13px] font-bold text-text-heading leading-snug tabular-nums">${escapeHtml(s.val)}</strong>
            <span class="text-[10px] max-[374px]:text-[9px] text-text-muted mt-px leading-snug">${s.label}</span>
          </div>
        `
          )
          .join("")}
      </div>`
    : "";

  // Rozet artık kart sağ-üst köşesinde (mock `.sup-card` üst satırı) — meta
  // satırından kaldırıldı; sadece VERİSİ OLAN parçalar (yıl, ülke bayrağı) kalır.
  const supplierMetaParts = [
    si.yearsInBusiness > 0 ? t("product.yearsLabel", { count: String(si.yearsInBusiness) }) : "",
    si.country
      ? `<span class="inline-flex items-center gap-1">${getFlagSvg(getCountryCode(si.country))}${escapeHtml(getCountryCode(si.country))}</span>`
      : "",
  ].filter(Boolean);

  const supplierSection = `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div id="pdm-supplier-card" class="bg-surface px-4 py-3.5 max-[374px]:px-3 max-[374px]:py-3">
      ${supplierVerifiedBadge ? `<div class="flex justify-end mb-1.5">${supplierVerifiedBadge}</div>` : ""}
      <div class="pdm-supplier-header flex items-center gap-3 mb-3">
        <a href="${escapeHtml(sanitizeUrl(sellerProfileUrl))}" class="pdm-supplier-logo w-10 h-10 rounded-md bg-neutral-950 flex items-center justify-center shrink-0 text-[13px] font-bold text-white no-underline">${escapeHtml(si.name.charAt(0))}${escapeHtml(si.name.split(" ")[1]?.charAt(0) || "")}</a>
        <div class="min-w-0 flex-1">
          <a href="${escapeHtml(sanitizeUrl(sellerProfileUrl))}" class="pdm-supplier-name block text-[13px] font-bold text-text-heading leading-snug truncate underline">${escapeHtml(si.name)}</a>
          <div class="pdm-supplier-meta text-[11px] text-text-muted mt-0.5 flex items-center gap-1 flex-wrap">
            ${supplierMetaParts.join("<span>&middot;</span>")}
          </div>
        </div>
        <a href="${escapeHtml(sanitizeUrl(sellerProfileUrl))}" class="shrink-0 text-text-muted no-underline" aria-label="${t("product.companyProfile")}">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
      ${supplierStatsRail}
      <div class="pdm-supplier-btns grid grid-cols-2 gap-2 mt-3">
        <a href="${escapeHtml(sanitizeUrl(sellerProductsUrl))}" class="h-9 rounded-md bg-surface-raised text-[12px] font-semibold text-text-heading cursor-pointer text-center transition-colors duration-150 active:bg-neutral-200 inline-flex items-center justify-center no-underline">${t("product.otherProducts")}</a>
        <a href="${escapeHtml(sanitizeUrl(sellerProfileUrl))}" class="th-btn-outline h-9 text-[12px] font-semibold text-center inline-flex items-center justify-center no-underline">${t("product.companyProfile")}</a>
      </div>
    </div>
  `;

  // ── Bottom Sheets (all use bottomSheet builder) ──

  const sheets = [
    bottomSheet(
      "pdm-sheet-keyattrs",
      t("product.keyAttributes"),
      `
      <table class="pdm-attrs-table w-full border-collapse table-fixed [&_tr]:border-b [&_tr]:border-[var(--color-border-light,#f0f0f0)] [&_tr:last-child]:border-b-0 [&_td]:py-3 [&_td]:text-sm [&_td]:align-top [&_td]:[word-break:break-word] [&_td]:[overflow-wrap:break-word]">
        ${p.specs.map((s) => `<tr><td class="text-[var(--color-text-placeholder,#999)] w-[38%] pe-2.5 max-[374px]:text-xs max-[374px]:py-2.5 max-[374px]:w-[35%] max-[374px]:pe-2">${escapeHtml(s.key)}</td><td class="text-[var(--color-text-heading,#111827)] font-medium max-[374px]:text-xs max-[374px]:py-2.5">${escapeHtml(s.value)}</td></tr>`).join("")}
      </table>
    `
    ),
    kybBlocked ? "" : OptionsSheet(),
  ].join("");

  // ── Sticky section tabs ──

  const sectionTabs = `
    <div id="pdm-section-tabs" class="flex items-center gap-0 bg-surface border-b border-border-default sticky top-0 z-30 p-0">
      <button type="button" class="pdm-section-tab pdm-section-tab-active flex-1 py-3 max-[374px]:py-2.5 text-sm max-[374px]:text-[13px] font-normal text-text-muted bg-transparent border-none border-b-2 border-b-transparent cursor-pointer text-center whitespace-nowrap transition-[color,border-color] duration-200 [&.pdm-section-tab-active]:text-[var(--pd-tab-active-color,#cc9900)] [&.pdm-section-tab-active]:font-semibold [&.pdm-section-tab-active]:border-b-[var(--pd-tab-active-border,#cc9900)]" data-pdm-tab="pdm-sec-overview">${t("product.overviewTab")}</button>
      <button type="button" class="pdm-section-tab flex-1 py-3 max-[374px]:py-2.5 text-sm max-[374px]:text-[13px] font-normal text-text-muted bg-transparent border-none border-b-2 border-b-transparent cursor-pointer text-center whitespace-nowrap transition-[color,border-color] duration-200 [&.pdm-section-tab-active]:text-[var(--pd-tab-active-color,#cc9900)] [&.pdm-section-tab-active]:font-semibold [&.pdm-section-tab-active]:border-b-[var(--pd-tab-active-border,#cc9900)]" data-pdm-tab="pdm-sec-details">${t("product.detailsTab")}</button>
      <button type="button" class="pdm-section-tab flex-1 py-3 max-[374px]:py-2.5 text-sm max-[374px]:text-[13px] font-normal text-text-muted bg-transparent border-none border-b-2 border-b-transparent cursor-pointer text-center whitespace-nowrap transition-[color,border-color] duration-200 [&.pdm-section-tab-active]:text-[var(--pd-tab-active-color,#cc9900)] [&.pdm-section-tab-active]:font-semibold [&.pdm-section-tab-active]:border-b-[var(--pd-tab-active-border,#cc9900)]" data-pdm-tab="pdm-sec-supplier">${t("product.recommendationsTab")}</button>
    </div>
  `;

  // ── Assemble ──

  return `
    <div id="pdm-mobile-layout" class="max-[374px]:pb-[70px]">
      ${gallerySection}
      ${thumbStripSection}

      ${sectionTabs}

      <!-- Overview section -->
      <div id="pdm-sec-overview">
        ${badgesSection}
        ${kybBannerSection}
        ${priceTiersSection}
        ${socialProofSection}
        ${sampleSection}
        ${titleSection}
        ${supplierRowHtml}
        ${optionsSummarySection}
      </div>

      <!-- Details section -->
      <div id="pdm-sec-details">
        ${shippingSection}
        ${processingTimeSection}
        ${keyAttrsSection}
        ${inlineReviewsSection}
        ${salesRankSection}
      </div>

      <!-- Supplier / Recommendations section -->
      <div id="pdm-sec-supplier">
        ${supplierSection}
        ${MobileRecommendations()}
        <div class="px-3 pb-4">
          ${RelatedProducts()}
        </div>
      </div>
    </div>
    ${sheets}
    ${MediaViewer()}
  `;
}

/* ══════════════════════════════════════════════════════
   Init — JS behaviors (mobile only)
   ══════════════════════════════════════════════════════ */

export function initMobileLayout(): void {
  if (window.matchMedia("(min-width: 1024px)").matches) return;

  initMobileGallery();
  initThumbStrip();
  initSectionTabs();
  initCollapsibles();
  initSheetTriggers();
  initTitleExpand();
  initShareButton();
  initSupplierRowScroll();
  initReviewsRow();
  initInlineReviewsSection();
  initMobileRecommendations();
  initOptionsSheet();
  initMediaViewer();
  initAskQuestionBar();
}

/* ── Alt bar "Soru sor" → Soru & Cevap bölümü ─────────── */

// Soru sorma, chat'e mesaj bırakan ayrı bir form yerine ürünün Soru & Cevap
// bölümünde yaşar (QAModal içindeki ProductQA formu) — inline Yorumlar
// başlığındaki "Soru & Cevap" linkiyle aynı yüzeye çıkar.
function initAskQuestionBar(): void {
  document.getElementById("pdm-bar-ask")?.addEventListener("click", () => showQAModal());
}

/* ── Başlık genişlet + Paylaş (madde 2) ───────────────── */

function initTitleExpand(): void {
  const btn = document.getElementById("pdm-title-expand");
  const text = document.getElementById("pdm-product-title");
  if (!btn || !text) return;
  btn.addEventListener("click", () => {
    const expanded = text.classList.toggle("pdm-title-expanded");
    btn.classList.toggle("pdm-collapsible-open", expanded);
  });
}

function initShareButton(): void {
  const btn = document.getElementById("pdm-share-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const p = getCurrentProduct();
    void navigator.share({ title: p.title, url: window.location.href }).catch(() => {});
  });
}

/* ── Verified Tedarikçi satırı (madde 3) — tedarikçi kartına scroll ──── */

function initSupplierRowScroll(): void {
  document.querySelector("[data-pdm-scroll-supplier]")?.addEventListener("click", () => {
    document.getElementById("pdm-supplier-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* ── Gallery: scroll-snap carousel + chips + thumb sync ──────────── */

/** Track scrollLeft/clientWidth'ten anlık slayt index'ini hesaplar —
 *  gallery click ve "Daha fazla" linki bu index'i tam ekran görüntüleyiciye
 *  aktarır. Kapalı bir modül değişkeni yerine DOM'dan okur; birden fazla
 *  tetikleyici (scroll handler, click, thumb strip) tutarlı kalır. */
function getCurrentGallerySlideIndex(): number {
  const track = document.getElementById("pdm-gallery-track");
  if (!track || track.clientWidth === 0) return 0;
  return Math.round(track.scrollLeft / track.clientWidth);
}

function initMobileGallery(): void {
  const track = document.getElementById("pdm-gallery-track");
  const counterEl = document.getElementById("pdm-gallery-chip-counter");
  if (!track) return;

  const slides = track.querySelectorAll<HTMLElement>(".pdm-gallery-slide");
  if (slides.length === 0) return;

  const syncActiveThumb = (idx: number): void => {
    document.querySelectorAll<HTMLElement>("[data-thumb-index]").forEach((thumb) => {
      thumb.classList.toggle("pdm-thumb-active", Number(thumb.dataset.thumbIndex) === idx);
    });
  };

  let scrollTimer: ReturnType<typeof setTimeout> | null = null;
  track.addEventListener(
    "scroll",
    () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const idx = getCurrentGallerySlideIndex();
        if (counterEl) counterEl.textContent = `${idx + 1}/${slides.length}`;
        syncActiveThumb(Math.min(idx, 4));
      }, 50);
    },
    { passive: true }
  );

  // Slayta dokunma → tam ekran görüntüleyici, Fotoğraflar modunda mevcut index.
  track.addEventListener("click", () => openMediaViewer("photos", getCurrentGallerySlideIndex()));

  // "Fotoğraflar" chip'i → galeriyi ilk slayta kaydırır (video chip'i tam ekranı açar).
  document.getElementById("pdm-gallery-chip-photos")?.addEventListener("click", (e) => {
    e.stopPropagation();
    track.scrollTo({ left: 0, behavior: "smooth" });
  });
  document.getElementById("pdm-gallery-chip-video")?.addEventListener("click", (e) => {
    e.stopPropagation();
    openMediaViewer("video", 0);
  });
}

/* ── Küçük görsel şeridi: thumb tıklama + "Daha fazla" ────────────── */

function initThumbStrip(): void {
  const track = document.getElementById("pdm-gallery-track");
  document.querySelectorAll<HTMLButtonElement>("[data-thumb-index]").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const idx = Number(thumb.dataset.thumbIndex);
      track?.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
    });
  });

  document.getElementById("pdm-thumbs-more")?.addEventListener("click", () => {
    openMediaViewer("photos", getCurrentGallerySlideIndex());
  });
}

/* ── Collapsible sections (data-pdm-target driven) ───── */

function initCollapsibles(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-pdm-target]").forEach((header) => {
    header.addEventListener("click", () => {
      const body = document.getElementById(header.dataset.pdmTarget!);
      if (!body) return;
      body.classList.toggle("pdm-hidden");
      header.classList.toggle("pdm-collapsible-open");
    });
  });
}

/* ── Bottom sheet open/close + triggers (data-pdm-sheet driven) ── */

let activeSheetId: string | null = null;

function openSheet(sheetId: string): void {
  const sheet = document.getElementById(sheetId);
  if (!sheet) return;
  activeSheetId = sheetId;
  sheet.classList.remove("pdm-hidden");
  sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("pdm-sheet-open");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => sheet.classList.add("pdm-sheet-visible"))
  );
}

export function closeSheet(sheetId: string): void {
  const sheet = document.getElementById(sheetId);
  if (!sheet) return;
  activeSheetId = null;
  sheet.classList.remove("pdm-sheet-visible");
  const inner = sheet.querySelector<HTMLElement>(".pdm-sheet-inner");
  if (inner) {
    inner.style.transition = "";
    inner.style.transform = ""; // clear inline from drag — let CSS animate to translateY(100%)
  }
  const onEnd = () => {
    sheet.classList.add("pdm-hidden");
    sheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pdm-sheet-open");
  };
  inner?.addEventListener("transitionend", onEnd, { once: true });
  setTimeout(onEnd, 350);
}

function initSheetTriggers(): void {
  // Open triggers — all driven by data-pdm-sheet attribute
  document.querySelectorAll<HTMLButtonElement>("[data-pdm-sheet]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const target = trigger.dataset.pdmSheet!;
      if (target === "shipping-modal") {
        openShippingModal();
      } else {
        openSheet(target);
      }
    });
  });

  // Close triggers — all driven by data-pdm-close attribute
  document.querySelectorAll<HTMLButtonElement>("[data-pdm-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeSheet(btn.dataset.pdmClose!));
  });

  // Backdrop click closes sheet
  document.querySelectorAll<HTMLElement>(".pdm-bottom-sheet").forEach((sheet) => {
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet) closeSheet(sheet.id);
    });
  });

  // Escape key closes active sheet
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeSheetId) closeSheet(activeSheetId);
  });

  // Drag-to-dismiss gesture on each bottom sheet (pointer events — works for both mouse & touch)
  document.querySelectorAll<HTMLElement>(".pdm-bottom-sheet").forEach((sheet) => {
    const inner = sheet.querySelector<HTMLElement>(".pdm-sheet-inner");
    if (!inner) return;

    const handle = inner.querySelector<HTMLElement>(".pdm-sheet-handle");
    const header = inner.querySelector<HTMLElement>(".pdm-sheet-header");
    const dragTarget = handle || header || inner;

    let startY = 0;
    let currentY = 0;
    let dragging = false;

    dragTarget.addEventListener("pointerdown", (e: PointerEvent) => {
      startY = e.clientY;
      currentY = startY;
      dragging = true;
      inner.style.transition = "none";
      dragTarget.setPointerCapture(e.pointerId);
    });

    dragTarget.addEventListener("pointermove", (e: PointerEvent) => {
      if (!dragging) return;
      currentY = e.clientY;
      const deltaY = currentY - startY;
      if (deltaY > 0) {
        inner.style.transform = `translateY(${deltaY}px)`;
        const progress = Math.min(deltaY / inner.offsetHeight, 1);
        sheet.style.background = `rgba(0,0,0,${0.5 * (1 - progress)})`;
      }
    });

    dragTarget.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      inner.style.transition = "";
      sheet.style.background = "";
      const deltaY = currentY - startY;
      if (deltaY > inner.offsetHeight * 0.3) {
        closeSheet(sheet.id);
      } else {
        inner.style.transform = "translateY(0)";
      }
    });
  });
}

/* ── Rating satırı — tıkla yorumlar modal'ını aç + reviews-loaded senkron ── */

function initReviewsRow(): void {
  // innerHTML reviews-loaded'da yenilendiği için delegation şart — doğrudan
  // butona bağlanan listener yeniden render'da kaybolur (bkz. ProductTitleBar).
  document.getElementById("pdm-rating-row")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("#pdm-review-count-link")) showReviewsModal();
  });

  // Reviews backend'den (loadProductReviews) geç geldiğinde puan satırı ve
  // inline yorum gövdesi TEK noktadan yenilenir.
  document.addEventListener("product-reviews-loaded", () => {
    const row = document.getElementById("pdm-rating-row");
    if (row) row.innerHTML = mobileRatingRowHtml();
    const body = document.getElementById("pdm-inline-reviews-body");
    if (body) body.innerHTML = inlineReviewsBodyHtml();
  });
}

/* ── Sticky section tabs — scroll-to + active tracking ── */

function initSectionTabs(): void {
  const tabBar = document.getElementById("pdm-section-tabs");
  const tabs = document.querySelectorAll<HTMLButtonElement>(".pdm-section-tab");
  if (!tabBar || tabs.length === 0) return;

  const sectionIds = Array.from(tabs).map((t) => t.dataset.pdmTab!);
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean) as HTMLElement[];
  if (sections.length === 0) return;

  let isScrolling = false;

  // Set sticky top position below header
  const stickyHeaderEl = document.getElementById("sticky-header");
  if (stickyHeaderEl) {
    const updateTop = () => {
      tabBar.style.top = `${stickyHeaderEl.offsetHeight}px`;
    };
    updateTop();
    window.addEventListener("resize", updateTop);
  }

  // Click → smooth scroll to section
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.pdmTab!;
      const section = document.getElementById(targetId);
      if (!section) return;

      isScrolling = true;
      const tabBarH = tabBar.offsetHeight;
      const stickyHeader = document.getElementById("sticky-header");
      const headerH = stickyHeader?.offsetHeight ?? 0;
      const offset = headerH + tabBarH;

      const top = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });

      setActiveTab(tab);
      setTimeout(() => {
        isScrolling = false;
      }, 600);
    });
  });

  function setActiveTab(active: HTMLButtonElement): void {
    tabs.forEach((t) => t.classList.remove("pdm-section-tab-active"));
    active.classList.add("pdm-section-tab-active");
  }

  // Scroll → track active section via IntersectionObserver
  const stickyHeader = document.getElementById("sticky-header");
  const headerH = stickyHeader?.offsetHeight ?? 0;
  const rootMargin = `${-(headerH + tabBar.offsetHeight + 1)}px 0px -60% 0px`;

  const observer = new IntersectionObserver(
    (entries) => {
      if (isScrolling) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = sections.indexOf(entry.target as HTMLElement);
          if (idx >= 0) setActiveTab(tabs[idx]);
        }
      }
    },
    { rootMargin, threshold: 0 }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/* ── Fiyat kademe paneli senkronu (madde 1) ──────────── */

/** OptionsSheet'in render()'ı her adet değişikliğinde çağırır — gövdedeki
 *  fiyat panelinin aktif kolonunu (sarı-sis zemin + amber fiyat) senkron
 *  tutar. Panel yoksa (kybBlocked) no-op. */
export function syncPriceTiersPanel(activeIdx: number): void {
  document
    .querySelectorAll<HTMLElement>("#pdm-price-tiers-panel [data-tier-index]")
    .forEach((col) => {
      col.classList.toggle("pdm-tier-active", Number(col.dataset.tierIndex) === activeIdx);
    });
}

/* ── Inline Yorumlar bölümü (madde 6) ─────────────────── */

/** Tüm yorumlardaki görselleri düzleştirir; ilk 5 kare + "···" fazlalık
 *  karosu (varsa) — hepsi ReviewsModal'ı açar. Hiç foto yoksa şerit yok. */
function flattenReviewPhotos(reviews: ProductReview[]): string {
  const imgs = reviews.flatMap((r) => r.images ?? []);
  if (imgs.length === 0) return "";

  const MAX = 5;
  const shown = imgs.slice(0, MAX);
  const remaining = imgs.length - shown.length;

  const tiles = shown
    .map(
      (src) => `
      <button type="button" data-rev-photo class="th-no-press appearance-none focus:outline-none aspect-square rounded-md overflow-hidden bg-surface-raised">
        <img src="${escapeHtml(sanitizeUrl(src))}" width="96" height="96" decoding="async" class="w-full h-full object-cover" loading="lazy" alt="" />
      </button>`
    )
    .join("");
  const moreTile =
    remaining > 0
      ? `<button type="button" data-rev-photo class="th-no-press appearance-none focus:outline-none aspect-square rounded-md bg-neutral-900 text-white font-bold text-sm grid place-items-center">&middot;&middot;&middot;</button>`
      : "";

  return `<div class="grid grid-cols-5 gap-1.5 mb-3">${tiles}${moreTile}</div>`;
}

/** Tek yorum mini kartı — yıldız + maskeli isim + bayrak + doğrulanmış tik + 2 satır clamp. */
function reviewMiniCardHtml(r: ProductReview): string {
  const flagSvg = getFlagSvg(getCountryCode(r.country));
  const verifiedTick = r.verified
    ? `<svg class="w-3.5 h-3.5 text-[#16a34a] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
    : "";
  return `
    <div class="py-2.5 border-t border-border-default first:border-t-0 first:pt-0">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="flex text-[#f5a623] [&_svg]:w-3 [&_svg]:h-3">${renderStars(displayRating(r), true)}</span>
        <span class="text-xs text-text-muted">&middot; ${escapeHtml(anonymizeName(r.author))}</span>
        ${flagSvg}
        ${verifiedTick}
      </div>
      <p class="text-[13px] text-text-body leading-[1.5] mt-1 line-clamp-2">${escapeHtml(r.comment)}</p>
    </div>
  `;
}

function productReviewsPanelHtml(): string {
  const p = getCurrentProduct();
  if (!p.reviewCount) {
    // reviews.noReviews "filtrelere uygun yorum yok" der (modal filtre bağlamı);
    // inline bölümde filtre yok — nötr "henüz değerlendirme yapılmamış" doğrusu.
    return `<p class="text-[13px] text-text-muted py-2">${t("seller.sf.noReviewsYet")}</p>`;
  }
  const score = formatScore(p.rating);
  return `
    <div class="flex items-center gap-2 mb-3">
      <span class="text-2xl font-extrabold text-text-heading">${score}</span>
      <span class="flex text-[#f5a623] [&_svg]:w-4 [&_svg]:h-4">${renderStars(p.rating)}</span>
    </div>
    ${flattenReviewPhotos(p.reviews)}
    ${p.reviews.slice(0, 2).map(reviewMiniCardHtml).join("")}
    <button type="button" data-rev-viewall class="th-no-press appearance-none focus:outline-none mt-2.5 text-[13px] font-bold text-text-heading inline-flex items-center gap-1">
      ${t("product.viewAllPhotos", { count: String(p.reviewCount) })}
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
  `;
}

/** Puan özeti yoksa sade satır: "Mağaza değerlendirmeleri (M)" + profil linki.
 *  Mock'taki uydurma satıcı istatistikleri (ciro, konum vb.) YAZILMAZ. */
function storeReviewsPanelHtml(): string {
  const p = getCurrentProduct();
  const sellerUrl = getSellerUrl({ id: p.supplier.id });
  return `
    <div class="flex items-center justify-between gap-3 py-2">
      <span class="text-[13px] text-text-body">${t("product.storeReviewsTab", { count: String(p.storeReviewCount) })}</span>
      <a href="${escapeHtml(sanitizeUrl(sellerUrl))}" class="text-[13px] font-semibold text-text-heading underline shrink-0">${t("product.companyProfile")}</a>
    </div>
  `;
}

function reviewsTabsHtml(hasStore: boolean): string {
  if (!hasStore) return "";
  const p = getCurrentProduct();
  const tabCls =
    "pdm-rev-tab pb-2 text-sm text-text-muted border-b-2 border-transparent font-medium whitespace-nowrap [&.pdm-rev-tab-active]:text-text-heading [&.pdm-rev-tab-active]:font-bold [&.pdm-rev-tab-active]:border-b-[var(--pd-tab-active-border,#cc9900)]";
  return `
    <div class="flex gap-4 border-b border-border-default mb-3">
      <button type="button" data-rev-tab="product" class="${tabCls} pdm-rev-tab-active">${t("product.productReviewsTab", { count: String(p.reviewCount) })}</button>
      <button type="button" data-rev-tab="store" class="${tabCls}">${t("product.storeReviewsTab", { count: String(p.storeReviewCount) })}</button>
    </div>
  `;
}

/** Yeniden çağrılabilir gövde — ilk mount VE `product-reviews-loaded`
 *  event'inde `#pdm-inline-reviews-body`'e basılır. */
function inlineReviewsBodyHtml(): string {
  const p = getCurrentProduct();
  const hasStore = p.storeReviewCount > 0;
  return `
    ${reviewsTabsHtml(hasStore)}
    <div id="pdm-rev-panel-product">${productReviewsPanelHtml()}</div>
    ${hasStore ? `<div id="pdm-rev-panel-store" class="hidden">${storeReviewsPanelHtml()}</div>` : ""}
  `;
}

function inlineReviewsSectionHtml(): string {
  return `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div id="pdm-inline-reviews" class="bg-surface px-4 py-4 max-[374px]:px-3">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-[15px] font-bold text-text-heading m-0">${t("product.reviews")}</h2>
        <button type="button" id="pdm-inline-qa-link" class="th-no-press appearance-none focus:outline-none text-[13px] font-medium text-text-muted inline-flex items-center gap-0.5">
          ${t("product.qaLabel")}
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div id="pdm-inline-reviews-body">${inlineReviewsBodyHtml()}</div>
    </div>
  `;
}

function setActiveRevTab(tab: "product" | "store"): void {
  document.querySelectorAll<HTMLElement>("#pdm-inline-reviews [data-rev-tab]").forEach((b) => {
    b.classList.toggle("pdm-rev-tab-active", b.dataset.revTab === tab);
  });
  document.getElementById("pdm-rev-panel-product")?.classList.toggle("hidden", tab !== "product");
  document.getElementById("pdm-rev-panel-store")?.classList.toggle("hidden", tab !== "store");
}

function initInlineReviewsSection(): void {
  const root = document.getElementById("pdm-inline-reviews");
  if (!root) return;

  document.getElementById("pdm-inline-qa-link")?.addEventListener("click", () => showQAModal());

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const tabBtn = target.closest<HTMLButtonElement>("[data-rev-tab]");
    if (tabBtn) {
      setActiveRevTab(tabBtn.dataset.revTab === "store" ? "store" : "product");
      return;
    }
    if (target.closest("[data-rev-viewall], [data-rev-photo]")) {
      showReviewsModal();
    }
  });

  // product-reviews-loaded re-render'ı initReviewsRow'daki tek listener'da.
}
