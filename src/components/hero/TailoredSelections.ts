/**
 * TailoredSelections Component
 * iSTOC-style: Swiper slider with curated collection cards.
 * Each card has a title, views subtitle, two product images side by side, and prices.
 */

import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { t } from "../../i18n";
import { localizePriceString } from "../../utils/currency";
import { getTailoredSelections } from "../../services/listingService";
import { initCurrency } from "../../services/currencyService";
import { applySwiperDir } from "../../utils/direction";
import { formatViews } from "../../utils/formatCount";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

interface CollectionProduct {
  name: string;
  price: string;
  imageSrc: string;
}

interface TailoredCollection {
  title: string;
  titleKey: string;
  views: string;
  viewsCount: string | number;
  href: string;
  products: [CollectionProduct, CollectionProduct];
}

// Empty — populated from API in initTailoredSelections()
const tailoredCollections: TailoredCollection[] = [];

function renderProductImage(product: CollectionProduct): string {
  return `
    <div class="relative h-full w-full overflow-hidden rounded-md bg-white" aria-hidden="true">
      <img
        src="${escapeHtml(sanitizeUrl(product.imageSrc))}"
        alt="${escapeHtml(product.name)}"
        width="400" height="400"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-contain transition-transform duration-300 ease-out group-hover/col:scale-[1.04]"
      />
    </div>
  `;
}

const VIEWS_EYE_ICON = `<svg class="h-[13px] w-[13px] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

function renderCollectionSlide(collection: TailoredCollection): string {
  const [product1, product2] = collection.products;
  // Kategori adı: API'den gelen `title` öncelikli, yoksa i18n key
  const titleLabel = collection.title || t(collection.titleKey) || "";
  // Views count: 0 ise satırı hiç render etme
  const rawCount = collection.viewsCount;
  const countNum = typeof rawCount === "number" ? rawCount : parseInt(String(rawCount), 10) || 0;
  const formattedCount = formatViews(countNum);
  const viewsHtml =
    countNum > 0
      ? `<p class="flex items-center gap-1.5 mb-3 text-[11px] sm:text-[12px] md:text-[13px]" style="color: var(--tailored-views-color, #767676);">${VIEWS_EYE_ICON}<span class="truncate" data-i18n="tailored.views" data-i18n-options='${JSON.stringify({ count: formattedCount })}'>${t("tailored.views", { count: formattedCount })}</span></p>`
      : // Görüntüleme yoksa da aynı satır yüksekliğini rezerve et — aksi halde
        // kart bir metin satırı kadar kısalıp görselleri diğer kartlarla hizasız kalır.
        // Aynı font sınıfları + &nbsp; her kırılımda birebir aynı line-box yüksekliğini verir.
        `<p class="truncate mb-3 text-[11px] sm:text-[12px] md:text-[13px]" aria-hidden="true">&nbsp;</p>`;
  return `
    <div class="swiper-slide tailored-slide">
      <a
        href="${escapeHtml(sanitizeUrl(collection.href))}"
        class="group/col flex flex-col h-full rounded-md overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-[0_10px_28px_-14px_rgba(17,24,39,0.2)]"
        style="background: var(--tailored-card-bg, #ffffff); padding: var(--space-card-padding, 16px);"
        aria-label="${escapeHtml(titleLabel)}"
      >
        <!-- Title -->
        <h3
          class="truncate mb-0.5 font-bold leading-tight text-[14px] sm:text-[15px] md:text-[17px]"
          style="color: var(--tailored-collection-title-color, #222222);"
        >${escapeHtml(titleLabel)}</h3>

        <!-- Views subtitle -->
        ${viewsHtml}

        <!-- Product images side by side — 164x164 each -->
        <div class="flex gap-2 flex-1">
          <div class="flex-1 flex flex-col justify-center">
            <!-- overflow-hidden: flex-col içinde min-height:auto, portre görselde
                 aspect-square'i içerik yüksekliğine esnetiyor — kare kilidi için şart -->
            <div class="aspect-square w-full overflow-hidden">
              ${renderProductImage(product1)}
            </div>
            <p
              class="font-bold tabular-nums leading-none truncate mt-2 text-[14px] sm:text-[15px] md:text-[16px]"
              style="color: var(--tailored-price-color, #222222);"
            >${localizePriceString(product1.price)}</p>
          </div>
          <div class="flex-1 flex flex-col justify-center">
            <div class="aspect-square w-full overflow-hidden">
              ${renderProductImage(product2)}
            </div>
            <p
              class="font-bold tabular-nums leading-none truncate mt-2 text-[14px] sm:text-[15px] md:text-[16px]"
              style="color: var(--tailored-price-color, #222222);"
            >${localizePriceString(product2.price)}</p>
          </div>
        </div>
      </a>
    </div>
  `;
}

export function initTailoredSelections(): void {
  const el = document.querySelector<HTMLElement>(".tailored-swiper");
  if (!el) return;

  applySwiperDir(el);
  new Swiper(el, {
    modules: [Navigation],
    spaceBetween: 8,
    navigation: {
      nextEl: ".tailored-next",
      prevEl: ".tailored-prev",
    },
    breakpoints: {
      0: {
        slidesPerView: 1.2,
        spaceBetween: 8,
      },
      480: {
        slidesPerView: 1.5,
        spaceBetween: 8,
      },
      640: {
        slidesPerView: 2,
        spaceBetween: 8,
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 8,
      },
    },
  });

  // Load tailored recommendations — 9 grup kartı, kategori başına 2 ürün.
  // Giriş yapmış kullanıcıda aktiviteye göre kişiselleştirilir, aksi halde
  // global top kategoriler (cold-start) döner.
  initCurrency()
    .then(() => getTailoredSelections(9))
    .then((result) => {
      if (!result.groups || result.groups.length === 0) return;

      const collections: TailoredCollection[] = result.groups
        .filter((g) => g.products && g.products.length >= 1)
        .map((g) => {
          // En az 1 ürün varsa slot'ları doldur (2 ürün gerekli render için)
          const p1 = g.products[0];
          const p2 = g.products[1] || g.products[0];
          return {
            title: g.name,
            titleKey: "",
            views: "",
            viewsCount: g.viewsCount || 0,
            href: `/pages/tailored-selections.html?category=${encodeURIComponent(g.slug)}`,
            products: [
              { name: p1.name, price: p1.price, imageSrc: p1.imageSrc || "" },
              { name: p2.name, price: p2.price, imageSrc: p2.imageSrc || "" },
            ] as [CollectionProduct, CollectionProduct],
          };
        });

      if (collections.length === 0) return;

      // Hide empty state
      const emptyState = document.getElementById("tailored-empty");
      if (emptyState) emptyState.style.display = "none";

      const wrapper = document.querySelector("#tailored-swiper .swiper-wrapper");
      if (wrapper) {
        wrapper.innerHTML = collections.map((c) => renderCollectionSlide(c)).join("");
        // Swiper element-bound instance — `swiper-element`/init script tarafından
        // DOM element üzerine `.swiper` property'si olarak eklenir. Resmi tip yok.
        const swiperEl = document.querySelector("#tailored-swiper") as
          | (HTMLElement & { swiper?: { update: () => void } })
          | null;
        if (swiperEl?.swiper) {
          swiperEl.swiper.update();
        }
      }
    })
    .catch((err) => console.warn("[TailoredSelections] API load failed:", err));
}

export function TailoredSelections(): string {
  return `
    <section class="py-4 lg:py-6" aria-label="Tailored Selections" style="margin-top: 28px;">
      <div class="container-boxed">
        <div class="rounded-md grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-3" style="background-color: var(--tailored-bg, #F5F5F5); padding: var(--space-card-padding, 16px);">
          <!-- Lead panel — Editorial Split: başlık + açıklama + CTA -->
          <a
            href="/size-ozel"
            class="flex flex-col rounded-md p-5 md:p-6 bg-[linear-gradient(160deg,#fffdf4,var(--tailored-lead-bg,#fff8e1)_60%,#ffefb3_130%)]"
            aria-label="${escapeHtml(t("tailored.title"))}"
          >
            <p class="text-[11px] font-bold uppercase tracking-[0.12em] mb-2.5 text-[var(--tailored-lead-eyebrow-color,#a87c00)]"><span data-i18n="tailored.eyebrow">${t("tailored.eyebrow")}</span></p>
            <h2
              class="text-[20px] md:text-[24px] font-bold leading-tight text-balance mb-2.5"
              style="color: var(--tailored-title-color, #111827);"
            ><span data-i18n="tailored.title">${t("tailored.title")}</span></h2>
            <p class="text-[13px] leading-relaxed mb-auto text-[var(--tailored-lead-desc-color,#6b6455)]"><span data-i18n="tailored.description">${t("tailored.description")}</span></p>
            <span class="th-btn rounded-full self-start mt-5 px-5 text-[13px]"><span data-i18n="tailored.exploreAll">${t("tailored.exploreAll")}</span></span>
          </a>

          <!-- Swiper slider -->
          <div class="group/tailored relative min-w-0">
            <div id="tailored-swiper" class="swiper tailored-swiper overflow-hidden h-full" aria-label="Tailored selection collections">
              <div class="swiper-wrapper">
                ${tailoredCollections.length > 0 ? tailoredCollections.map((c) => renderCollectionSlide(c)).join("") : ""}
              </div>
            </div>
            ${
              tailoredCollections.length === 0
                ? `
            <div id="tailored-empty" class="flex items-center justify-center py-12">
              <div class="text-center">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <p class="text-sm text-gray-400">Yak\u0131nda yeni \u00fcr\u00fcnler eklenecek</p>
              </div>
            </div>
            `
                : ""
            }

            <!-- Navigation arrows -->
            <button
              aria-label="Previous collections"
              class="tailored-prev absolute start-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-[opacity,color] duration-200 ease-out hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/tailored:opacity-100 group-hover/tailored:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <button
              aria-label="Next collections"
              class="tailored-next absolute end-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-[opacity,color] duration-200 ease-out hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/tailored:opacity-100 group-hover/tailored:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}
