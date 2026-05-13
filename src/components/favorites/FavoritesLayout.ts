/**
 * FavoritesLayout Component
 * Two hash-based views: #favorites (default) and #browsing-history.
 * Favorites: dynamic list-based system with sidebar, tabs, create/delete lists.
 */

import favEmptySvg from "../../assets/images/O1CN01Bny3KU1Swwfj3Ntma_!!6000000002312-55-tps-222-221.svg";
import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import { showToast } from "../../utils/toast";
import { getBrowsingHistory } from "../../services/browsingHistoryService";
import {
  getLists,
  getItems,
  getItemsByList,
  getListItemCount,
  getTotalCount,
  createList,
  deleteList,
  removeFromFavorites,
  type FavoriteItem,
} from "../../stores/favorites";
import {
  getFavoriteSellers,
  removeSellerFromAll,
  pruneSellerListId,
  type FavoriteSellerItem,
} from "../../stores/sellerFavorites";

const DEFAULT_LIST_ID = "default";

/* ────────────────────────────────────────
   EMPTY STATE ILLUSTRATION
   ──────────────────────────────────────── */
const FAVORITES_EMPTY_SVG = `<img src="${favEmptySvg}" alt="${t("favorites.noFavorites")}" width="160" height="160" />`;

/* ────────────────────────────────────────
   Current active filter state
   ──────────────────────────────────────── */
let activeListFilter: string = "all"; // ürün sekmesi: 'all', 'default', list id
let activeSupplierListFilter: string = "all"; // tedarikçiler sekmesi (paralel)

/* ────────────────────────────────────────
   SELLER HELPERS
   ──────────────────────────────────────── */
function getSellersByList(listId: string): FavoriteSellerItem[] {
  return getFavoriteSellers().filter((s) => s.listIds.includes(listId));
}

function getSellerListCount(listId: string): number {
  return getSellersByList(listId).length;
}

function getSellerTotalCount(): number {
  return getFavoriteSellers().length;
}

/* ────────────────────────────────────────
   SECTION RENDERERS
   ──────────────────────────────────────── */

function renderEmptyState(): string {
  return `
    <div class="flex flex-col items-center text-center py-15 px-5">
      <div class="mb-5">${FAVORITES_EMPTY_SVG}</div>
      <h3 class="text-base font-bold text-text-primary mb-2.5">${t("favorites.noFavorites")}</h3>
      <p class="text-sm text-text-tertiary leading-relaxed max-w-[380px]">${t("favorites.noFavoritesDesc")}</p>
    </div>
  `;
}

/**
 * Sidebar liste paneli — `kind`'e göre ürün veya tedarikçi sayılarını
 * gösterir. Aynı liste havuzu paylaşılır; sayılar bağlama göre değişir.
 */
function renderSidebarLists(kind: "products" | "suppliers" = "products"): string {
  const lists = getLists();
  const isSeller = kind === "suppliers";
  const totalCount = isSeller ? getSellerTotalCount() : getTotalCount();
  const defaultCount = isSeller
    ? getSellerListCount(DEFAULT_LIST_ID)
    : getListItemCount(DEFAULT_LIST_ID);
  const activeFilter = isSeller ? activeSupplierListFilter : activeListFilter;
  const filterAttr = isSeller ? "data-filter-supplier-list" : "data-filter-list";

  const customListItems = lists
    .map((list) => {
      const count = isSeller ? getSellerListCount(list.id) : getListItemCount(list.id);
      const isActive = activeFilter === list.id;
      return `
      <div class="fav-products__list-item group relative ${isActive ? "fav-products__list-item--active bg-surface-raised" : ""} p-2.5 px-3 rounded-md cursor-pointer transition-[background] duration-150 hover:bg-surface-raised" ${filterAttr}="${list.id}">
        <span class="block text-sm font-semibold text-text-primary">${escapeHtml(list.name)}</span>
        <span class="block text-xs text-text-tertiary mt-0.5">${t("favorites.itemCount", { count })}</span>
        <button type="button" class="fav-delete-list-btn absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" data-delete-list="${list.id}" title="${t("favorites.deleteList")}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;
    })
    .join("");

  return `
    <div class="fav-products__list-item ${activeFilter === "all" ? "fav-products__list-item--active bg-surface-raised" : ""} p-2.5 px-3 rounded-md cursor-pointer transition-[background] duration-150 hover:bg-surface-raised" ${filterAttr}="all">
      <span class="block text-sm font-semibold text-text-primary">${t("favorites.listAll")}</span>
      <span class="block text-xs text-text-tertiary mt-0.5">${t("favorites.itemCount", { count: totalCount })}</span>
    </div>
    <div class="fav-products__list-item ${activeFilter === "default" ? "fav-products__list-item--active bg-surface-raised" : ""} p-2.5 px-3 rounded-md cursor-pointer transition-[background] duration-150 hover:bg-surface-raised" ${filterAttr}="default">
      <div class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-red-500 shrink-0" fill="#ef4444" stroke="#ef4444" stroke-width="1" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        <span class="block text-sm font-semibold text-text-primary">${t("favorites.defaultList")}</span>
      </div>
      <span class="block text-xs text-text-tertiary mt-0.5">${t("favorites.itemCount", { count: defaultCount })}</span>
    </div>
    ${customListItems}
  `;
}

/**
 * Tedarikçi kartı — Alibaba "Sık kullanılanlar > Tedarikçiler" satır
 * görünümü. Logo + isim + doğrulama + lokasyon + sağda eylem
 * butonları.
 */
function renderSupplierCards(items: FavoriteSellerItem[]): string {
  if (items.length === 0) return renderEmptyState();

  const cards = items
    .map((s) => {
      const profileHref = `/pages/seller/seller-storefront.html?seller=${encodeURIComponent(s.code)}`;
      const initials = (s.name || "?")
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const ratingTxt = s.rating ? s.rating.toFixed(1) : "—";
      const reviews = s.reviewCount ?? 0;
      return `
    <div class="relative bg-white rounded-lg border border-[#eee] hover:border-[#F60] hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition-all p-5 max-sm:p-4 group" data-fav-seller-id="${s.code}">
      <button type="button" class="fav-remove-seller absolute top-3 right-3 w-8 h-8 rounded-full bg-[#f4f4f4] flex items-center justify-center cursor-pointer hover:bg-red-100 z-10 transition-colors opacity-0 group-hover:opacity-100" data-remove-seller="${s.code}" title="${t("favorites.removeFromAll")}">
        <svg class="w-[16px] h-[16px]" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <div class="flex max-md:flex-col gap-4 max-md:gap-3 items-start">
        <!-- Logo / cover -->
        <div class="w-[64px] h-[64px] rounded-md border border-gray-100 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center text-[#1a66ff] font-bold text-base">
          ${
            s.logo
              ? `<img src="${s.logo}" alt="${escapeHtml(s.name)}" class="w-full h-full object-contain p-1" />`
              : `<span>${escapeHtml(initials)}</span>`
          }
        </div>
        <!-- Info -->
        <div class="flex-1 min-w-0 pr-12 max-md:pr-0">
          <a href="${profileHref}" class="text-[15px] font-bold text-[#222] hover:text-[#1a66ff] transition-colors line-clamp-1">${escapeHtml(s.name)}</a>
          <div class="flex flex-wrap items-center gap-1.5 mt-1 text-[12px] text-[#555]">
            <span class="inline-flex items-center gap-1 text-[#1a66ff] font-semibold">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              ${t("mfr.list.verified")}
            </span>
            ${s.city ? `<span class="text-gray-300">·</span><span>${escapeHtml(s.city)}</span>` : ""}
            ${s.country ? `<span class="text-gray-300">·</span><span>${escapeHtml(s.country)}</span>` : ""}
          </div>
          <div class="flex items-center gap-3 mt-2 text-[12px] text-[#666]">
            <span class="inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
              <strong class="text-[#222]">${ratingTxt}</strong>/5
              <span class="text-gray-400">(${reviews})</span>
            </span>
          </div>
          ${
            s.listIds.length > 0
              ? `<div class="mt-2 flex flex-wrap gap-1">
                  ${s.listIds
                    .filter((id) => id !== DEFAULT_LIST_ID)
                    .map((id) => {
                      const list = getLists().find((l) => l.id === id);
                      return list
                        ? `<span class="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">${escapeHtml(list.name)}</span>`
                        : "";
                    })
                    .join("")}
                </div>`
              : ""
          }
        </div>
        <!-- Cover thumb -->
        ${
          s.cover
            ? `<div class="w-[140px] h-[100px] max-md:w-full max-md:h-[120px] rounded-md overflow-hidden bg-gray-50 shrink-0 max-lg:hidden">
                <img src="${s.cover}" alt="" class="w-full h-full object-cover" />
              </div>`
            : ""
        }
        <!-- Actions -->
        <div class="flex flex-col gap-2 shrink-0 max-md:w-full max-md:flex-row">
          <a href="${profileHref}" class="th-btn h-9 px-4 text-[13px] font-semibold whitespace-nowrap inline-flex items-center justify-center max-md:flex-1">
            ${t("mfr.list.viewProfile", { defaultValue: "Profili görüntüle" })}
          </a>
          <!-- DISABLED: "Bu satıcıyla iletişime geç" butonu — messages.html altyapısı yok, ileride geri açılacak. -->
          <!-- <a href="/pages/dashboard/messages.html?seller=${encodeURIComponent(s.code)}" class="th-btn-outline h-9 px-4 text-[13px] font-semibold whitespace-nowrap inline-flex items-center justify-center max-md:flex-1">
            ${t("mfr.list.contactUs")}
          </a> -->
        </div>
      </div>
    </div>
  `;
    })
    .join("");

  return `
    <div class="px-7 pt-5 pb-7 max-sm:px-3">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-[18px] font-bold text-text-primary">${t("favorites.suppliers")}</h2>
        <span class="text-[13px] text-text-tertiary">${t("favorites.itemCount", { count: items.length })}</span>
      </div>
      <div class="flex flex-col gap-3">${cards}</div>
    </div>
  `;
}

function renderProductCards(items: FavoriteItem[]): string {
  if (items.length === 0) return renderEmptyState();

  const cards = items
    .map((p) => {
      const detailHref = `/pages/product-detail.html?id=${encodeURIComponent(p.id)}`;
      return `
    <div class="relative bg-white rounded-lg border border-[#eee] hover:border-[#F60] hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-all p-4 group" data-fav-item-id="${p.id}">
      <button type="button" class="fav-remove-item absolute top-2 right-2 w-8 h-8 rounded-full bg-[#f4f4f4] flex items-center justify-center cursor-pointer hover:bg-red-100 z-10 transition-colors" data-remove-id="${p.id}" title="${t("favorites.removeFromAll")}">
        <svg class="w-[18px] h-[18px] text-[#f60]" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      </button>
      <a href="${detailHref}" class="block no-underline">
        <div class="w-full aspect-square rounded overflow-hidden mb-3 bg-[#f5f5f5]">
          <img src="${p.image}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover mix-blend-multiply" loading="lazy" />
        </div>
        <h4 class="text-[13px] font-normal text-[#333] leading-[18px] line-clamp-2 mb-2 group-hover:text-[#F60] transition-colors">${escapeHtml(p.title)}</h4>
        <div class="flex items-baseline gap-1 mb-1">
          <span class="text-[16px] font-[700] text-[#111] leading-none">${formatPrice(p.priceRange)}</span>
        </div>
        <p class="text-[12px] text-[#999] opacity-80">${p.minOrder}</p>
      </a>
      ${
        p.listIds.length > 0
          ? `
        <div class="mt-2 flex flex-wrap gap-1">
          ${p.listIds
            .filter((id) => id !== DEFAULT_LIST_ID)
            .map((id) => {
              const list = getLists().find((l) => l.id === id);
              return list
                ? `<span class="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">${escapeHtml(list.name)}</span>`
                : "";
            })
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
    })
    .join("");

  return `
    <div class="px-7 pt-5 pb-7 max-sm:px-3">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-[18px] font-bold text-text-primary">${t("favorites.products")}</h2>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1 bg-surface-raised border border-border-default rounded text-[13px] text-text-secondary hover:bg-[#f0f0f0]">${t("favorites.sortBy")}</button>
          <button class="w-8 h-8 rounded bg-surface-raised border border-border-default flex items-center justify-center hover:bg-[#f0f0f0]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2">
        ${cards}
      </div>
    </div>
  `;
}

function renderFavorites(): string {
  return `
    <div class="px-7 pt-6 max-sm:px-3 max-sm:pt-4">
      <h1 class="text-xl font-bold text-text-primary">${t("favorites.title")}</h1>
    </div>

    <div class="fav-tabs flex px-7 max-sm:px-3 border-b border-border-default mt-4" data-tabgroup="fav">
      <button class="fav-tabs__tab fav-tabs__tab--active th-no-press py-3 px-5 text-sm font-medium text-text-secondary bg-transparent border-0 border-b-2 border-solid border-transparent cursor-pointer transition-[color,border-color] duration-150 -mb-px hover:text-text-primary" data-tab="fav-products">${t("favorites.products")}</button>
      <button class="fav-tabs__tab th-no-press py-3 px-5 text-sm font-medium text-text-secondary bg-transparent border-0 border-b-2 border-solid border-transparent cursor-pointer transition-[color,border-color] duration-150 -mb-px hover:text-text-primary" data-tab="fav-suppliers">${t("favorites.suppliers")}</button>
    </div>

    <!-- Tab: Products -->
    <div class="fav-tab-content fav-tab-content--active hidden [&.fav-tab-content--active]:block" data-content="fav-products">
      <div class="fav-products flex min-h-[400px] max-md:flex-col">
        <aside class="fav-products__sidebar w-60 shrink-0 py-5 px-6 border-r border-[#f0f0f0] max-md:w-full max-md:border-r-0 max-md:border-b max-md:border-[#f0f0f0]">
          <h3 class="text-base font-bold text-text-primary mb-2.5">${t("favorites.myList")}</h3>
          <a href="#" class="text-sm text-text-primary font-semibold underline underline-offset-2 hover:text-(--color-cta-primary)" data-action="create-list">${t("favorites.createList")}</a>
          <div class="mt-4 flex flex-col gap-0.5" id="fav-list-sidebar">
            ${renderSidebarLists()}
          </div>
        </aside>
        <div class="flex-1 min-w-0" id="fav-products-container">
          <!-- Populated via JS -->
          ${renderEmptyState()}
        </div>
      </div>
    </div>

    <!-- Tab: Suppliers -->
    <div class="fav-tab-content hidden [&.fav-tab-content--active]:block" data-content="fav-suppliers">
      <div class="fav-products flex min-h-[400px] max-md:flex-col">
        <aside class="fav-products__sidebar w-60 shrink-0 py-5 px-6 border-r border-[#f0f0f0] max-md:w-full max-md:border-r-0 max-md:border-b max-md:border-[#f0f0f0]">
          <h3 class="text-base font-bold text-text-primary mb-2.5">${t("favorites.myList")}</h3>
          <a href="#" class="text-sm text-text-primary font-semibold underline underline-offset-2 hover:text-(--color-cta-primary)" data-action="create-list">${t("favorites.createList")}</a>
          <div class="mt-4 flex flex-col gap-0.5" id="fav-supplier-list-sidebar">
            ${renderSidebarLists("suppliers")}
          </div>
        </aside>
        <div class="flex-1 min-w-0" id="fav-suppliers-container">
          ${renderEmptyState()}
        </div>
      </div>
    </div>

    <!-- Modal: New list -->
    <div class="fav-modal hidden fixed inset-0 z-[9999] items-center justify-center" id="fav-list-modal">
      <div class="fav-modal__overlay absolute inset-0 bg-black/45"></div>
      <div class="relative bg-surface rounded-md w-[440px] max-w-[calc(100vw-32px)] shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-[favModalIn_200ms_ease-out]">
        <div class="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 class="text-lg font-bold text-text-primary">${t("favorites.addNewList")}</h3>
          <button class="fav-modal__close bg-transparent border-none cursor-pointer p-1 rounded flex items-center justify-center transition-[background] duration-150 hover:bg-surface-raised" aria-label="${t("common.close")}">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="#333" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="px-6 pb-5">
          <div class="relative">
            <input type="text" class="th-input th-input-md pr-[50px]" placeholder="${t("favorites.enterName")}" maxlength="25" id="fav-list-input" />
            <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-tertiary"><span id="fav-char-count">0</span>/25</span>
          </div>
        </div>
        <div class="flex justify-center gap-4 px-6 pb-6">
          <button class="fav-modal__btn--cancel th-btn-outline">${t("common.cancel")}</button>
          <button class="fav-modal__btn--save th-btn" disabled>${t("common.save")}</button>
        </div>
      </div>
    </div>
  `;
}

function renderBrowsingHistory(): string {
  const history = getBrowsingHistory();

  if (history.length === 0) {
    return `
      <div class="px-7 pt-6 max-sm:px-3 max-sm:pt-4">
        <h1 class="text-xl font-bold text-text-primary">${t("favorites.browsingHistoryTitle")}</h1>
        <p class="text-sm text-text-tertiary mt-1">${t("favorites.browsingHistoryDesc")}</p>
      </div>
      <div class="flex flex-col items-center text-center py-15 px-5">
        <div class="mb-5">${FAVORITES_EMPTY_SVG}</div>
        <h3 class="text-base font-bold text-text-primary mb-2.5">${t("favorites.browsingHistoryTitle")}</h3>
        <p class="text-sm text-text-tertiary leading-relaxed max-w-[380px]">${t("favorites.browsingHistoryDesc")}</p>
      </div>
    `;
  }

  const productCards = history
    .map(
      (p) => `
    <a href="${p.href}" class="group flex flex-col no-underline text-inherit transition-transform duration-150 hover:-translate-y-0.5">
      <div class="w-full aspect-square rounded-lg overflow-hidden border border-[#f0f0f0] mb-2.5">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" loading="lazy" />
      </div>
      <h4 class="text-[13px] text-text-secondary leading-[1.4] line-clamp-2 mb-1.5" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</h4>
      ${p.priceRange ? `<p class="text-sm font-bold text-text-primary mb-0.5">${formatPrice(p.priceRange)}</p>` : ""}
      ${p.minOrder ? `<p class="text-xs text-text-tertiary">${p.minOrder}</p>` : ""}
    </a>
  `
    )
    .join("");

  return `
    <div class="px-7 pt-6 max-sm:px-3 max-sm:pt-4">
      <h1 class="text-xl font-bold text-text-primary">${t("favorites.browsingHistoryTitle")}</h1>
      <p class="text-sm text-text-tertiary mt-1">${t("favorites.browsingHistoryDesc")}</p>
    </div>
    <div class="grid grid-cols-5 gap-4 px-7 py-5 pb-7 max-md:grid-cols-2 max-md:p-4 max-sm:grid-cols-2 max-sm:gap-3 max-sm:p-3 max-lg:min-[769px]:grid-cols-3">
      ${productCards}
    </div>
  `;
}

/* ────────────────────────────────────────
   SECTION MAP
   ──────────────────────────────────────── */
const SECTIONS: Record<string, () => string> = {
  favorites: renderFavorites,
  "browsing-history": renderBrowsingHistory,
};

function getActiveSection(): string {
  const hash = window.location.hash.replace("#", "");
  return SECTIONS[hash] ? hash : "favorites";
}

/* ────────────────────────────────────────
   MAIN LAYOUT
   ──────────────────────────────────────── */
export function FavoritesLayout(): string {
  const activeId = getActiveSection();
  const renderFn = SECTIONS[activeId] ?? renderFavorites;

  return `
    <div class="bg-surface rounded-lg min-h-[600px]" id="fav-content">
      ${renderFn()}
    </div>
  `;
}

/* ────────────────────────────────────────
   INIT
   ──────────────────────────────────────── */
export function initFavoritesLayout(): void {
  const contentEl = document.getElementById("fav-content");
  if (!contentEl) return;

  function navigate(): void {
    const activeId = getActiveSection();
    const renderFn = SECTIONS[activeId] ?? renderFavorites;
    contentEl!.innerHTML = renderFn();
    initFavTabs();
    initFavListModal();
    loadFavoritesData();
    loadSuppliersData();
    initListFiltering();
    initSupplierListFiltering();
    initRemoveButtons();
    initRemoveSupplierButtons();
    initDeleteListButtons();
  }

  window.addEventListener("hashchange", navigate);

  // Listen for favorites changes (from other pages like product-detail)
  window.addEventListener("favorites-changed", () => {
    refreshFavoritesView();
  });
  window.addEventListener("seller-favorites-changed", () => {
    refreshSuppliersView();
  });

  // Init for initial render
  initFavTabs();
  initFavListModal();
  loadFavoritesData();
  loadSuppliersData();
  initListFiltering();
  initSupplierListFiltering();
  initRemoveButtons();
  initRemoveSupplierButtons();
  initDeleteListButtons();
}

function refreshFavoritesView(): void {
  // Refresh sidebar counts
  const sidebar = document.getElementById("fav-list-sidebar");
  if (sidebar) {
    sidebar.innerHTML = renderSidebarLists("products");
    initListFiltering();
    initDeleteListButtons();
  }

  // Refresh product cards
  loadFavoritesData();
  initRemoveButtons();
}

function refreshSuppliersView(): void {
  const sidebar = document.getElementById("fav-supplier-list-sidebar");
  if (sidebar) {
    sidebar.innerHTML = renderSidebarLists("suppliers");
    initSupplierListFiltering();
    initDeleteListButtons();
  }
  loadSuppliersData();
  initRemoveSupplierButtons();
}

function getFilteredItems(): FavoriteItem[] {
  if (activeListFilter === "all") {
    return getItems();
  }
  return getItemsByList(activeListFilter);
}

function getFilteredSellerItems(): FavoriteSellerItem[] {
  if (activeSupplierListFilter === "all") {
    return getFavoriteSellers();
  }
  return getSellersByList(activeSupplierListFilter);
}

function loadFavoritesData(): void {
  const container = document.getElementById("fav-products-container");
  if (!container) return;

  const items = getFilteredItems();
  container.innerHTML = renderProductCards(items);
  initRemoveButtons();
}

function loadSuppliersData(): void {
  const container = document.getElementById("fav-suppliers-container");
  if (!container) return;
  const items = getFilteredSellerItems();
  container.innerHTML = renderSupplierCards(items);
  initRemoveSupplierButtons();
}

function initListFiltering(): void {
  document.querySelectorAll<HTMLElement>("[data-filter-list]").forEach((item) => {
    item.addEventListener("click", (e) => {
      // Don't trigger if clicking delete button
      if ((e.target as HTMLElement).closest(".fav-delete-list-btn")) return;

      const listId = item.dataset.filterList!;
      activeListFilter = listId;

      // Update sidebar active state — sadece ürün sekmesinin sidebar'ı
      const sidebar = document.getElementById("fav-list-sidebar");
      sidebar?.querySelectorAll<HTMLElement>(".fav-products__list-item").forEach((i) => {
        i.classList.remove("fav-products__list-item--active", "bg-surface-raised");
      });
      item.classList.add("fav-products__list-item--active", "bg-surface-raised");

      // Reload products
      loadFavoritesData();
    });
  });
}

function initSupplierListFiltering(): void {
  document.querySelectorAll<HTMLElement>("[data-filter-supplier-list]").forEach((item) => {
    item.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".fav-delete-list-btn")) return;
      const listId = item.dataset.filterSupplierList!;
      activeSupplierListFilter = listId;

      const sidebar = document.getElementById("fav-supplier-list-sidebar");
      sidebar?.querySelectorAll<HTMLElement>(".fav-products__list-item").forEach((i) => {
        i.classList.remove("fav-products__list-item--active", "bg-surface-raised");
      });
      item.classList.add("fav-products__list-item--active", "bg-surface-raised");

      loadSuppliersData();
    });
  });
}

function initRemoveSupplierButtons(): void {
  document.querySelectorAll<HTMLButtonElement>(".fav-remove-seller").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const code = btn.dataset.removeSeller!;
      removeSellerFromAll(code);

      const card = btn.closest("[data-fav-seller-id]") as HTMLElement;
      if (card) {
        card.style.transition = "all 300ms ease-out";
        card.style.opacity = "0";
        card.style.transform = "scale(0.96)";
        setTimeout(() => refreshSuppliersView(), 300);
      } else {
        refreshSuppliersView();
      }

      showToast({ message: t("favorites.removedFromList"), type: "info" });
    });
  });
}

function initRemoveButtons(): void {
  document.querySelectorAll<HTMLButtonElement>(".fav-remove-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = btn.dataset.removeId!;
      removeFromFavorites(productId);

      // Animate out and refresh
      const card = btn.closest("[data-fav-item-id]") as HTMLElement;
      if (card) {
        card.style.transition = "all 300ms ease-out";
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";
        setTimeout(() => refreshFavoritesView(), 300);
      } else {
        refreshFavoritesView();
      }

      showToast({ message: t("product.removedFromFavorites"), type: "info" });
    });
  });
}

function initDeleteListButtons(): void {
  document.querySelectorAll<HTMLButtonElement>(".fav-delete-list-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const listId = btn.dataset.deleteList!;

      deleteList(listId);
      pruneSellerListId(listId); // tedarikçi item'larından da listId'yi çıkar

      if (activeListFilter === listId) activeListFilter = "all";
      if (activeSupplierListFilter === listId) activeSupplierListFilter = "all";

      refreshFavoritesView();
      refreshSuppliersView();
      showToast({ message: t("favorites.removedFromList"), type: "info" });
    });
  });
}

function initFavTabs(): void {
  document.querySelectorAll<HTMLElement>(".fav-tabs").forEach((tabGroup) => {
    const tabs = tabGroup.querySelectorAll<HTMLButtonElement>(".fav-tabs__tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetId = tab.dataset.tab;
        if (!targetId) return;

        // Reset all tabs
        tabs.forEach((t) => {
          t.classList.remove("fav-tabs__tab--active");
          t.style.color = "";
          t.style.fontWeight = "";
          t.style.borderBottomColor = "transparent";
        });
        // Activate clicked tab
        tab.classList.add("fav-tabs__tab--active");
        tab.style.color = "#222";
        tab.style.fontWeight = "600";
        tab.style.borderBottomColor = "#222";

        const parent = tabGroup.parentElement;
        if (!parent) return;
        parent.querySelectorAll<HTMLElement>(".fav-tab-content").forEach((panel) => {
          const isActive = panel.dataset.content === targetId;
          panel.classList.toggle("fav-tab-content--active", isActive);
        });
      });
    });

    // Set initial active tab style
    const activeTab = tabGroup.querySelector<HTMLButtonElement>(".fav-tabs__tab--active");
    if (activeTab) {
      activeTab.style.color = "#222";
      activeTab.style.fontWeight = "600";
      activeTab.style.borderBottomColor = "#222";
    }
  });
}

function initFavListModal(): void {
  const modal = document.getElementById("fav-list-modal");
  if (!modal) return;

  const overlay = modal.querySelector<HTMLElement>(".fav-modal__overlay");
  const closeBtn = modal.querySelector<HTMLButtonElement>(".fav-modal__close");
  const cancelBtn = modal.querySelector<HTMLButtonElement>(".fav-modal__btn--cancel");
  const saveBtn = modal.querySelector<HTMLButtonElement>(".fav-modal__btn--save");
  const input = document.getElementById("fav-list-input") as HTMLInputElement | null;
  const counter = document.getElementById("fav-char-count");

  function openModal(): void {
    modal!.classList.remove("hidden");
    modal!.classList.add("flex");
    document.body.style.overflow = "hidden";
    input?.focus();
  }

  function closeModal(): void {
    modal!.classList.add("hidden");
    modal!.classList.remove("flex");
    document.body.style.overflow = "";
    if (input) {
      input.value = "";
    }
    if (counter) {
      counter.textContent = "0";
    }
    if (saveBtn) {
      saveBtn.disabled = true;
    }
  }

  function handleSave(): void {
    if (!input || !input.value.trim()) return;
    const name = input.value.trim();
    createList(name);
    closeModal();
    refreshFavoritesView();
    showToast({
      message: `${t("favorites.listCreated")} "${name}"`,
      type: "success",
    });
  }

  // Open modal from "Create a list" link
  document
    .querySelector<HTMLElement>('[data-action="create-list"]')
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });

  overlay?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  saveBtn?.addEventListener("click", handleSave);

  // Character counter + save button state
  input?.addEventListener("input", () => {
    const len = input.value.length;
    if (counter) counter.textContent = String(len);
    if (saveBtn) saveBtn.disabled = len === 0;
  });

  // Enter key to save
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      handleSave();
    }
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal!.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
