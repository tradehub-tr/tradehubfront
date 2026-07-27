/**
 * ProductOrderPanel — ürün detay SAĞ sütunu.
 * Kargo kartı, sosyal kanıt rozeti ve CTA'lar (Sepete Ekle / Sohbet et).
 * 1280px altında sağ panel ortanın altına akar; sticky yalnız 1280px ve
 * üstünde devreye girer. Eşiğin tek hakemi CSS: hem dıştaki `#pd-hero-info`
 * hem içerideki `[.pd-sticky_&]:` grupları `min-[1280px]:` ile kapılıdır.
 * JS `.pd-sticky` class'ını her genişlikte toggle eder (bkz. init).
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import type { PriceTier, ProductVariant } from "../../types/product";
import { openCartDrawer, openShippingModal } from "./CartDrawer";
import { SocialProofBadge } from "./SocialProofBadge";
import { SECTION_DIVIDER } from "./ProductBuyBox";
import { crossDisableVariants, isOptionAvailableForColor } from "./variantMatrix";
import { applyVariantPrice, tierQtyLabel } from "./variantPrice";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

/** Kampanya varsa ilk kademenin indirim yüzdesi — fiyatın üstündeki kırmızı rozet. */
function discountBadgeHtml(tiers: PriceTier[]): string {
  const first = tiers[0];
  if (!first || typeof first.originalPrice !== "number" || first.originalPrice <= first.price) {
    return "";
  }
  const percent = Math.round(((first.originalPrice - first.price) / first.originalPrice) * 100);
  if (percent <= 0) return "";
  // Rakamsal gösterim kasıtlı: "-10%" dört dilde de aynı okunur, çeviri gerektirmez.
  return `<span class="pd-discount-badge inline-flex items-center self-start mb-2.5 px-2 py-[3px] rounded-[3px] text-[13px] font-medium leading-tight text-white bg-[#cc0000]">-${percent}%</span>`;
}

/**
 * Fiyat kademeleri — referans sırası: büyük fiyat üstte, altında üstü çizili
 * kampanya öncesi fiyat, en altta adet aralığı etiketi.
 *
 * Kampanya varken backend her kademeye originalPrice (indirim öncesi) koyar;
 * o durumda ilk kademe kırmızı vurgulanır, kampanya yokken tüm kademeler
 * nötr siyahtır — referans düzenin davranışı bu.
 *
 * Adet etiketi product.moqSingle / product.moqRange ile tam yerelleştirilir,
 * böylece her dil kendi birimini yönetir (TR: "1 adet", EN: "1 piece").
 */
function renderPriceTiers(tiers: PriceTier[]): string {
  const campaignActive = tiers.some(
    (tier) => typeof tier.originalPrice === "number" && tier.originalPrice > tier.price
  );
  const activePriceColor = campaignActive ? "[.pd-price-tier.active_&]:text-[#cc0000]" : "";

  return `
    <div id="pd-price-tiers" class="grid grid-cols-3 gap-x-4 gap-y-4">
      ${tiers
        .map((tier, i) => {
          const hasDiscount =
            typeof tier.originalPrice === "number" && tier.originalPrice > tier.price;
          const strikethrough = hasDiscount
            ? `<span class="pd-price-tier-original block line-through text-[13px] leading-tight text-[var(--color-text-tertiary,#9ca3af)] mt-1">${formatCurrency(tier.originalPrice!, getSelectedCurrency())}</span>`
            : "";
          return `
          <div class="pd-price-tier flex flex-col p-0 cursor-default min-w-0 ${i === 0 ? "active" : ""}" data-tier-index="${i}">
            <span class="pd-price-tier-price text-[22px] font-bold leading-[1.15] break-words text-[var(--color-text-heading,#111827)] ${activePriceColor}">${formatCurrency(tier.price, getSelectedCurrency())}</span>
            ${strikethrough}
            <span class="pd-price-tier-qty mt-1.5 text-[13px] leading-snug text-[var(--color-text-muted,#666)] break-words">${tierQtyLabel(tier)}</span>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

/**
 * Varyant ekseni başlığı — referansta her eksen kendi başlığını taşır ve
 * yalnız ilkinin sağında seçim bağlantısı durur.
 * Seçili değer `.variant-selected-label` içinde kalır: tıklamada güncellenen
 * ve testlerin dayandığı düğüm budur.
 */
function variantHeaderHtml(
  variant: ProductVariant,
  selectedLabel: string,
  withSelectButton: boolean
): string {
  const selectButton = withSelectButton
    ? `<button type="button" data-open-selection class="pd-select-now th-no-press shrink-0 cursor-pointer whitespace-nowrap bg-transparent border-0 p-0 text-sm font-medium underline underline-offset-2 text-[var(--pd-title-color,#111827)] hover:opacity-70 transition-opacity duration-150">${t("product.makeSelection")}</button>`
    : "";

  return `
        <div class="flex items-center justify-between gap-3">
          <h3 class="pd-variant-label min-w-0 text-base font-bold text-[var(--pd-title-color,#111827)]">
            ${variant.displayLabel || variant.label}<span class="ms-1.5 font-normal text-sm text-[var(--color-text-muted,#666)] variant-selected-label">${selectedLabel}</span>
          </h3>
          ${selectButton}
        </div>`;
}

function renderVariant(variant: ProductVariant, allVariants: ProductVariant[], index = 0): string {
  // Default: isDefault flag; fallback: first available option
  const defaultOpt = variant.options.find((o) => o.isDefault && o.available);
  const selectedOpt = defaultOpt || variant.options.find((o) => o.available) || variant.options[0];
  const header = variantHeaderHtml(
    variant,
    selectedOpt.displayLabel || selectedOpt.label,
    index === 0
  );

  if (variant.type === "color") {
    return `
      <div class="variant-group mt-5 first:mt-0" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
        ${header}
        <div class="pd-color-thumbs flex flex-wrap gap-2 mt-3">
          ${variant.options
            .map((opt) => {
              const isDef = !!opt.isDefault;
              const isActive = opt.id === selectedOpt.id;
              return `
            <button
              type="button"
              class="variant-option pd-color-thumb w-14 h-14 p-0.5 border border-[var(--color-border-default,#e5e5e5)] rounded-md overflow-hidden cursor-pointer bg-[var(--color-surface,#fff)] transition-[border-color,box-shadow] duration-150 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:block [&_img]:rounded-[3px] [&.active]:border-2 [&.active]:border-[var(--pd-title-color,#111827)] [&.active]:p-[3px] [&:hover:not(.active):not(.pd-color-thumb-disabled)]:border-[#999] [&.pd-color-thumb-disabled]:opacity-40 [&.pd-color-thumb-disabled]:cursor-not-allowed ${isActive ? "active" : ""} ${opt.available ? "" : "pd-color-thumb-disabled"}"
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
    <div class="variant-group mt-5 first:mt-0" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
      ${header}
      <div class="flex flex-wrap gap-2 mt-3">
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
            class="variant-option pd-variant-btn min-w-[48px] px-3.5 py-2 rounded-md text-sm font-medium border border-[var(--color-border-medium,#d1d5db)] bg-[var(--color-surface-raised,#f5f5f5)] text-[var(--pd-title-color,#111827)] cursor-pointer transition-[border-color,color] duration-150 [&.active]:border-2 [&.active]:border-[var(--pd-title-color,#111827)] [&.active]:px-[13px] [&.active]:py-[7px] [&.active]:font-semibold [&:hover:not(.active):not(:disabled)]:border-[#999] ${isActive ? "active" : ""} ${isAvailable ? "" : "opacity-40 line-through cursor-not-allowed"}"
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

export function ProductOrderPanel(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;

  return `
    <div id="pd-order-panel" class="bg-[var(--color-surface,#fff)] flex flex-col border border-[var(--color-border-default,#e5e5e5)] rounded-md overflow-hidden min-[1280px]:[.pd-sticky_&]:flex-1 min-[1280px]:[.pd-sticky_&]:min-h-0 min-[1280px]:[.pd-sticky_&]:max-h-full min-[1280px]:[.pd-sticky_&]:overflow-hidden">
      <!-- Sekme şeridi panelin tepesinde; aktif sekme beyaz zemin + üst vurgu
           çizgisiyle içerikle birleşir. flex-1 sekme sayısına göre kendini
           paylaştırır: tek sekme şeridi komple kaplar, Özelleştirme sekmesi
           eklendiğinde ikisi 50/50 olur — sabit genişlik verilmez. -->
      <div id="pd-card-tabs" class="flex p-0 shrink-0 bg-[var(--color-surface-raised,#f5f5f5)] border-b border-[var(--color-border-default,#e5e5e5)]">
        <button type="button" class="pd-card-tab th-no-press flex-1 px-4 py-3.5 text-[15px] font-semibold text-center bg-transparent border-0 border-t-[3px] border-t-transparent cursor-pointer text-[var(--color-text-muted,#666)] relative transition-[background,color] duration-150 [&:not(:first-child)]:border-s [&:not(:first-child)]:border-s-[var(--color-border-default,#e5e5e5)] [&.active]:text-[var(--color-text-primary)] [&.active]:font-bold [&.active]:bg-[var(--color-surface,#fff)] [&.active]:border-t-[var(--pd-tab-active-border,#cc9900)] active">${t("product.wholesaleSales")}</button>
      </div>

      <div id="pd-info-scrollable" class="p-5 flex flex-col scrollbar-hide min-[1280px]:[.pd-sticky_&]:flex-1 min-[1280px]:[.pd-sticky_&]:overflow-y-auto min-[1280px]:[.pd-sticky_&]:min-h-0">
        <!-- Fiyat bloğu — KYB doğrulanmamış satıcıda fiyat yerine uyarı banner'ı -->
        ${
          p.sellerKybVerified === false
            ? `
        <div class="pd-kyb-banner-large flex items-start gap-3 px-4 py-3.5 bg-[#fff7ed] border border-[#fed7aa] rounded-md" role="alert">
          <svg class="shrink-0 mt-0.5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div class="text-sm leading-[1.5] text-[#9a3412] flex-1 min-w-0">
            <div class="font-semibold mb-1">${t("common.kybGateBannerTitle")}</div>
            <div class="text-xs">${t("common.kybGateBannerBody")}</div>
          </div>
        </div>
        `
            : `
        ${discountBadgeHtml(p.priceTiers)}
        ${renderPriceTiers(p.priceTiers)}
        ${
          p.samplePrice
            ? `
        <div id="pd-sample-price" class="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 rounded-md" style="background: var(--color-surface-raised, #f5f5f5);">
          <div class="flex items-center gap-2 text-sm min-w-0" style="color: var(--color-text-primary);">
            <svg class="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            <span class="whitespace-nowrap"><strong class="font-semibold">${t("product.samplePrice")}:</strong> ${formatCurrency(p.samplePrice, getSelectedCurrency())}</span>
          </div>
          <button type="button" data-order-sample="${p.id}" class="pd-sample-btn shrink-0 cursor-pointer whitespace-nowrap px-4 py-1.5 text-[13px] font-medium border-[length:var(--btn-outline-border-width)] border-[var(--btn-outline-border-color)] rounded-[var(--radius-button)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-text)] transition-[background,color,border-color] duration-150 hover:bg-[var(--btn-outline-hover-bg,var(--btn-outline-bg))] hover:text-[var(--btn-outline-hover-text,var(--btn-outline-text))]">${t("cart.orderSample")}</button>
        </div>
        `
            : ""
        }
        `
        }

        <!-- Varyant eksenleri — her biri kendi başlığını taşır, seçim bağlantısı
             yalnız ilkinin sağında durur (referans düzen). -->
        ${
          (p.variants ?? []).length > 0
            ? `
        ${SECTION_DIVIDER}
        <div id="pd-variations-section">
          ${p.variants.map((v, i) => renderVariant(v, p.variants, i)).join("")}
        </div>
        `
            : ""
        }

        <!-- Shipping — yöntem belli değilse bölüm hiç render edilmez -->
        ${
          p.shipping[0]?.method
            ? `
        ${SECTION_DIVIDER}
        <div>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-bold m-0 text-[var(--pd-title-color,#111827)]">${t("product.shippingLabel")}</h2>
            <a href="javascript:void(0)" class="text-sm font-medium no-underline whitespace-nowrap cursor-pointer text-[var(--pd-title-color,#111827)] hover:opacity-70 transition-opacity duration-150" id="pd-ship-card-change">${t("product.changeLabel")} ›</a>
          </div>
          <div class="flex flex-col gap-0.5 min-w-0 mt-3 px-4 py-3 rounded-md" id="pd-shipping-card" style="background: var(--color-surface-raised, #f5f5f5);">
            <span class="text-sm font-semibold truncate" id="pd-ship-card-method" style="color: var(--pd-title-color, #111827);">${escapeHtml(p.shipping[0].method)}</span>
            <span class="pd-shipping-card-detail text-[13px] truncate" style="color: var(--pd-rating-text-color, #6b7280);">${t("product.shippingCost", { cost: p.shipping[0].cost, days: p.shipping[0].estimatedDays })}</span>
          </div>
        </div>
        `
            : ""
        }

        <!-- Social Proof Badge — kargo ile CTA arası -->
        ${SocialProofBadge({
          listingId: p.id,
          supplierId: p.supplier?.id ?? "",
        })}

        <!-- KYB uyarısı orta sütunda (ProductBuyBox'ın fiyat alanında) tek sefer
             gösterilir; CTA üstündeki duplicate banner kaldırıldı (2026-06-15). -->

        <!-- CTA Buttons (Sepete Ekle + Sohbet et — 50/50 grid) -->
        <div id="pd-cta-buttons" class="grid grid-cols-2 gap-3 px-5 py-4 border-t border-b border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)] min-[1280px]:[.pd-sticky_&]:sticky min-[1280px]:[.pd-sticky_&]:-bottom-[22px] min-[1280px]:[.pd-sticky_&]:z-[2] min-[1280px]:[.pd-sticky_&]:bg-[var(--color-surface,#fff)] min-[1280px]:[.pd-sticky_&]:border-b-0 min-[1280px]:[.pd-sticky_&]:mx-[-20px] min-[1280px]:[.pd-sticky_&]:-mb-[20px] min-[1280px]:[.pd-sticky_&]:px-5 min-[1280px]:[.pd-sticky_&]:py-4 min-[1280px]:[.pd-sticky_&]:pb-5 min-[1280px]:[.pd-sticky_&]:shadow-[0_-4px_14px_-8px_rgba(17,24,39,0.12)]">
          ${
            mockProduct.sellerKybVerified === false
              ? `
            <button type="button" id="pd-add-to-cart" disabled aria-disabled="true" class="th-btn-dark whitespace-nowrap px-3.5 opacity-50 !cursor-not-allowed pointer-events-none" title="${t("common.addToCartDisabledKyb")}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ${t("product.addToCart")}
            </button>
          `
              : `
            <button type="button" id="pd-add-to-cart" data-add-to-cart="${mockProduct.id}" class="th-btn-dark whitespace-nowrap px-3.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              ${t("product.addToCart")}
            </button>
          `
          }

          <button type="button" id="pd-chat-with-seller"
                  data-chat-trigger
                  data-product-id="${escapeHtml(mockProduct.id)}"
                  data-product-title="${escapeHtml(p.title || "")}"
                  data-product-price="${escapeHtml(p.priceTiers[0] ? formatCurrency(p.priceTiers[0].price, getSelectedCurrency()) : "")}"
                  data-product-thumb="${escapeHtml(sanitizeUrl(p.images?.[0]?.src || ""))}"
                  data-product-min-order="${p.moq ? String(p.moq) : "1"}"
                  data-seller-id="${escapeHtml(p.supplier?.id || "")}"
                  class="th-btn-outline whitespace-nowrap px-3.5 inline-flex items-center justify-center gap-2 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            ${t("chat.chatWithSeller")}
          </button>
        </div>
        ${
          mockProduct.sellerKybVerified === false
            ? `<p class="pd-kyb-hint flex items-start gap-1.5 mx-5 mt-2 text-[11px] leading-[1.5] text-[#6b7280]">
                 <svg class="pd-kyb-hint-icon shrink-0 mt-0.5 text-[#9ca3af]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
                 <span>${t("common.kybGateFavoriteHint")}</span>
               </p>`
            : ""
        }
      </div>
    </div>
  `;
}

export function initProductOrderPanel(options: { signal?: AbortSignal } = {}): void {
  // Card tab switching (Toptan Satış / Özelleştirme)
  const cardTabs = document.querySelectorAll<HTMLButtonElement>(".pd-card-tab");
  cardTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      cardTabs.forEach((other) => other.classList.remove("active"));
      tab.classList.add("active");
    }, options);
  });

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

  // "Seçim yap" → sepet çekmecesini aç. Eskiden bir <a href="#"> idi;
  // referans düzende varyant başlığının sağında altı çizili bağlantıya dönüştü.
  const makeSelectionBtn = document.querySelector<HTMLButtonElement>(
    "#pd-variations-section [data-open-selection]"
  );
  if (makeSelectionBtn) {
    makeSelectionBtn.addEventListener("click", (e) => {
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

  // Sticky card: add .pd-sticky once user scrolls past the card's bottom.
  // Class HER genişlikte toggle edilir; 1280px eşiğinin TEK hakemi CSS'tir
  // (hem `#pd-hero-info` hem buradaki `[.pd-sticky_&]:` grupları
  // `min-[1280px]:` ile kapılı). Düzen yalnızca 1024px geçilince yeniden
  // mount edildiği için matchMedia'yı mount anında ölçmek 1100↔1440 canlı
  // resize'ında ya sticky'yi hiç bağlamıyor ya da tek sütunda çalıştırıyordu.
  const heroInfo = document.getElementById("pd-hero-info");
  if (heroInfo) {
    const stickyTop = 130;
    const cardBottom = heroInfo.getBoundingClientRect().bottom + window.scrollY;

    const onScroll = () => {
      heroInfo.classList.toggle("pd-sticky", window.scrollY + stickyTop >= cardBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true, signal: options.signal });
    onScroll();
  }

  // ── Shipping card change ──────────────────────────

  const pdShipChangeBtn = document.getElementById("pd-ship-card-change");
  if (pdShipChangeBtn) {
    pdShipChangeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openShippingModal();
    }, options);
  }

  // Listen for shipping changes from shared modal — update both desktop and mobile layouts
  document.addEventListener("shipping-change", ((e: CustomEvent) => {
    const { method, costStr, estimatedDays } = e.detail;
    const methodEl = document.getElementById("pd-ship-card-method");
    if (methodEl) methodEl.textContent = method;
    const detailEl = document.querySelector("#pd-shipping-card .pd-shipping-card-detail");
    if (detailEl)
      detailEl.textContent = `${t("product.shippingCost", { cost: costStr, days: estimatedDays })}`;

    const mobileMethodEl = document.querySelector("#pdm-ship-preview .pdm-ship-method");
    if (mobileMethodEl) mobileMethodEl.textContent = method;
    const mobileDetailEl = document.querySelector("#pdm-ship-preview .pdm-ship-detail");
    if (mobileDetailEl) {
      mobileDetailEl.innerHTML =
        `<span class="text-text-muted">${t("product.estimatedCost")}: <strong>${costStr}</strong></span>` +
        `<span class="text-text-muted">${t("product.duration")}: <strong>${estimatedDays}</strong></span>`;
    }
  }) as EventListener, options);
}
