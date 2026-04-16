import { getCurrentProduct } from '../../alpine/product';
import type { ProductDetail } from '../../types/product';
import {
  SharedCartDrawer,
  SharedShippingModal,
  initSharedCartDrawer,
  initSharedShippingModal,
  openSharedCartDrawer,
  openSharedShippingModal,
  type CartDrawerColorModel,
  type CartDrawerSizeGroup,
  type CartDrawerSelectableGroup,
  type CartDrawerItemModel,
  type CartDrawerShippingOption,
  type CartDrawerTierModel,
} from '../cart/overlay/SharedCartDrawer';

export interface CartDrawerTier {
  minQty: number;
  maxQty: number | null;
  price: number;
}

export interface CartDrawerContext {
  title?: string;
  priceTiers?: CartDrawerTier[];
  moq?: number;
  unit?: string;
}

let currentContext: CartDrawerContext | null = null;

function toShippingOptions(product: ProductDetail): CartDrawerShippingOption[] {
  return product.shipping.map((option, index) => {
    const numeric = Number(option.cost.replace(/[^0-9.]/g, '')) || 0;
    return {
      id: `ship-${index + 1}`,
      method: option.method,
      estimatedDays: option.estimatedDays,
      cost: numeric,
      costText: option.cost,
    };
  });
}

function toColors(product: ProductDetail): CartDrawerColorModel[] {
  // Filter ALL color variant groups and flatten options (backend may return multiple groups for same attribute)
  const colorVariants = product.variants.filter((v) => v.type === 'color');
  if (colorVariants.length === 0) return [];

  return colorVariants.flatMap((variant, groupIdx) =>
    variant.options.map((option, i) => ({
      id: option.id || `color-${groupIdx}-${i + 1}`,
      label: option.label,
      colorHex: option.value,
      imageKind: 'jewelry' as const,
      imageUrl: option.thumbnail || product.images[0]?.src,
      rawPrice: option.rawPrice ?? undefined,
    }))
  );
}

function toSizeGroups(product: ProductDetail): CartDrawerSizeGroup[] {
  return product.variants
    .filter((v) => v.type === 'size')
    .map((v) => ({
      groupLabel: v.label,
      options: v.options.map((o, i) => ({
        id: o.id || `${v.label}-${i}`,
        label: o.label,
        rawPrice: o.rawPrice ?? undefined,
      })),
    }))
    .filter((g) => g.options.length > 0);
}

function toSelectableGroups(product: ProductDetail): CartDrawerSelectableGroup[] {
  return product.variants
    .filter((v) => v.type === 'material')
    .map((v) => ({
      groupLabel: v.label,
      axisName: v.label,
      options: v.options.map((o, i) => ({
        id: o.id || `${v.label}-${i}`,
        label: o.label,
      })),
    }))
    .filter((g) => g.options.length > 0);
}

function toSkuMatrix(product: ProductDetail): CartDrawerItemModel['skuMatrix'] {
  const colorVariant = product.variants.find((v) => v.type === 'color');
  if (!colorVariant?.skuMatrix) return undefined;
  return colorVariant.skuMatrix;
}

function toDrawerItem(product: ProductDetail, context?: CartDrawerContext | null): CartDrawerItemModel {
  const unit = context?.unit || product.unit;
  const moq = context?.moq && context.moq > 0 ? context.moq : product.moq;
  const tiers: CartDrawerTierModel[] = (context?.priceTiers && context.priceTiers.length > 0)
    ? context.priceTiers.map((tier) => ({ minQty: tier.minQty, maxQty: tier.maxQty, price: tier.price }))
    : product.priceTiers.map((tier) => ({ minQty: tier.minQty, maxQty: tier.maxQty, price: tier.price, rawPrice: tier.basePrice }));

  return {
    id: product.id,
    title: context?.title || product.title,
    supplierName: product.supplier.name,
    unit,
    moq,
    sellInMoqMultiples: !!product.sellInMoqMultiples,
    imageKind: 'jewelry',
    currency: product.baseCurrency || 'USD',
    priceTiers: tiers,
    samplePrice: product.baseSamplePrice ?? product.samplePrice,
    colors: toColors(product),
    colorAxisLabel: product.variants.find((v) => v.type === 'color')?.label,
    sizeGroups: toSizeGroups(product),
    selectableGroups: toSelectableGroups(product),
    shippingOptions: toShippingOptions(product),
    skuMatrix: toSkuMatrix(product),
  };
}

function buildActiveItem(): CartDrawerItemModel {
  return toDrawerItem(getCurrentProduct(), currentContext);
}

export function setCartDrawerContext(context: CartDrawerContext | null): void {
  currentContext = context;
}

export function openCartDrawer(preselectedColor?: string, preselectedSize?: string): void {
  const item = buildActiveItem();
  initSharedCartDrawer([item]);
  openSharedCartDrawer(item.id, 'cart', preselectedColor, preselectedSize);
}

export function CartDrawer(): string {
  return SharedCartDrawer();
}

export function initCartDrawer(): void {
  const item = buildActiveItem();
  initSharedCartDrawer([item]);
}

export function ShippingModal(): string {
  return SharedShippingModal();
}

export function initShippingModal(): void {
  initSharedShippingModal();
}

export function openShippingModal(quantity?: number): void {
  openSharedShippingModal(quantity);
}
