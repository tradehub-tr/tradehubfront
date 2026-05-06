/**
 * Product row inside supplier card.
 * Alpine.js: Uses x-data on section for @click + $dispatch on favorite/delete buttons.
 * Checkbox and SkuRow children have their own Alpine scopes.
 */

import type { CartProduct, CartProductTag } from "../../../types/cart";
import { Checkbox } from "../atoms/Checkbox";
import { SkuRow } from "./SkuRow";
import trashIcon from "../../../assets/images/trash.png";
import favIcon from "../../../assets/images/fav.png";
import { t } from "../../../i18n";
import { formatPrice } from "../../../services/currencyService";

export interface ProductItemProps {
  product: CartProduct;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTag(tag: CartProductTag): string {
  return `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium" style="color:${escapeHtml(tag.color)};background:${escapeHtml(tag.bgColor)}">${escapeHtml(tag.text)}</span>`;
}

const SKU_COLLAPSE_THRESHOLD = 2;
const SKU_VISIBLE_WHEN_COLLAPSED = 2;

export function ProductItem({ product }: ProductItemProps): string {
  const collapsible = product.skus.length > SKU_COLLAPSE_THRESHOLD;
  const visibleSkus = collapsible
    ? product.skus.slice(0, SKU_VISIBLE_WHEN_COLLAPSED)
    : product.skus;
  const hiddenSkus = collapsible ? product.skus.slice(SKU_VISIBLE_WHEN_COLLAPSED) : [];
  const hiddenCount = hiddenSkus.length;

  const visibleSkusHtml = visibleSkus
    .map((sku) => SkuRow({ sku, productHref: product.href }))
    .join("");
  const hiddenSkusHtml = hiddenSkus
    .map((sku) => SkuRow({ sku, productHref: product.href }))
    .join("");

  const selectedSkuCount = product.skus.filter((s) => s.selected).length;
  const totalSkuCount = product.skus.length;
  const productIndeterminate = selectedSkuCount > 0 && selectedSkuCount < totalSkuCount;

  // Başlık (collapsed) durumunda gösterilen meta: varyant sayısı + adet + toplam
  const variantCount = product.skus.length;
  const totalQty = product.skus.reduce((sum, s) => sum + s.quantity, 0);
  const baseCurrency = product.skus[0]?.baseCurrency || "USD";
  const initialTotal = product.skus.reduce(
    (sum, s) => sum + (s.selected ? s.unitPrice * s.quantity : 0),
    0
  );
  const totalText = initialTotal > 0 ? formatPrice(initialTotal, baseCurrency) : "";

  // Tüm ürünler kapalı başlar — kullanıcı düzenlemek istediğini açar.
  const productOpen = false;
  const productImage = product.skus[0]?.skuImage || "";

  return `
    <section class="sc-c-spu-container-new" data-product-id="${escapeHtml(product.id)}" x-data="{ productOpen: ${productOpen}, skuExpanded: false }">
      <!-- Başlık satırı (her zaman görünür, tıklanır accordion toggle) -->
      <div class="sc-c-spu-head flex items-center gap-3">
        <div class="shrink-0" @click.stop>
          ${Checkbox({ id: `product-checkbox-${product.id}`, checked: product.selected, indeterminate: productIndeterminate, onChange: `product-select-${product.id}` })}
        </div>

        <button
          type="button"
          class="sc-c-spu-toggle flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
          @click="productOpen = !productOpen"
          :aria-expanded="productOpen"
        >
          ${productImage ? `<img src="${escapeHtml(productImage)}" alt="" class="sc-c-spu-thumb w-10 h-10 rounded-md object-cover border border-[var(--cc-border,#e8e6e0)] shrink-0" />` : ""}
          <div class="flex-1 min-w-0">
            <span class="sc-c-spu-title block truncate" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</span>
            <span class="sc-c-spu-moq block">${escapeHtml(product.moqLabel)}</span>
            <span class="sc-c-spu-meta block" x-show="!productOpen">
              ${t("checkout.variantsLabel", { count: variantCount })} <span class="sc-c-dot">·</span> ${t("checkout.unitsLabel", { count: totalQty })}
            </span>
          </div>
        </button>

        <div class="sc-c-spu-end flex items-center gap-2 shrink-0" @click.stop>
          <span class="sc-c-spu-total whitespace-nowrap" x-show="!productOpen" x-cloak>${totalText}</span>
          <button type="button" class="sc-c-spu-favorite-btn w-7 h-7 inline-flex items-center justify-center rounded-full transition-colors" data-product-id="${escapeHtml(product.id)}" @click="$dispatch('product-favorite', { productId: '${escapeHtml(product.id)}' })" aria-label="${t("cart.favorite")}">
            <img src="${favIcon}" class="w-4 h-4 object-contain" alt="${t("cart.favorite")}" />
          </button>
          <button type="button" class="sc-c-spu-delete-btn w-7 h-7 inline-flex items-center justify-center rounded-full transition-colors" data-product-id="${escapeHtml(product.id)}" @click="$dispatch('product-delete', { productId: '${escapeHtml(product.id)}' })" aria-label="${t("cart.removeProduct")}">
            <img src="${trashIcon}" class="w-4 h-4 object-contain" alt="${t("cart.removeProduct")}" />
          </button>
          <button type="button" class="sc-c-spu-chev-btn w-7 h-7 inline-flex items-center justify-center" @click="productOpen = !productOpen" aria-label="Aç/Kapat">
            <svg class="w-4 h-4 transition-transform duration-200" :class="productOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Açık gövde (SKU detayları) -->
      <div x-show="productOpen" x-cloak class="sc-c-spu-body">
        <div class="mt-2 mb-2 flex flex-wrap gap-1.5">${product.tags.map(renderTag).join("")}</div>
        <div class="mt-1 space-y-1.5">
          ${visibleSkusHtml}
          ${hiddenSkusHtml ? `<div x-show="skuExpanded" x-cloak class="space-y-1.5">${hiddenSkusHtml}</div>` : ""}
        </div>
        ${
          collapsible
            ? `<button
                type="button"
                class="sc-c-spu-show-more mt-2 inline-flex items-center gap-1.5"
                @click="skuExpanded = !skuExpanded"
                :aria-expanded="skuExpanded"
              >
                <span x-show="!skuExpanded">${t("checkout.showMoreVariants", { count: hiddenCount })}</span>
                <span x-show="skuExpanded" x-cloak>${t("checkout.showLessVariants")}</span>
                <svg class="w-4 h-4 transition-transform duration-200"
                  :class="skuExpanded ? 'rotate-180' : ''"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>`
            : ""
        }
      </div>
    </section>
  `.trim();
}

/** @deprecated Alpine.js handles product-favorite and product-delete dispatch declaratively via @click + $dispatch. Kept as no-op for backward compatibility. */
export function initProductItems(_container?: HTMLElement): void {
  // No-op — Alpine x-data on section + @click="$dispatch(...)" handles favorite and delete dispatch.
}
