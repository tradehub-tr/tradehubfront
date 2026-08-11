import type { ProductImageKind } from "../../../types/productListing";
import { cartStore } from "../state/CartStore";
import type { CartSku } from "../../../types/cart";
import { t } from "../../../i18n";
import { getCurrencySymbol } from "../../../utils/currency";
import { getListingUrl } from "../../../utils/listingUrl";
import { getSellerUrl } from "../../../utils/sellerUrl";
import { formatCurrency, getSelectedCurrency } from "../../../services/currencyService";
import { isLoggedIn } from "../../../utils/auth";
import { apiCheckStock, apiAddToCart, fetchCart } from "../../../services/cartService";
import { getCurrencySymbol as _getCurrencySymbolForCart } from "../../../utils/currency";
import { showCartError } from "../page/CartPage";
import { safeHexColor, escapeHtml, sanitizeUrl } from "../../../utils/sanitize";
import { moneyFlowHtml, mountMoneyFlows, resetMoneyFlows } from "../../../utils/moneyFlow";

export interface CartDrawerTierModel {
  minQty: number;
  maxQty: number | null;
  price: number;
  rawPrice?: number;
  /** Native (çevrilmemiş) tier fiyatı — sepete native saklamak için (Y1). */
  basePrice?: number;
  originalPrice?: number;
}

export interface CartDrawerShippingOption {
  id: string;
  method: string;
  estimatedDays: string;
  cost: number;
  costText: string;
}

export interface CartDrawerColorModel {
  id: string;
  label: string;
  colorHex: string;
  imageKind: ProductImageKind;
  imageUrl?: string;
  price?: number;
  rawPrice?: number;
  /** Native (çevrilmemiş) varyant fiyatı — sepete native saklamak için (Y1). */
  basePrice?: number;
}

export interface CartDrawerSizeOption {
  id: string;
  label: string;
  rawPrice?: number;
  /** Native (çevrilmemiş) beden fiyatı — sepete native saklamak için (Y1). */
  basePrice?: number;
}

export interface CartDrawerSizeGroup {
  groupLabel: string;
  options: CartDrawerSizeOption[];
}

export interface CartDrawerSelectableOption {
  id: string;
  label: string;
}

export interface CartDrawerSelectableGroup {
  groupLabel: string;
  axisName: string;
  options: CartDrawerSelectableOption[];
}

export interface SkuMatrixRow {
  axis1: string;
  axis2: string;
  stock: number;
  price: number;
  available: boolean;
  sku: string;
  variantId: string;
  extraAxes?: Record<string, string>;
}

export interface CartDrawerItemModel {
  id: string;
  title: string;
  supplierName: string;
  unit: string;
  moq: number;
  sellInMoqMultiples?: boolean;
  imageKind: ProductImageKind;
  priceTiers: CartDrawerTierModel[];
  colors: CartDrawerColorModel[];
  colorAxisLabel?: string;
  sizeGroups: CartDrawerSizeGroup[];
  selectableGroups?: CartDrawerSelectableGroup[];
  shippingOptions: CartDrawerShippingOption[];
  samplePrice?: number;
  /** Native (çevrilmemiş) numune fiyatı — sepete native saklamak için (Y1). */
  baseSamplePrice?: number;
  /** Modal gösterimi için seçili para birimi (display). */
  currency?: string;
  /** Listing'in native para birimi — sepete native saklamak için (Y1). */
  baseCurrency?: string;
  skuMatrix?: SkuMatrixRow[];
}

// ─── State ────────────────────────────────────────────────────────────────────

interface DrawerState {
  mode: "cart" | "sample";
  item: CartDrawerItemModel | null;
  selectedShippingIndex: number;
  /** Chip-selected color ID. '' when no colors. */
  selectedColorId: string;
  /** Selected values for extra selectable groups (e.g. Malzeme). Key = axisName, Value = selected label. */
  selectedSelectables: Map<string, string>;
  /** qty per size option ID. Used when sizeGroups exist. */
  sizeQuantities: Map<string, number>;
  /** single qty when there are no sizeGroups (colors-only or no-variant) */
  noVariantQty: number;
  /** Tek-eksen (satır) modunda seçenek id → adet. Bkz. getSingleAxis(). */
  rowQuantities: Map<string, number>;
  previewColorIndex: number;
  footerExpanded: boolean;
}

interface CartMemoryItem {
  item: CartDrawerItemModel;
  selectedColorId: string;
  selectedSelectables: Map<string, string>;
  sizeQuantities: Map<string, number>;
  noVariantQty: number;
}

interface ProductVisual {
  background: string;
  stroke: string;
  icon: string;
}

const productVisuals: Record<ProductImageKind, ProductVisual> = {
  jewelry: {
    background: "linear-gradient(180deg, #fef9e7 0%, #fdf0c3 100%)",
    stroke: "#8a6800",
    icon: '<path d="M12 2l2.5 5.5L20 9l-4 4 1 5.5L12 16l-5 2.5 1-5.5-4-4 5.5-1.5Z" /><circle cx="12" cy="10" r="2" />',
  },
  electronics: {
    background: "linear-gradient(180deg, #eef2ff 0%, #dbeafe 100%)",
    stroke: "#4f5fb3",
    icon: '<rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 20h10M12 16v4" /><circle cx="12" cy="10" r="2" />',
  },
  label: {
    background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)",
    stroke: "#2d8a5e",
    icon: '<rect x="4" y="6" width="16" height="12" rx="1" /><path d="M8 10h8M8 13h5" /><circle cx="17" cy="6" r="1.5" />',
  },
  crafts: {
    background: "linear-gradient(180deg, #fdf4ff 0%, #fae8ff 100%)",
    stroke: "#7e22ce",
    icon: '<path d="M12 2C8.5 2 6 4.5 6 7c0 3 6 8 6 8s6-5 6-8c0-2.5-2.5-5-6-5Z" /><path d="M8 18h8M9 21h6" />',
  },
  accessory: {
    background: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
    stroke: "#b45309",
    icon: '<rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /><path d="M4 14h16" />',
  },
  clothing: {
    background: "linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%)",
    stroke: "#a3456e",
    icon: '<path d="M8 3h8l2 6v12H6V9l2-6Z" /><path d="M12 3v8M8 3 6 9M16 3l2 6" />',
  },
  tools: {
    background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
    stroke: "#475569",
    icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />',
  },
  packaging: {
    background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)",
    stroke: "#92700c",
    icon: '<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" /><path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" /><path d="M10 12h4" />',
  },
};

const state: DrawerState = {
  mode: "cart",
  item: null,
  selectedShippingIndex: 0,
  selectedColorId: "",
  selectedSelectables: new Map(),
  sizeQuantities: new Map(),
  noVariantQty: 0,
  rowQuantities: new Map(),
  previewColorIndex: 0,
  footerExpanded: false,
};

const cartMemory = new Map<string, CartMemoryItem>();

let initialized = false;
let shippingInitialized = false;
let productsById = new Map<string, CartDrawerItemModel>();
let onItemMissing: ((id: string, mode: "cart" | "sample") => Promise<void>) | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasSizeGroups(): boolean {
  return (state.item?.sizeGroups.length ?? 0) > 0;
}

// ─── Tek-eksen (satır) modu ───────────────────────────────────────────────────
// Üründe TEK varyant ekseni varsa (yalnız renk, yalnız beden veya yalnız
// malzeme) chip + tek adet kutusu yerine referans B2B düzeni uygulanır: her
// seçenek görsel + fiyat + adet stepper'ı taşıyan bir SATIRDIR, alıcı tek
// açılışta birden çok seçeneği farklı adetlerle sepete atabilir.

interface SingleAxisOption {
  id: string;
  label: string;
  imageUrl?: string;
  colorHex?: string;
  /** Seçili para birimine çevrilmiş varyant fiyatı. */
  rawPrice?: number;
  /** Native (çevrilmemiş) varyant fiyatı — sepete native saklamak için (Y1). */
  basePrice?: number;
}

interface SingleAxisModel {
  kind: "color" | "selectable" | "size";
  /** skuMatrix eşleşmesi + sepet etiketi için ham eksen adı (çevrilmez). */
  axisName: string;
  /** Başlıkta gösterilen ad. */
  groupLabel: string;
  options: SingleAxisOption[];
}

let cachedAxisItem: CartDrawerItemModel | null = null;
let cachedAxis: SingleAxisModel | null = null;

function computeSingleAxis(): SingleAxisModel | null {
  const item = state.item;
  if (!item) return null;

  const selectables = item.selectableGroups ?? [];
  const axisCount = (item.colors.length > 0 ? 1 : 0) + selectables.length + item.sizeGroups.length;
  if (axisCount !== 1) return null;

  if (item.colors.length > 0) {
    const axisName = item.colorAxisLabel || t("cart.colorLabel");
    return {
      kind: "color",
      axisName,
      groupLabel: axisName,
      options: item.colors.map((c) => ({
        id: c.id,
        label: c.label,
        imageUrl: c.imageUrl,
        colorHex: c.colorHex,
        rawPrice: c.rawPrice,
        basePrice: c.basePrice,
      })),
    };
  }

  const selectable = selectables[0];
  if (selectable) {
    return {
      kind: "selectable",
      axisName: selectable.axisName,
      groupLabel: selectable.groupLabel,
      options: selectable.options.map((o) => ({ id: o.id, label: o.label })),
    };
  }

  const sizeGroup = item.sizeGroups[0];
  if (sizeGroup) {
    return {
      kind: "size",
      axisName: sizeGroup.groupLabel,
      groupLabel: sizeGroup.groupLabel,
      options: sizeGroup.options.map((o) => ({
        id: o.id,
        label: o.label,
        rawPrice: o.rawPrice,
        basePrice: o.basePrice,
      })),
    };
  }

  return null;
}

/** Tek eksenli ürünlerde satır modelini döner; çok eksenli/varyantsızda null. */
function getSingleAxis(): SingleAxisModel | null {
  if (state.item !== cachedAxisItem) {
    cachedAxisItem = state.item;
    cachedAxis = computeSingleAxis();
  }
  return cachedAxis;
}

function skuValueForSingleAxis(axis: SingleAxisModel, row: SkuMatrixRow): string {
  if (axis.kind === "color") return row.axis1;
  if (axis.kind === "size") return row.axis2;
  return (row.extraAxes || {})[axis.axisName] ?? "";
}

function isRowOptionAvailable(axis: SingleAxisModel, option: SingleAxisOption): boolean {
  const matrix = state.item?.skuMatrix;
  if (!matrix || matrix.length === 0) return true;
  return matrix.some((row) => row.available && skuValueForSingleAxis(axis, row) === option.label);
}

/** -1 = stok takibi yok (sınırsız). */
function getRowOptionStock(axis: SingleAxisModel, option: SingleAxisOption): number {
  const matrix = state.item?.skuMatrix;
  if (!matrix || matrix.length === 0) return -1;
  const match = matrix.find((row) => skuValueForSingleAxis(axis, row) === option.label);
  return match ? match.stock : 0;
}

function findRowOption(axis: SingleAxisModel, id: string): SingleAxisOption | undefined {
  return axis.options.find((o) => o.id === id);
}

/** Check if a specific color+size combination is available based on skuMatrix (including extra selectables). */
function isSizeAvailable(sizeLabel: string): boolean {
  if (!state.item?.skuMatrix || state.item.skuMatrix.length === 0) return true;
  const selectedColor = state.item.colors.find((c) => c.id === state.selectedColorId);
  if (!selectedColor) return true;
  const colorLabel = selectedColor.label;
  return state.item.skuMatrix.some((row) => {
    if (row.axis1 !== colorLabel || row.axis2 !== sizeLabel) return false;
    // Also check extra selectable axes match
    for (const [axName, axVal] of state.selectedSelectables) {
      if ((row.extraAxes || {})[axName] !== axVal) return false;
    }
    return row.available;
  });
}

/** Find size label by its option ID. */
function findSizeLabelById(sizeId: string): string | null {
  if (!state.item) return null;
  for (const group of state.item.sizeGroups) {
    const opt = group.options.find((o) => o.id === sizeId);
    if (opt) return opt.label;
  }
  return null;
}

/** Get the stock quantity for a specific color+size combination (including extra selectables). */
function getSizeStock(sizeLabel: string): number {
  if (!state.item?.skuMatrix || state.item.skuMatrix.length === 0) return -1;
  const selectedColor = state.item.colors.find((c) => c.id === state.selectedColorId);
  if (!selectedColor) return -1;
  const colorLabel = selectedColor.label;
  const match = state.item.skuMatrix.find((row) => {
    if (row.axis1 !== colorLabel || row.axis2 !== sizeLabel) return false;
    for (const [axName, axVal] of state.selectedSelectables) {
      if ((row.extraAxes || {})[axName] !== axVal) return false;
    }
    return true;
  });
  return match ? match.stock : 0;
}

/** Returns the base unit price accounting for selected color's rawPrice.
 *  Sample mode: color-specific rawPrice (toptan) override edilmez — listing.sample_price
 *  her renk için aynıdır, varyant fiyatı uygulanmaz. */
function getBasePrice(tierPrice: number): number {
  if (!state.item) return tierPrice;
  if (state.mode === "sample") return tierPrice;
  // Satır modunda tek bir "seçili renk" yoktur — her satır kendi fiyatını taşır,
  // kademe fiyatı yalnız fiyatsız satırların fallback'idir.
  if (getSingleAxis()) return tierPrice;
  const color = state.item.colors.find((c) => c.id === state.selectedColorId);
  return color?.rawPrice != null && color.rawPrice > 0 ? color.rawPrice : tierPrice;
}

function getTotalQty(): number {
  if (getSingleAxis()) {
    return Array.from(state.rowQuantities.values()).reduce((acc, q) => acc + q, 0);
  }
  if (hasSizeGroups()) {
    return Array.from(state.sizeQuantities.values()).reduce((acc, q) => acc + q, 0);
  }
  return state.noVariantQty;
}

function formatTierLabel(tier: CartDrawerTierModel, unit: string): string {
  if (tier.maxQty === null) return `≥ ${tier.minQty.toLocaleString()} ${unit}`;
  return `${tier.minQty.toLocaleString()} - ${tier.maxQty.toLocaleString()} ${unit}`;
}

/** Satır modu kademe etiketi — referans düzende boşluksuz: "1-399 Adet" / "≥400 Adet". */
function formatCompactTierLabel(tier: CartDrawerTierModel, unit: string): string {
  if (tier.maxQty === null) return `≥${tier.minQty.toLocaleString()} ${unit}`;
  return `${tier.minQty.toLocaleString()}-${tier.maxQty.toLocaleString()} ${unit}`;
}

function getActiveTierIndex(totalQty: number): number {
  if (!state.item) return 0;
  for (let i = state.item.priceTiers.length - 1; i >= 0; i -= 1) {
    if (totalQty >= state.item.priceTiers[i].minQty) return i;
  }
  return 0;
}

function getTotals(): {
  totalQty: number;
  activePrice: number;
  tierIndex: number;
  itemSubtotal: number;
  shippingCost: number;
  grandTotal: number;
  variationCount: number;
} {
  const totalQty = getTotalQty();
  const tierIndex = getActiveTierIndex(totalQty);
  const activeTier = state.item?.priceTiers[tierIndex];
  const tierPrice =
    state.mode === "sample"
      ? (state.item?.samplePrice ?? 30)
      : (activeTier?.rawPrice ?? activeTier?.price ?? 0);
  const activePrice = getBasePrice(tierPrice);

  let itemSubtotal = 0;
  const isSampleMode = state.mode === "sample";
  const singleAxis = getSingleAxis();
  if (singleAxis) {
    for (const opt of singleAxis.options) {
      const qty = state.rowQuantities.get(opt.id) ?? 0;
      if (qty === 0) continue;
      const unitPrice =
        !isSampleMode && opt.rawPrice != null && opt.rawPrice > 0 ? opt.rawPrice : activePrice;
      itemSubtotal += unitPrice * qty;
    }
  } else if (hasSizeGroups() && state.item) {
    for (const group of state.item.sizeGroups) {
      for (const opt of group.options) {
        const qty = state.sizeQuantities.get(opt.id) ?? 0;
        if (qty === 0) continue;
        // Numune mode'unda beden-özel rawPrice (toptan) uygulanmaz; sample_price sabit kalır.
        const unitPrice =
          !isSampleMode && opt.rawPrice != null && opt.rawPrice > 0 ? opt.rawPrice : activePrice;
        itemSubtotal += unitPrice * qty;
      }
    }
  } else {
    itemSubtotal = activePrice * totalQty;
  }

  const shippingCost = state.item?.shippingOptions[state.selectedShippingIndex]?.cost ?? 0;
  const grandTotal = itemSubtotal + shippingCost;

  let variationCount: number;
  if (singleAxis) {
    variationCount = Array.from(state.rowQuantities.values()).filter((q) => q > 0).length;
  } else if (hasSizeGroups()) {
    variationCount = Array.from(state.sizeQuantities.values()).filter((q) => q > 0).length;
  } else {
    variationCount = totalQty > 0 ? 1 : 0;
  }

  return {
    totalQty,
    activePrice,
    tierIndex,
    itemSubtotal,
    shippingCost,
    grandTotal,
    variationCount,
  };
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function getDrawerElements(): {
  overlay: HTMLElement | null;
  drawer: HTMLElement | null;
  body: HTMLElement | null;
  footer: HTMLElement | null;
} {
  return {
    overlay: document.getElementById("shared-cart-overlay"),
    drawer: document.getElementById("shared-cart-drawer"),
    body: document.getElementById("shared-cart-body"),
    footer: document.getElementById("shared-cart-footer"),
  };
}

function applyDrawerTransform(open: boolean): void {
  const { overlay, drawer } = getDrawerElements();
  if (!overlay || !drawer) return;

  const mobile = window.innerWidth < 1280;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // reduced-motion: konum hareketini kaldır, açık/kapalı yalnızca opacity ile
  const closedTransform = reduceMotion
    ? "translateX(0) translateY(0)"
    : mobile
      ? "translateY(100%)"
      : "translateX(100%)";
  const openTransform = "translateX(0) translateY(0)";

  // Kapanış açılıştan daha snappy (Emil: release > enter snappiness)
  drawer.style.transitionDuration = open ? "" : "200ms";
  drawer.style.transform = open ? openTransform : closedTransform;
  if (reduceMotion) {
    drawer.style.opacity = open ? "1" : "0";
  } else {
    drawer.style.opacity = "";
  }

  if (open) {
    overlay.classList.remove("opacity-0", "pointer-events-none");
    document.body.style.overflow = "hidden";
  } else {
    overlay.classList.add("opacity-0", "pointer-events-none");
    document.body.style.overflow = "";
  }

  const mobileBar = document.getElementById("pd-mobile-bar");
  if (mobileBar) mobileBar.style.display = open ? "none" : "";

  setPreviewVisible(open && !mobile);
}

function setPreviewVisible(visible: boolean): void {
  const preview = document.getElementById("shared-cart-preview");
  if (!preview) return;
  if (visible) {
    preview.classList.remove("hidden");
    preview.classList.add("flex");
  } else {
    preview.classList.remove("flex");
    preview.classList.add("hidden");
  }
}

function updatePreview(): void {
  const image = document.getElementById("shared-cart-preview-image");
  const label = document.getElementById("shared-cart-preview-label");
  if (!image || !label || !state.item) return;

  const color = state.item.colors[state.previewColorIndex];
  if (!color) return;

  if (color.imageUrl) {
    // imageUrl backend listing varyant verisinden geliyor; quote breakout +
    // event handler injection riski. URL'i escape edip src'ye yaz.
    image.innerHTML = `<img src="${escapeHtml(sanitizeUrl(color.imageUrl))}" alt="${escapeHtml(color.label)}" decoding="async" class="max-w-full max-h-full w-auto h-auto object-contain" />`;
  } else {
    // colorHex satıcı kontrollü; CSS context injection (";background:url(...)")
    // engellemek için hex pattern doğrulamasından geçir.
    image.innerHTML = `<div class="w-full h-full rounded-md" style="background:${safeHexColor(color.colorHex)};"></div>`;
  }
  label.textContent = `color : ${color.label}`;
}

function showSampleMaxToast(): void {
  const existing = document.getElementById("sample-max-toast");
  if (existing) return;

  const toast = document.createElement("div");
  toast.id = "sample-max-toast";
  toast.className =
    "fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex items-start gap-3 bg-[#1a1a1a] text-white text-sm rounded-md px-5 py-4 shadow-xl max-w-xs w-max pointer-events-none opacity-0 transition-opacity duration-200 motion-reduce:transition-none";
  toast.innerHTML = `
    <svg class="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e05c25" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>${t("cart.sampleMaxQty")}</span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.replace("opacity-0", "opacity-100"));
  setTimeout(() => {
    toast.classList.replace("opacity-100", "opacity-0");
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderPriceSectionHtml(totals: ReturnType<typeof getTotals>): string {
  if (!state.item) return "";
  if (state.mode === "sample") {
    return `
      <div class="mb-5 pb-5 border-b border-border-default">
        <p class="text-sm text-text-secondary mb-1">${t("cart.sampleMaxNote")}</p>
        <p class="text-[22px] font-bold text-text-heading">${formatCurrency(state.item.samplePrice ?? 30, getSelectedCurrency())} <span class="text-base font-normal text-text-tertiary">${t("cart.perUnit")}</span></p>
      </div>
    `;
  }
  return `
    <div class="grid grid-cols-3 gap-3 sm:gap-6 pb-4 sm:pb-5 mb-4 sm:mb-5 border-b border-border-default">
      ${state.item.priceTiers
        .map((tier, index) => {
          const activeClass = index === totals.tierIndex ? "text-error-500" : "text-text-heading";
          return `<div class="cart-tier-item" data-tier-index="${index}">
          <p class="text-xs sm:text-sm text-text-tertiary leading-snug">${formatTierLabel(tier, state.item!.unit)}</p>
          <p class="mt-1 text-base sm:text-[22px] font-bold ${activeClass}">${formatCurrency(tier.rawPrice ?? tier.price, state.item?.currency || getSelectedCurrency())}</p>
        </div>`;
        })
        .join("")}
    </div>
  `;
}

/**
 * Tek-eksen (satır) modu fiyat bloğu — referans ölçüleri:
 * blok `border-b #e6e7eb` + `pb-5 mb-5`; kademe ızgarası `flex-wrap gap-x-6 gap-y-3`;
 * fiyat 26px/1.5 bold #222; üstü çizili eski fiyat 14px/18px #666 `mt-1`;
 * adet etiketi 14px/20px #666 `mt-0.5`.
 */
function renderRowModePriceSectionHtml(totals: ReturnType<typeof getTotals>): string {
  const item = state.item;
  if (!item) return "";
  const currency = item.currency || getSelectedCurrency();

  if (state.mode === "sample") {
    return `
      <div class="border-b border-b-[#e6e7eb] pb-5 mb-5">
        <p class="text-sm leading-[18px] text-[#666] mb-1">${t("cart.sampleMaxNote")}</p>
        <p class="text-[26px] leading-[1.5] font-bold text-[#222]">${formatCurrency(item.samplePrice ?? 30, currency)} <span class="text-base font-normal text-[#666]">${t("cart.perUnit")}</span></p>
      </div>
    `;
  }

  const firstTier = item.priceTiers[0];
  const discountPct =
    firstTier?.originalPrice && firstTier.originalPrice > firstTier.price
      ? Math.round((1 - firstTier.price / firstTier.originalPrice) * 100)
      : 0;
  const badge =
    discountPct > 0
      ? `<span class="inline-block rounded-[2px] bg-[#d0021b] px-1 mb-2 text-[13px] leading-[18px] font-normal text-white">${escapeHtml(t("cart.offPercent", { percent: String(discountPct) }))}</span>`
      : "";

  const tiers = item.priceTiers
    .map((tier, index) => {
      const priceColor = index === totals.tierIndex ? "text-error-500" : "text-[#222]";
      const original =
        tier.originalPrice && tier.originalPrice > tier.price
          ? `<span class="block font-normal text-[#666] line-through mt-1 text-sm leading-[18px]">${formatCurrency(tier.originalPrice, currency)}</span>`
          : "";
      return `
        <div class="cart-tier-item" data-tier-index="${index}">
          <div class="text-[26px] leading-[1.5] font-bold ${priceColor}">${formatCurrency(tier.rawPrice ?? tier.price, currency)}</div>
          ${original}
          <div class="flex whitespace-nowrap text-[#666] mt-0.5 text-sm leading-[20px]">${escapeHtml(formatCompactTierLabel(tier, item.unit))}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="border-b border-b-[#e6e7eb] pb-5 mb-5">
      ${badge}
      <div class="flex flex-wrap gap-x-6 gap-y-3">${tiers}</div>
    </div>
  `;
}

/**
 * Satır adet stepper'ı — referans: 32px yüksekliğinde pill, uçlarda 32px daire
 * butonlar, ortada 16px/24px değer (#111827).
 */
function renderRowStepper(id: string, qty: number, disabled: boolean): string {
  const minusTone = qty <= 0 ? "bg-[#eee] text-[#bbb]" : "bg-transparent text-[#222]";
  return `
    <div class="inline-flex items-center h-8 shrink-0 rounded-full border border-[#e6e7eb] overflow-hidden">
      <button type="button" data-row-qty-action="minus" data-row-qty-id="${escapeHtml(id)}"
        aria-label="${t("cart.quantityDecrease")}"
        class="th-no-press w-8 h-8 shrink-0 rounded-full inline-flex items-center justify-center transition-colors ${minusTone}"
        ${qty <= 0 ? "disabled" : ""}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>
      </button>
      <input type="number" data-row-qty-input="${escapeHtml(id)}" value="${qty}" min="0"
        class="w-[52px] h-8 text-center border-0 bg-transparent text-base leading-6 text-[#111827] [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        ${disabled ? "disabled" : ""} />
      <button type="button" data-row-qty-action="plus" data-row-qty-id="${escapeHtml(id)}"
        aria-label="${t("cart.quantityIncrease")}"
        class="th-no-press w-8 h-8 shrink-0 rounded-full inline-flex items-center justify-center border border-[#e6e7eb] text-[#222] disabled:text-[#bbb] disabled:border-[#eee]"
        ${disabled ? "disabled" : ""}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>
  `;
}

/**
 * Tek-eksen satır listesi — referans ölçüleri: satır `flex w-full items-center
 * justify-between gap-1` 64px; sol blok `inline-flex w-5/12 items-center gap-2`
 * (64px görsel + 16px/24px etiket); sağ blok `flex w-7/12 items-center
 * justify-end gap-2 overflow-hidden` (fiyat `truncate text-base me-2` + stepper).
 */
function renderSingleAxisSectionHtml(
  axis: SingleAxisModel,
  totals: ReturnType<typeof getTotals>
): string {
  const item = state.item;
  if (!item) return "";
  const currency = item.currency || getSelectedCurrency();

  const rows = axis.options
    .map((opt, index) => {
      const qty = state.rowQuantities.get(opt.id) ?? 0;
      const available = isRowOptionAvailable(axis, opt);
      const stock = getRowOptionStock(axis, opt);
      const displayPrice =
        state.mode !== "sample" && opt.rawPrice != null && opt.rawPrice > 0
          ? opt.rawPrice
          : totals.activePrice;

      // Seçili satırın görseli koyu çerçeveyle işaretlenir (referans deseni).
      // Çerçeve kutunun İÇİNDE kalır (w-16/h-16 border-box) → seçim değişince
      // satır yüksekliği/hizası kaymaz, yalnız görsel 64 → 56'ya küçülür.
      const selected = index === state.previewColorIndex;
      const frame = selected ? "border-2 border-[#222] p-[2px]" : "border-2 border-transparent p-0";
      const thumb = opt.imageUrl
        ? `<span class="w-16 h-16 shrink-0 block rounded-md ${frame}">
             <img src="${escapeHtml(sanitizeUrl(opt.imageUrl))}" alt="${escapeHtml(opt.label)}" width="64" height="64" decoding="async" loading="lazy"
               class="w-full h-full rounded-[3px] object-contain bg-[var(--color-surface-raised,#f5f5f5)]${available ? "" : " grayscale"}" />
           </span>`
        : opt.colorHex
          ? `<span class="w-16 h-16 shrink-0 block rounded-md ${selected ? "border-2 border-[#222] p-[2px]" : "border border-[#e6e7eb] p-0"}">
               <span class="block w-full h-full rounded-[3px]" style="background:${safeHexColor(opt.colorHex)};"></span>
             </span>`
          : "";

      const stockNote = !available
        ? `<span class="block text-xs leading-[18px] font-medium text-red-500">${t("cart.outOfStock")}</span>`
        : stock > 0 && stock <= 10
          ? `<span class="block text-xs leading-[18px] font-medium text-amber-500">${t("cart.lowStock", { count: stock })}</span>`
          : "";

      return `
        <div class="flex w-full items-center justify-between gap-1 h-16${available ? "" : " opacity-50"}"
          data-row-option-index="${index}">
          <div class="relative inline-flex w-5/12 items-center justify-start gap-2 overflow-hidden">
            ${thumb}
            <span class="min-w-0">
              <span class="block truncate text-base leading-6 text-[#222]">${escapeHtml(opt.label)}</span>
              ${stockNote}
            </span>
          </div>
          <div class="flex w-7/12 items-center justify-end gap-2 overflow-hidden">
            <span class="truncate text-base leading-6 text-[#222] me-2">${moneyFlowHtml(`cart:row:${opt.id}`, displayPrice, currency)}</span>
            ${renderRowStepper(opt.id, qty, !available)}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <h4 class="relative mb-2 flex items-center justify-between text-base leading-6 font-bold text-[#222]">${escapeHtml(axis.groupLabel)}</h4>
    <div class="space-y-3">${rows}</div>
  `;
}

/**
 * Check if a color has ANY available SKU given the current selectable selections.
 * Returns true if no skuMatrix (no stock tracking).
 */
function isColorAvailable(colorLabel: string): boolean {
  if (!state.item?.skuMatrix || state.item.skuMatrix.length === 0) return true;
  return state.item.skuMatrix.some((row) => {
    if (row.axis1 !== colorLabel || !row.available) return false;
    for (const [axName, axVal] of state.selectedSelectables) {
      if ((row.extraAxes || {})[axName] !== axVal) return false;
    }
    return true;
  });
}

/**
 * Check if a selectable option (e.g. Malzeme=Pamuk) has ANY available SKU
 * given the currently selected color and other selectables.
 */
function isSelectableAvailable(axisName: string, optionLabel: string): boolean {
  if (!state.item?.skuMatrix || state.item.skuMatrix.length === 0) return true;
  const selectedColor = state.item.colors.find((c) => c.id === state.selectedColorId);
  if (!selectedColor) return true;
  return state.item.skuMatrix.some((row) => {
    if (row.axis1 !== selectedColor.label || !row.available) return false;
    if ((row.extraAxes || {})[axisName] !== optionLabel) return false;
    // Check other selectables (not this one)
    for (const [axName, axVal] of state.selectedSelectables) {
      if (axName === axisName) continue;
      if ((row.extraAxes || {})[axName] !== axVal) return false;
    }
    return true;
  });
}

function renderColorChip(color: CartDrawerColorModel, isSelected: boolean): string {
  const available = isColorAvailable(color.label);
  const borderStyle = isSelected
    ? "border-primary-500 bg-primary-50/40 shadow-[0_0_0_1px_var(--color-primary-500,#cc6b00)]"
    : available
      ? "border-border-default bg-surface hover:border-text-tertiary"
      : "border-border-default bg-surface opacity-40 cursor-not-allowed";

  const thumb = color.imageUrl
    ? `<img src="${escapeHtml(sanitizeUrl(color.imageUrl))}" alt="${escapeHtml(color.label)}" width="28" height="28" decoding="async" class="w-7 h-7 rounded-md object-contain shrink-0${!available ? " grayscale" : ""}" loading="lazy" />`
    : `<span class="w-5 h-5 rounded shrink-0 border border-border-default" style="background:${safeHexColor(color.colorHex || "#e5e5e5")};${!available ? "opacity:0.4;" : ""}"></span>`;

  return `
    <button type="button"
      data-color-chip="${escapeHtml(color.id)}"
      class="inline-flex items-center gap-1.5 ps-1 pe-2.5 py-1 rounded-md border transition-all ${borderStyle}"
      ${!available ? "disabled" : ""}
      title="${!available ? t("checkoutMfr.optionOutOfStock", { label: escapeHtml(color.label) }) : escapeHtml(color.label)}">
      ${thumb}
      <span class="text-xs font-medium text-text-heading truncate">${escapeHtml(color.label)}</span>
    </button>
  `;
}

function renderSelectableChip(
  axisName: string,
  option: CartDrawerSelectableOption,
  isSelected: boolean
): string {
  const available = isSelectableAvailable(axisName, option.label);
  const borderStyle = isSelected
    ? "border-primary-500 bg-primary-50/40 shadow-[0_0_0_1px_var(--color-primary-500,#cc6b00)]"
    : available
      ? "border-border-default bg-surface hover:border-text-tertiary"
      : "border-border-default bg-surface opacity-40 cursor-not-allowed";
  return `
    <button type="button"
      data-selectable-chip="${escapeHtml(axisName)}"
      data-selectable-value="${escapeHtml(option.label)}"
      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all ${borderStyle}"
      ${!available ? "disabled" : ""}
      title="${!available ? t("checkoutMfr.optionOutOfStock", { label: escapeHtml(option.label) }) : escapeHtml(option.label)}">
      <span class="text-xs font-medium text-text-heading">${escapeHtml(option.label)}</span>
    </button>
  `;
}

/** Renders a qty stepper pill (reused for sizes and no-variant). */
function renderQtyStepper(id: string, qty: number, dataAttr = "data-qty-size"): string {
  return `
    <div class="inline-flex items-center border border-border-default rounded-md overflow-hidden shrink-0">
      <button type="button" data-qty-action="minus" ${dataAttr}="${escapeHtml(id)}"
        class="w-8 h-8 bg-surface text-text-secondary hover:bg-surface-raised transition-colors text-sm leading-none">−</button>
      <input type="number" data-qty-input-size="${escapeHtml(id)}" value="${qty}" min="0"
        class="w-12 h-8 text-center border-x border-border-default bg-surface text-[13px] font-semibold text-text-heading [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <button type="button" data-qty-action="plus" ${dataAttr}="${escapeHtml(id)}"
        class="w-8 h-8 bg-surface text-text-secondary hover:bg-surface-raised transition-colors text-sm leading-none">+</button>
    </div>
  `;
}

function renderDrawerBody(): void {
  const { body } = getDrawerElements();
  if (!body || !state.item) return;

  const item = state.item;
  const totals = getTotals();
  const itemCurrency = item.currency || getSelectedCurrency();
  const singleAxis = getSingleAxis();
  const priceSection = singleAxis
    ? renderRowModePriceSectionHtml(totals)
    : renderPriceSectionHtml(totals);

  // ── Color chips section ──
  let colorSection = "";
  if (!singleAxis && item.colors.length > 0) {
    const selectedColor = item.colors.find((c) => c.id === state.selectedColorId);
    const colorLabel = selectedColor
      ? `${t("cart.colorLabel")}: <span class="font-normal text-text-secondary">${escapeHtml(selectedColor.label)}</span>`
      : t("cart.colorLabel");

    colorSection = `
      <div class="mb-4">
        <h5 class="text-[13px] font-semibold text-text-heading mb-1.5">${colorLabel}</h5>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1.5">
          ${item.colors.map((color) => renderColorChip(color, color.id === state.selectedColorId)).join("")}
        </div>
      </div>
    `;
  }

  // ── Selectable groups (e.g. Malzeme — chip selection like color) ──
  let selectableSection = "";
  if (!singleAxis && item.selectableGroups && item.selectableGroups.length > 0) {
    selectableSection = item.selectableGroups
      .map((group) => {
        const selectedVal = state.selectedSelectables.get(group.axisName) || "";
        const groupLabelHtml = selectedVal
          ? `${escapeHtml(group.groupLabel)}: <span class="font-normal text-text-secondary">${escapeHtml(selectedVal)}</span>`
          : escapeHtml(group.groupLabel);
        return `
        <div class="mb-4">
          <h5 class="text-[13px] font-semibold text-text-heading mb-1.5">${groupLabelHtml}</h5>
          <div class="flex flex-wrap gap-2">
            ${group.options.map((opt) => renderSelectableChip(group.axisName, opt, opt.label === selectedVal)).join("")}
          </div>
        </div>
      `;
      })
      .join("");
  }

  // ── Size rows section (leaf variant with qty steppers) ──
  let variantSection = "";
  if (singleAxis) {
    variantSection = renderSingleAxisSectionHtml(singleAxis, totals);
  } else if (item.sizeGroups.length > 0) {
    variantSection = item.sizeGroups
      .map((group) => {
        const rows = group.options
          .map((opt) => {
            const qty = state.sizeQuantities.get(opt.id) ?? 0;
            const hasQty = qty > 0;
            // Numune mode'unda beden-özel rawPrice (toptan) override'ı uygulanmaz.
            const displayPrice =
              state.mode !== "sample" && opt.rawPrice != null && opt.rawPrice > 0
                ? opt.rawPrice
                : totals.activePrice;
            const available = isSizeAvailable(opt.label);
            const stock = getSizeStock(opt.label);
            const stockLabel = !available
              ? `<span class="text-xs font-medium text-red-500 whitespace-nowrap">${t("cart.outOfStock")}</span>`
              : stock > 0 && stock <= 10
                ? `<span class="text-xs font-medium text-amber-500 whitespace-nowrap">${t("cart.lowStock", { count: stock })}</span>`
                : "";
            return `
          <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 py-2 border-b border-border-default last:border-b-0${!available ? " opacity-50" : ""}">
            <div class="min-w-0">
              <span class="text-[13px] font-medium text-text-heading block truncate">${escapeHtml(opt.label)}</span>
              ${stockLabel ? `<span class="block">${stockLabel}</span>` : ""}
            </div>
            <span class="text-[13px] font-semibold ${hasQty ? "text-text-heading" : "text-text-tertiary"} whitespace-nowrap">
              ${moneyFlowHtml(`cart:size:${opt.id}`, displayPrice, itemCurrency)}
            </span>
            ${available ? renderQtyStepper(opt.id, qty) : `<span class="inline-flex items-center justify-center w-[112px] h-8 text-xs text-red-400 font-medium">${t("cart.outOfStock")}</span>`}
          </div>
        `;
          })
          .join("");

        return `
        <div class="mb-4">
          <h5 class="text-sm font-semibold text-text-heading mb-1">${escapeHtml(group.groupLabel)}</h5>
          <div>${rows}</div>
        </div>
      `;
      })
      .join("");
  } else {
    // No size groups → single qty row (colors-only or no-variant)
    const qty = state.noVariantQty;
    const singleId = "__no_variant__";
    variantSection = `
      <div class="mb-4">
        <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 py-2 border-b border-border-default">
          <span class="text-[13px] font-medium text-text-heading min-w-0 truncate">${escapeHtml(item.title)}</span>
          <span class="text-[13px] font-semibold text-text-tertiary whitespace-nowrap">
            ${moneyFlowHtml("cart:noVariant", totals.activePrice, itemCurrency)}
          </span>
          ${renderQtyStepper(singleId, qty)}
        </div>
      </div>
    `;
  }

  // Sevkiyat kartı — modaldan seçilen servis; hiç seçenek yoksa "görüşülür" metni
  const selectedShipping = item.shippingOptions[state.selectedShippingIndex];
  const shippingQty = Math.max(totals.totalQty, item.moq);
  // "Değiştir" sadece seçilebilir servis varsa anlamlı — ürün panelindeki
  // `pd-ship-card-change` ile aynı koşul (ProductOrderPanel.ts:37).
  const canChangeShipping = hasSelectableShipping(item);

  body.innerHTML = `
    <h4 class="text-[15px] sm:text-base font-bold text-text-heading leading-snug mb-3 sm:mb-4">${escapeHtml(item.title)}</h4>

    ${priceSection}

    ${colorSection}

    ${selectableSection}

    ${variantSection}

    <!-- Sevkiyat — ürün panelindeki Kargo bloğuyla aynı düzen:
         başlık + "Değiştir ›" linki + gri kart (ikonlu/kesikli kart kaldırıldı) -->
    <div class="mt-3 sm:mt-4 mb-2">
      <div class="flex items-center justify-between gap-3">
        <h5 class="text-[14px] sm:text-[15px] font-bold text-text-heading leading-tight">${t("cart.shipping")}</h5>
        ${
          canChangeShipping
            ? `<button
          type="button"
          data-shipping-change
          class="th-no-press appearance-none focus:outline-none border-0 bg-transparent p-0 text-[13px] sm:text-[14px] leading-[20px] font-normal whitespace-nowrap cursor-pointer text-[#222] hover:opacity-70 transition-opacity duration-150"
        >${t("product.changeLabel")} ›</button>`
            : ""
        }
      </div>
      <div class="mt-3 px-4 py-3 rounded-md bg-[var(--color-surface-raised,#f5f5f5)]">
        ${
          selectedShipping
            ? `<span class="block text-[13px] sm:text-[14px] leading-[20px] font-semibold text-[#222] truncate">${escapeHtml(selectedShipping.method)}</span>
        <span class="block mt-1 text-[12px] sm:text-[13px] leading-snug font-normal text-[#222]">${t("cart.shippingFeeForQty", { qty: String(shippingQty), unit: item.unit, cost: selectedShipping.costText })}</span>
        <span class="block text-[12px] sm:text-[13px] leading-snug font-normal text-[#222]">${escapeHtml(formatDeliveryEstimate(selectedShipping.estimatedDays))}</span>`
            : `<p class="m-0 text-[12px] sm:text-[13px] leading-snug text-text-secondary">${t("cart.shippingNegotiate")}</p>`
        }
      </div>
    </div>
  `;

  mountMoneyFlows(body);
}

function renderDrawerFooter(): void {
  const { footer } = getDrawerElements();
  if (!footer || !state.item) return;

  const totals = getTotals();
  const perPiece = totals.totalQty > 0 ? totals.grandTotal / totals.totalQty : 0;
  const itemCurrency = state.item.currency || getSelectedCurrency();

  // Referans ölçüleri: "Fiyat" başlığı 16px/1.5 bold #222 · kırılım satırları
  // 14px/18px normal + `mb-[6px]` · "Ara toplam" satırı 16px/24px semibold #222
  // + `mb-[15px]`, etiket `mr-1`, birim-fiyat parantezi 14px #222.
  const subtotalRow = `
    <span class="font-semibold mr-1 whitespace-nowrap shrink-0">${t("cart.subtotal")}</span>
    <span class="flex items-center gap-1 min-w-0">
      ${moneyFlowHtml("cart:grandTotal", totals.grandTotal, itemCurrency)}
      <span class="text-sm font-normal text-[#222] whitespace-nowrap">(${moneyFlowHtml("cart:perPiece", perPiece, itemCurrency)}${t("cart.perUnit")})</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-text-tertiary shrink-0"><path d="${state.footerExpanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}"/></svg>
    </span>
  `;

  const breakdown = state.footerExpanded
    ? `
      <div class="text-base leading-[1.5] font-bold text-[#222] border-b border-border-default pb-2.5 mb-3 flex items-center justify-center gap-1">
        ${t("cart.price")}
      </div>
      <div class="flex justify-between gap-2 mb-[6px] text-sm leading-[18px] font-normal text-[#222]">
        <span class="min-w-0 truncate">${t("cart.productTotal")} (${t("cart.variationItems", { variation: String(totals.variationCount), items: String(totals.totalQty) })})</span>
        <span class="shrink-0">${moneyFlowHtml("cart:itemSubtotal", totals.itemSubtotal, itemCurrency)}</span>
      </div>
      <div class="flex justify-between gap-2 mb-[6px] text-sm leading-[18px] font-normal text-[#222]">
        <span>${t("cart.shippingTotal")}</span>
        <span class="shrink-0">${escapeHtml(state.item.shippingOptions[state.selectedShippingIndex]?.costText ?? formatCurrency(0, itemCurrency))}</span>
      </div>
    `
    : "";

  const details = `
    ${breakdown}
    <button type="button" id="shared-cart-footer-toggle"
      class="th-no-press w-full flex justify-between items-center gap-2 font-semibold text-base leading-6 text-[#222] mb-[15px]">
      ${subtotalRow}
    </button>
  `;

  footer.innerHTML = `
    ${details}
    <button type="button" id="shared-cart-confirm" class="w-full th-btn-dark h-10 sm:h-12 text-[13px] sm:text-lg">${state.mode === "sample" ? t("cart.orderSample") : t("cart.addToCartBtn")}</button>
  `;

  mountMoneyFlows(footer);
}

function rerenderDrawer(): void {
  renderDrawerBody();
  renderDrawerFooter();
  updatePreview();
}

// ─── Shipping modal ───────────────────────────────────────────────────────────

/**
 * Sevkiyat modalı ancak gerçekten seçilebilir bir servis varsa anlamlı.
 * Yöntem adı boş kayıtlar (backend'de kargo tanımlanmamış satıcı) seçenek sayılmaz.
 */
function hasSelectableShipping(item: CartDrawerItemModel): boolean {
  return item.shippingOptions.some((option) => (option.method ?? "").trim() !== "");
}

function updateShippingModal(quantityOverride?: number): void {
  const qtyEl = document.getElementById("shared-cart-shipping-qty");
  const optionsEl = document.getElementById("shared-cart-shipping-options");
  if (!qtyEl || !optionsEl || !state.item) return;

  const totals = getTotals();
  const qty = quantityOverride ?? Math.max(totals.totalQty, state.item.moq);
  qtyEl.textContent = `${qty} ${state.item.unit}`;

  optionsEl.innerHTML = state.item.shippingOptions
    .map((option, index) => {
      const active = index === state.selectedShippingIndex;
      const deliveryText = formatDeliveryEstimate(option.estimatedDays);
      // Referans ölçüleri: kart dolgusu 20px 16px · yöntem adı 14/18/600 ·
      // teslimat satırı üstten 10px boşluk · tutar 14px/600 — hepsi #333.
      // Seçim göstergesi onay işareti değil, klasik radyo (dolu iç daire).
      return `
      <label class="grid grid-cols-[20px_1fr_auto] items-start gap-x-3 gap-y-0 rounded-md border px-4 py-5 cursor-pointer transition-colors ${active ? "border-[#222] bg-surface" : "border-border-default bg-surface-muted hover:bg-surface"}" data-shipping-option-index="${index}">
        <span class="w-5 h-5 rounded-full border-2 inline-flex items-center justify-center shrink-0 ${active ? "border-[#222]" : "border-[#ccc]"}">
          ${active ? '<span class="w-2.5 h-2.5 rounded-full bg-[#222]"></span>' : ""}
        </span>
        <span class="min-w-0">
          <strong class="block text-[14px] leading-[18px] font-semibold text-[#333]">${escapeHtml(option.method)}</strong>
          <span class="block text-[14px] leading-[18px] font-normal text-[#333] mt-[10px]">${escapeHtml(deliveryText)}</span>
        </span>
        <strong class="text-[14px] leading-[1.5] font-semibold text-[#333] whitespace-nowrap">${escapeHtml(option.costText)}</strong>
      </label>
    `;
    })
    .join("");
}

function formatDeliveryEstimate(estimatedDays: string): string {
  const trimmed = (estimatedDays ?? "").trim();
  if (!trimmed) return t("cart.deliveryDiscussWithSeller");
  return t("cart.deliveryInDays", { days: trimmed });
}

function setShippingModalOpen(open: boolean): void {
  const modal = document.getElementById("shared-cart-shipping-modal");
  const sheet = document.getElementById("shared-cart-shipping-sheet");
  if (!modal || !sheet) return;

  // reduced-motion: alttan kayan sheet hareketini atla; modal opacity yeterli
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (open) {
    modal.classList.remove("opacity-0", "pointer-events-none");
    sheet.classList.remove("translate-y-4");
  } else {
    modal.classList.add("opacity-0", "pointer-events-none");
    if (!reduceMotion) sheet.classList.add("translate-y-4");
  }
}

// ─── Cart / SKU helpers ───────────────────────────────────────────────────────

function buildGroupedItemsForEvent(): Array<{
  supplierName: string;
  productTitle: string;
  items: Array<{ label: string; unitPrice: number; qty: number; colorValue: string }>;
}> {
  const groups = new Map<
    string,
    {
      supplierName: string;
      productTitle: string;
      items: Array<{ label: string; unitPrice: number; qty: number; colorValue: string }>;
    }
  >();

  cartMemory.forEach((memory) => {
    const totalQty = hasSizesInMemory(memory)
      ? Array.from(memory.sizeQuantities.values()).reduce((a, b) => a + b, 0)
      : memory.noVariantQty;

    if (totalQty <= 0) return;

    const tierIndex = getActiveTierIndex(totalQty);
    const unitPrice =
      memory.item.priceTiers[tierIndex]?.price ?? memory.item.priceTiers[0]?.price ?? 0;
    const supplierKey = memory.item.supplierName || "Supplier";

    if (!groups.has(supplierKey)) {
      groups.set(supplierKey, {
        supplierName: memory.item.supplierName,
        productTitle: memory.item.title,
        items: [],
      });
    }

    groups.get(supplierKey)!.items.push({
      label: `${totalQty} ${memory.item.unit}, ${memory.item.title.length > 40 ? `${memory.item.title.slice(0, 40)}...` : memory.item.title}`,
      unitPrice,
      qty: totalQty,
      colorValue: productVisuals[memory.item.imageKind].stroke,
    });
  });

  return Array.from(groups.values());
}

function hasSizesInMemory(memory: CartMemoryItem): boolean {
  return memory.item.sizeGroups.length > 0;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildVariantText(
  item: CartDrawerItemModel,
  sizeLabel: string,
  sizeOptionLabel: string
): string {
  const selectedColor = item.colors.find((c) => c.id === state.selectedColorId);
  const colorAxisName = item.colorAxisLabel || t("cart.colorLabel");
  const parts: string[] = [];
  if (selectedColor) parts.push(`${colorAxisName}: ${selectedColor.label}`);
  for (const [axName, axVal] of state.selectedSelectables) {
    if (axVal) parts.push(`${axName}: ${axVal}`);
  }
  if (sizeLabel && sizeOptionLabel) parts.push(`${sizeLabel}: ${sizeOptionLabel}`);
  return parts.join(" | ");
}

/** Guest cartStore'da supplier + product kayıtlarını (yoksa) oluşturur; supplierId döner. */
function ensureGuestSupplierProduct(
  supplierName: string,
  p: { id: string; title: string; moq: number; unit: string }
): string {
  const supplierId = toSlug(supplierName || "unknown-supplier");
  if (!cartStore.getSupplier(supplierId)) {
    cartStore.addSupplier({
      id: supplierId,
      name: supplierName,
      href: getSellerUrl({ id: supplierId }),
      selected: true,
      products: [],
    });
  }
  if (!cartStore.getProduct(p.id)) {
    cartStore.addProduct(supplierId, {
      id: p.id,
      title: p.title,
      href: getListingUrl({ id: p.id }),
      tags: [],
      moqLabel: `${t("product.minOrderLabel")}: ${p.moq} ${p.unit}`,
      favoriteIcon: "♡",
      deleteIcon: "🗑",
      skus: [],
      selected: true,
    });
  }
  return supplierId;
}

function syncToCartStore(item: CartDrawerItemModel, unitPrice: number): void {
  ensureGuestSupplierProduct(item.supplierName, item);
  const isSampleMode = state.mode === "sample";
  // Numune satırı kendi miktar/fiyat kuralına sahip olduğundan SKU id'sine "sample" eki koyup
  // toptan satırından ayrı bir kayıt olarak tut (mini sepet ve sepet sayfası bu sayede iki ayrı satır gösterir).
  const sampleIdSuffix = isSampleMode ? "-sample" : "";
  const samplePrice = isSampleMode ? (item.samplePrice ?? unitPrice) : unitPrice;

  // Y1 — sepete NATIVE fiyat + native para birimi yaz (oturumlu/backend yoluyla
  // aynı semantik). Modal display'i seçili para biriminde kalır; sepet kalıcı
  // state'i native saklar → gösterimde HER ZAMAN güncel kura çevrilir (donmuş
  // kur / round-trip drift yok). Native değer yoksa (context/listing-cart yolu)
  // eski davranışa (çevrilmiş + seçili currency) düşülür → tutar ile etiket tutarlı.
  const nativeCurrency = item.baseCurrency || getSelectedCurrency();
  const activeTierIdx = getActiveTierIndex(getTotalQty());
  const activeTier = item.priceTiers[activeTierIdx];
  const selColor = item.colors.find((c) => c.id === state.selectedColorId);
  const activeTierNative =
    selColor?.basePrice != null && selColor.basePrice > 0
      ? selColor.basePrice
      : activeTier?.basePrice;
  const persist = (
    convertedPrice: number,
    nativePrice: number | undefined
  ): { price: number; currency: string } =>
    nativePrice != null && nativePrice > 0 && item.baseCurrency
      ? { price: nativePrice, currency: nativeCurrency }
      : { price: convertedPrice, currency: getSelectedCurrency() };

  const productId = item.id;
  const selectedColor = item.colors.find((c) => c.id === state.selectedColorId);
  const skuImage = selectedColor?.imageUrl || "https://placehold.co/120x120/f5f5f5/999?text=SKU";

  if (hasSizeGroups()) {
    // One SKU per size option that has qty > 0
    for (const group of item.sizeGroups) {
      for (const opt of group.options) {
        const qty = state.sizeQuantities.get(opt.id) ?? 0;
        if (qty <= 0) continue;

        const skuId = `${item.id}-${state.selectedColorId || "no-color"}-${opt.id}${sampleIdSuffix}`;
        const effectivePrice = isSampleMode
          ? samplePrice
          : opt.rawPrice != null && opt.rawPrice > 0
            ? opt.rawPrice
            : unitPrice;
        // Native karşılık: numunede native sample, aksi halde beden-özel native
        // fiyat (yoksa aktif tier native).
        const nativeEffective = isSampleMode
          ? item.baseSamplePrice
          : opt.basePrice != null && opt.basePrice > 0
            ? opt.basePrice
            : activeTierNative;
        const persisted = persist(effectivePrice, nativeEffective);
        const variantText = buildVariantText(item, group.groupLabel, opt.label);
        const existing = cartStore.getSku(skuId);

        if (existing) {
          if (!isSampleMode) {
            cartStore.updateSkuQuantity(skuId, existing.sku.quantity + qty);
          }
          // Numune satırı zaten varsa miktar artırma (max 1).
        } else {
          const sku: CartSku = {
            id: skuId,
            skuImage,
            variantText,
            unitPrice: persisted.price,
            currency: getCurrencySymbol(),
            unit: item.unit,
            quantity: qty,
            minQty: isSampleMode ? 1 : item.moq,
            // Numune satırı MOQ katı kuralından muaf (backend get_cart ile aynı semantik).
            sellInMoqMultiples: !isSampleMode && !!item.sellInMoqMultiples,
            maxQty: isSampleMode ? 1 : 9999,
            selected: true,
            baseUnitPrice: persisted.price,
            basePriceAddon: 0,
            baseCurrency: persisted.currency,
            listingVariant: opt.id,
            isSample: isSampleMode || undefined,
          };
          cartStore.addSku(productId, sku);
        }
      }
    }
  } else {
    // Single SKU
    const qty = state.noVariantQty;
    if (qty <= 0) return;

    const colorId = state.selectedColorId || "__no_variant__";
    const isFallback = !state.selectedColorId;
    const skuId = `${item.id}-${colorId}${sampleIdSuffix}`;
    const colorAxisName = item.colorAxisLabel || t("cart.colorLabel");
    const variantParts: string[] = [];
    if (selectedColor) variantParts.push(`${colorAxisName}: ${selectedColor.label}`);
    for (const [axName, axVal] of state.selectedSelectables) {
      if (axVal) variantParts.push(`${axName}: ${axVal}`);
    }
    const variantText = variantParts.join(" | ");
    const existing = cartStore.getSku(skuId);

    if (existing) {
      if (!isSampleMode) {
        cartStore.updateSkuQuantity(skuId, existing.sku.quantity + qty);
      }
    } else {
      const nativeSingle = isSampleMode ? item.baseSamplePrice : activeTierNative;
      const persisted = persist(isSampleMode ? samplePrice : unitPrice, nativeSingle);
      const sku: CartSku = {
        id: skuId,
        skuImage,
        variantText,
        unitPrice: persisted.price,
        currency: getCurrencySymbol(),
        unit: item.unit,
        quantity: qty,
        minQty: isSampleMode ? 1 : item.moq,
        sellInMoqMultiples: !isSampleMode && !!item.sellInMoqMultiples,
        maxQty: isSampleMode ? 1 : 9999,
        selected: true,
        baseUnitPrice: persisted.price,
        basePriceAddon: 0,
        baseCurrency: persisted.currency,
        ...(isFallback ? {} : { listingVariant: colorId }),
        isSample: isSampleMode || undefined,
      };
      cartStore.addSku(productId, sku);
    }
  }
}

// ─── Generic cart submission (shared with OptionsSheet — mobil PDP "Seçenekler" sheet) ──

export interface CartSubmitLine {
  /** Backend `listing_variant` değeri — çoğunlukla renk id'si (OptionsSheet renk-satır
   *  modelinde renk = "leaf" eksen); beden yoksa colorId ile aynı değeri taşır. */
  variantId?: string;
  /** Backend + guest sepette gösterilecek insan-okur varyant metni ("Renk: Kırmızı"). */
  variantLabel?: string;
  /** Renk id'si — stok kontrolünde ve guest SKU görselinde kullanılır. */
  colorId?: string;
  /** Renk-dışı eksen seçimleri (ör. Beden/Malzeme chip'leri). */
  extraAxes?: Record<string, string>;
  /** Guest sepette gösterilecek görsel (yoksa placeholder). */
  imageUrl?: string;
  /** Satıra özel birim fiyat (seçili para biriminde); yoksa çağıranın unitPrice'ı. */
  unitPrice?: number;
  /** Satıra özel NATIVE birim fiyat; yoksa çağıranın nativeUnitPrice'ı. */
  nativeUnitPrice?: number;
  qty: number;
}

export interface CartSubmitItem {
  id: string;
  title: string;
  supplierName: string;
  unit: string;
  moq: number;
  /** Listing "MOQ katlarıyla sat" bayrağı — misafir sepetinde satır adımını (step) MOQ yapar. */
  sellInMoqMultiples?: boolean;
  currency?: string;
  baseCurrency?: string;
}

function extraAxesKey(extraAxes?: Record<string, string>): string {
  if (!extraAxes) return "";
  return Object.entries(extraAxes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

/**
 * Sepete-ekleme çekirdeği: login'liyse backend stok kontrolü + add_to_cart,
 * misafirse guest cartStore senkronu (Y1 native fiyat persist). `dispatchCartAdd`'in
 * çok-eksenli (sizeGroups + per-option rawPrice override) modeline DOKUNMADAN, YENİ
 * bir çağıran (OptionsSheet — tek fiyattan renk-satır modeli) için eklendi;
 * dispatchCartAdd değişmedi, CartDrawer.ts / ListingCartDrawer.ts etkilenmez.
 */
export async function submitCartLines(
  item: CartSubmitItem,
  lines: CartSubmitLine[],
  unitPrice: number,
  nativeUnitPrice: number | undefined,
  isSample = false
): Promise<boolean> {
  const active = lines.filter((line) => line.qty > 0);
  if (active.length === 0) return false;

  if (isLoggedIn()) {
    try {
      for (const line of active) {
        await apiCheckStock(
          item.id,
          line.qty,
          line.variantId || line.colorId,
          line.variantLabel,
          isSample
        );
      }
      let lastResponse = null;
      for (const line of active) {
        lastResponse = await apiAddToCart(
          item.id,
          line.qty,
          line.variantId,
          line.variantLabel,
          line.colorId,
          line.extraAxes && Object.keys(line.extraAxes).length ? line.extraAxes : undefined,
          isSample
        );
      }
      const sym = _getCurrencySymbolForCart();
      if (lastResponse) {
        cartStore.init(lastResponse.suppliers, 0, sym, 0);
      } else {
        const refreshed = await fetchCart();
        cartStore.init(refreshed.suppliers, 0, sym, 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showCartError(msg || t("cart.stockError"));
      return false;
    }
    return true;
  }

  // Guest — backend'e yazmadan doğrudan cartStore (checkout girişte senkronize edilir).
  ensureGuestSupplierProduct(item.supplierName, item);

  const nativeCurrency = item.baseCurrency || getSelectedCurrency();

  for (const line of active) {
    // Satır kendi fiyatını taşıyorsa (varyant-bazlı fiyat) onu kullan.
    const lineConverted = line.unitPrice != null && line.unitPrice > 0 ? line.unitPrice : unitPrice;
    const lineNative =
      line.nativeUnitPrice != null && line.nativeUnitPrice > 0
        ? line.nativeUnitPrice
        : nativeUnitPrice;
    const persisted =
      lineNative != null && lineNative > 0 && item.baseCurrency
        ? { price: lineNative, currency: nativeCurrency }
        : { price: lineConverted, currency: getSelectedCurrency() };

    const skuId = `${item.id}-${line.colorId || "no-color"}-${line.variantId || "no-variant"}${
      line.extraAxes ? `-${extraAxesKey(line.extraAxes)}` : ""
    }${isSample ? "-sample" : ""}`;
    const existing = cartStore.getSku(skuId);
    if (existing) {
      if (!isSample) cartStore.updateSkuQuantity(skuId, existing.sku.quantity + line.qty);
      continue;
    }
    cartStore.addSku(item.id, {
      id: skuId,
      skuImage: line.imageUrl || "https://placehold.co/120x120/f5f5f5/999?text=SKU",
      variantText: line.variantLabel || "",
      unitPrice: persisted.price,
      currency: getCurrencySymbol(),
      unit: item.unit,
      quantity: line.qty,
      minQty: isSample ? 1 : item.moq,
      sellInMoqMultiples: !isSample && !!item.sellInMoqMultiples,
      maxQty: isSample ? 1 : 9999,
      selected: true,
      baseUnitPrice: persisted.price,
      basePriceAddon: 0,
      baseCurrency: persisted.currency,
      listingVariant: line.variantId,
      isSample: isSample || undefined,
    });
  }

  return true;
}

/**
 * Tek-eksen (satır) modunda sepete ekleme — her satır ayrı bir cart line'dır.
 * `submitCartLines` çekirdeğini kullanır; çok-eksenli `dispatchCartAdd` yolu
 * (chip + beden matrisi) değişmeden kalır.
 */
async function dispatchRowCartAdd(axis: SingleAxisModel): Promise<boolean> {
  const item = state.item;
  if (!item) return false;

  const totals = getTotals();
  if (totals.totalQty <= 0) return false;

  const isSampleMode = state.mode === "sample";
  const activeTier = item.priceTiers[totals.tierIndex];
  const fallbackPrice = isSampleMode
    ? (item.samplePrice ?? 0)
    : (activeTier?.rawPrice ?? activeTier?.price ?? 0);
  const fallbackNative = isSampleMode ? item.baseSamplePrice : activeTier?.basePrice;

  const lines: CartSubmitLine[] = axis.options.map((opt) => ({
    qty: state.rowQuantities.get(opt.id) ?? 0,
    variantId: opt.id,
    colorId: axis.kind === "color" ? opt.id : undefined,
    variantLabel: `${axis.axisName}: ${opt.label}`,
    extraAxes: axis.kind === "selectable" ? { [axis.axisName]: opt.label } : undefined,
    imageUrl: opt.imageUrl,
    // Numune fiyatı varyanta göre değişmez; toptanda satır fiyatı önceliklidir.
    unitPrice: isSampleMode ? undefined : opt.rawPrice,
    nativeUnitPrice: isSampleMode ? undefined : opt.basePrice,
  }));

  const ok = await submitCartLines(
    {
      id: item.id,
      title: item.title,
      supplierName: item.supplierName,
      unit: item.unit,
      moq: item.moq,
      sellInMoqMultiples: !!item.sellInMoqMultiples,
      currency: item.currency,
      baseCurrency: item.baseCurrency,
    },
    lines,
    fallbackPrice,
    fallbackNative,
    isSampleMode
  );

  if (ok) document.dispatchEvent(new CustomEvent("cart-add"));
  return ok;
}

async function dispatchCartAdd(): Promise<boolean> {
  if (!state.item) return false;

  const singleAxis = getSingleAxis();
  if (singleAxis) return dispatchRowCartAdd(singleAxis);

  const totals = getTotals();
  if (totals.totalQty <= 0) return false;

  const isSampleMode = state.mode === "sample";

  if (isLoggedIn()) {
    // Stock check — build variant_label for per-variant stock validation
    try {
      const stockColorAxisName = state.item.colorAxisLabel || t("cart.colorLabel");
      const stockSelectedColor = state.item.colors.find((c) => c.id === state.selectedColorId);

      if (hasSizeGroups()) {
        for (const group of state.item.sizeGroups) {
          for (const opt of group.options) {
            const qty = state.sizeQuantities.get(opt.id) ?? 0;
            if (qty <= 0) continue;
            const labelParts: string[] = [];
            if (stockSelectedColor)
              labelParts.push(`${stockColorAxisName}: ${stockSelectedColor.label}`);
            for (const [axName, axVal] of state.selectedSelectables) {
              if (axVal) labelParts.push(`${axName}: ${axVal}`);
            }
            labelParts.push(`${group.groupLabel}: ${opt.label}`);
            const stockLabel = labelParts.join(" | ");
            await apiCheckStock(state.item.id, qty, opt.id, stockLabel, isSampleMode);
          }
        }
      } else {
        const colorId = state.selectedColorId || undefined;
        const labelParts: string[] = [];
        if (stockSelectedColor)
          labelParts.push(`${stockColorAxisName}: ${stockSelectedColor.label}`);
        for (const [axName, axVal] of state.selectedSelectables) {
          if (axVal) labelParts.push(`${axName}: ${axVal}`);
        }
        const stockLabel = labelParts.length > 0 ? labelParts.join(" | ") : undefined;
        await apiCheckStock(state.item.id, state.noVariantQty, colorId, stockLabel, isSampleMode);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showCartError(msg || t("cart.stockError"));
      return false;
    }

    // Add to cart backend
    try {
      let lastResponse = null;
      const selectedColor = state.item.colors.find((c) => c.id === state.selectedColorId);

      // Build extra axes map from selectable groups
      const extraAxes: Record<string, string> = {};
      for (const [axName, axVal] of state.selectedSelectables) {
        if (axVal) extraAxes[axName] = axVal;
      }
      const hasExtra = Object.keys(extraAxes).length > 0;
      const colorAxisName = state.item.colorAxisLabel || t("cart.colorLabel");

      if (hasSizeGroups()) {
        for (const group of state.item.sizeGroups) {
          for (const opt of group.options) {
            const qty = state.sizeQuantities.get(opt.id) ?? 0;
            if (qty <= 0) continue;
            const labelParts: string[] = [];
            if (selectedColor) labelParts.push(`${colorAxisName}: ${selectedColor.label}`);
            for (const [axName, axVal] of state.selectedSelectables) {
              if (axVal) labelParts.push(`${axName}: ${axVal}`);
            }
            labelParts.push(`${group.groupLabel}: ${opt.label}`);
            const variantLabel = labelParts.join(" | ");
            lastResponse = await apiAddToCart(
              state.item.id,
              qty,
              opt.id,
              variantLabel,
              state.selectedColorId || undefined,
              hasExtra ? extraAxes : undefined,
              isSampleMode
            );
          }
        }
      } else {
        const colorId = state.selectedColorId || undefined;
        const isFallback = !state.selectedColorId;
        const labelParts: string[] = [];
        if (selectedColor) labelParts.push(`${colorAxisName}: ${selectedColor.label}`);
        for (const [axName, axVal] of state.selectedSelectables) {
          if (axVal) labelParts.push(`${axName}: ${axVal}`);
        }
        const variantLabel = labelParts.length > 0 ? labelParts.join(" | ") : undefined;
        lastResponse = await apiAddToCart(
          state.item.id,
          state.noVariantQty,
          isFallback ? undefined : colorId,
          variantLabel,
          colorId,
          hasExtra ? extraAxes : undefined,
          isSampleMode
        );
      }

      if (lastResponse) {
        const sym = _getCurrencySymbolForCart();
        cartStore.init(lastResponse.suppliers, 0, sym, 0);
      } else {
        const refreshed = await fetchCart();
        const sym = _getCurrencySymbolForCart();
        cartStore.init(refreshed.suppliers, 0, sym, 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showCartError(msg || t("cart.stockError"));
      return false;
    }
  }

  if (!isLoggedIn()) {
    syncToCartStore(state.item, totals.activePrice);
  }

  // Persist to cartMemory — composite key includes color + selectables so different
  // variant combinations of the same product don't overwrite each other
  const memoryKey = [
    state.item.id,
    state.selectedColorId || "",
    ...Array.from(state.selectedSelectables.entries()).map(([k, v]) => `${k}=${v}`),
  ].join("|||");
  const existing = cartMemory.get(memoryKey);
  if (existing) {
    if (hasSizeGroups()) {
      state.sizeQuantities.forEach((qty, sizeId) => {
        if (qty > 0)
          existing.sizeQuantities.set(sizeId, (existing.sizeQuantities.get(sizeId) ?? 0) + qty);
      });
    } else {
      existing.noVariantQty += state.noVariantQty;
    }
  } else {
    cartMemory.set(memoryKey, {
      item: state.item,
      selectedColorId: state.selectedColorId,
      selectedSelectables: new Map(state.selectedSelectables),
      sizeQuantities: new Map(state.sizeQuantities),
      noVariantQty: state.noVariantQty,
    });
  }

  const groupedItems = buildGroupedItemsForEvent();
  const quantity = groupedItems.reduce(
    (sum, group) => sum + group.items.reduce((acc, item) => acc + item.qty, 0),
    0
  );
  const grandTotal = groupedItems.reduce(
    (sum, group) => sum + group.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0),
    0
  );

  document.dispatchEvent(
    new CustomEvent("cart-add", {
      detail: {
        productTitle: state.item.title,
        supplierName: state.item.supplierName,
        unitPrice: totals.activePrice,
        quantity,
        itemTotal: totals.itemSubtotal,
        grandTotal,
        groupedItems,
      },
    })
  );

  return true;
}

// ─── Open drawer ──────────────────────────────────────────────────────────────

function openDrawer(
  itemId?: string,
  mode: "cart" | "sample" = "cart",
  preselectedColor?: string,
  preselectedSize?: string
): void {
  const item = itemId ? productsById.get(itemId) : Array.from(productsById.values())[0];
  if (!item) return;

  state.mode = mode;
  state.item = item;
  state.selectedShippingIndex = 0;
  state.footerExpanded = false;

  // Color: prefer preselected (by id or label), fallback to first chip
  let preselectedIndex = -1;
  if (preselectedColor) {
    const needle = preselectedColor.toLowerCase();
    preselectedIndex = item.colors.findIndex(
      (c) => c.id === preselectedColor || c.label.toLowerCase() === needle
    );
  }
  if (preselectedIndex < 0) preselectedIndex = 0;
  state.selectedColorId = item.colors[preselectedIndex]?.id ?? "";
  state.previewColorIndex = Math.max(0, preselectedIndex);

  // Initialize selectable groups — prefer preselectedSize match (e.g. detail
  // page passes the active 2nd-axis value like "64GB"), otherwise first option.
  state.selectedSelectables = new Map();
  if (item.selectableGroups) {
    const sizeNeedle = preselectedSize?.toLowerCase();
    for (const group of item.selectableGroups) {
      if (group.options.length === 0) continue;
      let chosenLabel = group.options[0].label;
      if (sizeNeedle) {
        const match = group.options.find(
          (o) => o.id === preselectedSize || o.label.toLowerCase() === sizeNeedle
        );
        if (match) chosenLabel = match.label;
      }
      state.selectedSelectables.set(group.axisName, chosenLabel);
    }
  }

  // Sample mode → user picks one size manually (all start 0); cart mode → seed first/selected size with MOQ
  const initialQty = mode === "sample" ? 1 : Math.max(1, item.moq || 1);
  let targetSizeId: string | undefined;
  if (mode !== "sample") {
    if (preselectedSize) {
      const sizeNeedle = preselectedSize.toLowerCase();
      for (const group of item.sizeGroups) {
        const match = group.options.find(
          (o) => o.id === preselectedSize || o.label.toLowerCase() === sizeNeedle
        );
        if (match) {
          targetSizeId = match.id;
          break;
        }
      }
    }
    if (!targetSizeId) targetSizeId = item.sizeGroups[0]?.options[0]?.id;
  }
  state.sizeQuantities = new Map(
    item.sizeGroups.flatMap((g) =>
      g.options.map((o) => [o.id, targetSizeId && o.id === targetSizeId ? initialQty : 0])
    )
  );

  // No-variant qty: sample → 1, cart → MOQ
  state.noVariantQty = item.sizeGroups.length === 0 ? initialQty : 0;

  // Tek-eksen (satır) modu: chip seçimi yok — adet satır bazında tutulur.
  // Toptanda ilk uygun satır MOQ ile tohumlanır (mevcut drawer semantiği),
  // numunede tüm satırlar 0'dan başlar (toplam en fazla 1).
  const singleAxis = getSingleAxis();
  state.rowQuantities = new Map();
  if (singleAxis) {
    state.selectedColorId = "";
    state.noVariantQty = 0;
    let seedId: string | undefined;
    if (mode !== "sample") {
      const needle = (preselectedColor || preselectedSize || "").toLowerCase();
      const preselected = needle
        ? singleAxis.options.find(
            (o) =>
              (o.id === preselectedColor ||
                o.id === preselectedSize ||
                o.label.toLowerCase() === needle) &&
              isRowOptionAvailable(singleAxis, o)
          )
        : undefined;
      seedId = (preselected ?? singleAxis.options.find((o) => isRowOptionAvailable(singleAxis, o)))
        ?.id;
    }
    for (const opt of singleAxis.options) {
      state.rowQuantities.set(opt.id, opt.id === seedId ? initialQty : 0);
    }
    // Çerçeveli (seçili) satır = önizlemedeki satır; tohumlanan satırla başlar.
    const seedIndex = seedId ? singleAxis.options.findIndex((o) => o.id === seedId) : -1;
    state.previewColorIndex = seedIndex >= 0 ? seedIndex : 0;
  }

  const heading = document.getElementById("shared-cart-heading");
  if (heading) {
    heading.textContent =
      mode === "sample" ? t("cart.sampleVariations") : t("cart.selectVariation");
  }

  // Drawer başka bir ürün/mod ile açılıyor — önceki üründen kalan değerler
  // yanlış yönde flash tetiklemesin.
  resetMoneyFlows("cart:");

  rerenderDrawer();
  applyDrawerTransform(true);
}

// ─── Event binding ────────────────────────────────────────────────────────────

function bindShippingEvents(): void {
  if (shippingInitialized) return;
  shippingInitialized = true;

  const modal = document.getElementById("shared-cart-shipping-modal");
  const closeBtn = document.getElementById("shared-cart-shipping-close");
  const options = document.getElementById("shared-cart-shipping-options");
  const applyBtn = document.getElementById("shared-cart-shipping-apply");
  if (!modal || !closeBtn || !options || !applyBtn) return;

  closeBtn.addEventListener("click", () => setShippingModalOpen(false));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) setShippingModalOpen(false);
  });

  options.addEventListener("click", (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-shipping-option-index]");
    if (!row) return;
    const idx = Number(row.dataset.shippingOptionIndex ?? 0);
    state.selectedShippingIndex = Number.isNaN(idx) ? 0 : idx;
    updateShippingModal();
  });

  applyBtn.addEventListener("click", () => {
    if (!state.item) return;

    const selected = state.item.shippingOptions[state.selectedShippingIndex];
    if (selected) {
      document.dispatchEvent(
        new CustomEvent("shipping-change", {
          detail: {
            index: state.selectedShippingIndex,
            method: selected.method,
            estimatedDays: selected.estimatedDays,
            costStr: selected.costText,
            cost: selected.cost,
          },
        })
      );
    }

    setShippingModalOpen(false);
    // Gövde de çizilir ki sevkiyat kartı seçilen servisi göstersin
    rerenderDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("opacity-0")) {
      setShippingModalOpen(false);
    }
  });
}

// ─── Public HTML template ─────────────────────────────────────────────────────

export function SharedCartDrawer(): string {
  return `
    <div id="shared-cart-overlay" class="fixed inset-0 z-[110] bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300 ease-out motion-reduce:transition-none">
      <div id="shared-cart-preview" class="hidden fixed start-0 top-0 bottom-0 end-[600px] z-[120] items-center justify-center px-8 pointer-events-none">
        <div class="relative w-full max-w-[760px] h-[78vh] rounded-md overflow-hidden pointer-events-auto shadow-xl bg-surface">
          <button type="button" id="shared-cart-preview-prev" class="absolute start-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-secondary-700 border border-border-default shadow-md z-20">‹</button>
          <div id="shared-cart-preview-image" class="w-full h-full flex items-center justify-center px-20 pt-8 pb-16"></div>
          <button type="button" id="shared-cart-preview-next" class="absolute end-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-secondary-700 border border-border-default shadow-md z-20">›</button>
          <div id="shared-cart-preview-label" class="absolute start-0 end-0 bottom-0 px-6 py-4 text-white text-xl font-medium bg-gradient-to-t from-black/60 to-transparent">color : -</div>
        </div>
      </div>

      <aside id="shared-cart-drawer" class="fixed end-0 top-0 h-full w-full sm:w-[500px] lg:w-[600px] max-w-full bg-surface shadow-[-8px_0_30px_rgba(0,0,0,0.18)] xl:rounded-s-md xl:border-s xl:border-border-default flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0 max-md:px-4 max-md:py-3">
          <h3 id="shared-cart-heading" class="text-[15px] sm:text-lg font-bold text-text-heading">${t("cart.selectVariation")}</h3>
          <button type="button" id="shared-cart-close" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-secondary-400 hover:text-secondary-900 hover:bg-surface-raised transition-colors inline-flex items-center justify-center shrink-0" aria-label="${t("common.close")}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 sm:w-[18px] sm:h-[18px]"><path d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div id="shared-cart-body" class="flex-1 overflow-y-auto px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3"></div>
        <div id="shared-cart-footer" class="shrink-0 border-t border-border-default bg-surface px-6 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:pt-4 sm:pb-5 max-md:px-4"></div>
      </aside>
    </div>
  `;
}

export function SharedShippingModal(): string {
  return `
    <div id="shared-cart-shipping-modal" class="fixed inset-0 z-[210] bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300 ease-out motion-reduce:transition-none flex items-end md:items-center justify-center">
      <div id="shared-cart-shipping-sheet" class="w-full md:w-[min(92vw,760px)] bg-surface rounded-t-md md:rounded-md border border-border-default shadow-xl p-4 sm:p-6 translate-y-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none motion-reduce:translate-y-0 max-h-[90vh] md:max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between">
          <h4 class="text-[15px] sm:text-[20px] sm:leading-[26px] font-bold tracking-tight text-[#222]">${t("cart.selectShipping")}</h4>
          <button type="button" id="shared-cart-shipping-close" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-secondary-400 hover:text-secondary-900 hover:bg-surface-raised transition-colors inline-flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 sm:w-[18px] sm:h-[18px]"><path d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Referans: 14px / lh 1.5 / 400 / #333; vurgulu parçalar 600 -->
        <p class="mt-2.5 sm:mt-4 text-[13px] sm:text-[14px] sm:leading-[1.5] font-normal text-[#333]">${t("cart.shippingTo")}: <strong class="font-semibold">${t("countries.TR")}</strong> · ${t("cart.shippingQty")}: <strong class="font-semibold" id="shared-cart-shipping-qty">1 ${state.item?.unit ?? "pc"}</strong></p>
        <div id="shared-cart-shipping-options" class="mt-3 sm:mt-5 space-y-2 sm:space-y-3 flex-1 overflow-y-auto min-h-0"></div>

        <button type="button" id="shared-cart-shipping-apply" class="mt-3 sm:mt-6 w-full th-btn-dark h-11 sm:h-12 text-[13px] sm:text-[14px] shrink-0">${t("common.apply")}</button>
      </div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSharedCartDrawer(items: CartDrawerItemModel[]): void {
  productsById = new Map(items.map((item) => [item.id, item]));

  const { overlay, drawer, body, footer } = getDrawerElements();
  if (!overlay || !drawer || !body || !footer) return;

  bindShippingEvents();

  if (initialized) return;
  initialized = true;

  const closeBtn = document.getElementById("shared-cart-close");
  const previewPrev = document.getElementById("shared-cart-preview-prev");
  const previewNext = document.getElementById("shared-cart-preview-next");

  applyDrawerTransform(false);

  closeBtn?.addEventListener("click", () => applyDrawerTransform(false));

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) applyDrawerTransform(false);
  });

  // Global triggers (data-add-to-cart / data-order-sample)
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    const cartTrigger = target.closest<HTMLElement>("[data-add-to-cart]");
    if (cartTrigger) {
      const id = cartTrigger.dataset.addToCart;
      if (id && productsById.has(id)) {
        event.preventDefault();
        openDrawer(id, "cart");
      } else if (id && onItemMissing) {
        event.preventDefault();
        onItemMissing(id, "cart");
      }
      return;
    }

    const sampleTrigger = target.closest<HTMLElement>("[data-order-sample]");
    if (sampleTrigger) {
      const id = sampleTrigger.dataset.orderSample;
      if (id && productsById.has(id)) {
        event.preventDefault();
        openDrawer(id, "sample");
      } else if (id && onItemMissing) {
        event.preventDefault();
        onItemMissing(id, "sample");
      }
      return;
    }
  });

  // Body click events
  body.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    // Tek-eksen satır stepper'ı (renk/beden/malzeme satır listesi)
    const rowBtn = target.closest<HTMLElement>("[data-row-qty-action]");
    const rowAxis = getSingleAxis();
    if (rowBtn && rowAxis && state.item) {
      const optionId = rowBtn.dataset.rowQtyId ?? "";
      const option = findRowOption(rowAxis, optionId);
      if (!option) return;

      // Adet değiştirilen satır aynı zamanda seçili satır olur (çerçeve + önizleme).
      const optionIndex = rowAxis.options.indexOf(option);
      if (optionIndex >= 0) state.previewColorIndex = optionIndex;

      const current = state.rowQuantities.get(optionId) ?? 0;
      const moq = Math.max(1, state.item.moq || 1);
      const step = state.mode !== "sample" && state.item.sellInMoqMultiples ? moq : 1;

      if (rowBtn.dataset.rowQtyAction === "plus") {
        if (state.mode === "sample") {
          if (getTotalQty() >= 1) {
            showSampleMaxToast();
            return;
          }
          state.rowQuantities.set(optionId, current + 1);
        } else {
          const next = current + step;
          const stock = getRowOptionStock(rowAxis, option);
          if (stock >= 0 && next > stock) {
            showCartError(t("cart.stockError"));
            return;
          }
          state.rowQuantities.set(optionId, next);
        }
      } else if (state.mode === "sample") {
        state.rowQuantities.set(optionId, Math.max(0, current - 1));
      } else {
        // MOQ toplam üzerinden korunur: diğer satırlar MOQ'yu karşılıyorsa
        // bu satır 0'a inebilir.
        const othersSum = Array.from(state.rowQuantities.entries())
          .filter(([id]) => id !== optionId)
          .reduce((acc, [, q]) => acc + q, 0);
        const minForThis = Math.max(0, moq - othersSum);
        state.rowQuantities.set(optionId, Math.max(minForThis, current - step));
      }

      rerenderDrawer();
      return;
    }

    // Satıra tıklayınca o satır seçilir: görselde çerçeve + soldaki önizleme
    const rowEl = target.closest<HTMLElement>("[data-row-option-index]");
    if (rowEl && rowAxis) {
      const idx = Number(rowEl.dataset.rowOptionIndex ?? 0);
      if (!Number.isNaN(idx) && idx !== state.previewColorIndex) {
        state.previewColorIndex = idx;
        rerenderDrawer();
      }
      return;
    }

    // Color chip selection
    const colorChip = target.closest<HTMLElement>("[data-color-chip]");
    if (colorChip && state.item) {
      const colorId = colorChip.dataset.colorChip ?? "";
      const colorIndex = state.item.colors.findIndex((c) => c.id === colorId);
      state.selectedColorId = colorId;
      if (colorIndex >= 0) {
        state.previewColorIndex = colorIndex;
      }
      // Reset quantities for sizes that are now unavailable with the new color
      if (state.item.skuMatrix && state.item.skuMatrix.length > 0) {
        for (const group of state.item.sizeGroups) {
          for (const opt of group.options) {
            if (!isSizeAvailable(opt.label)) {
              state.sizeQuantities.set(opt.id, 0);
            }
          }
        }
      }
      rerenderDrawer();
      return;
    }

    // Selectable chip selection (e.g. Malzeme)
    const selectableChip = target.closest<HTMLElement>("[data-selectable-chip]");
    if (selectableChip && state.item) {
      const axisName = selectableChip.dataset.selectableChip ?? "";
      const value = selectableChip.dataset.selectableValue ?? "";
      state.selectedSelectables.set(axisName, value);
      // Reset quantities for sizes that are now unavailable
      if (state.item.skuMatrix && state.item.skuMatrix.length > 0) {
        for (const group of state.item.sizeGroups) {
          for (const opt of group.options) {
            if (!isSizeAvailable(opt.label)) {
              state.sizeQuantities.set(opt.id, 0);
            }
          }
        }
      }
      rerenderDrawer();
      return;
    }

    // Size / no-variant qty buttons
    const qtyBtn = target.closest<HTMLElement>("[data-qty-action]");
    if (qtyBtn) {
      const action = qtyBtn.dataset.qtyAction;
      const sizeId = qtyBtn.dataset.qtySize ?? "";
      const isNoVariant = sizeId === "__no_variant__";

      const current = isNoVariant ? state.noVariantQty : (state.sizeQuantities.get(sizeId) ?? 0);

      const moq = Math.max(1, state.item?.moq || 1);
      const step = state.mode !== "sample" && state.item?.sellInMoqMultiples ? moq : 1;

      if (action === "plus") {
        if (state.mode === "sample") {
          const totalQty = getTotalQty();
          if (totalQty >= 1) {
            showSampleMaxToast();
            return;
          }
        }
        // Enforce stock limit for the size
        const next = current + step;
        if (!isNoVariant && state.item?.skuMatrix && state.item.skuMatrix.length > 0) {
          const sizeLabel = findSizeLabelById(sizeId);
          if (sizeLabel) {
            const stock = getSizeStock(sizeLabel);
            if (stock >= 0 && next > stock) {
              showCartError(t("cart.stockError"));
              return;
            }
          }
        }
        if (isNoVariant) state.noVariantQty = next;
        else state.sizeQuantities.set(sizeId, next);
      }

      if (action === "minus") {
        if (state.mode === "sample") {
          const next = Math.max(0, current - 1);
          if (isNoVariant) state.noVariantQty = next;
          else state.sizeQuantities.set(sizeId, next);
        } else {
          if (isNoVariant) {
            state.noVariantQty = Math.max(moq, current - step);
          } else {
            const othersSum = Array.from(state.sizeQuantities.entries())
              .filter(([id]) => id !== sizeId)
              .reduce((a, [, b]) => a + b, 0);
            const minForThis = Math.max(0, moq - othersSum);
            state.sizeQuantities.set(sizeId, Math.max(minForThis, current - step));
          }
        }
      }

      rerenderDrawer();
      return;
    }

    if (target.closest("[data-shipping-change]")) {
      openSharedShippingModal();
    }
  });

  // Body change events (qty inputs)
  body.addEventListener("change", (event) => {
    const rowInput = (event.target as HTMLElement).closest<HTMLInputElement>(
      "[data-row-qty-input]"
    );
    const rowAxis = getSingleAxis();
    if (rowInput && rowAxis && state.item) {
      const optionId = rowInput.dataset.rowQtyInput ?? "";
      const option = findRowOption(rowAxis, optionId);
      if (!option) return;

      let next = Number(rowInput.value);
      if (Number.isNaN(next) || next < 0) next = 0;

      const moq = Math.max(1, state.item.moq || 1);
      const othersSum = Array.from(state.rowQuantities.entries())
        .filter(([id]) => id !== optionId)
        .reduce((acc, q) => acc + q[1], 0);

      if (state.mode === "sample") {
        if (othersSum + next > 1) {
          next = Math.max(0, 1 - othersSum);
          showSampleMaxToast();
        }
      } else {
        next = Math.max(Math.max(0, moq - othersSum), next);
        if (state.item.sellInMoqMultiples && moq > 1 && next > 0 && next % moq !== 0) {
          next = Math.ceil(next / moq) * moq;
        }
        const stock = getRowOptionStock(rowAxis, option);
        if (stock >= 0 && next > stock) {
          next = stock;
          showCartError(t("cart.stockError"));
        }
      }

      rowInput.value = String(next);
      state.rowQuantities.set(optionId, next);
      rerenderDrawer();
      return;
    }

    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-qty-input-size]");
    if (!input) return;

    const sizeId = input.dataset.qtyInputSize ?? "";
    const isNoVariant = sizeId === "__no_variant__";
    let nextValue = Number(input.value);
    if (Number.isNaN(nextValue) || nextValue < 0) nextValue = 0;

    const moq = Math.max(1, state.item?.moq || 1);
    if (state.mode !== "sample") {
      if (isNoVariant) {
        nextValue = Math.max(moq, nextValue);
      } else {
        const othersSum = Array.from(state.sizeQuantities.entries())
          .filter(([id]) => id !== sizeId)
          .reduce((a, [, b]) => a + b, 0);
        const minForThis = Math.max(0, moq - othersSum);
        nextValue = Math.max(minForThis, nextValue);
      }
      // MOQ katlarıyla satış aktifse yukarı yuvarla
      if (state.item?.sellInMoqMultiples && moq > 1 && nextValue > 0 && nextValue % moq !== 0) {
        nextValue = Math.ceil(nextValue / moq) * moq;
      }
      // Enforce stock limit
      if (!isNoVariant && state.item?.skuMatrix && state.item.skuMatrix.length > 0) {
        const sizeLabel = findSizeLabelById(sizeId);
        if (sizeLabel) {
          const stock = getSizeStock(sizeLabel);
          if (stock >= 0 && nextValue > stock) {
            nextValue = stock;
            showCartError(t("cart.stockError"));
          }
        }
      }
      input.value = String(nextValue);
    }

    if (state.mode === "sample") {
      const othersTotal = isNoVariant
        ? 0
        : Array.from(state.sizeQuantities.entries())
            .filter(([id]) => id !== sizeId)
            .reduce((a, [, b]) => a + b, 0);
      if (othersTotal + nextValue > 1) {
        nextValue = Math.max(0, 1 - othersTotal);
        input.value = String(nextValue);
        showSampleMaxToast();
      }
    }

    if (isNoVariant) {
      state.noVariantQty = nextValue;
    } else {
      state.sizeQuantities.set(sizeId, nextValue);
    }
    rerenderDrawer();
  });

  // Footer events
  footer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.closest("#shared-cart-footer-toggle")) {
      state.footerExpanded = !state.footerExpanded;
      renderDrawerFooter();
      return;
    }

    if (target.closest("#shared-cart-confirm")) {
      const totals = getTotals();
      // Satır modunda satırlar 0'a inebildiği için MOQ altı toplam da uyarılır.
      const moq = Math.max(1, state.item?.moq || 1);
      const belowMoq = state.mode !== "sample" && getSingleAxis() !== null && totals.totalQty < moq;

      if (totals.totalQty <= 0 || belowMoq) {
        const confirmBtn = document.getElementById("shared-cart-confirm");
        if (!confirmBtn) return;

        const originalText = confirmBtn.textContent;
        confirmBtn.textContent =
          totals.totalQty <= 0
            ? t("cart.pleaseSelectQty")
            : t("product.optionsMinOrderHint", { moq, unit: state.item?.unit ?? "" });
        confirmBtn.classList.add("bg-error-500");

        setTimeout(() => {
          confirmBtn.textContent = originalText;
          confirmBtn.classList.remove("bg-error-500");
        }, 1400);
        return;
      }

      // Numune onayı da sepete-ekleme akışına girer (toptan ile aynı sepete farklı satır).
      // Backend is_sample=1 ile snapshot fiyatını sample_price olarak yazar; aynı listing için
      // ikinci numune girişimini reddeder. Onay sonrası her iki mode da sadece drawer kapanır.
      dispatchCartAdd().then((success) => {
        if (!success) return;
        applyDrawerTransform(false);
      });
    }
  });

  // Preview navigation
  // Satır modunda tek bir "seçili renk" yoktur; önizleme gezinmesi yalnız
  // görseli değiştirir, fiyat/sepet state'ine dokunmaz.
  const stepPreview = (delta: number): void => {
    if (!state.item || state.item.colors.length === 0) return;
    const count = state.item.colors.length;
    state.previewColorIndex = (state.previewColorIndex + delta + count) % count;
    if (!getSingleAxis()) {
      state.selectedColorId =
        state.item.colors[state.previewColorIndex]?.id ?? state.selectedColorId;
    }
    updatePreview();
  };

  previewPrev?.addEventListener("click", () => stepPreview(-1));
  previewNext?.addEventListener("click", () => stepPreview(1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.classList.contains("opacity-0")) {
      applyDrawerTransform(false);
    }
  });

  window.addEventListener("resize", () => {
    if (!overlay.classList.contains("opacity-0")) {
      applyDrawerTransform(true);
    }
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function openSharedCartDrawer(
  itemId?: string,
  mode: "cart" | "sample" = "cart",
  preselectedColor?: string,
  preselectedSize?: string
): void {
  openDrawer(itemId, mode, preselectedColor, preselectedSize);
}

export function setOnItemMissing(
  cb: ((id: string, mode: "cart" | "sample") => Promise<void>) | null
): void {
  onItemMissing = cb;
}

export function setSharedCartItems(items: CartDrawerItemModel[]): void {
  productsById = new Map(items.map((item) => [item.id, item]));
}

export function initSharedShippingModal(): void {
  bindShippingEvents();
}

export function openSharedShippingModal(quantity?: number): void {
  if (!state.item) {
    const fallback = Array.from(productsById.values())[0];
    if (!fallback) return;
    state.item = fallback;
    state.selectedShippingIndex = 0;
    state.previewColorIndex = 0;
    state.footerExpanded = false;
    state.selectedColorId = fallback.colors[0]?.id ?? "";
    const fallbackMoq = Math.max(1, fallback.moq || 1);
    const fallbackFirstId = fallback.sizeGroups[0]?.options[0]?.id;
    state.sizeQuantities = new Map(
      fallback.sizeGroups.flatMap((g) =>
        g.options.map((o) => [o.id, o.id === fallbackFirstId ? fallbackMoq : 0])
      )
    );
    state.noVariantQty = fallbackMoq;
    const fallbackAxis = getSingleAxis();
    state.rowQuantities = new Map();
    if (fallbackAxis) {
      state.selectedColorId = "";
      state.noVariantQty = 0;
      const seedId = fallbackAxis.options[0]?.id;
      for (const opt of fallbackAxis.options) {
        state.rowQuantities.set(opt.id, opt.id === seedId ? fallbackMoq : 0);
      }
    }
  }
  // Kargo verisi girilmemişse modal boş açılırdı (sadece "Uygula" butonu görünürdü).
  // Bu durumda ürün/sepet kartındaki "görüşülecektir" metni tek doğru gösterim.
  if (!hasSelectableShipping(state.item)) return;
  updateShippingModal(quantity);
  setShippingModalOpen(true);
}
