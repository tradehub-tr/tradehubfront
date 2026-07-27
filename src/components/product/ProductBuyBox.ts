/**
 * ProductBuyBox — ürün detay ORTA sütunu.
 * Kart sekmeleri, başlık, puan/sipariş satırı, stok rozeti, fiyat kademeleri,
 * varyant seçiciler. Kargo / CTA'lar sağ sütundaki ProductOrderPanel'de durur.
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

/** Bölümler arası ince yatay ayraç — referans düzenin ritmini veren öğe. */
const SECTION_DIVIDER = `<hr class="my-5 border-0 border-t border-[var(--color-border-default,#e5e5e5)]" />`;

/**
 * Başlık altındaki meta satırı: yorum durumu │ sipariş sayısı.
 * Yorum yokken de #pd-review-count-link basılır — tıklanınca Yorumlar
 * bölümüne götürür, böylece ilk yorumu yazmak isteyen kullanıcı oraya ulaşır.
 */
function ratingLineHtml(): string {
  const p = getCurrentProduct();
  const hasReviews = p.reviewCount > 0;
  const linkText = hasReviews
    ? t("product.reviewsLabel", { count: String(p.reviewCount) })
    : t("product.noReviewsYet");

  const stars = hasReviews
    ? `<span class="flex items-center gap-0.5">${renderStars(p.rating)}</span>
       <span class="font-semibold text-[var(--pd-title-color,#111827)]">${formatScore(p.rating)}</span>`
    : "";

  // orderCount backend'den string gelir ("0" olabilir) — sıfırsa satırı kirletme.
  const orderCountNum = Number.parseInt(p.orderCount, 10);
  const orders =
    Number.isFinite(orderCountNum) && orderCountNum > 0
      ? `<span class="w-px h-3.5 bg-[var(--color-border-default,#e5e5e5)]" aria-hidden="true"></span>
         <span>${t("product.ordersLabel", { count: String(p.orderCount) })}</span>`
      : "";

  return `
        ${stars}
        <button
          type="button"
          id="pd-review-count-link"
          class="th-no-press cursor-pointer hover:underline bg-transparent border-0 p-0 text-sm text-[var(--pd-rating-text-color,#6b7280)]"
        >${linkText}</button>
        ${orders}
  `;
}

/**
 * Teknik Özellikler ızgarası — referansta orta sütunun son bölümü.
 * Gri kutu, 3 sütun, sütunlar arasında dikey ayraç; etiket üstte soluk,
 * değer altta kalın. İlk 6 özellik; tamamı detay sekmelerinde duruyor.
 */
function keyAttributesHtml(): string {
  const specs = (getCurrentProduct().specs ?? []).slice(0, 6);
  if (specs.length === 0) return "";

  const cells = specs
    .map(
      (spec) => `
      <div class="min-w-0 px-4 [&:nth-child(3n+1)]:ps-0 [&:nth-child(3n)]:border-e-0 border-e border-[var(--color-border-default,#e5e5e5)]">
        <div class="text-[13px] leading-snug text-[var(--color-text-tertiary,#737373)] break-words">${escapeHtml(spec.key)}</div>
        <div class="mt-1 text-[15px] font-bold leading-snug text-[var(--pd-title-color,#111827)] break-words">${escapeHtml(spec.value)}</div>
      </div>`
    )
    .join("");

  return `
    ${SECTION_DIVIDER}
    <h2 class="text-base font-bold text-[var(--pd-title-color,#111827)]">${t("product.keyAttributes")}</h2>
    <div id="pd-key-attributes" class="mt-3.5 grid grid-cols-3 gap-y-6 rounded-md bg-[var(--color-surface-raised,#f5f5f5)] p-4">
      ${cells}
    </div>
  `;
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
  const activePriceColor = campaignActive
    ? "[.pd-price-tier.active_&]:text-[#cc0000]"
    : "";

  return `
    <div id="pd-price-tiers" class="grid grid-cols-3 gap-x-6 gap-y-4">
      ${tiers
        .map((tier, i) => {
          const hasDiscount =
            typeof tier.originalPrice === "number" && tier.originalPrice > tier.price;
          const strikethrough = hasDiscount
            ? `<span class="pd-price-tier-original block line-through text-[13px] leading-tight text-[var(--color-text-tertiary,#9ca3af)] mt-1">${formatCurrency(tier.originalPrice!, getSelectedCurrency())}</span>`
            : "";
          return `
          <div class="pd-price-tier flex flex-col p-0 cursor-default min-w-0 ${i === 0 ? "active" : ""}" data-tier-index="${i}">
            <span class="pd-price-tier-price text-[26px] font-bold leading-[1.15] break-words text-[var(--color-text-heading,#111827)] ${activePriceColor}">${formatCurrency(tier.price, getSelectedCurrency())}</span>
            ${strikethrough}
            <span class="pd-price-tier-qty mt-1.5 text-sm leading-snug text-[var(--color-text-muted,#666)] break-words">${tierQtyLabel(tier)}</span>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

/**
 * Varyant ekseni başlığı — referansta her eksen kendi başlığını taşır ve
 * yalnız ilkinin sağında seçim butonu durur.
 * Seçili değer `.variant-selected-label` içinde kalır: tıklamada güncellenen
 * ve testlerin dayandığı düğüm budur.
 */
function variantHeaderHtml(
  variant: ProductVariant,
  selectedLabel: string,
  withSelectButton: boolean
): string {
  const selectButton = withSelectButton
    ? `<button type="button" data-open-selection class="pd-select-now shrink-0 cursor-pointer whitespace-nowrap px-4 py-1.5 text-[13px] font-medium border-[length:var(--btn-outline-border-width)] border-[var(--btn-outline-border-color)] rounded-[var(--radius-button)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-text)] transition-[background,color,border-color] duration-150 hover:bg-[var(--btn-outline-hover-bg,var(--btn-outline-bg))] hover:text-[var(--btn-outline-hover-text,var(--btn-outline-text))]">${t("product.makeSelection")}</button>`
    : "";

  return `
        <div class="flex items-center justify-between gap-3">
          <h3 class="pd-variant-label min-w-0 text-base font-bold text-[var(--pd-title-color,#111827)]">
            ${variant.displayLabel || variant.label}<span class="ms-1.5 font-normal text-sm text-[var(--color-text-muted,#666)] variant-selected-label">${selectedLabel}</span>
          </h3>
          ${selectButton}
        </div>`;
}

function renderVariant(
  variant: ProductVariant,
  allVariants: ProductVariant[],
  index = 0
): string {
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
              class="variant-option pd-color-thumb w-16 h-16 p-0.5 border border-[var(--color-border-default,#e5e5e5)] rounded-md overflow-hidden cursor-pointer bg-[var(--color-surface,#fff)] transition-[border-color,box-shadow] duration-150 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:block [&_img]:rounded-[3px] [&.active]:border-2 [&.active]:border-[var(--pd-title-color,#111827)] [&.active]:p-[3px] [&:hover:not(.active):not(.pd-color-thumb-disabled)]:border-[#999] [&.pd-color-thumb-disabled]:opacity-40 [&.pd-color-thumb-disabled]:cursor-not-allowed ${isActive ? "active" : ""} ${opt.available ? "" : "pd-color-thumb-disabled"}"
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
            class="variant-option pd-variant-btn min-w-[52px] px-4 py-2.5 rounded-md text-sm font-medium border border-[var(--color-border-medium,#d1d5db)] bg-[var(--color-surface-raised,#f5f5f5)] text-[var(--pd-title-color,#111827)] cursor-pointer transition-[border-color,color] duration-150 [&.active]:border-2 [&.active]:border-[var(--pd-title-color,#111827)] [&.active]:px-[15px] [&.active]:py-[9px] [&.active]:font-semibold [&:hover:not(.active):not(:disabled)]:border-[#999] ${isActive ? "active" : ""} ${isAvailable ? "" : "opacity-40 line-through cursor-not-allowed"}"
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

export function ProductBuyBox(): string {
  const p = getCurrentProduct();

  return `
    <div id="pd-buy-box" class="flex flex-col overflow-hidden rounded-md border border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)]">
      <!-- Sekme şeridi kartın tepesinde; aktif sekme beyaz zemin + üst vurgu
           çizgisiyle içerikle birleşir. Genişliği yarımla sınırlı ki ikinci
           sekme (Özelleştirme) geldiğinde düzen kaymasın. -->
      <div id="pd-card-tabs" class="flex p-0 bg-[var(--color-surface-raised,#f5f5f5)] border-b border-[var(--color-border-default,#e5e5e5)]">
        <button type="button" class="pd-card-tab th-no-press flex-1 max-w-[50%] px-4 py-3.5 text-[15px] font-semibold text-center bg-transparent border-0 border-t-[3px] border-t-transparent cursor-pointer text-[var(--color-text-muted,#666)] relative transition-[background,color] duration-150 [&:not(:first-child)]:border-s [&:not(:first-child)]:border-s-[var(--color-border-default,#e5e5e5)] [&.active]:text-[var(--color-text-primary)] [&.active]:font-bold [&.active]:bg-[var(--color-surface,#fff)] [&.active]:border-t-[var(--pd-tab-active-border,#cc9900)] active">${t("product.wholesaleSales")}</button>
      </div>

      <div class="px-5 pt-5 pb-6">
      <h1 id="pd-product-title" class="text-[22px] font-bold leading-[1.35] tracking-[-0.015em] text-balance break-words text-[var(--pd-title-color,#111827)]">${escapeHtml(p.title)}</h1>
      <div id="pd-rating-line" class="mt-2 flex items-center gap-3 flex-wrap text-sm text-[var(--pd-rating-text-color,#6b7280)]">
        ${ratingLineHtml()}
      </div>

      <!-- Ready to Ship Badge — varyant seçimine tepki verdiği için seçicilerle
           aynı sütunda durur (variantMatrix.updateReadyBadge id ile bulur).
           Referansta uyumluluk rozetinin durduğu konum: meta satırının altı. -->
      <span id="pd-ready-badge" class="th-badge inline-flex items-center self-start mt-2 px-2 py-[3px] text-[13px] font-medium border border-[#16a34a] rounded-[3px] text-[#16a34a] bg-[#f0fdf4] [&.is-out-of-stock]:border-[#dc2626] [&.is-out-of-stock]:text-[#dc2626] [&.is-out-of-stock]:bg-[#fef2f2]">${t("product.readyToShip")}</span>

      ${SECTION_DIVIDER}

      <div class="flex flex-col">
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
        <!-- İndirim rozeti + fiyat kademeleri -->
        ${discountBadgeHtml(p.priceTiers)}
        ${renderPriceTiers(p.priceTiers)}

        <!-- Sample Price -->
        ${
          p.samplePrice
            ? `
        <div id="pd-sample-price" class="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 rounded-md" style="background: var(--color-surface-raised, #f5f5f5);">
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
      </div>

      <!-- Varyant eksenleri — her biri kendi başlığını taşır, seçim butonu
           yalnız ilkinin sağında durur (referans düzen). -->
      ${
        p.variants.length > 0
          ? `
      ${SECTION_DIVIDER}
      <div id="pd-variations-section">
        ${p.variants.map((v, i) => renderVariant(v, p.variants, i)).join("")}
      </div>
      `
          : ""
      }

      ${keyAttributesHtml()}
      </div>
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
  // Card tab switching (Toptan Satış / Özelleştirme)
  const cardTabs = document.querySelectorAll<HTMLButtonElement>(".pd-card-tab");
  cardTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      cardTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    }, options);
  });

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

  // "Seçim yap" butonu → sepet çekmecesini aç. Eskiden bir <a href="#"> idi;
  // referans düzende varyant başlığının sağında outline butona dönüştü.
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
}
