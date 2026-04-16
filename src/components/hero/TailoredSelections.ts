/**
 * TailoredSelections Component
 * iSTOC-style: Swiper slider with curated collection cards.
 * Each card has a title, views subtitle, two product images side by side, and prices.
 */

import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import { getTailoredSelections } from "../../services/listingService";
import { initCurrency } from "../../services/currencyService";

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
    <div class="relative h-full w-full overflow-hidden rounded-md bg-gray-100" aria-hidden="true">
      <img
        src="${product.imageSrc}"
        alt="${product.name}"
        loading="lazy"
        class="w-full h-full object-cover"
      />
    </div>
  `;
}

function formatViews(n: number | string): string {
  const num = typeof n === "number" ? n : parseInt(String(n), 10) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return String(num);
}

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
      ? `<p class="truncate" style="color: var(--tailored-views-color, #767676); font-size: var(--text-product-meta, 16px); margin: 0 0 12px;"><span data-i18n="tailored.views" data-i18n-options='${JSON.stringify({ count: formattedCount })}'>${t("tailored.views", { count: formattedCount })}</span></p>`
      : '<div style="margin: 0 0 12px;"></div>';
  return `
    <div class="swiper-slide tailored-slide">
      <a
        href="${collection.href}"
        class="group/col flex flex-col h-full rounded-md overflow-hidden cursor-pointer"
        style="background: var(--tailored-card-bg, #ffffff); padding: var(--space-card-padding, 16px);"
        aria-label="${titleLabel}"
      >
        <!-- Title -->
        <h3
          class="truncate font-bold leading-tight"
          style="color: var(--tailored-collection-title-color, #222222); font-size: var(--text-product-price, 20px);"
        >${titleLabel}</h3>

        <!-- Views subtitle -->
        ${viewsHtml}

        <!-- Product images side by side — 164x164 each -->
        <div class="flex gap-2 flex-1">
          <div class="flex-1 flex flex-col">
            <div class="aspect-square w-full">
              ${renderProductImage(product1)}
            </div>
            <p
              class="font-bold leading-none truncate"
              style="color: var(--tailored-price-color, #222222); font-size: var(--text-product-price, 20px); margin-top: 8px;"
            >${formatPrice(product1.price)}</p>
          </div>
          <div class="flex-1 flex flex-col">
            <div class="aspect-square w-full">
              ${renderProductImage(product2)}
            </div>
            <p
              class="font-bold leading-none truncate"
              style="color: var(--tailored-price-color, #222222); font-size: var(--text-product-price, 20px); margin-top: 8px;"
            >${formatPrice(product2.price)}</p>
          </div>
        </div>
      </a>
    </div>
  `;
}

export function initTailoredSelections(): void {
  const el = document.querySelector<HTMLElement>(".tailored-swiper");
  if (!el) return;

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
        const swiperEl = document.querySelector("#tailored-swiper") as HTMLElement;
        if (swiperEl && (swiperEl as any).swiper) {
          (swiperEl as any).swiper.update();
        }
      }
    })
    .catch((err) => console.warn("[TailoredSelections] API load failed:", err));
}

export function TailoredSelections(): string {
  return `
    <section class="py-4 lg:py-6" aria-label="Tailored Selections" style="margin-top: 28px;">
      <div class="container-boxed">
        <div class="rounded-md" style="background-color: var(--tailored-bg, #F5F5F5); padding: var(--space-card-padding, 16px);">
          <!-- Section header -->
          <div class="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2
                class="text-[20px] sm:text-[22px] font-bold leading-tight"
                style="color: var(--tailored-title-color, #111827);"
              ><span data-i18n="tailored.title">${t("tailored.title")}</span></h2>
            </div>
            <a
              href="/pages/tailored-selections.html"
              class="flex-shrink-0 text-[13px] font-semibold transition-colors duration-150 hover:underline"
              style="color: var(--tailored-link-color, #111827);"
            ><span data-i18n="common.viewMore">${t("common.viewMore")}</span> &gt;</a>
          </div>

          <!-- Swiper slider -->
          <div class="group/tailored relative">
            <div id="tailored-swiper" class="swiper tailored-swiper overflow-hidden" aria-label="Tailored selection collections">
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
              class="tailored-prev absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/tailored:opacity-100 group-hover/tailored:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <button
              aria-label="Next collections"
              class="tailored-next absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/tailored:opacity-100 group-hover/tailored:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
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
