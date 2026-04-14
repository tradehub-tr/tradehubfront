import { getListingDetail } from '../../services/listingService';
import type { ProductDetail } from '../../types/product';
import type { ProductListingCard } from '../../types/productListing';
import {
  SharedCartDrawer,
  initSharedCartDrawer,
  openSharedCartDrawer,
  setOnItemMissing,
  type CartDrawerItemModel,
  type CartDrawerColorModel,
  type CartDrawerShippingOption,
} from '../cart/overlay/SharedCartDrawer';

/* ── Mapping helpers (mirrors CartDrawer.ts logic) ── */

function toShippingOptions(product: ProductDetail): CartDrawerShippingOption[] {
  return product.shipping.map((option, index) => ({
    id: `ship-${index + 1}`,
    method: option.method,
    estimatedDays: option.estimatedDays,
    cost: Number(option.cost.replace(/[^0-9.]/g, '')) || 0,
    costText: option.cost,
  }));
}

function toColors(product: ProductDetail): CartDrawerColorModel[] {
  const colorVariants = product.variants.filter((v) => v.type === 'color');
  if (colorVariants.length === 0) return [];
  return colorVariants.flatMap((variant, groupIdx) =>
    variant.options.map((option, i) => ({
      id: option.id || `color-${groupIdx}-${i + 1}`,
      label: option.label,
      colorHex: option.value,
      imageKind: 'jewelry' as const,
      imageUrl: option.thumbnail || product.images[0]?.src,
    }))
  );
}

function toDrawerItem(product: ProductDetail): CartDrawerItemModel {
  return {
    id: product.id,
    title: product.title,
    supplierName: product.supplier.name,
    unit: product.unit,
    moq: product.moq,
    sellInMoqMultiples: !!product.sellInMoqMultiples,
    imageKind: 'jewelry',
    currency: product.baseCurrency || 'USD',
    samplePrice: product.baseSamplePrice ?? product.samplePrice,
    priceTiers: product.priceTiers.map((tier) => ({
      minQty: tier.minQty,
      maxQty: tier.maxQty,
      price: tier.price,
      rawPrice: tier.basePrice,
    })),
    colors: toColors(product),
    sizeGroups: product.variants
      .filter((v) => v.type !== 'color')
      .map((v) => ({
        groupLabel: v.label,
        options: v.options.map((o, i) => ({
          id: o.id || `${v.label}-${i}`,
          label: o.label,
          rawPrice: o.rawPrice ?? undefined,
        })),
      }))
      .filter((g) => g.options.length > 0),
    shippingOptions: toShippingOptions(product),
  };
}

/* ── Lazy-load handler ── */

async function handleItemMissing(id: string, mode: 'cart' | 'sample'): Promise<void> {
  const btn = document.querySelector<HTMLElement>(
    `[data-add-to-cart="${id}"], [data-order-sample="${id}"]`
  );
  if (btn) btn.classList.add('loading');

  try {
    const product = await getListingDetail(id);
    const item = toDrawerItem(product);
    initSharedCartDrawer([item]);
    openSharedCartDrawer(item.id, mode);
  } catch (err) {
    console.error('[ListingCartDrawer] Failed to load product detail:', err);
  } finally {
    if (btn) btn.classList.remove('loading');
  }
}

/* ── Public API (export signatures unchanged) ── */

export function ListingCartDrawer(): string {
  return SharedCartDrawer();
}

export function initListingCartDrawer(_products: ProductListingCard[]): void {
  initSharedCartDrawer([]);
  setOnItemMissing(handleItemMissing);
}
