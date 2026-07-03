/**
 * ProductTitleBar Component
 * Full-width section above the product hero grid (iSTOC-style).
 * Contains: product title (h1), rating/review/order line, supplier company bar.
 */

import { getCurrentProduct } from "../../alpine/product";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { t } from "../../i18n";
import { getCountryCode } from "../../utils/country";
import { getFlagSvg } from "../../utils/flags";
import { getBrandUrl } from "../../utils/brandUrl";
import { getSellerUrl } from "../../utils/sellerUrl";
import { renderStars } from "./ProductReviews";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";

function ratingLineHtml(): string {
  const p = getCurrentProduct();
  const score = p.rating ? Number(p.rating).toFixed(p.rating % 1 === 0 ? 0 : 1) : "0";
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
  const p = getCurrentProduct();
  return `
    <div id="pd-title-bar" class="mb-4">
      <h1 id="pd-product-title" class="text-2xl font-bold leading-snug tracking-[-0.015em] text-balance break-words text-[var(--pd-title-color,#111827)]">${escapeHtml(p.title)}</h1>
    </div>
  `;
}

/**
 * SellerTrustCard — galerinin ALTINDA yatay satıcı güven şeridi.
 * İçerik: satıcı kimliği + rating + marka + güven sinyalleri (Variant B, yatay).
 * Rating (#pd-rating-line) initProductTitleBar tarafından reviews yüklenince
 * yeniden render edilir; #pd-review-count-link Yorumlar sekmesine götürür.
 */
export function SellerTrustCard(): string {
  const p = getCurrentProduct();
  const s = p.supplier;
  const brand = p.brandInfo;

  const sellerUrl = escapeHtml(sanitizeUrl(getSellerUrl({ id: s.id })));
  const sellerInitial = escapeHtml((s.name || "?").trim().charAt(0).toUpperCase() || "?");

  // Marka — satıcı kimliğinin alt satırında (bayrağın yanında), marka sayfasına link.
  const brandSubHtml =
    brand && brand.name
      ? `<span class="text-gray-300">·</span>
         <a href="${escapeHtml(sanitizeUrl(getBrandUrl({ slug: brand.slug })))}" class="no-underline hover:underline underline-offset-2 text-[var(--color-text-tertiary,#737373)]" title="${escapeHtml(brand.name)}">${t("product.brandLabel", { defaultValue: "Marka" })}: <strong class="font-semibold text-[var(--pd-title-color,#111827)]">${escapeHtml(brand.name)}</strong></a>`
      : "";

  const chatPrice = p.priceTiers?.[0]
    ? formatCurrency(p.priceTiers[0].price, getSelectedCurrency())
    : "";

  return `
    <section id="pd-seller-strip" class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md border border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)] py-3 pl-5 pr-3">
      <!-- Satıcı kimliği -->
      <div class="flex items-center gap-3 min-w-0">
        <span class="shrink-0 w-11 h-11 rounded-md bg-gradient-to-br from-[#3b3b3b] to-[#111111] text-white text-base font-extrabold inline-flex items-center justify-center" aria-hidden="true">${sellerInitial}</span>
        <div class="min-w-0">
          <a href="${sellerUrl}" class="block truncate text-sm font-bold no-underline hover:underline underline-offset-2 text-[var(--pd-title-color,#111827)] max-w-[260px]">${escapeHtml(s.name)}</a>
          <span class="mt-0.5 flex items-center gap-1.5 flex-wrap text-xs text-[var(--color-text-tertiary,#737373)]">
            ${s.country ? `<span class="inline-flex items-center gap-1.5">${getFlagSvg(getCountryCode(s.country))}${escapeHtml(getCountryCode(s.country))}</span>` : ""}
            ${brandSubHtml}
          </span>
        </div>
      </div>

      <span class="hidden lg:block w-px h-9 bg-[var(--color-border-default,#e5e5e5)] shrink-0"></span>

      <!-- Rating + güven sinyalleri -->
      <div class="flex flex-1 min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--color-text-secondary,#525252)]">
        <div id="pd-rating-line" class="flex items-center gap-1.5 flex-wrap text-[13px] text-[var(--pd-rating-text-color,#6b7280)]">
          ${ratingLineHtml()}
        </div>
        ${
          s.verified
            ? `<span class="flex items-center gap-1.5">
                <svg class="w-[15px] h-[15px] shrink-0 text-[#16a34a]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                <span>${t("product.verifiedSupplier")}</span>
              </span>`
            : ""
        }
        <span class="flex items-center gap-1.5">
          <svg class="w-[15px] h-[15px] shrink-0 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
          <span>${t("product.orderProtection", { defaultValue: "Sipariş Koruması" })}</span>
        </span>
        ${
          s.yearsInBusiness > 0
            ? `<span class="flex items-center gap-1.5">
                <svg class="w-[15px] h-[15px] shrink-0 text-[var(--color-text-tertiary,#737373)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                <span>${t("product.yearsLabel", { count: String(s.yearsInBusiness) })} ${t("product.experienceSuffix", { defaultValue: "tecrübe" })}</span>
              </span>`
            : ""
        }
      </div>

      <!-- Aksiyonlar: mağaza + sohbet -->
      <div class="flex items-center gap-2 ml-auto shrink-0">
        <a href="${sellerUrl}" class="th-btn-outline th-btn-sm inline-flex items-center gap-1.5 whitespace-nowrap">
          <svg class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9l1-5h14l1 5M4 9v10h16V9M4 9a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0M9 19v-5h6v5"/></svg>
          ${t("product.visitStore", { defaultValue: "Mağazayı Ziyaret Et" })}
        </a>
        <button type="button"
                data-chat-trigger
                data-product-id="${escapeHtml(p.id)}"
                data-product-title="${escapeHtml(p.title || "")}"
                data-product-price="${escapeHtml(chatPrice)}"
                data-product-thumb="${escapeHtml(sanitizeUrl(p.images?.[0]?.src || ""))}"
                data-product-min-order="${p.moq ? String(p.moq) : "1"}"
                data-seller-id="${escapeHtml(s.id || "")}"
                class="th-no-press w-9 h-9 rounded-md border border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)] text-[var(--color-text-secondary,#525252)] inline-flex items-center justify-center cursor-pointer transition-[background-color] duration-150 hover:bg-[var(--color-surface-raised,#f5f5f5)]"
                aria-label="${t("chat.chatWithSeller")}">
          <svg class="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5z"/></svg>
        </button>
      </div>
    </section>
  `;
}
