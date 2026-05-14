/**
 * ProductTitleBar Component
 * Full-width section above the product hero grid (iSTOC-style).
 * Contains: product title (h1), rating/review/order line, supplier company bar.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { getCountryCode, getCountryFlag } from "../../utils/country";
import { renderStars } from "./ProductReviews";

function ratingLineHtml(): string {
  const p = getCurrentProduct();
  return `
        <div class="flex items-center gap-1">
          ${renderStars(p.rating)}
        </div>
        <span class="font-semibold text-[var(--pd-title-color,#222222)]">${p.rating ? Number(p.rating).toFixed(p.rating % 1 === 0 ? 0 : 1) : "0"}</span>
        <button
          type="button"
          id="pd-review-count-link"
          class="cursor-pointer hover:underline bg-transparent border-0 p-0 text-[13px] text-[var(--pd-rating-text-color,#6b7280)]"
        >${t("product.reviewsLabel", { count: String(p.reviewCount) })}</button>
        <span class="text-[var(--pd-rating-text-color,#d1d5db)]">·</span>
        <span class="text-[var(--pd-rating-text-color,#6b7280)]">${t("product.ordersLabel", { count: String(p.orderCount) })}</span>
  `;
}

/** "X yorum" tıklamasında Yorumlar tab'ını aç + bölümü scroll'a getir. */
function scrollToReviewsTab(): void {
  // Alpine'ın `Alpine.$data(el)` API'si ile #product-tabs-section üzerindeki
  // activeTab state'ini "reviews"'a çek. Alpine yüklü değilse sessizce geç.
  const section = document.getElementById("product-tabs-section");
  if (!section) return;
  const AlpineGlobal = (
    window as unknown as { Alpine?: { $data: (el: Element) => { activeTab?: string } } }
  ).Alpine;
  if (AlpineGlobal && typeof AlpineGlobal.$data === "function") {
    const data = AlpineGlobal.$data(section);
    if (data) data.activeTab = "reviews";
  }
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Reviews backend'den geldiğinde başlık satırını (yıldız + puan + yorum/sipariş
 * sayısı) yeniden render et. `loadProductReviews` summary'i frontend'de yeniden
 * hesaplıyor; bu fonksiyon DOM'a o güncel değerleri basar.
 */
export function initProductTitleBar(): void {
  const update = () => {
    const el = document.getElementById("pd-rating-line");
    if (el) el.innerHTML = ratingLineHtml();
  };
  document.addEventListener("product-reviews-loaded", update);
  window.addEventListener("review-submitted", update);

  // "X yorum" butonuna tek bir delegated click listener — innerHTML yenilense
  // bile event delegation ile çalışmaya devam eder.
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest("#pd-review-count-link")) {
      scrollToReviewsTab();
    }
  });
}

export function ProductTitleBar(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;
  const s = p.supplier;
  const brand = (p as any).brandInfo as
    | { code: string; name: string; slug: string; logo?: string }
    | null
    | undefined;

  const brandRowHtml =
    brand && brand.name
      ? `<a href="/pages/brand.html?slug=${encodeURIComponent(brand.slug)}"
          class="inline-flex items-center gap-1.5 px-2 py-1 mb-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-medium no-underline"
          style="color: var(--pd-title-color, #222222);"
          title="${brand.name}">
        ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}" class="w-4 h-4 object-contain" />` : ""}
        <span>${t("product.brandLabel", { defaultValue: "Marka" })}:</span>
        <strong>${brand.name}</strong>
      </a>`
      : "";

  return `
    <div id="pd-title-bar" class="mb-5">
      ${brandRowHtml}
      <!-- Product Title -->
      <h1 id="pd-product-title" class="text-lg font-bold leading-snug mb-1.5 line-clamp-2 break-words" style="color: var(--pd-title-color, #222222);">${p.title}</h1>

      <!-- Rating + Reviews + Orders -->
      <div id="pd-rating-line" class="flex items-center gap-2 flex-wrap text-[13px] mb-3">
        ${ratingLineHtml()}
      </div>

      <!-- Supplier Company Bar -->
      <div class="flex items-center gap-2 flex-wrap text-[13px] px-3 py-2 rounded-md min-w-0 overflow-hidden" style="background: var(--color-surface-raised, #f5f5f5); color: var(--pd-rating-text-color, #6b7280);">
        <a href="/pages/seller/seller-storefront.html?seller=${encodeURIComponent(s.id)}" class="text-[13px] font-medium hover:underline truncate max-w-[200px]" style="color: var(--pd-breadcrumb-link-color, #cc9900);">${s.name}</a>
        ${
          s.verified
            ? `
          <span class="shrink-0" style="color: #d1d5db;">·</span>
          <span class="shrink-0 inline-flex items-center gap-0.5">
            <svg class="inline-block shrink-0" width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style="color: #16a34a;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <span class="truncate">${t("product.verifiedSupplier")}</span>
          </span>
        `
            : ""
        }
        ${
          s.yearsInBusiness > 0
            ? `
          <span class="shrink-0" style="color: #d1d5db;">·</span>
          <span class="shrink-0">${t("product.yearsLabel", { count: String(s.yearsInBusiness) })}</span>
        `
            : ""
        }
        ${
          s.country
            ? `
          <span class="shrink-0" style="color: #d1d5db;">·</span>
          <span class="shrink-0">${getCountryFlag(s.country)} ${getCountryCode(s.country)}</span>
        `
            : ""
        }
      </div>
    </div>
  `;
}
