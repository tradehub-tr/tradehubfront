/**
 * ProductBuyBox — ürün detay ORTA sütunu.
 * Başlık, puan/sipariş satırı, fiyat kademeleri, varyant seçiciler.
 * Kargo / CTA'lar sağ sütundaki ProductInfo kartında durur.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import type { PriceTier, ProductVariant } from "../../types/product";
import { openCartDrawer } from "./CartDrawer";
import { crossDisableVariants, isOptionAvailableForColor } from "./variantMatrix";
import { applyVariantPrice, tierQtyLabel } from "./variantPrice";
import { renderStars, formatScore } from "./ProductReviews";
import { escapeHtml } from "../../utils/sanitize";

function ratingLineHtml(): string {
  const p = getCurrentProduct();
  const score = formatScore(p.rating);
  return `
        <span class="flex items-center gap-0.5">${renderStars(p.rating)}</span>
        <span class="font-semibold text-[var(--pd-title-color,#111827)]">${score}</span>
        <span class="text-gray-300">·</span>
        <button
          type="button"
          id="pd-review-count-link"
          class="cursor-pointer hover:underline bg-transparent border-0 p-0 text-[13px] text-[var(--pd-rating-text-color,#6b7280)]"
        >${t("product.reviewsLabel", { count: String(p.reviewCount) })}</button>
        <span class="text-gray-300">·</span>
        <span class="text-[var(--pd-rating-text-color,#6b7280)]">${t("product.ordersLabel", { count: String(p.orderCount) })}</span>
  `;
}

function renderPriceTiers(tiers: PriceTier[]): string {
  // When a campaign is active the backend sets each tier's originalPrice
  // (pre-discount). We show it stacked above the deal price.
  // The qty label is fully localised via product.moqSingle / product.moqRange
  // so each locale controls its own unit (TR: "1 adet", EN: "1 piece").
  return `
    <div id="pd-price-tiers" class="grid grid-cols-3 gap-x-4 gap-y-3 mb-4">
      ${tiers
        .map((tier, i) => {
          const qtyLabel = tierQtyLabel(tier);
          const hasDiscount =
            typeof tier.originalPrice === "number" && tier.originalPrice > tier.price;
          const strikethrough = hasDiscount
            ? `<span class="pd-price-tier-original block line-through text-[13px] text-[var(--color-text-tertiary,#9ca3af)] leading-tight mb-0.5">${formatCurrency(tier.originalPrice!, getSelectedCurrency())}</span>`
            : "";
          return `
          <div class="pd-price-tier flex flex-col p-0 cursor-default min-w-0 ${i === 0 ? "active" : ""}" data-tier-index="${i}">
            <span class="pd-price-tier-qty text-[15px] text-[var(--color-text-muted,#666)] mb-1">${qtyLabel}</span>
            ${strikethrough}
            <span class="pd-price-tier-price shrink-0 text-[22px] font-bold text-[var(--color-text-heading,#111827)] leading-[1.2] [.pd-price-tier.active_&]:text-[#cc0000]">${formatCurrency(tier.price, getSelectedCurrency())}</span>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function renderVariant(variant: ProductVariant, allVariants: ProductVariant[]): string {
  // Default: isDefault flag; fallback: first available option
  const defaultOpt = variant.options.find((o) => o.isDefault && o.available);
  const selectedOpt = defaultOpt || variant.options.find((o) => o.available) || variant.options[0];

  if (variant.type === "color") {
    return `
      <div class="variant-group" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
        <h3 class="pd-variant-label text-sm text-[var(--pd-title-color,#111827)] my-4 mb-3"><strong>${variant.displayLabel || variant.label}:</strong> <span class="variant-selected-label">${selectedOpt.displayLabel || selectedOpt.label}</span></h3>
        <div class="pd-color-thumbs flex flex-wrap gap-2 mt-2">
          ${variant.options
            .map((opt) => {
              const isDef = !!opt.isDefault;
              const isActive = opt.id === selectedOpt.id;
              return `
            <button
              type="button"
              class="variant-option pd-color-thumb w-16 h-16 p-0 border-2 border-[var(--color-border-default,#e5e5e5)] rounded-full overflow-hidden cursor-pointer bg-transparent transition-[border-color] duration-150 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:block [&.active]:border-[var(--pd-title-color,#111827)] [&:hover:not(.active):not(.pd-color-thumb-disabled)]:border-[#999] [&.pd-color-thumb-disabled]:opacity-40 [&.pd-color-thumb-disabled]:cursor-not-allowed ${isActive ? "active" : ""} ${opt.available ? "" : "pd-color-thumb-disabled"}"
              data-variant-id="${opt.id}"
              data-variant-label="${opt.label}"
              data-variant-display="${opt.displayLabel || opt.label}"
              data-variant-image="${opt.thumbnail || ""}"
              data-variant-video="${opt.videoUrl || ""}"
              data-variant-title="${encodeURIComponent(opt.title || "")}"
              data-variant-images="${encodeURIComponent(JSON.stringify(opt.images || []))}"
              data-variant-value="${escapeHtml(opt.value)}"
              data-is-default="${isDef ? "1" : "0"}"
              ${opt.price ? `data-variant-price="${escapeHtml(opt.price)}"` : ""}
              ${opt.available ? "" : "disabled"}
              aria-label="${opt.displayLabel || opt.label}"
              title="${opt.displayLabel || opt.label}"
            >
              <img src="${opt.thumbnail || ""}" alt="${opt.displayLabel || opt.label}" width="48" height="48" decoding="async" style="background:${opt.value};">
            </button>
          `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // For non-color variants (size, material, etc.): check stock against the default/selected color
  const colorVariant = allVariants.find((v) => v.type === "color");
  const skuMatrix = colorVariant?.skuMatrix;
  const defaultColor =
    colorVariant?.options.find((o) => o.isDefault && o.available) ||
    colorVariant?.options.find((o) => o.available) ||
    colorVariant?.options[0];
  const defaultColorLabel = defaultColor?.label || "";

  // Determine axis index: axis2 = index 1 (second group), extra axes = index 2+
  const variantIndex = allVariants.indexOf(variant);
  const axisIndex = variantIndex >= 1 ? variantIndex : 1;

  return `
    <div class="variant-group" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
      <h4 class="pd-variant-label text-sm text-[var(--pd-title-color,#111827)] my-4 mb-3"><strong>${variant.displayLabel || variant.label}:</strong> <span class="variant-selected-label">${selectedOpt.displayLabel || selectedOpt.label}</span></h4>
      <div class="flex flex-wrap gap-2 mt-2">
        ${variant.options
          .map((opt) => {
            const isDef = !!opt.isDefault;
            const isActive = opt.id === selectedOpt.id;
            // Check availability for the default color (not just global availability).
            // Matching KAYNAK label/value ile — opt.label/variant.label kaynak.
            const availableForColor = defaultColorLabel
              ? isOptionAvailableForColor(
                  skuMatrix,
                  defaultColorLabel,
                  opt.label,
                  axisIndex,
                  variant.label
                )
              : opt.available;
            const isAvailable = opt.available && availableForColor;
            return `
          <button
            type="button"
            class="variant-option pd-variant-btn px-4 py-1.5 rounded-full text-[13px] font-medium border border-[var(--color-border-medium,#d1d5db)] bg-[var(--color-surface,#fff)] text-[var(--pd-title-color,#111827)] cursor-pointer transition-[border-color,color] duration-150 [&.active]:border-[var(--pd-title-color,#111827)] [&.active]:font-semibold [&:hover:not(.active):not(:disabled)]:border-[#999] ${isActive ? "active" : ""} ${isAvailable ? "" : "opacity-40 line-through cursor-not-allowed"}"
            data-variant-id="${opt.id}"
            data-variant-label="${opt.label}"
            data-variant-display="${opt.displayLabel || opt.label}"
            data-variant-video="${opt.videoUrl || ""}"
            data-variant-title="${encodeURIComponent(opt.title || "")}"
            data-variant-images="${encodeURIComponent(JSON.stringify(opt.images || []))}"
            data-is-default="${isDef ? "1" : "0"}"
            ${opt.price ? `data-variant-price="${escapeHtml(opt.price)}"` : ""}
            ${isAvailable ? "" : "disabled"}
            title="${isAvailable ? escapeHtml(opt.displayLabel || opt.label) : `${escapeHtml(opt.displayLabel || opt.label)} — ${t("prodUi.outOfStockSuffix")}`}"
          >
            ${opt.displayLabel || opt.label}
          </button>
        `;
          })
          .join("")}
      </div>
    </div>
  `;
}

/**
 * "X yorum" tıklamasında Yorumlar bölümüne git.
 * Sekme nav'ının kendi delegated handler'ına delege ediyoruz (ProductTabs.ts:128) —
 * o zaten sticky header + nav ofsetini hesaba katan yumuşak kaydırmayı yapıyor ve
 * aktif sekme vurgusunu güncelliyor. Sekmeler henüz mount edilmediyse bölüm
 * başına kaydırmaya düşülür.
 */
function scrollToReviewsTab(): void {
  const btn = document.getElementById("tab-btn-reviews");
  if (btn) {
    btn.click();
    return;
  }
  document
    .getElementById("product-tabs-section")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ProductBuyBox(): string {
  const p = getCurrentProduct();

  return `
    <div id="pd-buy-box" class="flex flex-col">
      <h1 id="pd-product-title" class="text-2xl font-bold leading-snug tracking-[-0.015em] text-balance break-words text-[var(--pd-title-color,#111827)]">${escapeHtml(p.title)}</h1>
      <div id="pd-rating-line" class="mt-2 flex items-center gap-1.5 flex-wrap text-[13px] text-[var(--pd-rating-text-color,#6b7280)]">
        ${ratingLineHtml()}
      </div>

      <div class="mt-4">
        ${
          p.sellerKybVerified === false
            ? `
        <!-- Sprint 2.6: KYB Verified DEĞİL → fiyat yerine uyarı banner (büyük, vurgulu) -->
        <div class="pd-kyb-banner-large flex items-start gap-3 mb-5 px-4 py-3.5 bg-[#fff7ed] border border-[#fed7aa] rounded-md" role="alert">
          <svg class="shrink-0 mt-0.5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div class="text-sm leading-[1.5] text-[#9a3412] flex-1 min-w-0">
            <div class="font-semibold mb-1">${t("common.kybGateBannerTitle")}</div>
            <div class="text-xs">${t("common.kybGateBannerBody")}</div>
          </div>
        </div>
        `
            : `
        <!-- Price Tiers -->
        ${renderPriceTiers(p.priceTiers)}

        <!-- Sample Price -->
        ${
          p.samplePrice
            ? `
        <div id="pd-sample-price" class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3.5 py-2.5 rounded-md mb-5" style="background: var(--color-surface-raised, #f5f5f5);">
          <div class="flex items-center gap-1.5 text-[13px] min-w-0" style="color: var(--color-text-primary);">
            <svg class="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            <span class="whitespace-nowrap">${t("product.samplePrice")}: <strong>${formatCurrency(p.samplePrice, getSelectedCurrency())}</strong></span>
          </div>
          <button type="button" data-order-sample="${p.id}" class="pd-sample-btn shrink-0 cursor-pointer whitespace-nowrap px-3.5 py-1.5 text-[13px] font-medium border-[length:var(--btn-outline-border-width)] border-[var(--btn-outline-border-color)] rounded-[var(--radius-button)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-text)] transition-[background,color,border-color] duration-150 hover:bg-[var(--btn-outline-hover-bg,var(--btn-outline-bg))] hover:text-[var(--btn-outline-hover-text,var(--btn-outline-text))]">${t("cart.orderSample")}</button>
        </div>
        `
            : ""
        }
        `
        }
      </div>

      <!-- Variations Header — yalnızca backend varyant döndürdüyse göster -->
      ${
        p.variants.length > 0
          ? `
      <div id="pd-variations-section" class="pb-4" style="border-bottom: 1px solid var(--color-border-light, #f0f0f0);">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-bold m-0" style="color: var(--pd-title-color, #111827);">${t("product.variants")}</h2>
          <a href="#" class="text-sm font-medium no-underline hover:underline" style="color: var(--pd-breadcrumb-link-color, #cc9900);">${t("product.makeSelection")}</a>
        </div>

        <!-- Variant Groups -->
        ${p.variants.map((v) => renderVariant(v, p.variants)).join("")}
      </div>
      `
          : ""
      }
    </div>
  `;
}

/**
 * Orta sütunun etkileşimleri:
 * - Reviews backend'den geldiğinde puan satırını (yıldız + puan + yorum/sipariş
 *   sayısı) yeniden render et. `loadProductReviews` summary'i frontend'de
 *   yeniden hesaplıyor; bu fonksiyon DOM'a o güncel değerleri basar.
 * - Varyant seçimi: aktif durum, etiket, fiyat, galeri olayı, cross-disable.
 */
export function initProductBuyBox(options: { signal?: AbortSignal } = {}): void {
  const update = () => {
    const el = document.getElementById("pd-rating-line");
    if (el) el.innerHTML = ratingLineHtml();
  };
  document.addEventListener("product-reviews-loaded", update, options);
  window.addEventListener("review-submitted", update, options);

  // "X yorum" butonuna tek bir delegated click listener — innerHTML yenilense
  // bile event delegation ile çalışmaya devam eder.
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest("#pd-review-count-link")) {
      scrollToReviewsTab();
    }
  }, options);

  const getSelectedVariantLabels = (): { color: string; size: string } => {
    const activeColorBtn = document.querySelector<HTMLButtonElement>(
      '.variant-group[data-variant-type="color"] .variant-option.active'
    );
    const activeSizeBtn = document.querySelector<HTMLButtonElement>(
      '.variant-group:not([data-variant-type="color"]) .variant-option.active'
    );
    return {
      color: activeColorBtn?.getAttribute("data-variant-label") || "",
      size: activeSizeBtn?.getAttribute("data-variant-label") || "",
    };
  };

  // "Seçim yap" link → open cart drawer
  const makeSelectionLink = document.querySelector<HTMLAnchorElement>(
    '#pd-variations-section a[href="#"]'
  );
  if (makeSelectionLink) {
    makeSelectionLink.addEventListener("click", (e) => {
      e.preventDefault();
      const { color, size } = getSelectedVariantLabels();
      openCartDrawer(color, size);
    }, options);
  }

  // Variant selection — event delegation so dynamically re-enabled buttons also work
  const variantGroups = document.querySelectorAll<HTMLElement>(".variant-group");
  variantGroups.forEach((group) => {
    const labelEl = group.querySelector<HTMLElement>(".variant-selected-label");

    group.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".variant-option");
      if (!btn || btn.disabled) return;

      // Update active state — clear all siblings, activate clicked
      group
        .querySelectorAll<HTMLButtonElement>(".variant-option")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update label text (çevrili gösterim) — eşleşme kaynak data-variant-label ile.
      const variantDisplay =
        btn.getAttribute("data-variant-display") || btn.getAttribute("data-variant-label");
      if (labelEl && variantDisplay) {
        labelEl.textContent = variantDisplay;
      }

      // Aktif kademe fiyatını seçilen varyantın fiyatına güncelle (O2 — eskiden
      // masaüstü varyant seçilince fiyat güncellenmiyordu; mobil ile aynı davranış).
      applyVariantPrice(btn, "#pd-price-tiers .pd-price-tier.active .pd-price-tier-price");

      // Read all variant-specific data from the clicked button
      const variantId = btn.getAttribute("data-variant-id") || "";
      const variantVideo = btn.getAttribute("data-variant-video") || "";
      const isDefaultVariant = btn.getAttribute("data-is-default") === "1";
      let variantImages: string[] = [];
      try {
        const raw = decodeURIComponent(btn.getAttribute("data-variant-images") || "[]");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) variantImages = parsed.filter(Boolean);
      } catch (_) {
        /* noop */
      }
      const variantTitle = decodeURIComponent(btn.getAttribute("data-variant-title") || "");

      // Dispatch a single event that the gallery + video + title listeners consume
      document.dispatchEvent(
        new CustomEvent("product-variant-change", {
          detail: {
            variantId,
            videoUrl: variantVideo,
            images: variantImages,
            title: variantTitle,
            isDefault: isDefaultVariant,
          },
        })
      );

      // Cross-disable: update other axis buttons based on skuMatrix availability
      crossDisableVariants(
        group.getAttribute("data-variant-label") || "",
        btn.getAttribute("data-variant-label") || ""
      );

      // Update URL so the selected variant is shareable / persistent on reload
      if (variantId) {
        const url = new URL(window.location.href);
        url.searchParams.set("variant", variantId);
        window.history.replaceState(null, "", url.toString());
      }

      // Open drawer only for NON-photo variant groups (size, material, etc.)
      // AND only on real user clicks (not auto-selection on page load).
      const hasVariantPhoto = !!btn.getAttribute("data-variant-image");
      const isAutoSelect = btn.hasAttribute("data-auto-select");
      if (!hasVariantPhoto && !isAutoSelect) {
        const { color, size } = getSelectedVariantLabels();
        openCartDrawer(color, size);
      }
    }, options);
  });

  // Apply cross-disable for the initially active color (without relying on auto-click)
  const activeColorBtn = document.querySelector<HTMLButtonElement>(
    '.variant-group[data-variant-type="color"] .variant-option.active'
  );
  if (activeColorBtn) {
    const colorGroup = activeColorBtn.closest<HTMLElement>(".variant-group");
    if (colorGroup) {
      crossDisableVariants(
        colorGroup.getAttribute("data-variant-label") || "",
        activeColorBtn.getAttribute("data-variant-label") || ""
      );
    }
  }
}
