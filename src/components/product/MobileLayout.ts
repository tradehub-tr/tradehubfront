/**
 * MobileLayout Component
 * Mobile-only product detail layout for TradeHub B2B e-commerce,
 * styled after iSTOC's mobile product detail page.
 * Uses reusable collapsibleSection() and bottomSheet() builders
 * with data-attribute-driven JS initialization.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t, getCurrentLang } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import { getCurrencySymbol } from "../../utils/currency";
import type { ProductVariant } from "../../types/product";
import { openShippingModal, openCartDrawer } from "./CartDrawer";
import { openLoginModal } from "./LoginModal";
import { renderStars } from "./ProductReviews";
import { showReviewsModal } from "./ReviewsModal";
import { showQAModal } from "./QAModal";
import { RelatedProducts } from "./RelatedProducts";
import { MobileRecommendations, initMobileRecommendations } from "./MobileRecommendations";
import { SocialProofBadge } from "./SocialProofBadge";
import { getSellerUrl } from "../../utils/sellerUrl";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

// Product loaded lazily — getCurrentProduct() called inside functions

/* ── Reusable SVG fragments ──────────────────────────── */

const chevronSvg = `<svg class="pdm-chevron transition-transform duration-200 ease-linear" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>`;

const closeSvg = `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 6l12 12M18 6l-12 12"/></svg>`;

/** Kategori/sıra sayılarını aktif dile göre binlik ayraçla biçimler. */
function fmtNum(n: number): string {
  return n.toLocaleString(getCurrentLang() === "en" ? "en-US" : "tr-TR");
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

/** Renders a bottom sheet modal with handle, header, close button, and body. */
function bottomSheet(id: string, title: string, bodyHtml: string): string {
  return `
    <div id="${id}" class="pdm-bottom-sheet pdm-hidden [&.pdm-hidden]:hidden fixed inset-0 z-[200] bg-black/0 flex items-end transition-[background] duration-[250ms] pointer-events-none [&.pdm-sheet-visible]:bg-black/50 [&.pdm-sheet-visible]:pointer-events-auto" aria-hidden="true">
      <div class="pdm-sheet-inner w-full max-w-[100vw] box-border bg-[var(--color-surface,#fff)] rounded-t-[16px] max-h-[85vh] overflow-y-auto overflow-x-hidden translate-y-full transition-transform duration-[300ms] [cubic-bezier(0.32,0.72,0,1)] [-webkit-overflow-scrolling:touch] [.pdm-sheet-visible_&]:translate-y-0">
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

/* ── Variant section renderer ────────────────────────── */

function renderVariantSection(variant: ProductVariant): string {
  const available = variant.options.filter((o) => o.available).length;

  if (variant.type === "color") {
    const thumbs = variant.options
      .map(
        (opt) => `
      <button type="button" class="pdm-color-thumb w-14 h-14 rounded-[6px] border-2 border-border-default overflow-hidden cursor-pointer p-0 bg-none transition-[border-color] duration-150 [&.active]:border-[var(--color-text-heading)] [&.pdm-disabled]:opacity-40 [&.pdm-disabled]:cursor-not-allowed${!opt.available ? " pdm-disabled" : ""}"
        data-value="${escapeHtml(opt.id)}" data-label="${escapeHtml(opt.label)}" ${opt.price ? `data-variant-price="${escapeHtml(opt.price)}"` : ""} ${!opt.available ? "disabled" : ""}>
        ${
          opt.thumbnail
            ? `<img src="${opt.thumbnail}" alt="${opt.displayLabel || opt.label}" class="w-full h-full object-cover" />`
            : `<span class="pdm-color-swatch" style="background:${opt.value}"></span>`
        }
      </button>
    `
      )
      .join("");

    return collapsibleSection({
      id: `pdm-color-section`,
      title: `${variant.displayLabel || variant.label} <em>(${available})</em>`,
      bodyHtml: `<div class="pdm-color-thumbs flex flex-wrap gap-2">${thumbs}</div>`,
    });
  }

  // Size / Material — pill layout
  const pills = variant.options
    .map(
      (opt) => `
    <button type="button" class="pdm-variant-pill px-4 py-[7px] border border-border-medium rounded-md text-[13px] text-text-body bg-surface cursor-pointer transition-[border-color] duration-150 [&.active]:border-[var(--color-text-heading)] [&.active]:font-semibold [&.pdm-disabled]:opacity-40 [&.pdm-disabled]:cursor-not-allowed${!opt.available ? " pdm-disabled" : ""}"
      data-value="${opt.id}" data-label="${opt.label}" ${opt.price ? `data-variant-price="${opt.price}"` : ""} ${!opt.available ? "disabled" : ""}>
      ${opt.displayLabel || opt.label}
    </button>
  `
    )
    .join("");

  return collapsibleSection({
    id: `pdm-${variant.type}-section`,
    title: `${variant.displayLabel || variant.label} <em>(${available})</em>`,
    bodyHtml: `<div class="pdm-variant-pills flex flex-wrap gap-2">${pills}</div>`,
  });
}

/* ══════════════════════════════════════════════════════
   Main Layout HTML
   ══════════════════════════════════════════════════════ */

export function MobileProductLayout(): string {
  const p = getCurrentProduct();

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
                ? `<img class="w-full h-full object-contain select-none" src="${escapeHtml(sanitizeUrl(img.src))}" alt="${escapeHtml(img.alt)}" draggable="false" loading="${i === 0 ? "eager" : "lazy"}">`
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
      <!-- Counter pill -->
      <div id="pdm-gallery-counter" class="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-surface text-text-body text-xs font-medium py-1 px-3.5 rounded-[14px] pointer-events-none z-5 tracking-wide whitespace-nowrap shadow-[0_1px_4px_rgba(0,0,0,0.15)]">${t("product.mobilePhotosCounter")} <span id="pdm-counter-current">1</span>/${p.images.length}</div>
    </div>
  `;

  const badgesSection = `
    <div id="pdm-badges" class="flex gap-2 pt-3 px-4 max-[374px]:pt-2.5 max-[374px]:px-3 bg-surface">
      <span data-ready-badge="mobile" class="pdm-badge-dark inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded bg-[#222] text-white leading-[1.4]">${t("product.readyToShip")}</span>
      <span class="pdm-badge-orange inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded border border-cta-primary text-cta-primary bg-transparent leading-[1.4]">${t("product.customizable")}</span>
    </div>
  `;

  // Sprint 2.6: KYB Verified DEĞİL → fiyat tier'larını render etme,
  // yerine sarı amber banner göster (mobil)
  const kybBlocked = p.sellerKybVerified === false;
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

  const priceTiersSection = kybBlocked
    ? ""
    : `
    <div id="pdm-price-tiers" class="grid grid-cols-3 bg-surface-raised rounded-lg mx-4 mt-3 py-3.5 max-[374px]:mx-3 max-[374px]:mt-2.5">
      ${p.priceTiers
        .map(
          (tier) => `
        <div class="pdm-tier-col flex flex-col items-center px-3 border-e border-border-default last:border-e-0">
          <span class="pdm-tier-price text-lg max-[374px]:text-[15px] font-bold text-[#111] leading-[1.3]">${formatCurrency(tier.price, getSelectedCurrency())}</span>
          <span class="pdm-tier-qty text-[11px] max-[374px]:text-[10px] text-text-placeholder mt-[3px] text-center">${
            tier.maxQty !== null
              ? t("product.moqRange", { min: tier.minQty, max: tier.maxQty })
              : t("product.moqSingle", { count: tier.minQty })
          }</span>
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

  const titleSection = `
    <div id="pdm-title-section" class="flex flex-col gap-2 pt-3.5 px-4 pb-3 max-[374px]:pt-3 max-[374px]:px-3 max-[374px]:pb-2.5 bg-surface">
      <div id="pdm-title-row" class="flex items-start justify-between gap-2">
        <h1 id="pdm-product-title" class="text-[15px] max-[374px]:text-sm font-semibold leading-[1.45] text-text-heading m-0 flex-1 line-clamp-3">${escapeHtml(p.title)}</h1>
        <button type="button" class="pdm-share-btn shrink-0 w-8 h-8 border-none bg-none cursor-pointer text-text-muted p-1 flex items-center justify-center" aria-label="${t("product.share")}">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
      </div>

      <div id="pdm-reviews-row" class="flex items-center gap-1.5 text-[13px] max-[374px]:text-xs text-text-muted cursor-pointer">
        <span class="pdm-stars flex gap-0.5 text-[#f5a623] [&_svg]:w-3.5 [&_svg]:h-3.5">${renderStars(p.rating)}</span>
        <span>${t("product.reviewsLabel", { count: String(p.reviewCount) })}</span>
      </div>

      <div class="flex items-center gap-3 pt-0.5">
        <button
          type="button"
          id="pdm-view-reviews-btn"
          class="text-[12px] text-text-muted font-medium inline-flex items-center gap-1 cursor-pointer border border-border-default rounded-full px-3 py-1.5 bg-surface transition-colors duration-150 active:bg-surface-raised"
          aria-label="${t("prodUi.viewAllReviews")}"
        >
          ${t("product.reviewsLabel", { count: String(p.reviewCount) })}
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
        <button
          type="button"
          id="pdm-view-qa-btn"
          class="text-[12px] text-text-muted font-medium inline-flex items-center gap-1 cursor-pointer border border-border-default rounded-full px-3 py-1.5 bg-surface transition-colors duration-150 active:bg-surface-raised"
          aria-label="${t("prodUi.questionsAndAnswers")}"
        >
          ${t("product.qaLabel")}
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  `;

  // ── Section 6: Variants (dynamic via renderVariantSection) ──

  const variantSections = p.variants.map((v) => renderVariantSection(v)).join("");

  // ── Sections 7-10: Collapsible info sections (all use collapsibleSection) ──

  const shippingSection = collapsibleSection({
    id: "pdm-ship-section",
    title: t("product.shippingSection"),
    sectionClass: "pdm-shipping-section bg-[#f0fdf4]",
    sheetId: "shipping-modal", // special: opens existing ShippingModal
    previewHtml: `
      <div id="pdm-ship-preview" class="px-4 pb-3.5 text-[13px] text-text-body leading-[1.6]">
        <div class="pdm-ship-method font-semibold text-text-heading">${escapeHtml(p.shipping[0]?.method) || t("product.shippingLabel")}</div>
        ${
          p.shipping[0]
            ? `<div class="pdm-ship-detail flex gap-4 mt-1">
          <span class="text-text-muted">${t("product.estimatedCost")}: <strong>${escapeHtml(p.shipping[0].cost)}</strong></span>
          <span class="text-text-muted">${t("product.duration")}: <strong>${escapeHtml(p.shipping[0].estimatedDays)}</strong></span>
        </div>`
            : ""
        }
      </div>
    `,
  });

  const keyAttrsSection = collapsibleSection({
    id: "pdm-keyattrs-section",
    title: t("product.keyAttributes"),
    sheetId: "pdm-sheet-keyattrs",
    previewHtml: `
      <div id="pdm-keyattrs-preview" class="px-4 pb-3.5">
        <div class="pdm-attrs-grid grid grid-cols-2 gap-y-2 gap-x-4">
          ${p.specs
            .slice(0, 4)
            .map(
              (s) => `
            <div class="pdm-attr-item flex flex-col">
              <span class="pdm-attr-key text-[11px] text-text-placeholder">${escapeHtml(s.key)}</span>
              <span class="pdm-attr-val text-[13px] text-text-heading font-medium">${escapeHtml(s.value)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `,
  });

  // ── Section: Order protection (static assurance, istoc-branded) ──
  // Sprint note: backend yok — bu blok platform güvence bilgisini özetleyen
  // STATİK içeriktir, listing-level veri çekmez.

  const protectionItems = [
    {
      label: t("product.securePayments"),
      icon: `<path d="M9 12l2 2 4-4"/><path d="M12 3l8 4v5c0 4.4-3.1 8.4-8 9.5C7.1 20.4 4 16.4 4 12V7l8-4z"/>`,
    },
    {
      label: t("product.moneyBackProtection"),
      icon: `<path d="M3 9h18"/><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15l-2-2 2-2"/>`,
    },
    {
      label: t("product.support247"),
      icon: `<path d="M4 14a8 8 0 0 1 16 0"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/>`,
    },
    {
      label: t("product.dataProtection"),
      icon: `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
    },
  ];

  const orderProtectionSection = `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div id="pdm-order-protection" class="bg-surface px-4 py-4 max-[374px]:px-3">
      <div class="flex items-center gap-2 mb-1">
        <svg class="shrink-0 text-[#16a34a]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v5c0 4.4-3.1 8.4-8 9.5C7.1 20.4 4 16.4 4 12V7l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
        <h2 class="text-[15px] font-bold text-text-heading m-0">${t("product.orderProtectionSection")}</h2>
      </div>
      <p class="text-xs text-text-muted leading-[1.5] mb-3">${t("product.orderProtectionSectionDesc")}</p>
      <div class="grid grid-cols-4 gap-1 border border-border-default rounded-lg py-3 px-1">
        ${protectionItems
          .map(
            (it) => `
          <div class="flex flex-col items-center text-center gap-1.5 px-0.5">
            <svg class="text-[#16a34a]" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${it.icon}</svg>
            <span class="text-[10px] max-[374px]:text-[9px] text-text-body leading-[1.3]">${it.label}</span>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="flex items-center gap-2 mt-3 text-[11px] text-text-muted">
        <span class="shrink-0">${t("product.supportedPayments")}:</span>
        <span class="flex items-center gap-1.5 flex-wrap">
          <span class="px-1.5 py-0.5 rounded border border-border-default text-[10px] font-semibold text-text-body bg-surface">VISA</span>
          <span class="px-1.5 py-0.5 rounded border border-border-default text-[10px] font-semibold text-text-body bg-surface">Mastercard</span>
          <span class="px-1.5 py-0.5 rounded border border-border-default text-[10px] font-semibold text-text-body bg-surface">PayPal</span>
        </span>
      </div>
    </div>
  `;

  // ── Section: Processing time + delivery address (Alibaba app pattern) ──
  // p.leadTimeRanges → her aralık bir kolon (gün üstte, miktar altta).

  const processingTimeSection = p.leadTimeRanges.length
    ? `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div id="pdm-processing-time" class="bg-surface px-4 py-4 max-[374px]:px-3">
      <h2 class="text-[15px] font-bold text-text-heading m-0 mb-3">
        ${t("product.deliveryAddressLabel")}: <span class="underline">TR</span>
      </h2>
      <div class="bg-surface-raised rounded-lg p-3.5">
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

  // ── Section: Sales Rank (kategori bazlı satış sıralaması) ──
  // Masaüstü AttributesTabContent'teki ProductSalesRank'ın mobil karşılığı.
  // En spesifik (i===0) kategori "ödül" hissiyle vurgulanır; her kart o
  // kategorinin listesine linklenir. categoryRanks boşsa render edilmez.

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
      <div class="flex flex-col gap-2.5">
        ${ranks
          .map((r, i) => {
            const isTop = i === 0;
            const cardCls = isTop
              ? "border-amber-200 bg-amber-50/60"
              : "border-border-default bg-surface";
            const medalCls = isTop
              ? "bg-surface border-amber-200"
              : "bg-surface-raised border-border-default";
            const medalLabelCls = isTop ? "text-amber-600/70" : "text-text-placeholder";
            const medalNumCls = isTop ? "text-amber-500" : "text-primary-600";
            const badge =
              isTop && r.rank === 1
                ? `<span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3"/></svg>
                     ${t("product.bestSeller")}
                   </span>`
                : "";
            return `
            <a href="/pages/products.html?cat=${encodeURIComponent(r.slug)}"
               class="group flex items-center gap-3 rounded-md border ${cardCls} px-2.5 py-2.5 no-underline transition-colors duration-150 active:bg-surface-raised">
              <div class="flex shrink-0 w-12 h-12 max-[374px]:w-11 max-[374px]:h-11 flex-col items-center justify-center rounded-md border ${medalCls}">
                <span class="text-[8px] font-semibold uppercase tracking-wider leading-none ${medalLabelCls}">${t("product.salesRankPosition")}</span>
                <span class="mt-0.5 text-lg max-[374px]:text-base font-extrabold leading-none tabular-nums ${medalNumCls}">#${fmtNum(r.rank)}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span class="text-[13.5px] max-[374px]:text-[13px] font-bold text-text-heading leading-snug group-active:underline">${escapeHtml(r.categoryName)}</span>
                  ${badge}
                </div>
                <span class="mt-0.5 block text-[11.5px] text-text-muted tabular-nums">${t("product.salesRankOutOf", { total: fmtNum(r.total) })}</span>
              </div>
              <svg class="h-4 w-4 shrink-0 text-text-placeholder rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </a>`;
          })
          .join("")}
      </div>
    </div>
  `
    : "";

  // ── Section 11: Supplier Card ──

  const si = p.supplier;
  const sellerProfileUrl = getSellerUrl({ id: si.id });
  const sellerProductsUrl = `${sellerProfileUrl}#products`;
  const supplierSection = `
    <div class="pdm-section-divider h-2 bg-surface-raised"></div>
    <div id="pdm-supplier-card" class="bg-surface px-4 py-3.5 max-[374px]:px-3 max-[374px]:py-3">
      <a href="${escapeHtml(sanitizeUrl(sellerProfileUrl))}" class="pdm-supplier-header flex items-center gap-3 mb-3 no-underline">
        <div class="pdm-supplier-logo w-10 h-10 rounded-lg bg-[#fef9e7] flex items-center justify-center shrink-0 text-sm font-bold text-primary-600">${escapeHtml(si.name.charAt(0))}${escapeHtml(si.name.split(" ")[1]?.charAt(0) || "")}</div>
        <div class="min-w-0 flex-1">
          <div class="pdm-supplier-name text-[13px] font-bold text-text-heading leading-snug truncate">${escapeHtml(si.name)}</div>
          <div class="pdm-supplier-meta text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
            ${t("product.yearsLabel", { count: String(si.yearsInBusiness) })} <span>&middot;</span> ${si.verified ? t("product.verifiedSupplier") : ""}
          </div>
        </div>
        <svg class="shrink-0 text-text-muted" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </a>
      <div class="text-[13px] font-bold text-text-heading mb-2">${t("product.companyOverview")}</div>
      <div class="pdm-supplier-stats grid grid-cols-3 border border-border-default rounded-md overflow-hidden">
        ${[
          { val: si.onTimeDelivery, label: t("product.onTimeDelivery") },
          { val: si.responseTime, label: t("product.responseTime") },
          { val: si.responseRate, label: t("product.responseRate") },
        ]
          .map(
            (s) => `
          <div class="pdm-supplier-stat flex flex-col items-center py-2 px-1 border-e border-border-default last:border-e-0 text-center">
            <strong class="text-[13px] max-[374px]:text-xs font-bold text-text-heading leading-snug">${escapeHtml(s.val)}</strong>
            <span class="text-[10px] max-[374px]:text-[9px] text-text-placeholder mt-px leading-snug">${s.label}</span>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="pdm-supplier-btns grid grid-cols-2 gap-2 mt-3">
        <a href="${escapeHtml(sanitizeUrl(sellerProfileUrl))}" class="h-9 rounded-md border border-border-medium bg-surface text-[12px] font-semibold text-text-heading cursor-pointer text-center transition-colors duration-150 active:bg-surface-raised inline-flex items-center justify-center no-underline">${t("product.companyProfile")}</a>
        <a href="${escapeHtml(sanitizeUrl(sellerProductsUrl))}" class="h-9 rounded-md border border-border-medium bg-surface text-[12px] font-semibold text-text-heading cursor-pointer text-center transition-colors duration-150 active:bg-surface-raised inline-flex items-center justify-center no-underline">${t("product.otherProducts")}</a>
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

      ${sectionTabs}

      <!-- Overview section -->
      <div id="pdm-sec-overview">
        ${badgesSection}
        ${kybBannerSection}
        ${priceTiersSection}
        ${socialProofSection}
        ${sampleSection}
        ${titleSection}
        ${variantSections}
        ${orderProtectionSection}
      </div>

      <!-- Details section -->
      <div id="pdm-sec-details">
        ${shippingSection}
        ${processingTimeSection}
        ${keyAttrsSection}
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
  `;
}

/* ══════════════════════════════════════════════════════
   Init — JS behaviors (mobile only)
   ══════════════════════════════════════════════════════ */

export function initMobileLayout(): void {
  if (window.matchMedia("(min-width: 1024px)").matches) return;

  initMobileGallery();
  initSectionTabs();
  initCollapsibles();
  initSheetTriggers();
  initBottomBar();
  initVariantSelection();
  initReviewsRow();
  initMobileRecommendations();
}

/* ── Gallery: scroll-snap carousel ───────────────────── */

function initMobileGallery(): void {
  const counterEl = document.getElementById("pdm-counter-current");
  const track = document.getElementById("pdm-gallery-track");
  if (!track) return;

  const slides = track.querySelectorAll<HTMLElement>(".pdm-gallery-slide");
  if (slides.length === 0) return;

  let currentIdx = 0;
  let scrollTimer: ReturnType<typeof setTimeout> | null = null;

  track.addEventListener(
    "scroll",
    () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const slideWidth = track.clientWidth;
        if (slideWidth === 0) return;
        const newIdx = Math.round(track.scrollLeft / slideWidth);
        if (newIdx !== currentIdx && newIdx >= 0 && newIdx < slides.length) {
          currentIdx = newIdx;
          if (counterEl) counterEl.textContent = String(newIdx + 1);
        }
      }, 50);
    },
    { passive: true }
  );
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

function closeSheet(sheetId: string): void {
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

/* ── Bottom bar actions ──────────────────────────────── */

function initBottomBar(): void {
  document.getElementById("pdm-bar-order")?.addEventListener("click", openLoginModal);
}

/* ── Reviews row — tıkla yorumlar modal'ını aç ──────── */

function initReviewsRow(): void {
  // Yıldız + "N yorum" satırı VE "Tüm yorumları görüntüle" CTA tıklanınca
  // tam ekran ReviewsModal'ı aç. Mobile-first: kullanıcı yorumlara açıkça
  // erişebilmeli — yıldız satırı pasif görsel değil, asıl CTA aşağıdaki buton.
  const openReviews = () => showReviewsModal();
  document.getElementById("pdm-reviews-row")?.addEventListener("click", openReviews);
  document.getElementById("pdm-view-reviews-btn")?.addEventListener("click", openReviews);

  // Soru & Cevap linki — full-screen Q&A modal'ı aç
  document.getElementById("pdm-view-qa-btn")?.addEventListener("click", () => showQAModal());
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

/* ── Variant selection (delegated) ───────────────────── */

function updateMobileVariantPrice(btn: HTMLButtonElement): void {
  const variantPrice = btn.getAttribute("data-variant-price");
  if (variantPrice) {
    // Update the first tier price as the "active" price indicator
    const firstTierPrice = document.querySelector<HTMLElement>(
      "#pdm-price-tiers .pdm-tier-col:first-child .pdm-tier-price"
    );
    if (firstTierPrice) {
      firstTierPrice.textContent = getCurrencySymbol() + parseFloat(variantPrice).toFixed(2);
    }
    document.dispatchEvent(
      new CustomEvent("variant-price-change", { detail: { price: parseFloat(variantPrice) } })
    );
  }
}

function initVariantSelection(): void {
  // Color thumbnails
  const colorBody = document.getElementById("pdm-color-section-body");
  if (colorBody) {
    colorBody.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        ".pdm-color-thumb:not(.pdm-disabled)"
      );
      if (!btn) return;
      colorBody.querySelectorAll(".pdm-color-thumb").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateMobileVariantPrice(btn);
      // Open cart drawer with selected color
      const label = btn.getAttribute("data-label") || btn.getAttribute("title") || "";
      openCartDrawer(label);
    });
  }

  // Size/Material pills — delegated per pill group
  document.querySelectorAll<HTMLElement>(".pdm-variant-pills").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        ".pdm-variant-pill:not(.pdm-disabled)"
      );
      if (!btn) return;
      group.querySelectorAll(".pdm-variant-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateMobileVariantPrice(btn);
      // Open cart drawer
      openCartDrawer();
    });
  });
}
