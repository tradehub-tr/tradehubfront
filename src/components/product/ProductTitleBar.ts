/**
 * ProductTitleBar Component
 * Center column of the product hero grid.
 * Contains: product title (h1). Rating/review/order line markup
 * (`ratingLineHtml`) is kept here for `initProductTitleBar`'s update
 * listeners; it will be mounted into the center column (ProductBuyBox)
 * in a later phase.
 */

import { getCurrentProduct } from "../../alpine/product";
import { escapeHtml } from "../../utils/sanitize";
import { t } from "../../i18n";
import { renderStars, formatScore } from "./ProductReviews";

function ratingLineHtml(): string {
  const p = getCurrentProduct();
  const score = formatScore(p.rating);
  return `
        <span class="flex items-center gap-0.5">${renderStars(p.rating)}</span>
        <span class="font-semibold text-[var(--pd-title-color,#111827)]">${score}</span>
        <span class="text-gray-300">·</span>
        <button
          type="button"
          id="pd-review-count-link"
          class="cursor-pointer hover:underline bg-transparent border-0 p-0 text-[13px] text-[var(--pd-rating-text-color,#6b7280)]"
        >${t("product.reviewsLabel", { count: String(p.reviewCount) })}</button>
        <span class="text-gray-300">·</span>
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
export function initProductTitleBar(options: { signal?: AbortSignal } = {}): void {
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

export function ProductTitleBar(): string {
  const p = getCurrentProduct();
  return `
    <div id="pd-title-bar" class="mb-4">
      <h1 id="pd-product-title" class="text-2xl font-bold leading-snug tracking-[-0.015em] text-balance break-words text-[var(--pd-title-color,#111827)]">${escapeHtml(p.title)}</h1>
    </div>
  `;
}
