import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import type { ProductVariant, SkuMatrixEntry } from "../../types/product";

/**
 * Check if a non-color option is available for a specific color using the skuMatrix.
 * For axis2 options, checks axis2 match. For extra axes, checks extraAxes match.
 * Returns true if no skuMatrix exists (fallback to global availability).
 */
export function isOptionAvailableForColor(
  skuMatrix: SkuMatrixEntry[] | undefined,
  colorLabel: string,
  optionLabel: string,
  axisIndex: number, // 1 = axis2, 2+ = extra axis
  axisName?: string // required for extra axes
): boolean {
  if (!skuMatrix || skuMatrix.length === 0) return true;
  const matches = skuMatrix.filter((row) => {
    if (row.axis1 !== colorLabel) return false;
    if (axisIndex === 1) return row.axis2 === optionLabel;
    // Extra axis
    return (row.extraAxes || {})[axisName!] === optionLabel;
  });
  if (matches.length === 0) return false;
  return matches.some((row) => row.available);
}

/**
 * Get the axis field name in a skuMatrix row for a given variant group label.
 * axis1 name → "axis1", axis2 name → "axis2", extra axes → "extraAxes.{name}"
 */
export function getSkuAxisKey(
  variants: ProductVariant[],
  groupLabel: string
): { field: "axis1" | "axis2" | "extra"; extraName?: string } {
  if (variants[0]?.label === groupLabel) return { field: "axis1" };
  if (variants[1]?.label === groupLabel) return { field: "axis2" };
  return { field: "extra", extraName: groupLabel };
}

export function getSkuValueForAxis(
  sku: SkuMatrixEntry,
  axisKey: ReturnType<typeof getSkuAxisKey>
): string {
  if (axisKey.field === "axis1") return sku.axis1 || "";
  if (axisKey.field === "axis2") return sku.axis2 || "";
  return (sku.extraAxes || {})[axisKey.extraName!] || "";
}

/**
 * Collect currently selected values from all variant groups.
 * Returns a map: groupLabel → selectedValue
 */
export function getSelectedAxes(): Map<string, string> {
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
export function updateReadyBadge(skuMatrix: SkuMatrixEntry[], variants: ProductVariant[]): void {
  const desktopBadge = document.getElementById("pd-ready-badge");
  const mobileBadge = document.querySelector<HTMLElement>('[data-ready-badge="mobile"]');
  if (!desktopBadge && !mobileBadge) return;

  // Listing-level "Out of Stock" status overrides everything: even if some
  // SKU rows would otherwise look available, the seller has explicitly flagged
  // this listing as unavailable, so the badge should reflect that.
  const product = getCurrentProduct();
  let inStock = !product?.outOfStock;

  if (inStock && skuMatrix.length > 0) {
    const selectedAxes = getSelectedAxes();
    inStock = skuMatrix.some((sku) => {
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
    // Mobil rozet yalnızca stok-yok uyarısıdır; stok varken alan tamamen gizli.
    mobileBadge.textContent = outText;
    const wrap = mobileBadge.closest<HTMLElement>("#pdm-badges");
    (wrap ?? mobileBadge).classList.toggle("hidden", inStock);
  }
}

/**
 * Cross-disable: when a variant axis value is selected, disable options in
 * OTHER axes that have no available SKU for this combination.
 * Supports N axes (Color, Size, Material, etc.).
 */
export function crossDisableVariants(_selectedAxisLabel: string, _selectedValue: string): void {
  const product = getCurrentProduct();
  const variants = product.variants || [];

  // Find the skuMatrix (attached to the first group)
  let skuMatrix: SkuMatrixEntry[] = [];
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

      // Tooltip = çevrili gösterim (eşleşme btnValue=kaynak ile yapıldı).
      const btnDisplay = btn.getAttribute("data-variant-display") || btnValue;
      if (!hasStock && btnValue) {
        btn.classList.add("opacity-40", "line-through", "cursor-not-allowed");
        btn.classList.remove("active");
        btn.setAttribute("title", `${btnDisplay} — ${t("prodUi.outOfStockSuffix")}`);
        btn.setAttribute("disabled", "");
      } else {
        btn.classList.remove("opacity-40", "line-through", "cursor-not-allowed");
        btn.removeAttribute("disabled");
        btn.setAttribute("title", btnDisplay);
      }
    });
  });
}
