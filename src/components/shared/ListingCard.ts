/**
 * ListingCard — paylaşılan zengin ürün kartı.
 * Listeleme (products) ve En İyi Fırsatlar (top-deals) sayfaları kullanır.
 * Kart, container'daki group/grid + data-list-mode attribute'una göre
 * grid/list görünümü alır — kullanan sayfa bu container'ı sağlamak zorundadır.
 */
import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import { getBrandUrl } from "../../utils/brandUrl";
import { getSellerUrl } from "../../utils/sellerUrl";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import verifiedTickUrl from "../../assets/images/verfied.png";
import type { ProductListingCard } from "../../types/productListing";

export interface ListingCardOptions {
  /** %N indirim rozeti + üstü çizili originalPrice gösterir. Varsayılan: false. */
  showDiscount?: boolean;
  /** 1-bazlı sıra rozeti (En Çok Satanlar). Verilirse görselin sol-üst köşesine numara çipi basılır; OOS/KYB/indirim rozetleri altına kayar. */
  rank?: number;
}

/**
 * Render image slider for product card (iSTOC-style)
 * - translateX-based horizontal sliding with CSS transition
 * - group/img for hover detection on image area only
 * - Prev/next arrows + dot indicators visible on hover
 * - "${t('products.addToCompare')}" checkbox overlay on hover
 * - Camera icon at bottom-left
 */
function renderImageSlider(card: ProductListingCard): string {
  // ──────────────────────────────────────────────────────────────
  // DISABLED: Camera/visual search icon (bottom-left overlay)
  // İleride tekrar etkinleştirmek için:
  //   1) Aşağıdaki cameraIconHtml'i return template'ine ekle
  //      (compare checkbox label'ının altına)
  //
  // const cameraIconHtml = `
  //   <div
  //     class="absolute bottom-2 start-2 z-10 flex h-6 w-6 items-center justify-center rounded-full opacity-60 group-hover/img:opacity-100 transition-opacity"
  //     style="background: rgba(0,0,0,0.4); color: #ffffff;"
  //     aria-hidden="true"
  //   >
  //   </div>
  // `;
  // ──────────────────────────────────────────────────────────────

  // Build image list from available source
  const realImageSrc = card.imageSrc || "";
  const imageList: string[] = realImageSrc ? [realImageSrc] : [];
  const hasMultiple = imageList.length > 1;

  let slidesHtml: string;

  if (imageList.length > 0) {
    slidesHtml = imageList
      .map(
        (src, i) => `
      <div class="w-full h-full flex-shrink-0">
        <img src="${escapeHtml(sanitizeUrl(src))}" alt="${escapeHtml(card.name)}${i > 0 ? ` - ${i + 1}` : ""}" class="w-full h-full object-cover" decoding="async" ${i > 0 ? 'loading="lazy"' : ""} />
      </div>
    `
      )
      .join("");
  } else {
    // No image — show placeholder
    slidesHtml = `
      <div class="w-full h-full flex-shrink-0 flex items-center justify-center bg-gray-100">
        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
      </div>
    `;
  }

  const arrowsHtml = hasMultiple
    ? `
    <!-- Prev arrow -->
    <button type="button"
      class="product-slider-prev absolute start-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow-sm opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-white cursor-pointer"
      data-slider-prev="${escapeHtml(card.id)}" aria-label="Previous"
      onclick="event.preventDefault(); event.stopPropagation(); this.dispatchEvent(new CustomEvent('slider-nav', {detail:{id:this.dataset.sliderPrev,dir:-1},bubbles:true}));">
      <svg class="w-3.5 h-3.5 text-gray-700 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <!-- Next arrow -->
    <button type="button"
      class="product-slider-next absolute end-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow-sm opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-white cursor-pointer"
      data-slider-next="${escapeHtml(card.id)}" aria-label="Next"
      onclick="event.preventDefault(); event.stopPropagation(); this.dispatchEvent(new CustomEvent('slider-nav', {detail:{id:this.dataset.sliderNext,dir:1},bubbles:true}));">
      <svg class="w-3.5 h-3.5 text-gray-700 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  `
    : "";

  const dotsHtml = hasMultiple
    ? `
    <div class="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
      ${imageList.map((_, i) => `<div class="w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}" data-slider-dot="${escapeHtml(card.id)}" data-dot-index="${i}"></div>`).join("")}
    </div>
  `
    : "";

  return `
    <div class="relative aspect-square w-full flex-shrink-0 overflow-hidden group/img">
      <!-- Slides container -->
      <div class="product-slider flex w-full h-full transition-transform duration-300 ease-out"
           data-slider-id="${escapeHtml(card.id)}"
           style="transform: translateX(0%)">
        ${slidesHtml}
      </div>

      ${arrowsHtml}
      ${dotsHtml}

      <!-- Camera icon (bottom-left) - DISABLED -->
    </div>
  `;
}

/**
 * Country flag emoji lookup
 */
function countryFlag(code?: string): string {
  const flags: Record<string, string> = {
    CN: "\u{1F1E8}\u{1F1F3}",
    TR: "\u{1F1F9}\u{1F1F7}",
    IN: "\u{1F1EE}\u{1F1F3}",
    BD: "\u{1F1E7}\u{1F1E9}",
    VN: "\u{1F1FB}\u{1F1F3}",
    DE: "\u{1F1E9}\u{1F1EA}",
  };
  return code ? flags[code] || "" : "";
}

/**
 * Checkmark icon for selling point badge
 */
function checkIcon(): string {
  return `
    <svg class="w-3.5 h-3.5 shrink-0 text-[rgb(34,137,31)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `;
}

/**
 * Laurel branch for rank badge (Alibaba top-ranking style).
 * Sol dal; sağ dal -scale-x-100 ile aynalanır.
 */
function rankLaurelBranch(flip: boolean): string {
  return `<svg class="w-2.5 h-5 shrink-0${flip ? " -scale-x-100" : ""}" viewBox="0 0 12 22" fill="currentColor" aria-hidden="true">
      <ellipse cx="8.8" cy="19.6" rx="3.4" ry="1.5" transform="rotate(28 8.8 19.6)"/>
      <ellipse cx="6" cy="16" rx="3.4" ry="1.5" transform="rotate(45 6 16)"/>
      <ellipse cx="4.2" cy="11.8" rx="3.4" ry="1.5" transform="rotate(62 4.2 11.8)"/>
      <ellipse cx="3.4" cy="7.4" rx="3.2" ry="1.4" transform="rotate(78 3.4 7.4)"/>
      <ellipse cx="3.8" cy="3.2" rx="2.8" ry="1.3" transform="rotate(95 3.8 3.2)"/>
    </svg>`;
}

/** Yaprak tonu: 1 altın, 2 gümüş, 3 bronz, 4+ nötr. */
function rankLaurelTone(rank: number): string {
  if (rank === 1) return "text-[#f5a623]";
  if (rank === 2) return "text-[#a7adb8]";
  if (rank === 3) return "text-[#cd803a]";
  return "text-gray-300";
}

/**
 * Star icon for supplier rating
 */
function starIcon(): string {
  return `<svg style="width:12px;height:12px;flex-shrink:0;" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;
}

/**
 * Render a single product card (fy26 snapshot-matched design)
 */
export function renderListingCard(
  card: ProductListingCard,
  opts: ListingCardOptions = {}
): string {
  // Selling point badge
  const sellingPointText = card.sellingPoint || card.promo || "";
  const sellingPointHtml = sellingPointText
    ? `<div data-sp-slot="${escapeHtml(card.id)}" class="hidden group-data-[list-mode=list]/grid:flex items-center min-w-0 gap-1 mt-1 h-[15px] overflow-hidden text-[11px] leading-tight min-[480px]:text-xs text-[rgb(34,137,31)]">
        ${checkIcon()}
        <span class="truncate">${escapeHtml(sellingPointText)}</span>
      </div>`
    : "";
  // Grid modunda selling point / sosyal kanıt, görselin altında tam genişlik şerit (ticker).
  // "Çok satan" → amber + yıldız; diğerleri → yeşil + check. Sinyal geldiğinde
  // initListingSocialProof içeriği dönen renkli satırlarla değiştirir.
  // Selling point yokken !hidden — sinyal gelirse JS açar (sp-strip-empty).
  const sellingIsAmber = /satan/i.test(sellingPointText);
  const sellingIcon = sellingIsAmber ? starIcon() : checkIcon();
  const sellingTone = sellingIsAmber ? "text-[#A6730A]" : "text-[rgb(34,137,31)]";
  const sellingOverlayHtml = `<div data-sp-slot="${escapeHtml(card.id)}" data-sp-align="center" class="${sellingPointText ? "" : "sp-strip-empty !hidden "}hidden group-data-[list-mode=grid]/grid:flex items-center justify-center gap-1 absolute inset-x-0 bottom-0 z-20 h-[21px] min-[480px]:h-6 px-2 overflow-hidden bg-white/95 border-t border-gray-100 text-[9.5px] min-[480px]:text-[10.5px] font-bold whitespace-nowrap ${sellingTone} pointer-events-none">${sellingIcon}<span class="truncate">${escapeHtml(sellingPointText)}</span></div>`;

  // MOQ
  const moqHtml = card.moq
    ? `<div class="text-[11px] leading-tight min-[480px]:text-sm min-[480px]:leading-[18px] font-normal text-gray-900">${t("products.minOrder", { moq: card.moq })}</div>`
    : "";

  // Supplier name
  const supplierNameHtml = card.supplierName
    ? `<a class="hidden min-[480px]:block text-xs font-normal text-[#767676] no-underline whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">${escapeHtml(card.supplierName)}</a>`
    : "";

  // Marka: chip yerine Trendyol tarzı başlık içi kalın isim + mavi tik.
  // Ayrı <a> — ürün linkinin İÇİNE konamaz (nested anchor geçersiz HTML);
  // hover'da yalnız alt çizgi (layout shift yok). Tıklayınca satıcı mağazasına
  // (/magaza/<supplierSlug>) gider; slug henüz gelmiyorsa marka sayfasına düşer.
  const brandHref = card.supplierSlug
    ? getSellerUrl({ slug: card.supplierSlug })
    : getBrandUrl({ slug: card.brandSlug });
  const brandInlineHtml = card.brandName
    ? `<a href="${escapeHtml(sanitizeUrl(brandHref))}" title="${escapeHtml(card.brandName)}" class="font-semibold text-gray-900 no-underline hover:underline">${escapeHtml(card.brandName)}<img src="${verifiedTickUrl}" alt="" class="inline-block w-3.5 h-3.5 align-[-2.5px] ms-0.5" /></a> `
    : "";

  // Supplier info: year, country, rating
  const yearCountryParts: string[] = [];
  if (card.supplierYears)
    yearCountryParts.push(
      `<span>${t("products.yearLabel", { count: String(card.supplierYears) })}</span>`
    );
  if (card.supplierCountry)
    yearCountryParts.push(
      `${countryFlag(card.supplierCountry)} <span>${escapeHtml(card.supplierCountry)}</span>`
    );

  const yearCountryHtml =
    yearCountryParts.length > 0
      ? `<a class="text-xs font-normal text-black no-underline">${yearCountryParts.join(" ")}</a>`
      : "";

  const ratingHtml = card.rating
    ? `<span class="text-xs font-normal text-gray-900 leading-4"><span>${card.rating}</span>/5.0${card.reviewCount ? ` <span>(${card.reviewCount.toLocaleString()})</span>` : ""}</span>`
    : "";

  const supplierInfoParts = [yearCountryHtml, ratingHtml].filter(Boolean);
  const supplierContentHtml =
    card.supplierYears || card.supplierCountry || card.rating
      ? `<div class="hidden min-[480px]:flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] min-[480px]:text-xs font-normal leading-4 text-black mt-0.5">
        ${starIcon()}
        ${supplierInfoParts.join("")}
      </div>`
      : "";

  const isOOS = !!card.outOfStock;
  // Sprint 2.6: KYB unverified seller — fiyatı gizle + sepete ekle disable + amber badge.
  // OOS önceliği KYB'den yüksek (envanter bilgisi her zaman gösterilmeli).
  const kybBlocked = card.sellerKybVerified === false;
  // Sıra rozeti sol-üst köşeyi alır; durum rozetleri (OOS/KYB/indirim) altına iner
  // ki iki rozet aynı anda okunabilir kalsın.
  const hasRank = Number.isFinite(opts.rank) && (opts.rank as number) > 0;
  const statusBadgePos = hasRank ? "top-8 start-2" : "top-2 start-2";
  const rankBadgeHtml = hasRank
    ? `<div class="absolute top-2 start-2 z-20 flex items-center pointer-events-none ${rankLaurelTone(opts.rank as number)}" aria-label="Rank ${opts.rank}">
        ${rankLaurelBranch(false)}
        <span class="text-[13px] leading-none font-extrabold ${(opts.rank as number) <= 3 ? "text-gray-900" : "text-gray-500"} px-px">#${opts.rank}</span>
        ${rankLaurelBranch(true)}
      </div>`
    : "";
  const oosBadgeHtml = isOOS
    ? `<div class="absolute ${statusBadgePos} z-20 px-2 py-1 rounded-md bg-red-600 text-white text-[11px] font-semibold shadow-sm pointer-events-none">${t("products.outOfStock")}</div>`
    : "";
  const oosOverlayHtml = isOOS
    ? `<div class="absolute inset-0 z-10 bg-white/40 pointer-events-none"></div>`
    : "";
  // KYB rozeti start'ta (OOS ile aynı anda görünmez) — top-end köşesi favori kalbine ayrıldı.
  const kybBadgeHtml =
    kybBlocked && !isOOS
      ? `<div class="absolute ${statusBadgePos} z-20 px-2 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-semibold shadow-sm pointer-events-none max-w-[60%] truncate" title="${t("common.kybGateBannerTitle")}">${t("common.kybGateBannerTitle")}</div>`
      : "";
  // İndirim rozeti sol-üst köşeyi OOS/KYB rozetleriyle paylaşır —
  // öncelik OOS > KYB > indirim (envanter/uyarı bilgisi kampanyadan önce gelir).
  const discountPercent =
    card.discountPercentage ?? parseInt(card.discount?.match(/(\d+)/)?.[1] ?? "", 10);
  const showDiscountBadge =
    !!opts.showDiscount &&
    !isOOS &&
    !kybBlocked &&
    Number.isFinite(discountPercent) &&
    discountPercent > 0;
  const discountBadgeHtml = showDiscountBadge
    ? `<div class="absolute ${statusBadgePos} z-20 px-2 py-1 rounded-md bg-red-500 text-white text-[11px] font-bold shadow-sm pointer-events-none">%${discountPercent}</div>`
    : "";
  // Eski fiyat ayrı satırda — fiyat div'i whitespace-nowrap olduğu için içine
  // eklemek dar kartta taşırırdı (scale-resilience: taşmaya dayanıklı tasarım).
  const oldPriceHtml =
    showDiscountBadge && card.originalPrice
      ? `<div class="text-xs font-normal text-gray-400 line-through leading-tight mt-0.5">${escapeHtml(card.originalPrice)}</div>`
      : "";
  const addToCartBtnHtml = isOOS
    ? `<button type="button" class="searchx-product-e-abutton flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium whitespace-nowrap rounded-md bg-gray-200 text-gray-500 cursor-not-allowed
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8"
              disabled aria-disabled="true">
        ${t("products.outOfStock")}
      </button>`
    : kybBlocked
      ? `<button type="button" class="searchx-product-e-abutton th-btn flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium whitespace-nowrap opacity-50 !cursor-not-allowed pointer-events-none
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8"
              disabled aria-disabled="true" title="${t("common.addToCartDisabledKyb")}">
        ${t("products.addToCart")}
      </button>`
      : `<button type="button" class="searchx-product-e-abutton th-btn flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8"
              data-add-to-cart="${escapeHtml(card.id)}">
        ${t("products.addToCart")}
      </button>`;

  const escapeAttr = (s: string): string => escapeHtml(s);
  const moqDigits = card.moq?.match(/\d+/)?.[0] ?? "1";

  // Favori kalbi — görselin sağ-üst köşesi (Trendyol deseni). Ürün <a>'sının
  // İÇİNE konamaz (interactive-in-anchor geçersiz) → görsel wrapper'ına absolute
  // kardeş. List modunda dar görselde (76px) küçülür. Davranış:
  // initListingFavorites.ts (body delegation, data-fav-btn).
  const favBtnHtml = `<button type="button"
              data-fav-btn="${escapeAttr(card.id)}"
              data-product-title="${escapeAttr(card.name)}"
              data-product-price="${escapeAttr(card.price)}"
              data-product-thumb="${escapeAttr(card.imageSrc ?? "")}"
              data-product-min-order="${escapeAttr(card.moq ?? "")}"
              class="th-no-press absolute top-2 end-2 z-30 w-8 h-8 flex items-center justify-center rounded-full border-0 bg-white/95 shadow-sm cursor-pointer text-gray-500 hover:text-red-500
              max-sm:group-data-[list-mode=list]/grid:top-1 max-sm:group-data-[list-mode=list]/grid:end-1 max-sm:group-data-[list-mode=list]/grid:w-6 max-sm:group-data-[list-mode=list]/grid:h-6"
              aria-label="${t("product.addToFavorites")}">
        <svg class="w-[18px] h-[18px] pointer-events-none max-sm:group-data-[list-mode=list]/grid:w-3.5 max-sm:group-data-[list-mode=list]/grid:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z"/></svg>
      </button>`;
  // data-seller-id olmazsa chat popup satıcıyı çözemez ve inbox'taki İLK
  // konuşmaya düşer (yanlış satıcı!) — supplierSlug = Admin Seller Profile
  // docname'i, backend start_or_get_thread/can_chat bunu resolve ediyor.
  // Üç buton varyantı aynı seti paylaşır; drift bu bug'ı yeniden doğurur.
  const chatTriggerAttrs = `data-chat-trigger
              data-seller-id="${escapeAttr(card.supplierSlug ?? "")}"
              data-product-id="${escapeAttr(card.id)}"
              data-product-title="${escapeAttr(card.name)}"
              data-product-price="${escapeAttr(card.price)}"
              data-product-thumb="${escapeAttr(card.imageSrc ?? "")}"
              data-product-min-order="${escapeAttr(moqDigits)}"`;
  const chatBtnHtml = `<button type="button"
              ${chatTriggerAttrs}
              class="th-btn-outline searchx-product-e-chatbutton flex-1 flex items-center justify-center h-9 text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap
              min-[1200px]:group-data-[list-mode=list]/grid:flex-none
              min-[1200px]:group-data-[list-mode=list]/grid:w-full
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:px-2
              lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        ${t("chat.chatWithSeller")}
      </button>`;

  // ── Yoğun (mobil list) görünüm — sadece <480px list modunda görünür, ≥480px list ve grid modunda gizli ──
  // Kompakt meta satırı: ★ rating · ülke · Min. {moq}  (referans: Alibaba dense list)
  const denseMetaParts: string[] = [];
  if (card.rating) {
    const reviewBit = card.reviewCount
      ? `<span class="text-gray-400">(${card.reviewCount.toLocaleString()})</span>`
      : "";
    denseMetaParts.push(
      `<span class="inline-flex items-center gap-0.5">${starIcon()}<span class="font-medium text-gray-700">${card.rating}</span>${reviewBit}</span>`
    );
  }
  if (card.moq)
    denseMetaParts.push(`<span class="whitespace-nowrap">Min. ${escapeHtml(card.moq)}</span>`);
  const denseMetaHtml = denseMetaParts.length
    ? `<div class="flex min-[480px]:hidden items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] leading-tight text-gray-500">${denseMetaParts.join(`<span class="text-gray-300">·</span>`)}</div>`
    : "";

  // Sağ kolon: küçük chat butonu (outline) + yuvarlak sepete ekle butonu (sarı), dikey yığılı.
  const plusIcon = `<svg class="w-5 h-5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
  const denseAddCls = "shrink-0 flex items-center justify-center !w-10 !h-10 !p-0 rounded-full";
  const denseAddBtnHtml = isOOS
    ? `<button type="button" class="${denseAddCls} bg-gray-200 text-gray-400 cursor-not-allowed" disabled aria-disabled="true" aria-label="${t("products.outOfStock")}">${plusIcon}</button>`
    : kybBlocked
      ? `<button type="button" class="${denseAddCls} th-btn opacity-50 !cursor-not-allowed pointer-events-none" disabled aria-disabled="true" aria-label="${t("products.addToCart")}" title="${t("common.addToCartDisabledKyb")}">${plusIcon}</button>`
      : `<button type="button" class="${denseAddCls} th-btn" data-add-to-cart="${escapeHtml(card.id)}" aria-label="${t("products.addToCart")}">${plusIcon}</button>`;
  const denseChatBtnHtml = `<button type="button" ${chatTriggerAttrs}
        class="th-btn-outline shrink-0 flex items-center justify-center !w-10 !h-10 !p-0 rounded-full" aria-label="${t("chat.chatWithSeller")}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>`;
  const denseActionsHtml = `<div class="hidden group-data-[list-mode=list]/grid:flex min-[480px]:group-data-[list-mode=list]/grid:!hidden flex-col items-center gap-2 col-start-3 row-start-1 self-center pl-1">
      ${denseChatBtnHtml}
      ${denseAddBtnHtml}
    </div>`;

  // ── Grid 2'li (mobil <480) aksiyon satırı: geniş "Sepete ekle" (sepet ikonlu) + küçük yuvarlak chat ──
  // Sepet ikonu sadece ≥400px'de görünür — 320px dar kartta "Sepete ekle" metnine yer açar (okunabilirlik).
  const cartIcon = `<span class="hidden min-[400px]:inline-flex shrink-0"><svg class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H5"/></svg></span>`;
  const gridAddCls =
    "flex-1 min-w-0 flex items-center justify-center gap-1 h-8 rounded-md !px-1 text-[11px] font-semibold whitespace-nowrap";
  const gridAddBtnHtml = isOOS
    ? `<button type="button" class="${gridAddCls} bg-gray-200 text-gray-500 cursor-not-allowed" disabled aria-disabled="true">${t("products.outOfStock")}</button>`
    : kybBlocked
      ? `<button type="button" class="${gridAddCls} th-btn opacity-50 !cursor-not-allowed pointer-events-none" disabled aria-disabled="true" title="${t("common.kybGateBannerTitle")}">${cartIcon}<span class="truncate">${t("products.addToCart")}</span></button>`
      : `<button type="button" class="${gridAddCls} th-btn" data-add-to-cart="${escapeHtml(card.id)}">${cartIcon}<span class="truncate">${t("products.addToCart")}</span></button>`;
  const gridChatBtnHtml = `<button type="button" ${chatTriggerAttrs}
        class="th-btn-outline shrink-0 flex items-center justify-center !w-8 !h-8 !p-0 rounded-md" aria-label="${t("chat.chatWithSeller")}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>`;
  const gridMobileActionsHtml = `<div class="hidden group-data-[list-mode=grid]/grid:flex min-[480px]:group-data-[list-mode=grid]/grid:hidden items-center gap-1 px-2 mt-auto pt-2.5">
      ${gridAddBtnHtml}
      ${gridChatBtnHtml}
    </div>`;

  return `
    <div class="fy26-product-card-wrapper relative isolate flex flex-col justify-between w-full rounded-md overflow-hidden bg-white pb-3 border-0
            group-data-[list-mode=grid]/grid:border group-data-[list-mode=grid]/grid:border-gray-200 group-data-[list-mode=grid]/grid:rounded-md
            min-[480px]:group-data-[list-mode=grid]/grid:border-0
            group-data-[list-mode=list]/grid:grid
            group-data-[list-mode=list]/grid:grid-cols-[76px_1fr_auto]
            group-data-[list-mode=list]/grid:grid-rows-[1fr_auto]
            group-data-[list-mode=list]/grid:gap-x-3
            group-data-[list-mode=list]/grid:gap-y-0
            group-data-[list-mode=list]/grid:p-3
            group-data-[list-mode=list]/grid:border
            group-data-[list-mode=list]/grid:border-[var(--product-card-border,#e5e7eb)]
            group-data-[list-mode=list]/grid:rounded-lg
            group-data-[list-mode=list]/grid:overflow-visible
            min-[480px]:group-data-[list-mode=list]/grid:grid-cols-[200px_1fr]
            min-[480px]:group-data-[list-mode=list]/grid:gap-x-4
            min-[1200px]:group-data-[list-mode=list]/grid:flex
            min-[1200px]:group-data-[list-mode=list]/grid:flex-row
            min-[1200px]:group-data-[list-mode=list]/grid:items-start
            min-[1200px]:group-data-[list-mode=list]/grid:gap-4">
      <!-- Image area (full-bleed, kart padding'inin dışında) + favori kalbi (bkz. favBtnHtml) -->
      <div class="searchx-img-area relative mb-3
            group-data-[list-mode=grid]/grid:mb-2
            min-[480px]:group-data-[list-mode=grid]/grid:mb-3
            group-data-[list-mode=list]/grid:row-[1/-1]
            group-data-[list-mode=list]/grid:col-start-1
            group-data-[list-mode=list]/grid:self-start
            group-data-[list-mode=list]/grid:mb-0
            group-data-[list-mode=list]/grid:w-full
            group-data-[list-mode=list]/grid:rounded-md
            group-data-[list-mode=list]/grid:border
            group-data-[list-mode=list]/grid:border-gray-200
            group-data-[list-mode=list]/grid:overflow-hidden
            min-[480px]:group-data-[list-mode=list]/grid:border-0
            min-[480px]:group-data-[list-mode=list]/grid:rounded-none
            min-[1200px]:group-data-[list-mode=list]/grid:w-60
            min-[1200px]:group-data-[list-mode=list]/grid:shrink-0">
        <a href="${escapeHtml(sanitizeUrl(card.href))}" class="block">
          ${rankBadgeHtml}${oosBadgeHtml}
          ${kybBadgeHtml}${discountBadgeHtml}
          ${oosOverlayHtml}
          ${renderImageSlider(card)}
          ${sellingOverlayHtml}
        </a>
        ${favBtnHtml}
      </div>

      <!-- Content area -->
      <div class="fy26-product-card-content flex-1 flex flex-col
            group-data-[list-mode=list]/grid:col-start-2
            group-data-[list-mode=list]/grid:row-start-1
            group-data-[list-mode=list]/grid:min-w-0
            min-[1200px]:group-data-[list-mode=list]/grid:flex-1">
        <!-- Title area -->
        <div class="px-3">
          <h2 class="searchx-product-e-title text-[13px] font-normal leading-[17px] min-h-[34px] min-[480px]:text-sm min-[480px]:leading-[20px] min-[480px]:min-h-[40px] text-[#333] overflow-hidden text-ellipsis line-clamp-2 m-0
            group-data-[list-mode=list]/grid:line-clamp-1 group-data-[list-mode=list]/grid:!min-h-0 min-[480px]:group-data-[list-mode=list]/grid:line-clamp-2
            min-[480px]:group-data-[list-mode=list]/grid:!h-auto
            min-[480px]:group-data-[list-mode=list]/grid:text-base
            min-[480px]:group-data-[list-mode=list]/grid:leading-[22px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-[13px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:leading-[17px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:h-[51px]">
            ${brandInlineHtml}<a href="${escapeHtml(sanitizeUrl(card.href))}" target="_blank" class="text-inherit no-underline hover:text-primary-500"><span>${escapeHtml(card.name)}</span></a>
          </h2>
          ${sellingPointHtml}
          ${denseMetaHtml}
        </div>

        <!-- Price area -->
        <div class="px-3 mt-2">
          ${
            kybBlocked
              ? `<div class="fy26-price text-sm font-medium leading-[20px] text-amber-800" title="${t("common.kybGateBannerTitle")}">${t("common.kybGateBannerTitle")}</div>`
              : `<div class="fy26-price text-[15px] leading-tight font-semibold text-gray-900 whitespace-nowrap min-[480px]:text-lg sm:text-xl sm:leading-[26px]
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-base
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:leading-[1.375rem]">${formatPrice(card.price)}</div>`
          }${oldPriceHtml}
          <div class="fy26-moq-stats hidden min-[480px]:flex gap-1.5 flex-wrap mt-0.5
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:leading-4
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:[&_.text-sm]:text-xs
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:[&_.text-sm]:leading-4">
            ${moqHtml}
          </div>
          ${isOOS ? `<div class="mt-1 text-xs font-medium text-red-600">${t("products.outOfStock")}</div>` : ""}
        </div>

        <!-- Supplier area -->
        <div class="px-3 mt-2">
          ${supplierNameHtml}
          ${supplierContentHtml}
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-area-layout flex group-data-[list-mode=list]/grid:hidden min-[480px]:group-data-[list-mode=list]/grid:flex group-data-[list-mode=grid]/grid:hidden min-[480px]:group-data-[list-mode=grid]/grid:flex flex-col min-[480px]:flex-row gap-2 px-3 mt-3 items-stretch min-[480px]:items-center
            group-data-[list-mode=list]/grid:col-start-2
            group-data-[list-mode=list]/grid:row-start-2
            group-data-[list-mode=list]/grid:px-0
            group-data-[list-mode=list]/grid:mt-2
            min-[1200px]:group-data-[list-mode=list]/grid:flex-col
            min-[1200px]:group-data-[list-mode=list]/grid:items-stretch
            min-[1200px]:group-data-[list-mode=list]/grid:w-[140px]
            min-[1200px]:group-data-[list-mode=list]/grid:mt-0
            min-[1200px]:group-data-[list-mode=list]/grid:shrink-0">
        ${addToCartBtnHtml}
        ${chatBtnHtml}
      </div>
      ${gridMobileActionsHtml}
      ${denseActionsHtml}
    </div>
  `;
}

/**
 * Navigate a product slider to the given index using translateX.
 * Updates the slider transform and dot indicators.
 */
function navigateSlider(sliderId: string, direction: number): void {
  const slider = document.querySelector<HTMLElement>(`[data-slider-id="${sliderId}"]`);
  if (!slider) return;

  const totalSlides = slider.children.length;
  if (totalSlides <= 1) return;

  // Parse current index from transform
  const currentTransform = slider.style.transform;
  const currentIndex = Math.abs(parseInt(currentTransform.match(/-?(\d+)/)?.[1] || "0")) / 100;

  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = totalSlides - 1;
  if (newIndex >= totalSlides) newIndex = 0;

  slider.style.transform = `translateX(-${newIndex * 100}%)`;

  // Update dots
  const dots = document.querySelectorAll<HTMLElement>(`[data-slider-dot="${sliderId}"]`);
  dots.forEach((dot, i) => {
    if (i === newIndex) {
      dot.classList.remove("bg-white/50");
      dot.classList.add("bg-white");
    } else {
      dot.classList.remove("bg-white");
      dot.classList.add("bg-white/50");
    }
  });
}

/**
 * Navigate a product slider to a specific index (for dot clicks).
 */
function navigateSliderTo(sliderId: string, targetIndex: number): void {
  const slider = document.querySelector<HTMLElement>(`[data-slider-id="${sliderId}"]`);
  if (!slider) return;

  const totalSlides = slider.children.length;
  if (totalSlides <= 1 || targetIndex < 0 || targetIndex >= totalSlides) return;

  slider.style.transform = `translateX(-${targetIndex * 100}%)`;

  // Update dots
  const dots = document.querySelectorAll<HTMLElement>(`[data-slider-dot="${sliderId}"]`);
  dots.forEach((dot, i) => {
    if (i === targetIndex) {
      dot.classList.remove("bg-white/50");
      dot.classList.add("bg-white");
    } else {
      dot.classList.remove("bg-white");
      dot.classList.add("bg-white/50");
    }
  });
}

/**
 * Initialize product image sliders.
 * Uses event delegation on document for prev/next arrows and dot clicks.
 * Prevents navigation events from following the product card link.
 */
let _slidersInitialized = false;
export function initProductSliders(): void {
  if (_slidersInitialized) return;
  _slidersInitialized = true;

  // Arrow buttons use inline onclick (stopPropagation to prevent <a> navigate)
  // and dispatch custom 'slider-nav' event that bubbles to document
  document.addEventListener("slider-nav", ((e: CustomEvent) => {
    const { id, dir } = e.detail || {};
    if (id && typeof dir === "number") navigateSlider(id, dir);
  }) as EventListener);

  // Dot clicks
  document.addEventListener("click", (e: MouseEvent) => {
    const dotEl = (e.target as HTMLElement).closest<HTMLElement>("[data-dot-index]");
    if (dotEl) {
      e.preventDefault();
      e.stopPropagation();
      const sliderId = dotEl.getAttribute("data-slider-dot");
      const dotIndex = parseInt(dotEl.getAttribute("data-dot-index") ?? "0", 10);
      if (sliderId) navigateSliderTo(sliderId, dotIndex);
    }
  });
}
