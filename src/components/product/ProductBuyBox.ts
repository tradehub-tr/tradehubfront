/**
 * ProductBuyBox — ürün detay ORTA sütunu: referans düzenin sekmeli
 * "Toptan satış" kartı. Başlık, yorum meta satırı, satıcı sertifikaları,
 * fiyat kademeleri, numune şeridi, varyant eksenleri ve Teknik Özellikler
 * tek kartta toplanır.
 *
 * Sağ sütun (ProductOrderPanel) yalnız kargo, sosyal kanıt ve CTA'ları taşır —
 * sayfa kaydırılırken sabit kalan panel olduğu için aksiyon öğeleri orada durur.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import type { PriceTier, ProductVariant } from "../../types/product";
import { openCartDrawer } from "./CartDrawer";
import { renderStars, formatScore } from "./ProductReviews";
import { crossDisableVariants, isOptionAvailableForColor } from "./variantMatrix";
import { applyVariantPrice, tierQtyLabel } from "./variantPrice";
import { escapeHtml } from "../../utils/sanitize";

/** Bölümler arası ince yatay ayraç — referans düzenin ritmini veren öğe (16px). */
export const SECTION_DIVIDER = `<hr class="my-4 border-0 border-t border-[var(--color-border-default,#e5e5e5)]" />`;

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
      ? `<span class="w-px h-[11px] bg-[#ddd]" aria-hidden="true"></span>
         <span>${t("product.ordersLabel", { count: String(p.orderCount) })}</span>`
      : "";

  return `
        ${stars}
        <button
          type="button"
          id="pd-review-count-link"
          class="th-no-press cursor-pointer ${hasReviews ? "underline" : "hover:underline"} bg-transparent border-0 p-0 text-[14px] text-[#222] hover:opacity-70 transition-opacity duration-150"
        >${linkText}</button>
        ${orders}
  `;
}

/**
 * Satıcının doğrulanmış sertifikaları — referansta uyumluluk rozetinin
 * (RoHS compliant) durduğu konum: meta satırının hemen altı.
 * Backend yalnız verification_status='Verified' ve süresi geçmemiş
 * sertifikaları döndürür (listing.py), yani burada basılan her rozet doğrulanmıştır.
 * Sertifika yoksa satır hiç basılmaz — boş alan bırakılmaz.
 */
function certificationsHtml(): string {
  const certs = (getCurrentProduct().supplier?.certifications ?? []).filter(Boolean).slice(0, 4);
  if (certs.length === 0) return "";

  const chips = certs
    .map(
      (cert) => `
      <span class="inline-flex items-center gap-1 rounded-[2px] bg-[#E7F4FF] px-1 h-4 text-[14px] leading-[16px] text-[#222]">
        ${escapeHtml(cert)}
        <svg class="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
      </span>`
    )
    .join("");

  return `<div id="pd-certifications" class="mt-[6px] flex flex-wrap items-center gap-1.5">${chips}</div>`;
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
  return `<span class="pd-discount-badge inline-flex items-center self-start mb-[6px] px-1 h-4 rounded-[2px] text-[12px] leading-[16px] font-normal text-white bg-[#cc0000]">-${percent}%</span>`;
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
            ? `<span class="pd-price-tier-original block line-through font-normal text-[14px] leading-[18px] text-[var(--color-text-muted,#666)] mt-1">${formatCurrency(tier.originalPrice!, getSelectedCurrency())}</span>`
            : "";
          return `
          <div class="pd-price-tier flex flex-col p-0 cursor-default min-w-0 ${i === 0 ? "active" : ""}" data-tier-index="${i}">
            <span class="pd-price-tier-price text-[20px] min-[1280px]:text-[26px] font-bold leading-[1.2] break-words text-[var(--color-text-heading,#111827)] ${activePriceColor}">${formatCurrency(tier.price, getSelectedCurrency())}</span>
            ${strikethrough}
            <span class="pd-price-tier-qty mt-0.5 text-[14px] leading-[20px] text-[var(--color-text-muted,#666)] break-words">${tierQtyLabel(tier)}</span>
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
    ? `<button type="button" data-open-selection class="pd-select-now th-no-press shrink-0 cursor-pointer whitespace-nowrap inline-flex items-center h-6 px-2 text-[12px] font-semibold bg-transparent border border-[var(--pd-title-color,#111827)] rounded-full text-[var(--pd-title-color,#111827)] hover:opacity-70 transition-opacity duration-150">${t("product.makeSelection")}</button>`
    : "";

  return `
        <div class="flex items-center justify-between gap-3">
          <h3 class="pd-variant-label min-w-0 text-[16px] leading-6 font-semibold text-[var(--pd-title-color,#111827)]">
            ${variant.displayLabel || variant.label}<span class="ms-1.5 font-normal text-[14px] text-[var(--color-text-muted,#666)] variant-selected-label">${selectedLabel}</span>
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
              class="variant-option pd-color-thumb w-[60px] h-[60px] p-0.5 border border-[var(--color-border-default,#e5e5e5)] rounded-md overflow-hidden cursor-pointer bg-[var(--color-surface,#fff)] transition-[border-color,box-shadow] duration-150 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:block [&_img]:rounded-[3px] [&.active]:border-2 [&.active]:border-[var(--pd-title-color,#111827)] [&.active]:p-[3px] [&:hover:not(.active):not(.pd-color-thumb-disabled)]:border-[#999] [&.pd-color-thumb-disabled]:opacity-40 [&.pd-color-thumb-disabled]:cursor-not-allowed ${isActive ? "active" : ""} ${opt.available ? "" : "pd-color-thumb-disabled"}"
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
            class="variant-option pd-variant-btn min-w-[48px] px-3 py-2 rounded-md text-[14px] leading-[20px] border-0 bg-[var(--color-surface-raised,#f4f4f4)] text-[#222] cursor-pointer transition-[box-shadow] duration-150 [&.active]:shadow-[inset_0_0_0_1.5px_#222,inset_0_0_0_3.5px_#fff] [&:hover:not(.active):not(:disabled)]:shadow-[inset_0_0_0_1px_#999] ${isActive ? "active" : ""} ${isAvailable ? "" : "opacity-40 line-through cursor-not-allowed"}"
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
 * Teknik Özellikler ızgarası — kartın son bölümü.
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
        <div class="text-[14px] leading-[18px] text-[#222] break-words line-clamp-3">${escapeHtml(spec.key)}</div>
        <div class="mt-1 text-[16px] font-semibold leading-snug text-[var(--pd-title-color,#111827)] break-words">${escapeHtml(spec.value)}</div>
      </div>`
    )
    .join("");

  return `
    ${SECTION_DIVIDER}
    <h2 class="text-[16px] leading-[22px] font-bold text-[var(--pd-title-color,#111827)]">${t("product.keyAttributes")}</h2>
    <div id="pd-key-attributes" class="mt-3 grid grid-cols-2 min-[1280px]:grid-cols-3 gap-y-5 rounded-md bg-[var(--color-surface-raised,#f5f5f5)] p-3">
      ${cells}
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

  // Fiyat bloğu — KYB doğrulanmamış satıcıda fiyat/numune yerine uyarı banner'ı.
  const priceBlock =
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
      <div id="pd-sample-price" class="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 rounded-md" style="background: var(--color-surface-raised, #f5f5f5);">
        <div class="flex items-center gap-2 text-[14px] min-w-0" style="color: var(--color-text-primary);">
          <svg class="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
          <span class="whitespace-nowrap"><strong class="font-semibold">${t("product.samplePrice")}:</strong> ${formatCurrency(p.samplePrice, getSelectedCurrency())}</span>
        </div>
        <button type="button" data-order-sample="${p.id}" class="pd-sample-btn shrink-0 cursor-pointer whitespace-nowrap inline-flex items-center h-6 px-2 text-[12px] font-medium border-[length:var(--btn-outline-border-width)] border-[var(--btn-outline-border-color)] rounded-[var(--radius-button)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-text)] transition-[background,color,border-color] duration-150 hover:bg-[var(--btn-outline-hover-bg,var(--btn-outline-bg))] hover:text-[var(--btn-outline-hover-text,var(--btn-outline-text))]">${t("cart.orderSample")}</button>
      </div>
      `
          : ""
      }
      `;

  // Varyant eksenleri — her biri kendi başlığını taşır, seçim bağlantısı
  // yalnız ilkinin sağında durur (referans düzen).
  const variantsBlock =
    (p.variants ?? []).length > 0
      ? `
      ${SECTION_DIVIDER}
      <div id="pd-variations-section">
        ${p.variants.map((v, i) => renderVariant(v, p.variants, i)).join("")}
      </div>
      `
      : "";

  // Sekme şeridi YALNIZ özelleştirme seçeneği olan üründe basılır — referans,
  // özelleştirmesiz üründe tek "Toptan satış" sekmesini de basmıyor.
  const customOpts = p.customizationOptions ?? [];
  const tabBar =
    customOpts.length > 0
      ? `
      <div id="pd-card-tabs" class="flex w-full h-[46px] shrink-0">
        <button type="button" data-pd-tab="wholesale" class="pd-card-tab th-no-press flex-1 h-full inline-flex items-center justify-center whitespace-nowrap px-4 text-[16px] text-[#222] cursor-pointer bg-[var(--color-surface-raised,#f8f8f8)] border-0 border-b border-b-[#EAEAEA] font-normal transition-[background-color] duration-150 [&.active]:bg-[var(--color-surface,#fff)] [&.active]:border-b-0 [&.active]:border-t-[3px] [&.active]:border-t-[var(--pd-tab-active-border,#cc9900)] [&.active]:font-semibold active">${t("product.wholesaleSales")}</button>
        <button type="button" data-pd-tab="custom" class="pd-card-tab th-no-press flex-1 h-full inline-flex items-center justify-center whitespace-nowrap px-4 text-[16px] text-[#222] cursor-pointer bg-[var(--color-surface-raised,#f8f8f8)] border-0 border-b border-b-[#EAEAEA] font-normal transition-[background-color] duration-150 [&.active]:bg-[var(--color-surface,#fff)] [&.active]:border-b-0 [&.active]:border-t-[3px] [&.active]:border-t-[var(--pd-tab-active-border,#cc9900)] [&.active]:font-semibold">${t("product.customization")}</button>
      </div>`
      : "";

  const customPanel =
    customOpts.length > 0
      ? `
      <div id="pd-tab-panel-custom" class="hidden">
      ${SECTION_DIVIDER}
      <h2 class="text-[16px] leading-[22px] font-bold text-[var(--pd-title-color,#111827)]">${t("product.customizationOptions")}</h2>
      <div class="mt-3 flex flex-col gap-5 rounded-md bg-[var(--color-surface-raised,#f8f8f8)] p-3">
        ${customOpts
          .map(
            (o) => `
        <div class="flex flex-col gap-1 min-w-0">
          <span class="text-[16px] font-semibold leading-snug text-[#222] break-words">${escapeHtml(o.name)}</span>
          ${
            [o.minOrder, o.priceAddon].filter(Boolean).length > 0
              ? `<span class="text-[14px] leading-[18px] text-[var(--color-text-muted,#666)]">${[o.minOrder, o.priceAddon].filter(Boolean).map(escapeHtml).join(" · ")}</span>`
              : ""
          }
        </div>`
          )
          .join("")}
      </div>
      </div>`
      : "";

  return `
    <div id="pd-buy-box" class="flex flex-col overflow-hidden rounded-md border border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)]">
      ${tabBar}
      <div class="px-4 pt-4 pb-5">
      <h1 id="pd-product-title" class="text-[18px] font-semibold leading-[22px] tracking-normal break-words text-[var(--pd-title-color,#111827)]">${escapeHtml(p.title)}</h1>
      <div id="pd-rating-line" class="mt-2 flex items-center gap-2 flex-wrap text-[14px] leading-5 text-[#222]">
        ${ratingLineHtml()}
      </div>

      ${certificationsHtml()}

      <!-- Stok rozeti — yalnızca stok YOKKEN görünür; stok varken alan boş kalır.
           Rozet burada: updateReadyBadge onu id ile document genelinde bulur. -->
      <span id="pd-ready-badge" class="th-badge is-out-of-stock ${p.outOfStock ? "inline-flex" : "hidden"} items-center self-start mt-2 px-2 py-[3px] text-[14px] font-medium border border-[#dc2626] rounded-[3px] text-[#dc2626] bg-[#fef2f2]">${t("cart.outOfStock")}</span>

      <div id="pd-tab-panel-wholesale">
      ${SECTION_DIVIDER}
      <!-- Fiyat + numune + varyantlar TEK sarmalayıcıda: sağ panel sticky'ye
           geçince bu node olduğu gibi panele TAŞINIR (kopya değil — state ve
           listener'lar tek kaynakta kalır; referans davranış, bkz. video).
           Kart o anda zaten ekran dışında olduğu için boşluğu görünmez. -->
      <div id="pd-wholesale-home">
        <div id="pd-wholesale-blocks">
          ${priceBlock}
          ${variantsBlock}
        </div>
      </div>
      ${keyAttributesHtml()}
      </div>
      ${customPanel}
      </div>
    </div>
  `;
}

/**
 * Orta sütun kartının etkileşimleri:
 * - Varyant seçimi: aktif durum, etiket, fiyat, galeri/video eventi,
 *   cross-disable ve paylaşılabilir URL güncellemesi.
 * - "Seçim yap" → sepet çekmecesi.
 * - Reviews yüklendiğinde puan satırı yeniden render; "X yorum" → Yorumlar.
 */
export function initProductBuyBox(options: { signal?: AbortSignal } = {}): void {
  // Kart sekmeleri (Toptan Satış / Özelleştirme) — yalnız özelleştirmeli üründe
  // basılır. Başlık/rating sabit kalır; alt içerik panelleri değişir.
  const cardTabs = document.querySelectorAll<HTMLButtonElement>(".pd-card-tab");
  cardTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      cardTabs.forEach((other) => other.classList.toggle("active", other === tab));
      const key = tab.dataset.pdTab;
      document.getElementById("pd-tab-panel-wholesale")?.classList.toggle("hidden", key !== "wholesale");
      document.getElementById("pd-tab-panel-custom")?.classList.toggle("hidden", key !== "custom");
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

  // "Seçim yap" → sepet çekmecesini aç.
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

  // Reviews backend'den geldiğinde puan satırını yeniden render et
  // (`loadProductReviews` summary'i frontend'de yeniden hesaplıyor).
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
}
