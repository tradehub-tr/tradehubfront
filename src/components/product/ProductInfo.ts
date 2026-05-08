/**
 * ProductInfo Component
 * Right sticky card (iSTOC layout-stick style).
 * Contains: price tiers, variations, shipping, CTAs.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import type { PriceTier, ProductVariant } from "../../types/product";
import { openShippingModal, openCartDrawer } from "./CartDrawer";

function renderPriceTiers(tiers: PriceTier[]): string {
  // When a campaign is active the backend sets each tier's originalPrice
  // (pre-discount). We show it as a strikethrough next to the deal price.
  // The qty label is fully localised via product.moqSingle / product.moqRange
  // so each locale controls its own abbreviation + unit (TR: "MSA: 1 adet",
  // EN: "MSQ: 1 piece").
  return `
    <div id="pd-price-tiers">
      ${tiers
        .map((tier, i) => {
          const qtyLabel = tier.maxQty
            ? t("product.moqRange", { min: tier.minQty, max: tier.maxQty })
            : t("product.moqSingle", { count: tier.minQty });
          const hasDiscount =
            typeof tier.originalPrice === "number" && tier.originalPrice > tier.price;
          const strikethrough = hasDiscount
            ? `<span class="pd-price-tier-original" style="text-decoration: line-through; color: var(--color-text-tertiary, #9ca3af); font-size: 12px; margin-right: 6px;">${formatCurrency(tier.originalPrice!, getSelectedCurrency())}</span>`
            : "";
          return `
          <div class="pd-price-tier ${i === 0 ? "active" : ""}" data-tier-index="${i}">
            <span class="pd-price-tier-qty">${qtyLabel}</span>
            <span class="pd-price-tier-price shrink-0 flex items-baseline gap-1">${strikethrough}${formatCurrency(tier.price, getSelectedCurrency())}</span>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

/**
 * Check if a non-color option is available for a specific color using the skuMatrix.
 * For axis2 options, checks axis2 match. For extra axes, checks extraAxes match.
 * Returns true if no skuMatrix exists (fallback to global availability).
 */
function isOptionAvailableForColor(
  skuMatrix: any[] | undefined,
  colorLabel: string,
  optionLabel: string,
  axisIndex: number, // 1 = axis2, 2+ = extra axis
  axisName?: string // required for extra axes
): boolean {
  if (!skuMatrix || skuMatrix.length === 0) return true;
  const matches = skuMatrix.filter((row: any) => {
    if (row.axis1 !== colorLabel) return false;
    if (axisIndex === 1) return row.axis2 === optionLabel;
    // Extra axis
    return (row.extraAxes || {})[axisName!] === optionLabel;
  });
  if (matches.length === 0) return false;
  return matches.some((row: any) => row.available);
}

function renderVariant(variant: ProductVariant, allVariants: ProductVariant[]): string {
  // Default: isDefault flag; fallback: first available option
  const defaultOpt = variant.options.find((o) => (o as any).isDefault && o.available);
  const selectedOpt = defaultOpt || variant.options.find((o) => o.available) || variant.options[0];

  if (variant.type === "color") {
    return `
      <div class="variant-group" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
        <h4 class="pd-variant-label"><strong>${variant.label}:</strong> <span class="variant-selected-label">${selectedOpt.label}</span></h4>
        <div class="pd-color-thumbs">
          ${variant.options
            .map((opt) => {
              const isDef = !!(opt as any).isDefault;
              const isActive = opt.id === selectedOpt.id;
              return `
            <button
              type="button"
              class="variant-option pd-color-thumb ${isActive ? "active" : ""} ${opt.available ? "" : "pd-color-thumb-disabled"}"
              data-variant-id="${opt.id}"
              data-variant-label="${opt.label}"
              data-variant-image="${opt.thumbnail || ""}"
              data-variant-video="${(opt as any).videoUrl || ""}"
              data-variant-title="${encodeURIComponent((opt as any).title || "")}"
              data-variant-images="${encodeURIComponent(JSON.stringify((opt as any).images || []))}"
              data-variant-value="${opt.value}"
              data-is-default="${isDef ? "1" : "0"}"
              ${opt.price ? `data-variant-price="${opt.price}"` : ""}
              ${opt.available ? "" : "disabled"}
              aria-label="${opt.label}"
              title="${opt.label}"
            >
              <img src="${opt.thumbnail || ""}" alt="${opt.label}" style="background:${opt.value};">
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
    colorVariant?.options.find((o) => (o as any).isDefault && o.available) ||
    colorVariant?.options.find((o) => o.available) ||
    colorVariant?.options[0];
  const defaultColorLabel = defaultColor?.label || "";

  // Determine axis index: axis2 = index 1 (second group), extra axes = index 2+
  const variantIndex = allVariants.indexOf(variant);
  const axisIndex = variantIndex >= 1 ? variantIndex : 1;

  return `
    <div class="variant-group" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
      <h4 class="pd-variant-label"><strong>${variant.label}:</strong> <span class="variant-selected-label">${selectedOpt.label}</span></h4>
      <div class="flex flex-wrap gap-2 mt-2">
        ${variant.options
          .map((opt) => {
            const isDef = !!(opt as any).isDefault;
            const isActive = opt.id === selectedOpt.id;
            // Check availability for the default color (not just global availability)
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
            class="variant-option pd-variant-btn ${isActive ? "active" : ""} ${isAvailable ? "" : "opacity-40 line-through cursor-not-allowed"}"
            data-variant-id="${opt.id}"
            data-variant-label="${opt.label}"
            data-variant-video="${(opt as any).videoUrl || ""}"
            data-variant-title="${encodeURIComponent((opt as any).title || "")}"
            data-variant-images="${encodeURIComponent(JSON.stringify((opt as any).images || []))}"
            data-is-default="${isDef ? "1" : "0"}"
            ${opt.price ? `data-variant-price="${opt.price}"` : ""}
            ${isAvailable ? "" : "disabled"}
            title="${isAvailable ? opt.label : `${opt.label} — tükendi`}"
          >
            ${opt.label}
          </button>
        `;
          })
          .join("")}
      </div>
    </div>
  `;
}

export function ProductInfo(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;

  return `
    <div id="product-info">
      <div id="pd-info-scrollable">
        <!-- Wholesale Tab -->
        <div id="pd-card-tabs">
          <button type="button" class="pd-card-tab active">${t("product.wholesaleSales")}</button>
        </div>

        <!-- Ready to Ship Badge -->
        <span id="pd-ready-badge" class="th-badge">${t("product.readyToShip")}</span>

        <!-- Price Tiers -->
        ${renderPriceTiers(p.priceTiers)}

        <!-- Sample Price -->
        ${
          p.samplePrice
            ? `
        <div id="pd-sample-price" class="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg mb-5" style="background: var(--color-surface-raised, #f5f5f5);">
          <div class="flex items-center gap-2 text-sm min-w-0" style="color: var(--color-text-primary);">
            <svg class="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            <span class="truncate">${t("product.samplePrice")}: <strong class="shrink-0">${formatCurrency(p.samplePrice, getSelectedCurrency())}</strong></span>
          </div>
          <button type="button" data-order-sample="${mockProduct.id}" class="pd-sample-btn shrink-0 cursor-pointer">${t("cart.orderSample")}</button>
        </div>
        `
            : ""
        }

        <!-- Variations Header -->
        <div id="pd-variations-section" class="pb-4" style="border-bottom: 1px solid var(--color-border-light, #f0f0f0);">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold m-0" style="color: var(--pd-title-color, #111827);">${t("product.variants")}</h3>
            <a href="#" class="text-sm font-medium no-underline hover:underline" style="color: var(--pd-breadcrumb-link-color, #cc9900);">${t("product.makeSelection")}</a>
          </div>

          <!-- Variant Groups -->
          ${p.variants.map((v) => renderVariant(v, p.variants)).join("")}
        </div>

        <!-- Shipping -->
        <div class="py-5" style="border-bottom: 1px solid var(--color-border-light, #f0f0f0);">
          <h3 class="text-sm font-bold mb-3 flex items-center gap-1.5 m-0" style="color: var(--pd-title-color, #111827);">${t("product.shippingLabel")}</h3>
          <div class="flex items-center justify-between gap-3 mt-3 px-3.5 py-3 rounded-lg border min-w-0" id="pd-shipping-card" style="background: var(--pd-spec-header-bg, #f9fafb); border-color: var(--color-border-default, #e5e5e5);">
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="text-sm font-semibold truncate" id="pd-ship-card-method" style="color: var(--pd-title-color, #111827);">${p.shipping[0]?.method || t("product.shippingLabel")}</span>
              <span class="pd-shipping-card-detail text-xs truncate" style="color: var(--pd-rating-text-color, #6b7280);">${p.shipping[0] ? t("product.shippingCost", { cost: p.shipping[0].cost, days: p.shipping[0].estimatedDays }) : ""}</span>
            </div>
            <a href="javascript:void(0)" class="text-[13px] font-medium no-underline whitespace-nowrap cursor-pointer" id="pd-ship-card-change" style="color: var(--pd-price-color, #cc9900);">${t("product.changeLabel")} ›</a>
          </div>
        </div>

        ${
          mockProduct.sellerKybVerified === false
            ? `
        <!-- KYB Gate Uyarı Banner — Sepete Ekle butonunun ÜSTÜNDE, flex container DIŞINDA -->
        <div class="pd-kyb-banner" role="alert">
          <svg class="pd-kyb-banner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div class="pd-kyb-banner-text">
            <div class="pd-kyb-banner-title">${t("common.kybGateBannerTitle")}</div>
            <div class="pd-kyb-banner-body">${t("common.kybGateBannerBody")}</div>
          </div>
        </div>
        `
            : ""
        }

        <!-- CTA Buttons -->
        <div id="pd-cta-buttons">
          ${
            mockProduct.sellerKybVerified === false
              ? `
            <button type="button" id="pd-add-to-cart" disabled aria-disabled="true" class="th-btn-dark pd-add-to-cart--disabled" title="${t("common.addToCartDisabledKyb")}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ${t("product.addToCart")}
            </button>
          `
              : `
            <button type="button" id="pd-add-to-cart" data-add-to-cart="${mockProduct.id}" class="th-btn-dark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              ${t("product.addToCart")}
            </button>
          `
          }
        </div>
        ${
          mockProduct.sellerKybVerified === false
            ? `<p class="pd-kyb-hint">
                 <svg class="pd-kyb-hint-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
                 <span>${t("common.kybGateFavoriteHint")}</span>
               </p>`
            : ""
        }
      </div>
    </div>
  `;
}

/**
 * Get the axis field name in a skuMatrix row for a given variant group label.
 * axis1 name → "axis1", axis2 name → "axis2", extra axes → "extraAxes.{name}"
 */
function getSkuAxisKey(
  variants: any[],
  groupLabel: string
): { field: "axis1" | "axis2" | "extra"; extraName?: string } {
  if (variants[0]?.label === groupLabel) return { field: "axis1" };
  if (variants[1]?.label === groupLabel) return { field: "axis2" };
  return { field: "extra", extraName: groupLabel };
}

function getSkuValueForAxis(sku: any, axisKey: ReturnType<typeof getSkuAxisKey>): string {
  if (axisKey.field === "axis1") return sku.axis1 || "";
  if (axisKey.field === "axis2") return sku.axis2 || "";
  return (sku.extraAxes || {})[axisKey.extraName!] || "";
}

/**
 * Collect currently selected values from all variant groups.
 * Returns a map: groupLabel → selectedValue
 */
function getSelectedAxes(): Map<string, string> {
  const selected = new Map<string, string>();
  document.querySelectorAll<HTMLElement>(".variant-group").forEach((group) => {
    const label = group.getAttribute("data-variant-label") || "";
    const activeBtn = group.querySelector<HTMLButtonElement>(".variant-option.active");
    if (activeBtn && label) {
      selected.set(label, activeBtn.getAttribute("data-variant-label") || "");
    }
  });
  return selected;
}

/**
 * Update the "Ready to Ship" badge based on whether the currently selected
 * variant combination has stock. Falls back to "ready" when the product has
 * no skuMatrix (single-variant or unmatrixed products).
 */
function updateReadyBadge(skuMatrix: any[], variants: any[]): void {
  const desktopBadge = document.getElementById("pd-ready-badge");
  const mobileBadge = document.querySelector<HTMLElement>('[data-ready-badge="mobile"]');
  if (!desktopBadge && !mobileBadge) return;

  // Listing-level "Out of Stock" status overrides everything: even if some
  // SKU rows would otherwise look available, the seller has explicitly flagged
  // this listing as unavailable, so the badge should reflect that.
  const product = getCurrentProduct() as any;
  let inStock = !product?.outOfStock;

  if (inStock && skuMatrix.length > 0) {
    const selectedAxes = getSelectedAxes();
    inStock = skuMatrix.some((sku: any) => {
      if (!sku.available) return false;
      for (const [axLabel, axValue] of selectedAxes) {
        const axKey = getSkuAxisKey(variants, axLabel);
        if (getSkuValueForAxis(sku, axKey) !== axValue) return false;
      }
      return true;
    });
  }

  const readyText = t("product.readyToShip");
  const outText = t("cart.outOfStock");

  if (desktopBadge) {
    desktopBadge.textContent = inStock ? readyText : outText;
    desktopBadge.classList.toggle("is-out-of-stock", !inStock);
  }
  if (mobileBadge) {
    mobileBadge.textContent = inStock ? readyText : outText;
    mobileBadge.style.background = inStock ? "" : "#dc2626";
  }
}

/**
 * Cross-disable: when a variant axis value is selected, disable options in
 * OTHER axes that have no available SKU for this combination.
 * Supports N axes (Color, Size, Material, etc.).
 */
function crossDisableVariants(_selectedAxisLabel: string, _selectedValue: string): void {
  const product = getCurrentProduct() as any;
  const variants = product.variants || [];

  // Find the skuMatrix (attached to the first group)
  let skuMatrix: any[] = [];
  for (const v of variants) {
    if (v.skuMatrix) {
      skuMatrix = v.skuMatrix;
      break;
    }
  }

  // Always sync the "ready to ship" badge to the current selection,
  // even when there is no skuMatrix (the helper handles that fallback).
  updateReadyBadge(skuMatrix, variants);

  if (skuMatrix.length === 0) return;

  // Collect currently selected values from all variant groups
  const selectedAxes = getSelectedAxes();

  // For each variant group, check which options are available given ALL other selections
  document.querySelectorAll<HTMLElement>(".variant-group").forEach((group) => {
    const groupLabel = group.getAttribute("data-variant-label") || "";
    const groupAxisKey = getSkuAxisKey(variants, groupLabel);

    group.querySelectorAll<HTMLButtonElement>(".variant-option").forEach((btn) => {
      const btnValue = btn.getAttribute("data-variant-label") || "";

      // Check if ANY SKU row matches: this button's value + all OTHER selected axis values
      let hasStock = false;
      for (const sku of skuMatrix) {
        // Check this button's value matches on its axis
        if (getSkuValueForAxis(sku, groupAxisKey) !== btnValue) continue;

        // Check all other selected axes match
        let allMatch = true;
        for (const [axLabel, axValue] of selectedAxes) {
          if (axLabel === groupLabel) continue; // skip self
          const axKey = getSkuAxisKey(variants, axLabel);
          if (getSkuValueForAxis(sku, axKey) !== axValue) {
            allMatch = false;
            break;
          }
        }

        if (allMatch && sku.available) {
          hasStock = true;
          break;
        }
      }

      if (!hasStock && btnValue) {
        btn.classList.add("opacity-40", "line-through", "cursor-not-allowed");
        btn.classList.remove("active");
        btn.setAttribute("title", `${btnValue} — tükendi`);
        btn.setAttribute("disabled", "");
      } else {
        btn.classList.remove("opacity-40", "line-through", "cursor-not-allowed");
        btn.removeAttribute("disabled");
        btn.setAttribute("title", btnValue);
      }
    });
  });
}

export function initProductInfo(): void {
  // Card tab switching (Toptan Satış / Özelleştirme)
  const cardTabs = document.querySelectorAll<HTMLButtonElement>(".pd-card-tab");
  cardTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      cardTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
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

  // "Seçim yap" link → open cart drawer
  const makeSelectionLink = document.querySelector<HTMLAnchorElement>(
    '#pd-variations-section a[href="#"]'
  );
  if (makeSelectionLink) {
    makeSelectionLink.addEventListener("click", (e) => {
      e.preventDefault();
      const { color, size } = getSelectedVariantLabels();
      openCartDrawer(color, size);
    });
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

      // Update label text (e.g., "Renk: Altın" → "Renk: Gümüş")
      const variantLabel = btn.getAttribute("data-variant-label");
      if (labelEl && variantLabel) {
        labelEl.textContent = variantLabel;
      }

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
    });
  });

  // Sticky card: add .pd-sticky once user scrolls past the card's bottom
  const heroInfo = document.getElementById("pd-hero-info");
  if (heroInfo && window.matchMedia("(min-width: 1024px)").matches) {
    const stickyTop = 130;
    const cardBottom = heroInfo.getBoundingClientRect().bottom + window.scrollY;

    const onScroll = () => {
      heroInfo.classList.toggle("pd-sticky", window.scrollY + stickyTop >= cardBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ── Shipping card change ──────────────────────────

  const pdShipChangeBtn = document.getElementById("pd-ship-card-change");
  if (pdShipChangeBtn) {
    pdShipChangeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openShippingModal();
    });
  }

  // Listen for shipping changes from shared modal
  document.addEventListener("shipping-change", ((e: CustomEvent) => {
    const { method, costStr, estimatedDays } = e.detail;
    const methodEl = document.getElementById("pd-ship-card-method");
    if (methodEl) methodEl.textContent = method;
    const detailEl = document.querySelector("#pd-shipping-card .pd-shipping-card-detail");
    if (detailEl)
      detailEl.textContent = `${t("product.shippingCost", { cost: costStr, days: estimatedDays })}`;
  }) as EventListener);

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
