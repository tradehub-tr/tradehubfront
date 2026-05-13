/**
 * RelatedProducts Component — 4-tab layout with horizontal slider per tab
 *
 * Renders the "İlgili Ürünler" section under the product detail page.
 * Tabs: Benzer (similar) / İkame (substitute) / Tamamlayıcı (complementary) / Aksesuar (accessory).
 *
 * Behaviour:
 *  - An empty category's tab button is not rendered.
 *  - When all four categories are empty, the entire section is hidden.
 *  - The first non-empty tab becomes active on load.
 *  - Each tab's products are shown as a single-row Swiper carousel with
 *    desktop hover-revealed prev/next buttons; mobile is touch-swipe.
 *
 * The component is ID-agnostic so it can appear in both desktop and mobile
 * layouts on the same page — init walks every `[data-rp-root]` element.
 */

import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import {
  getRelatedListingsGrouped,
  type RelatedListingsGrouped,
  type RelatedRelationType,
} from "../../services/listingService";
import { getCurrentProduct } from "../../alpine/product";
import type { ProductListingCard } from "../../types/productListing";

interface TabMeta {
  key: RelatedRelationType;
  label: string;
  description: string;
}

// Track Swiper instances per (root, tab) so we can lazily init on first
// tab activation and destroy on root teardown without leaking listeners.
const swiperRegistry = new WeakMap<HTMLElement, Map<string, Swiper>>();
let rootCounter = 0;

function tabsMeta(): TabMeta[] {
  return [
    {
      key: "similar",
      label: t("product.relatedTabSimilar"),
      description: t("product.relatedDescSimilar"),
    },
    {
      key: "substitute",
      label: t("product.relatedTabSubstitute"),
      description: t("product.relatedDescSubstitute"),
    },
    {
      key: "complementary",
      label: t("product.relatedTabComplementary"),
      description: t("product.relatedDescComplementary"),
    },
    {
      key: "accessory",
      label: t("product.relatedTabAccessory"),
      description: t("product.relatedDescAccessory"),
    },
  ];
}

function renderCard(card: ProductListingCard): string {
  const safeName = card.name.replace(/"/g, "&quot;");
  const discountText = card.discount ? card.discount : "";
  const supplierYearsText = card.supplierYears
    ? `${card.supplierYears} ${t("productGrid.yr")}`
    : "";

  return `
    <a
      class="rp-card flex flex-col h-full overflow-hidden no-underline text-inherit transition-shadow hover:shadow-md bg-[var(--pc-related-bg,#fff)] border border-[var(--pc-related-border-color,#f3f4f6)] rounded-[var(--pc-related-radius,8px)]"
      href="${card.href}"
      aria-label="${safeName}"
    >
      <div class="aspect-square w-full overflow-hidden bg-gray-50">
        ${
          card.imageSrc
            ? `<img class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" src="${card.imageSrc}" alt="${safeName}" loading="lazy" />`
            : `<div class="w-full h-full flex items-center justify-center text-gray-300">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>`
        }
      </div>

      <div class="flex flex-col flex-1 gap-1.5 p-3">
        <p class="text-[13px] leading-[1.4] line-clamp-2 text-gray-800 min-h-[36px]" title="${safeName}">${card.name}</p>

        <div class="flex flex-wrap items-baseline gap-x-2">
          <span class="text-sm font-bold text-gray-900">${formatPrice(card.price)}</span>
          ${discountText ? `<span class="text-xs font-medium text-red-500">${discountText}</span>` : ""}
        </div>

        <div class="text-xs text-gray-500 truncate">
          <span class="mr-1.5 font-medium text-gray-600">${card.moq}</span>
          ${card.stats ? `<span>${card.stats}</span>` : ""}
        </div>

        <div class="mt-auto flex items-center gap-1.5 text-xs text-gray-400">
          ${supplierYearsText ? `<span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">${supplierYearsText}</span>` : ""}
          ${card.supplierCountry ? `<span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">${card.supplierCountry}</span>` : ""}
        </div>
      </div>
    </a>
  `;
}

/**
 * Returns the markup shell. The same shell can be rendered multiple times
 * on the same page (e.g. once in the desktop layout and once in the mobile
 * layout); initRelatedProducts() populates every instance it finds.
 */
export function RelatedProducts(): string {
  return `
    <section data-rp-root class="rp-section mt-3 mb-8 rounded-lg border border-gray-200 bg-white overflow-hidden hidden">
      <div class="flex items-center justify-between px-4 sm:px-5 pt-4 pb-2 border-b border-gray-100">
        <h2 class="text-base font-bold text-gray-900">${t("product.relatedProductsTitle")}</h2>
      </div>

      <div data-rp-tabs-nav role="tablist" class="flex flex-wrap gap-6 px-4 sm:px-5 border-b border-gray-200">
        <!-- tabs rendered dynamically -->
      </div>

      <div data-rp-panels class="p-4 sm:p-5">
        <!-- panels rendered dynamically -->
      </div>
    </section>
  `;
}

function renderTabButton(meta: TabMeta, count: number, active: boolean): string {
  const activeStyle = active
    ? "color: var(--pd-tab-active-color, #cc9900); font-weight: 600;"
    : "color: var(--pd-tab-color, #6b7280); font-weight: 500;";
  const activeClass = active ? "rp-tab-active" : "";
  return `
    <button
      type="button"
      role="tab"
      data-rp-tab="${meta.key}"
      aria-selected="${active ? "true" : "false"}"
      class="rp-tab ${activeClass} relative py-3.5 px-1 text-sm whitespace-nowrap border-0 bg-transparent cursor-pointer hover:text-gray-900 [&.rp-tab-active]:after:content-[''] [&.rp-tab-active]:after:absolute [&.rp-tab-active]:after:left-0 [&.rp-tab-active]:after:right-0 [&.rp-tab-active]:after:-bottom-px [&.rp-tab-active]:after:h-0.5 [&.rp-tab-active]:after:bg-[var(--pd-tab-active-border,#cc9900)]"
      style="${activeStyle}"
    >
      ${meta.label}
      <span class="ml-1 text-[11px] text-gray-400" data-rp-count>${count > 0 ? `(${count})` : ""}</span>
    </button>
  `;
}

/**
 * Renders one tabpanel containing a Swiper. Each card sits in its own
 * `swiper-slide` so Swiper measures real content widths; breakpoints
 * decide how many slides per view at each viewport.
 */
function renderPanel(meta: TabMeta, cards: ProductListingCard[], active: boolean): string {
  const slides = cards
    .map((card) => `<div class="swiper-slide h-auto">${renderCard(card)}</div>`)
    .join("");

  return `
    <div
      role="tabpanel"
      data-rp-panel="${meta.key}"
      class="rp-panel ${active ? "" : "hidden"}"
      aria-hidden="${active ? "false" : "true"}"
    >
      <p class="text-xs text-gray-500 mb-3">${meta.description}</p>

      <div class="relative group/rp-slider">
        <div class="swiper rp-swiper" data-rp-swiper="${meta.key}">
          <div class="swiper-wrapper">${slides}</div>
        </div>

        <button
          type="button"
          aria-label="Önceki ürünler"
          data-rp-prev="${meta.key}"
          class="rp-swiper-prev hidden md:flex absolute -left-2 top-[40%] -translate-y-1/2 z-10
                 h-9 w-9 rounded-full border border-gray-200 bg-white shadow-md
                 items-center justify-center text-gray-600 hover:text-gray-900
                 opacity-0 group-hover/rp-slider:opacity-100 transition-opacity duration-200
                 disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <button
          type="button"
          aria-label="Sonraki ürünler"
          data-rp-next="${meta.key}"
          class="rp-swiper-next hidden md:flex absolute -right-2 top-[40%] -translate-y-1/2 z-10
                 h-9 w-9 rounded-full border border-gray-200 bg-white shadow-md
                 items-center justify-center text-gray-600 hover:text-gray-900
                 opacity-0 group-hover/rp-slider:opacity-100 transition-opacity duration-200
                 disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Lazily initialise (or re-update) the Swiper for a given panel.
 *
 * Re-init logic: tab switches don't destroy the panel, so the next
 * activation can either reuse the existing instance (calling .update())
 * or create a fresh one if the panel was first activated now. This
 * keeps initial render cheap — only the active tab's Swiper exists on
 * page load.
 */
function ensurePanelSwiper(root: HTMLElement, key: string): void {
  const swiperEl = root.querySelector<HTMLElement>(`[data-rp-swiper="${key}"]`);
  if (!swiperEl) return;

  let registry = swiperRegistry.get(root);
  if (!registry) {
    registry = new Map();
    swiperRegistry.set(root, registry);
  }
  const existing = registry.get(key);
  if (existing) {
    existing.update();
    return;
  }

  const prevBtn = root.querySelector<HTMLElement>(`[data-rp-prev="${key}"]`);
  const nextBtn = root.querySelector<HTMLElement>(`[data-rp-next="${key}"]`);

  const swiper = new Swiper(swiperEl, {
    modules: [Navigation],
    slidesPerView: 1.4,
    spaceBetween: 12,
    watchOverflow: true,
    navigation: prevBtn && nextBtn ? { prevEl: prevBtn, nextEl: nextBtn } : undefined,
    breakpoints: {
      // Tuned to read like a single product row across breakpoints
      480: { slidesPerView: 2.2, spaceBetween: 12 },
      640: { slidesPerView: 3, spaceBetween: 14 },
      960: { slidesPerView: 4, spaceBetween: 16 },
      1280: { slidesPerView: 5, spaceBetween: 16 },
    },
  });

  registry.set(key, swiper);
}

export function initRelatedProducts(): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-rp-root]"));
  if (roots.length === 0) return;

  const product = getCurrentProduct();
  const urlId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id") || ""
      : "";
  const listingId = product.id || urlId;
  if (!listingId) {
    roots.forEach((root) => root.remove());
    return;
  }

  getRelatedListingsGrouped(listingId)
    .then((data) => {
      roots.forEach((root) => renderIntoRoot(root, data));
    })
    .catch((err: unknown) => {
      console.warn("[RelatedProducts] Failed to load:", err);
      roots.forEach((root) => root.remove());
    });
}

function renderIntoRoot(root: HTMLElement, data: RelatedListingsGrouped): void {
  const tabsNav = root.querySelector<HTMLElement>("[data-rp-tabs-nav]");
  const panelsContainer = root.querySelector<HTMLElement>("[data-rp-panels]");
  if (!tabsNav || !panelsContainer) return;

  // Per-root unique ID lets multiple roots on the same page (desktop +
  // mobile) own independent swiper registries without collisions.
  if (!root.dataset.rpRootId) {
    rootCounter += 1;
    root.dataset.rpRootId = String(rootCounter);
  }

  const metas = tabsMeta();
  const filledMetas = metas.filter((m) => Array.isArray(data[m.key]) && data[m.key].length > 0);

  if (filledMetas.length === 0) {
    root.remove();
    return;
  }

  const firstKey = filledMetas[0].key;

  tabsNav.innerHTML = filledMetas
    .map((m) => renderTabButton(m, data[m.key].length, m.key === firstKey))
    .join("");

  panelsContainer.innerHTML = filledMetas
    .map((m) => renderPanel(m, data[m.key], m.key === firstKey))
    .join("");

  root.classList.remove("hidden");

  // Initialise Swiper for the initially-active tab; others are deferred
  // until the user clicks them (saves layout/measure work on hidden panels).
  ensurePanelSwiper(root, firstKey);

  tabsNav.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".rp-tab");
    if (!btn) return;
    const tabKey = btn.dataset.rpTab;
    if (!tabKey) return;

    tabsNav.querySelectorAll<HTMLButtonElement>(".rp-tab").forEach((b) => {
      const isActive = b === btn;
      b.setAttribute("aria-selected", isActive ? "true" : "false");
      b.classList.toggle("rp-tab-active", isActive);
      if (isActive) {
        b.style.color = "var(--pd-tab-active-color, #cc9900)";
        b.style.fontWeight = "600";
      } else {
        b.style.color = "var(--pd-tab-color, #6b7280)";
        b.style.fontWeight = "500";
      }
    });

    panelsContainer.querySelectorAll<HTMLElement>(".rp-panel").forEach((panel) => {
      const isMatch = panel.dataset.rpPanel === tabKey;
      panel.classList.toggle("hidden", !isMatch);
      panel.setAttribute("aria-hidden", isMatch ? "false" : "true");
    });

    // Lazy-init / refresh the Swiper for the newly visible tab. Hidden
    // Swipers can't measure container width correctly, so we defer
    // initialisation until they're shown.
    ensurePanelSwiper(root, tabKey);
  });
}
