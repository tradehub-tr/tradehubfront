/**
 * OptionsSheet Component
 * Mobil ürün detay — "Seçenekler" bottom-sheet (Alibaba app deseni, iStoc sarısı).
 * Alt bardaki "Sepete Ekle" butonu bunu açar (data-pdm-sheet="pdm-sheet-options",
 * MobileLayout.ts'in mevcut generic sheet aç/kapa altyapısı kullanılır).
 *
 * Model: renk (veya renk yoksa ilk eksen) SATIR + adet stepper'ı taşır; diğer
 * eksenler (beden/malzeme) satırların ÜSTÜNDE tek-seçim chip grubu olarak durur.
 * Fiyat = toplam seçili adete göre aktif kademe (tüm satırlar aynı birim fiyatı
 * paylaşır — Alibaba app referans mock'uyla birebir).
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import { tierQtyLabel } from "./variantPrice";
import type { ProductDetail, ProductVariant, SkuMatrixEntry, VariantOption } from "../../types/product";
import { bottomSheet, closeSheet, syncPriceTiersPanel } from "./MobileLayout";
import { openMediaViewer } from "./MediaViewer";
import { chatTriggerAttrs } from "../chat-popup/chatTriggerAttrs";
import { escapeHtml, sanitizeUrl, safeHexColor } from "../../utils/sanitize";
import { isLoggedIn } from "../../utils/auth";
import { openLoginModal } from "./LoginModal";
import { submitCartLines } from "../cart/overlay/SharedCartDrawer";
import type { CartSubmitItem, CartSubmitLine } from "../cart/overlay/SharedCartDrawer";

const SHEET_ID = "pdm-sheet-options";

/* ── Model ────────────────────────────────────────────── */

interface SheetModel {
  variants: ProductVariant[];
  /** Satır olarak render edilen eksen (renk varsa renk, yoksa ilk eksen). */
  rowVariant: ProductVariant | null;
  /** Satırların üstünde tek-seçim chip grubu olarak render edilen diğer eksenler. */
  chipVariants: ProductVariant[];
  skuMatrix: SkuMatrixEntry[];
}

function buildModel(p: ProductDetail): SheetModel {
  const variants = p.variants;
  const rowVariant = variants.find((v) => v.type === "color") ?? variants[0] ?? null;
  const chipVariants = variants.filter((v) => v !== rowVariant);
  const skuMatrix = variants.find((v) => v.skuMatrix && v.skuMatrix.length > 0)?.skuMatrix ?? [];
  return { variants, rowVariant, chipVariants, skuMatrix };
}

/* ── skuMatrix axis lookup (variants[0]=axis1, [1]=axis2, [2+]=extraAxes) ── */

type AxisKey = { field: "axis1" | "axis2" | "extra"; extraName?: string };

function axisKeyFor(variants: ProductVariant[], variant: ProductVariant): AxisKey {
  const idx = variants.indexOf(variant);
  if (idx === 0) return { field: "axis1" };
  if (idx === 1) return { field: "axis2" };
  return { field: "extra", extraName: variant.label };
}

function skuValueForAxis(sku: SkuMatrixEntry, key: AxisKey): string {
  if (key.field === "axis1") return sku.axis1 || "";
  if (key.field === "axis2") return sku.axis2 || "";
  return (sku.extraAxes || {})[key.extraName!] || "";
}

function isRowAvailable(model: SheetModel, rowOpt: VariantOption): boolean {
  if (model.skuMatrix.length === 0) return true;
  const rowKey = axisKeyFor(model.variants, model.rowVariant!);
  return model.skuMatrix.some((sku) => {
    if (!sku.available) return false;
    if (skuValueForAxis(sku, rowKey) !== rowOpt.label) return false;
    for (const chip of model.chipVariants) {
      const sel = state.chipSelections.get(chip.label);
      if (!sel) continue;
      if (skuValueForAxis(sku, axisKeyFor(model.variants, chip)) !== sel) return false;
    }
    return true;
  });
}

function isChipOptionAvailable(model: SheetModel, chip: ProductVariant, optLabel: string): boolean {
  if (model.skuMatrix.length === 0) return true;
  const key = axisKeyFor(model.variants, chip);
  return model.skuMatrix.some((sku) => {
    if (!sku.available) return false;
    if (skuValueForAxis(sku, key) !== optLabel) return false;
    for (const other of model.chipVariants) {
      if (other === chip) continue;
      const sel = state.chipSelections.get(other.label);
      if (!sel) continue;
      if (skuValueForAxis(sku, axisKeyFor(model.variants, other)) !== sel) return false;
    }
    return true;
  });
}

/* ── State ────────────────────────────────────────────── */

interface SheetState {
  /** rowVariant option id → seçili adet. */
  rowQty: Map<string, number>;
  /** rowVariant yoksa tek "Adet" satırının miktarı. */
  noVariantQty: number;
  /** chipVariant.label → seçili option label. */
  chipSelections: Map<string, string>;
  breakdownOpen: boolean;
}

const state: SheetState = {
  rowQty: new Map(),
  noVariantQty: 0,
  chipSelections: new Map(),
  breakdownOpen: false,
};

function resetState(): void {
  state.rowQty = new Map();
  state.noVariantQty = 0;
  state.breakdownOpen = false;
  state.chipSelections = new Map();
  const model = buildModel(getCurrentProduct());
  for (const chip of model.chipVariants) {
    const first = chip.options.find((o) => o.available) ?? chip.options[0];
    if (first) state.chipSelections.set(chip.label, first.label);
  }
}

function resetUnavailableRowQty(model: SheetModel): void {
  if (!model.rowVariant) return;
  for (const opt of model.rowVariant.options) {
    if ((state.rowQty.get(opt.id) ?? 0) > 0 && !isRowAvailable(model, opt)) {
      state.rowQty.set(opt.id, 0);
    }
  }
}

function getTotalQty(model: SheetModel): number {
  if (model.rowVariant) return Array.from(state.rowQty.values()).reduce((a, b) => a + b, 0);
  return state.noVariantQty;
}

/** Mevcut seçim state'inin özeti — QuestionFormSheet'in "Ürün miktarı ve
 *  özellikleri" bölümünde kullanılır. Sadece adedi > 0 olan satırlar döner;
 *  hiç seçim yoksa boş dizi (çağıran taraf noSelectionYet metnini gösterir). */
export function getSelectionSummary(): Array<{ label: string; qty: number }> {
  const model = buildModel(getCurrentProduct());
  if (model.rowVariant) {
    return model.rowVariant.options
      .map((opt) => ({
        label: opt.displayLabel || opt.label,
        qty: state.rowQty.get(opt.id) ?? 0,
      }))
      .filter((row) => row.qty > 0);
  }
  return state.noVariantQty > 0 ? [{ label: t("product.quantity"), qty: state.noVariantQty }] : [];
}

function getActiveTierIndex(p: ProductDetail, total: number): number {
  for (let i = p.priceTiers.length - 1; i >= 0; i -= 1) {
    if (total >= p.priceTiers[i].minQty) return i;
  }
  return 0;
}

/* ── HTML fragments ───────────────────────────────────── */

function renderTiersHtml(p: ProductDetail, activeIdx: number, currency: string): string {
  return p.priceTiers
    .map((tier, i) => {
      const active = i === activeIdx;
      const qtyLabel = tierQtyLabel(tier);
      return `
        <div class="shrink-0 text-center min-w-[64px]">
          <div class="text-[17px] font-bold whitespace-nowrap ${active ? "text-[#b45309]" : "text-text-secondary"}">${formatCurrency(tier.price, currency)}</div>
          <div class="text-[11px] mt-0.5 whitespace-nowrap ${active ? "text-[#b45309] font-medium" : "text-text-tertiary"}">${escapeHtml(qtyLabel)}</div>
        </div>
      `;
    })
    .join("");
}

function renderChipsHtml(model: SheetModel): string {
  return model.chipVariants
    .map((chip) => {
      const selected = state.chipSelections.get(chip.label);
      const axisLabel = escapeHtml(chip.displayLabel || chip.label);
      const selectedHtml = selected
        ? `: <span class="font-normal text-text-secondary">${escapeHtml(selected)}</span>`
        : "";
      const options = chip.options
        .map((opt) => {
          const isSel = opt.label === selected;
          const available = isChipOptionAvailable(model, chip, opt.label);
          const cls = isSel
            ? "border-primary-500 bg-primary-50/40 shadow-[0_0_0_1px_var(--color-primary-500,#cc9900)]"
            : available
              ? "border-border-default bg-surface"
              : "border-border-default bg-surface opacity-40 cursor-not-allowed";
          return `
            <button type="button" data-opt-chip="${escapeHtml(chip.label)}" data-opt-chip-value="${escapeHtml(opt.label)}"
              class="px-3 py-1.5 rounded-md border text-xs font-medium text-text-heading transition-colors ${cls}"
              ${available ? "" : "disabled"}>${escapeHtml(opt.displayLabel || opt.label)}</button>
          `;
        })
        .join("");
      return `
        <div class="mb-3">
          <h5 class="text-[13px] font-semibold text-text-heading mb-1.5">${axisLabel}${selectedHtml}</h5>
          <div class="flex flex-wrap gap-2">${options}</div>
        </div>
      `;
    })
    .join("");
}

function renderRowsHtml(model: SheetModel): string {
  const rowVariant = model.rowVariant!;
  // Büyütme ikonu (mock `.vthumb .exp`) yalnızca renk satırında anlamlı —
  // beden/malzeme fallback satırında gerçek görsel yoktur (safeHexColor swatch).
  const isColorRow = rowVariant.type === "color";
  return rowVariant.options
    .map((opt, idx) => {
      const qty = state.rowQty.get(opt.id) ?? 0;
      const available = isRowAvailable(model, opt);
      const label = opt.displayLabel || opt.label;
      const thumb = opt.thumbnail
        ? `<img src="${escapeHtml(sanitizeUrl(opt.thumbnail))}" alt="${escapeHtml(label)}" width="80" height="80" decoding="async" class="w-full h-full object-cover" />`
        : `<div class="w-full h-full" style="background:${safeHexColor(opt.value)}"></div>`;
      const expandBtn = isColorRow
        ? `
          <button type="button" data-opt-expand="${idx}" aria-label="${escapeHtml(label)} ${t("aria.expand")}"
            class="th-no-press appearance-none focus:outline-none absolute top-[3px] start-[3px] w-[15px] h-[15px] rounded-[4px] bg-black/45 text-white flex items-center justify-center">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>`
        : "";
      return `
        <div class="flex items-center gap-3 py-2 border-b border-[var(--color-border-light,#f0f0f0)] last:border-b-0${available ? "" : " opacity-40"}">
          <div class="relative w-[62px] h-[62px] rounded-md overflow-hidden shrink-0 bg-surface-raised">${thumb}${expandBtn}</div>
          <span class="flex-1 min-w-0 truncate text-[14.5px] ${qty > 0 ? "font-semibold text-text-heading" : "text-text-body"}">${escapeHtml(label)}</span>
          <div class="inline-flex items-center border border-border-medium rounded-full h-10 overflow-hidden shrink-0">
            <button type="button" data-opt-dec="${escapeHtml(opt.id)}"
              class="w-[42px] h-full flex items-center justify-center text-text-secondary disabled:text-border-medium disabled:cursor-not-allowed"
              ${qty === 0 ? "disabled" : ""}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>
            </button>
            <span class="w-10 text-center text-[15px] font-semibold tabular-nums">${qty}</span>
            <button type="button" data-opt-inc="${escapeHtml(opt.id)}"
              class="w-[42px] h-full flex items-center justify-center text-text-secondary disabled:text-border-medium disabled:cursor-not-allowed"
              ${available ? "" : "disabled"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderNoVariantRowHtml(): string {
  const qty = state.noVariantQty;
  return `
    <div class="flex items-center justify-between gap-3 py-2.5">
      <span class="text-[14.5px] font-medium text-text-heading">${t("product.quantity")}</span>
      <div class="inline-flex items-center border border-border-medium rounded-full h-10 overflow-hidden shrink-0">
        <button type="button" data-opt-novariant-dec
          class="w-[42px] h-full flex items-center justify-center text-text-secondary disabled:text-border-medium disabled:cursor-not-allowed"
          ${qty === 0 ? "disabled" : ""}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
        <span class="w-10 text-center text-[15px] font-semibold tabular-nums">${qty}</span>
        <button type="button" data-opt-novariant-inc class="w-[42px] h-full flex items-center justify-center text-text-secondary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
  `;
}

function renderBreakdownHtml(model: SheetModel, p: ProductDetail, total: number, unitPrice: number, currency: string): string {
  if (total === 0) {
    return `<div class="border-t border-dashed border-border-default pt-2 pb-1 mb-1.5 flex justify-between text-xs text-text-tertiary"><span>${t("product.noSelectionYet")}</span><span>—</span></div>`;
  }
  const lines: string[] = [];
  if (model.rowVariant) {
    for (const opt of model.rowVariant.options) {
      const qty = state.rowQty.get(opt.id) ?? 0;
      if (qty <= 0) continue;
      const label = opt.displayLabel || opt.label;
      lines.push(
        `<div class="flex justify-between text-xs text-text-secondary py-0.5"><span>${escapeHtml(label)} × ${qty}</span><span>${formatCurrency(qty * unitPrice, currency)}</span></div>`
      );
    }
  }
  const totalLabel = t("product.optionsBreakdownTotal", {
    qty: total,
    unit: p.unit,
    price: formatCurrency(unitPrice, currency),
  });
  lines.push(
    `<div class="flex justify-between text-xs font-bold text-text-heading pt-1"><span>${escapeHtml(totalLabel)}</span><span>${formatCurrency(total * unitPrice, currency)}</span></div>`
  );
  return `<div class="border-t border-dashed border-border-default pt-2 pb-1 mb-1.5 space-y-0.5">${lines.join("")}</div>`;
}

/* ── Cart line builder ────────────────────────────────── */

function buildLines(model: SheetModel): CartSubmitLine[] {
  const extraAxes: Record<string, string> = {};
  for (const [axis, value] of state.chipSelections) extraAxes[axis] = value;
  const hasExtra = Object.keys(extraAxes).length > 0;

  if (!model.rowVariant) {
    return [{ qty: state.noVariantQty }];
  }

  const isColor = model.rowVariant.type === "color";
  const rowAxisLabel = model.rowVariant.displayLabel || model.rowVariant.label;

  return model.rowVariant.options.map((opt) => {
    const qty = state.rowQty.get(opt.id) ?? 0;
    const parts = [`${rowAxisLabel}: ${opt.displayLabel || opt.label}`];
    for (const chip of model.chipVariants) {
      const sel = state.chipSelections.get(chip.label);
      if (sel) parts.push(`${chip.displayLabel || chip.label}: ${sel}`);
    }
    return {
      qty,
      variantId: opt.id,
      colorId: isColor ? opt.id : undefined,
      variantLabel: parts.join(" | "),
      extraAxes: hasExtra ? extraAxes : undefined,
      imageUrl: opt.thumbnail,
    };
  });
}

/* ── Render ───────────────────────────────────────────── */

function render(): void {
  const p = getCurrentProduct();
  const model = buildModel(p);
  const total = getTotalQty(model);
  const tierIdx = getActiveTierIndex(p, total);
  const tier = p.priceTiers[tierIdx];
  const unitPrice = tier?.price ?? 0;
  const currency = getSelectedCurrency();

  const tiersEl = document.getElementById("pdm-opt-tiers");
  if (tiersEl) tiersEl.innerHTML = renderTiersHtml(p, tierIdx, currency);
  // Gövdedeki fiyat paneli (pdm-price-tiers-panel), sheet hiç açılmadıysa bile
  // ilk kademeyi aktif göstermeli — bu yüzden initOptionsSheet() ilk render()'ı
  // sheet kapalıyken de çağırır (bkz. initOptionsSheet).
  syncPriceTiersPanel(tierIdx);

  const chipsEl = document.getElementById("pdm-opt-chips");
  if (chipsEl) chipsEl.innerHTML = renderChipsHtml(model);

  const rowHeadEl = document.getElementById("pdm-opt-rowhead");
  const rowsEl = document.getElementById("pdm-opt-rows");
  if (model.rowVariant) {
    // Toplam seçenek sayısı (stok durumu satır bazında zaten görünür) —
    // stok dışı üründe "(0)" gibi kırık bir başlık üretmez.
    if (rowHeadEl) {
      rowHeadEl.textContent = `${model.rowVariant.displayLabel || model.rowVariant.label} (${model.rowVariant.options.length})`;
    }
    if (rowsEl) rowsEl.innerHTML = renderRowsHtml(model);
  } else {
    if (rowHeadEl) rowHeadEl.textContent = "";
    if (rowsEl) rowsEl.innerHTML = renderNoVariantRowHtml();
  }

  const minHintEl = document.getElementById("pdm-opt-minhint");
  if (minHintEl) {
    minHintEl.innerHTML =
      total > 0 && total < p.moq
        ? `<div class="text-xs text-[#92700c] bg-[#fff8e1] border border-[#f0e2b6] rounded-md px-2.5 py-1.5 mb-2.5">${escapeHtml(t("product.optionsMinOrderHint", { moq: p.moq, unit: p.unit }))}</div>`
        : "";
  }

  const breakdownEl = document.getElementById("pdm-opt-breakdown");
  if (breakdownEl) {
    breakdownEl.classList.toggle("hidden", !state.breakdownOpen);
    breakdownEl.innerHTML = state.breakdownOpen
      ? renderBreakdownHtml(model, p, total, unitPrice, currency)
      : "";
  }

  document.getElementById("pdm-opt-chevron")?.classList.toggle("rotate-180", state.breakdownOpen);

  const subtotalAmtEl = document.getElementById("pdm-opt-subtotal-amt");
  if (subtotalAmtEl) subtotalAmtEl.textContent = formatCurrency(total * unitPrice, currency);

  const enabled = total >= p.moq;
  const addBtn = document.getElementById("pdm-opt-add") as HTMLButtonElement | null;
  const orderBtn = document.getElementById("pdm-opt-order") as HTMLButtonElement | null;
  if (addBtn) {
    addBtn.disabled = !enabled;
    addBtn.textContent = enabled ? `${t("product.addToCart")} (${total})` : t("product.addToCart");
  }
  if (orderBtn) orderBtn.disabled = !enabled;
}

/* ── Actions ──────────────────────────────────────────── */

function currentSubmitItem(p: ProductDetail): CartSubmitItem {
  return {
    id: p.id,
    title: p.title,
    supplierName: p.supplier?.name || "",
    unit: p.unit,
    moq: p.moq,
    currency: getSelectedCurrency(),
    baseCurrency: p.baseCurrency,
  };
}

/** Seçimi sepete yazar (moq guard + kademe fiyatı + cart-add event). */
async function submitSelection(): Promise<boolean> {
  const p = getCurrentProduct();
  const model = buildModel(p);
  const total = getTotalQty(model);
  if (total < p.moq) return false;

  const tier = p.priceTiers[getActiveTierIndex(p, total)];
  const ok = await submitCartLines(
    currentSubmitItem(p),
    buildLines(model),
    tier?.price ?? 0,
    tier?.basePrice,
    false
  );
  if (ok) document.dispatchEvent(new CustomEvent("cart-add"));
  return ok;
}

async function onAddToCart(): Promise<void> {
  if (!(await submitSelection())) return;
  closeSheet(SHEET_ID);
  resetState();
  render();
}

async function submitOrderAndGoToCart(): Promise<void> {
  if (!(await submitSelection())) return;
  window.location.href = "/pages/cart.html";
}

function onOrderLoginSuccess(): void {
  // Kullanıcı login modalını sipariş vermeden kapatıp sonradan başka bir
  // yerden giriş yaparsa sürpriz sipariş oluşmasın: devam yalnızca kullanıcı
  // hâlâ Seçenekler sheet'indeyken geçerli.
  const sheetStillOpen = document
    .getElementById(SHEET_ID)
    ?.classList.contains("pdm-sheet-visible");
  if (sheetStillOpen) void submitOrderAndGoToCart();
}

function onStartOrder(): void {
  const p = getCurrentProduct();
  const model = buildModel(p);
  if (getTotalQty(model) < p.moq) return;

  if (!isLoggedIn()) {
    openLoginModal();
    window.removeEventListener("login-success", onOrderLoginSuccess);
    window.addEventListener("login-success", onOrderLoginSuccess, { once: true });
    return;
  }
  void submitOrderAndGoToCart();
}

function onStepper(optId: string, delta: number): void {
  const current = state.rowQty.get(optId) ?? 0;
  state.rowQty.set(optId, Math.max(0, current + delta));
  render();
}

function bindEvents(root: HTMLElement): void {
  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    const expand = target.closest<HTMLButtonElement>("[data-opt-expand]");
    if (expand) {
      openMediaViewer("variants", Number(expand.dataset.optExpand));
      return;
    }
    const inc = target.closest<HTMLButtonElement>("[data-opt-inc]");
    if (inc && !inc.disabled) {
      onStepper(inc.dataset.optInc!, 1);
      return;
    }
    const dec = target.closest<HTMLButtonElement>("[data-opt-dec]");
    if (dec && !dec.disabled) {
      onStepper(dec.dataset.optDec!, -1);
      return;
    }
    if (target.closest<HTMLButtonElement>("[data-opt-novariant-inc]")) {
      state.noVariantQty += 1;
      render();
      return;
    }
    const noVariantDec = target.closest<HTMLButtonElement>("[data-opt-novariant-dec]");
    if (noVariantDec && !noVariantDec.disabled) {
      state.noVariantQty = Math.max(0, state.noVariantQty - 1);
      render();
      return;
    }
    const chip = target.closest<HTMLButtonElement>("[data-opt-chip]");
    if (chip && !chip.disabled) {
      const model = buildModel(getCurrentProduct());
      state.chipSelections.set(chip.dataset.optChip!, chip.dataset.optChipValue!);
      resetUnavailableRowQty(model);
      render();
      return;
    }
    if (target.closest("#pdm-opt-subtotal-btn")) {
      state.breakdownOpen = !state.breakdownOpen;
      render();
    }
  });

  document.getElementById("pdm-opt-add")?.addEventListener("click", onAddToCart);
  document.getElementById("pdm-opt-order")?.addEventListener("click", onStartOrder);
}

/* ── Public HTML ──────────────────────────────────────── */

export function OptionsSheet(): string {
  const p = getCurrentProduct();

  const heroSrc = p.images?.[0]?.src;
  const heroHtml = heroSrc
    ? `<img src="${escapeHtml(sanitizeUrl(heroSrc))}" alt="${escapeHtml(p.title)}" width="80" height="80" decoding="async" class="w-full h-full object-cover" />`
    : `<div class="w-full h-full flex items-center justify-center text-text-tertiary">
        <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      </div>`;

  const chatBtn = `
    <button type="button" id="pdm-opt-chat" ${chatTriggerAttrs(p)}
      class="th-no-press w-11 h-11 rounded-full border border-border-medium bg-surface flex items-center justify-center shrink-0 text-text-body"
      aria-label="${t("prodUi.chat")}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
  `;

  const bodyHtml = `
    <div class="flex gap-3 pb-3.5 border-b border-border-default">
      <div class="w-[84px] h-[84px] rounded-md overflow-hidden shrink-0 bg-surface-raised">${heroHtml}</div>
      <div id="pdm-opt-tiers" class="flex-1 min-w-0 overflow-x-auto flex gap-5 items-start pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"></div>
    </div>
    <div id="pdm-opt-chips"></div>
    <div id="pdm-opt-rowhead" class="text-[15px] font-bold text-text-heading pt-3.5 pb-1"></div>
    <div id="pdm-opt-rows"></div>
    <div class="h-1"></div>
    <div class="sticky bottom-0 -mx-4 px-4 pt-3 pb-1 bg-[var(--color-surface,#fff)] border-t border-border-default" id="pdm-opt-footer">
      <div id="pdm-opt-minhint"></div>
      <div id="pdm-opt-breakdown" class="hidden"></div>
      <button type="button" id="pdm-opt-subtotal-btn" class="th-no-press appearance-none w-full flex items-center gap-2 pb-2.5 text-start focus:outline-none">
        <span class="text-[13px] text-text-secondary flex-1">${t("cart.subtotalExTax")}</span>
        <span id="pdm-opt-subtotal-amt" class="text-[17px] font-bold text-text-heading tabular-nums"></span>
        <svg id="pdm-opt-chevron" class="shrink-0 transition-transform duration-200 text-text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
      </button>
      <div class="flex items-center gap-2 pb-3">
        ${chatBtn}
        <button type="button" id="pdm-opt-add" class="th-btn-outline flex-1 h-11 whitespace-nowrap px-2 text-[13px]" disabled>${t("product.addToCart")}</button>
        <button type="button" id="pdm-opt-order" class="th-btn-dark flex-1 h-11 whitespace-nowrap px-2 text-[13px]" disabled>${t("product.startOrder")}</button>
      </div>
    </div>
  `;

  return bottomSheet(SHEET_ID, t("product.optionsSheetTitle"), bodyHtml);
}

export function initOptionsSheet(): void {
  const p = getCurrentProduct();
  if (p.sellerKybVerified === false) return;

  const root = document.getElementById(SHEET_ID);
  if (!root) return;

  resetState();
  bindEvents(root);
  render();
}
