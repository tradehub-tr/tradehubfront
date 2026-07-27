/**
 * ProductBuyBox — ürün detay ORTA sütunu: ürünün KİMLİĞİ.
 * Başlık, yorum/sipariş meta satırı, satıcı sertifikaları, stok uyarısı ve
 * Teknik Özellikler ızgarası.
 *
 * Satın almaya ait her şey (sekmeler, fiyat kademeleri, numune, varyant
 * seçiciler, kargo, CTA'lar) sağ sütundaki ProductOrderPanel'de toplanır —
 * orası sayfa kaydırılırken sabit kalan panel olduğu için karar verdirten
 * öğelerin hepsi orada durur.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { renderStars, formatScore } from "./ProductReviews";
import { escapeHtml } from "../../utils/sanitize";

/** Bölümler arası ince yatay ayraç — referans düzenin ritmini veren öğe. */
export const SECTION_DIVIDER = `<hr class="my-5 border-0 border-t border-[var(--color-border-default,#e5e5e5)]" />`;

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
          class="th-no-press cursor-pointer hover:underline bg-transparent border-0 p-0 text-[15px] text-[var(--pd-rating-text-color,#6b7280)]"
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
      <span class="inline-flex items-center gap-1 rounded-[3px] bg-[#eff6ff] px-2 py-[3px] text-sm text-[#1e40af]">
        <svg class="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
        ${escapeHtml(cert)}
      </span>`
    )
    .join("");

  return `<div id="pd-certifications" class="mt-2 flex flex-wrap items-center gap-1.5">${chips}</div>`;
}

/**
 * Teknik Özellikler ızgarası — referansta bilgi sütununun son bölümü.
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

  return `
    <div id="pd-buy-box" class="flex flex-col overflow-hidden rounded-md border border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)]">
      <div class="px-5 pt-5 pb-6">
      <h1 id="pd-product-title" class="text-2xl font-bold leading-[1.35] tracking-[-0.015em] text-balance break-words text-[var(--pd-title-color,#111827)]">${escapeHtml(p.title)}</h1>
      <div id="pd-rating-line" class="mt-2.5 flex items-center gap-3 flex-wrap text-[15px] text-[var(--pd-rating-text-color,#6b7280)]">
        ${ratingLineHtml()}
      </div>

      ${certificationsHtml()}

      <!-- Stok rozeti — yalnızca stok YOKKEN görünür; stok varken alan boş kalır.
           Varyant seçicileri sağ panelde ama rozet burada: updateReadyBadge
           onu id ile document genelinde bulur, sütun ayrımı görünmez. -->
      <span id="pd-ready-badge" class="th-badge is-out-of-stock ${p.outOfStock ? "inline-flex" : "hidden"} items-center self-start mt-2 px-2 py-[3px] text-sm font-medium border border-[#dc2626] rounded-[3px] text-[#dc2626] bg-[#fef2f2]">${t("cart.outOfStock")}</span>

      ${keyAttributesHtml()}
      </div>
    </div>
  `;
}

/**
 * Orta sütunun etkileşimleri — yalnız kimlik bilgisiyle ilgili olanlar:
 * - Reviews backend'den geldiğinde puan satırını yeniden render et
 *   (`loadProductReviews` summary'i frontend'de yeniden hesaplıyor).
 * - "X yorum" tıklaması Yorumlar bölümüne götürür.
 *
 * Varyant/fiyat etkileşimleri sağ paneldedir (initProductOrderPanel).
 */
export function initProductBuyBox(options: { signal?: AbortSignal } = {}): void {
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
