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
import { getListingDetail } from "../../services/listingService";

/* ────────────────────────────────────────
   Favori enrichment (listing detail'den çekilen ek meta)
   Filtreleme + stok pill + supplier satırı için
   ──────────────────────────────────────── */
interface FavEnrichment {
  category?: string;
  supplier?: { name: string; verified: boolean; country?: string };
  stockQty?: number;
  inStock?: boolean;
}
const enrichmentMap: Map<string, FavEnrichment> = new Map();
let enrichmentLoading = false;
let enrichmentLoadedFor: string = ""; // son enrichment hangi item set'i için yüklendi

async function loadEnrichments(items: FavoriteItem[]): Promise<void> {
  if (enrichmentLoading) return;
  const fingerprint = items.map((i) => i.id).sort().join(",");
  if (fingerprint === enrichmentLoadedFor) return;
  enrichmentLoading = true;
  try {
    const results = await Promise.allSettled(items.map((it) => getListingDetail(it.id)));
    results.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        const d = res.value;
        enrichmentMap.set(items[idx].id, {
          category: d.category?.[0],
          supplier: d.supplier
            ? {
                name: d.supplier.name,
                verified: Boolean(d.supplier.verified),
                country: d.supplier.country,
              }
            : undefined,
          stockQty: d.stockQty,
          inStock: d.inStock ?? !d.outOfStock,
        });
      }
    });
    enrichmentLoadedFor = fingerprint;
  } finally {
    enrichmentLoading = false;
  }
}

function getStockState(en: FavEnrichment | undefined): "in" | "low" | "out" | "unknown" {
  if (!en) return "unknown";
  if (en.inStock === false || en.stockQty === 0) return "out";
  if (typeof en.stockQty === "number" && en.stockQty > 0 && en.stockQty < 50) return "low";
  if (en.inStock === true || (en.stockQty ?? 0) > 0) return "in";
  return "unknown";
}

function getStockLabel(en: FavEnrichment | undefined): string {
  const state = getStockState(en);
  if (state === "out") return t("favorites.stockOut", { defaultValue: "Tükendi" });
  if (state === "low" && typeof en?.stockQty === "number")
    return t("favorites.stockN", { defaultValue: "{{n}} stok", n: en.stockQty });
  if (state === "in" && typeof en?.stockQty === "number")
    return t("favorites.stockN", { defaultValue: "{{n}} stok", n: en.stockQty });
  if (state === "in") return t("favorites.stockIn", { defaultValue: "Stokta" });
  return "";
}

function getEnrichedCategoryCounts(items: FavoriteItem[]): Map<string, number> {
  const m = new Map<string, number>();
  items.forEach((p) => {
    const c = enrichmentMap.get(p.id)?.category;
    if (c) m.set(c, (m.get(c) || 0) + 1);
  });
  return m;
}

function getEnrichedSupplierCounts(items: FavoriteItem[]): Map<string, number> {
  const m = new Map<string, number>();
  items.forEach((p) => {
    const s = enrichmentMap.get(p.id)?.supplier?.name;
    if (s) m.set(s, (m.get(s) || 0) + 1);
  });
  return m;
}

const DEFAULT_LIST_ID = "default";
const RECENT_ID = "recent";
const RECENT_DAYS = 14;

/* ────────────────────────────────────────
   EMPTY STATE ILLUSTRATION
   ──────────────────────────────────────── */
const FAVORITES_EMPTY_SVG = `<img src="${favEmptySvg}" alt="${t("favorites.noFavorites")}" width="160" height="160" />`;

/* ────────────────────────────────────────
   Sort options
   ──────────────────────────────────────── */
type SortId = "added-desc" | "added-asc" | "name-asc";
const SORTS: { id: SortId; labelKey: string; defaultLabel: string }[] = [
  { id: "added-desc", labelKey: "favorites.sortAddedDesc", defaultLabel: "Yeni eklenenler" },
  { id: "added-asc", labelKey: "favorites.sortAddedAsc", defaultLabel: "Eski eklenenler" },
  { id: "name-asc", labelKey: "favorites.sortNameAsc", defaultLabel: "Ürün adı (A-Z)" },
];

function sortLabel(id: SortId): string {
  const s = SORTS.find((x) => x.id === id);
  if (!s) return "";
  return t(s.labelKey, { defaultValue: s.defaultLabel });
}

function applySort(list: FavoriteItem[], id: SortId): FavoriteItem[] {
  const out = [...list];
  if (id === "added-desc") out.sort((a, b) => b.addedAt - a.addedAt);
  else if (id === "added-asc") out.sort((a, b) => a.addedAt - b.addedAt);
  else if (id === "name-asc") out.sort((a, b) => a.title.localeCompare(b.title, "tr"));
  return out;
}

/* ────────────────────────────────────────
   Current active filter state
   ──────────────────────────────────────── */
let activeListFilter: string = "all"; // ürün sekmesi: 'all', 'default', 'recent', list id
let activeSupplierListFilter: string = "all"; // tedarikçiler sekmesi (paralel)
let searchQuery: string = "";
let sortId: SortId = "added-desc";
let viewMode: "grid" | "list" = "grid";
let currentPage: number = 1;
const PAGE_SIZE = 24;

function resetPagination(): void {
  currentPage = 1;
}

/* ────────────────────────────────────────
   Detaylı filtre state'i
   ──────────────────────────────────────── */
interface FilterState {
  categories: string[];
  suppliers: string[];
  stock: Array<"in" | "low" | "out">;
  minPrice: string;
  maxPrice: string;
}
const activeFilters: FilterState = {
  categories: [],
  suppliers: [],
  stock: [],
  minPrice: "",
  maxPrice: "",
};

function activeFilterCount(): number {
  return (
    activeFilters.categories.length +
    activeFilters.suppliers.length +
    activeFilters.stock.length +
    (activeFilters.minPrice ? 1 : 0) +
    (activeFilters.maxPrice ? 1 : 0)
  );
}

function clearAllFilters(): void {
  activeFilters.categories = [];
  activeFilters.suppliers = [];
  activeFilters.stock = [];
  activeFilters.minPrice = "";
  activeFilters.maxPrice = "";
}

function parsePriceFromRange(range: string): number {
  // priceRange "€56.49 - €120.00" veya "₺214.67" gibi olabilir
  const m = range.match(/[\d]+([.,][\d]+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : NaN;
}

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
function getRecentItems(): FavoriteItem[] {
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  return getItems().filter((i) => i.addedAt >= cutoff);
}

function renderSidebarLists(kind: "products" | "suppliers" = "products"): string {
  const lists = getLists();
  const isSeller = kind === "suppliers";
  const totalCount = isSeller ? getSellerTotalCount() : getTotalCount();
  const defaultCount = isSeller
    ? getSellerListCount(DEFAULT_LIST_ID)
    : getListItemCount(DEFAULT_LIST_ID);
  const recentCount = isSeller ? 0 : getRecentItems().length;
  const activeFilter = isSeller ? activeSupplierListFilter : activeListFilter;
  const filterAttr = isSeller ? "data-filter-supplier-list" : "data-filter-list";

  const rowBase =
    "fav-products__list-item group relative flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer transition-colors duration-150 hover:bg-surface-raised";
  const rowActive = "fav-products__list-item--active bg-surface-raised";
  const iconBase = "shrink-0 inline-flex items-center justify-center text-text-tertiary";
  const labelWrap = "flex-1 min-w-0 flex flex-col gap-0.5";
  const nameBase = "text-[13.5px] text-text-primary truncate";
  const countBase = "text-[11px] text-text-tertiary";

  const sysHeart = `<svg class="w-3.5 h-3.5 text-red-500" fill="#ef4444" stroke="#ef4444" stroke-width="1" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;
  const sysLayers = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
  const sysClock = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
  const folderIcon = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

  const sysRow = (id: string, icon: string, label: string, count: number): string => {
    const on = activeFilter === id;
    return `
      <div class="${rowBase} ${on ? rowActive : ""}" ${filterAttr}="${id}">
        <span class="${iconBase}">${icon}</span>
        <span class="${labelWrap}">
          <span class="${nameBase} ${on ? "font-semibold" : "font-medium"}">${label}</span>
          <span class="${countBase}">${t("favorites.itemCount", { count })}</span>
        </span>
      </div>
    `;
  };

  const systemRows =
    sysRow("all", sysLayers, t("favorites.listAll"), totalCount) +
    sysRow("default", sysHeart, t("favorites.defaultList"), defaultCount) +
    (isSeller
      ? ""
      : sysRow(
          RECENT_ID,
          sysClock,
          t("favorites.listRecent", { defaultValue: "Yakın zamanda" }),
          recentCount
        ));

  const customRows = lists
    .map((list) => {
      const count = isSeller ? getSellerListCount(list.id) : getListItemCount(list.id);
      const on = activeFilter === list.id;
      return `
      <div class="${rowBase} ${on ? rowActive : ""}" ${filterAttr}="${list.id}">
        <span class="${iconBase}">${folderIcon}</span>
        <span class="${labelWrap}">
          <span class="${nameBase} ${on ? "font-semibold" : "font-medium"}">${escapeHtml(list.name)}</span>
          <span class="${countBase}">${t("favorites.itemCount", { count })}</span>
        </span>
        <button type="button"
                class="fav-delete-list-btn shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md text-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-white hover:text-red-500 transition-opacity appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta-primary,#F5B800)]"
                data-delete-list="${list.id}"
                aria-label="${t("favorites.deleteList")}"
                title="${t("favorites.deleteList")}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
    })
    .join("");

  const divider = customRows
    ? `<div class="my-2 mx-3 h-px bg-border-default"></div>`
    : "";

  return `${systemRows}${divider}${customRows}`;
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

function renderFilterButton(): string {
  const items = getItems();
  const catCounts = getEnrichedCategoryCounts(items);
  const supCounts = getEnrichedSupplierCounts(items);
  const badge = activeFilterCount();

  const stockOpts: Array<{ v: "in" | "low" | "out"; l: string }> = [
    { v: "in", l: t("favorites.stockInOpt", { defaultValue: "Stokta var" }) },
    { v: "low", l: t("favorites.stockLowOpt", { defaultValue: "Az kaldı" }) },
    { v: "out", l: t("favorites.stockOutOpt", { defaultValue: "Tükendi" }) },
  ];

  const checkbox = (
    group: "cat" | "sup" | "stock",
    val: string,
    label: string,
    count?: number,
    checked?: boolean
  ): string => `
    <label class="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-surface-raised transition-colors">
      <input type="checkbox" data-fav-filter-group="${group}" data-fav-filter-val="${escapeHtml(val)}" ${checked ? "checked" : ""}
             class="w-3.5 h-3.5 rounded border-border-strong text-[var(--color-cta-primary,#F5B800)] focus:ring-1 focus:ring-[var(--color-cta-primary,#F5B800)] focus:ring-offset-0 cursor-pointer" />
      <span class="flex-1 min-w-0 text-[12.5px] text-text-primary truncate">${escapeHtml(label)}</span>
      ${typeof count === "number" ? `<span class="text-[11px] text-text-tertiary tabular-nums">${count}</span>` : ""}
    </label>
  `;

  const catRows = Array.from(catCounts.entries())
    .map(([cat, c]) => checkbox("cat", cat, cat, c, activeFilters.categories.includes(cat)))
    .join("");
  const supRows = Array.from(supCounts.entries())
    .map(([s, c]) => checkbox("sup", s, s, c, activeFilters.suppliers.includes(s)))
    .join("");
  const stockRows = stockOpts
    .map((o) => checkbox("stock", o.v, o.l, undefined, activeFilters.stock.includes(o.v)))
    .join("");

  return `
    <div class="relative" data-fav-filter-wrap>
      <button type="button" data-fav-filter-toggle
              class="relative inline-flex items-center gap-1.5 h-8 bg-white border border-border-default text-[12.5px] font-medium text-text-secondary px-2.5 rounded-md cursor-pointer transition-colors hover:border-text-secondary hover:text-text-primary appearance-none focus:outline-none focus-visible:border-[var(--color-cta-primary,#F5B800)] ${badge ? "border-[var(--color-cta-primary,#F5B800)] text-text-primary" : ""}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
        ${t("favorites.filter", { defaultValue: "Filtrele" })}
        ${badge ? `<span class="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full bg-[var(--color-cta-primary,#F5B800)] text-white tabular-nums">${badge}</span>` : ""}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div data-fav-filter-menu class="hidden absolute top-[calc(100%+6px)] right-0 z-30 w-[300px] max-h-[480px] overflow-y-auto bg-white border border-border-default rounded-xl shadow-[0_24px_60px_-12px_rgba(20,20,18,0.18),0_8px_20px_-6px_rgba(20,20,18,0.08)] p-2">
        ${
          catRows
            ? `<div class="mb-1.5">
                <div class="text-[10.5px] uppercase tracking-[0.1em] font-semibold text-text-tertiary px-2 py-1">${t("favorites.filterCategory", { defaultValue: "Kategori" })}</div>
                ${catRows}
              </div>`
            : ""
        }
        ${
          supRows
            ? `<div class="mb-1.5 border-t border-border-default pt-1.5">
                <div class="text-[10.5px] uppercase tracking-[0.1em] font-semibold text-text-tertiary px-2 py-1">${t("favorites.filterSupplier", { defaultValue: "Tedarikçi" })}</div>
                ${supRows}
              </div>`
            : ""
        }
        <div class="mb-1.5 border-t border-border-default pt-1.5">
          <div class="text-[10.5px] uppercase tracking-[0.1em] font-semibold text-text-tertiary px-2 py-1">${t("favorites.filterStock", { defaultValue: "Stok durumu" })}</div>
          ${stockRows}
        </div>
        <div class="border-t border-border-default pt-1.5">
          <div class="text-[10.5px] uppercase tracking-[0.1em] font-semibold text-text-tertiary px-2 py-1">${t("favorites.filterPriceRange", { defaultValue: "Fiyat aralığı" })}</div>
          <div class="flex items-center gap-2 px-2 py-1.5">
            <input type="number" data-fav-filter-min value="${escapeHtml(activeFilters.minPrice)}" placeholder="Min"
                   class="flex-1 min-w-0 h-7 px-2 text-[12px] bg-white border border-border-default rounded-md focus:border-[var(--color-cta-primary,#F5B800)] focus:outline-none appearance-none" />
            <input type="number" data-fav-filter-max value="${escapeHtml(activeFilters.maxPrice)}" placeholder="Max"
                   class="flex-1 min-w-0 h-7 px-2 text-[12px] bg-white border border-border-default rounded-md focus:border-[var(--color-cta-primary,#F5B800)] focus:outline-none appearance-none" />
          </div>
        </div>
        <div class="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border-default px-1">
          <button type="button" data-fav-filter-reset class="th-btn-outline h-7 px-3 text-[12px] font-semibold inline-flex items-center justify-center appearance-none focus:outline-none">${t("favorites.filterReset", { defaultValue: "Sıfırla" })}</button>
          <button type="button" data-fav-filter-apply class="th-btn h-7 px-4 text-[12px] font-semibold inline-flex items-center justify-center appearance-none focus:outline-none">${t("favorites.filterApply", { defaultValue: "Uygula" })}</button>
        </div>
      </div>
    </div>
  `;
}

function getActiveListName(): string {
  if (activeListFilter === "all") return t("favorites.listAll");
  if (activeListFilter === DEFAULT_LIST_ID) return t("favorites.defaultList");
  if (activeListFilter === RECENT_ID)
    return t("favorites.listRecent", { defaultValue: "Yakın zamanda" });
  const list = getLists().find((l) => l.id === activeListFilter);
  return list ? list.name : t("favorites.listAll");
}

function renderToolbar(count: number): string {
  const titleName = escapeHtml(getActiveListName());
  const searchValue = escapeHtml(searchQuery);
  const sortBtnLabel = escapeHtml(sortLabel(sortId));

  const viewBtn = (mode: "grid" | "list", svg: string, label: string): string => {
    const on = viewMode === mode;
    return `<button type="button" data-view="${mode}" aria-label="${label}" title="${label}"
              class="inline-flex items-center justify-center w-7 h-7 rounded cursor-pointer appearance-none focus:outline-none transition-colors ${on ? "bg-white text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "bg-transparent text-text-tertiary hover:text-text-primary"}">${svg}</button>`;
  };

  const gridSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`;
  const listSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`;

  return `
    <div class="fav-toolbar flex flex-wrap items-center gap-3 mb-4">
      <div class="inline-flex items-center gap-2">
        <h2 class="text-base font-bold text-text-primary m-0">${titleName}</h2>
        <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-surface-raised text-text-secondary">${t("favorites.itemCount", { count })}</span>
      </div>

      <label class="flex-1 min-w-[180px] max-w-[340px] inline-flex items-center gap-1.5 h-8 bg-white border border-border-default rounded-md px-2.5 focus-within:border-[var(--color-cta-primary,#F5B800)] transition-colors">
        <svg class="w-3.5 h-3.5 text-text-tertiary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text"
               data-fav-search
               value="${searchValue}"
               placeholder="${t("favorites.searchPlaceholder", { defaultValue: "Bu listede ara — ürün, tedarikçi, kategori..." })}"
               class="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[12.5px] text-text-primary placeholder:text-text-tertiary appearance-none" />
        ${
          searchQuery
            ? `<button type="button" data-fav-search-clear aria-label="${t("common.clear", { defaultValue: "Temizle" })}" class="shrink-0 w-4 h-4 inline-flex items-center justify-center rounded-full text-text-tertiary hover:bg-surface-raised hover:text-text-primary appearance-none focus:outline-none"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`
            : ""
        }
      </label>

      ${renderFilterButton()}

      <div class="relative" data-fav-sort-wrap>
        <button type="button" data-fav-sort-toggle
                class="inline-flex items-center gap-1.5 h-8 bg-white border border-border-default text-[12.5px] font-medium text-text-secondary px-2.5 rounded-md cursor-pointer transition-colors hover:border-text-secondary hover:text-text-primary appearance-none focus:outline-none focus-visible:border-[var(--color-cta-primary,#F5B800)]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h13M3 12h9M3 18h5"/><path d="M18 9V4M18 9l-2-2M18 9l2-2M18 15v5M18 15l-2 2M18 15l2 2"/></svg>
          ${sortBtnLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div data-fav-sort-menu
             class="hidden absolute top-[calc(100%+6px)] right-0 z-30 min-w-[200px] bg-white border border-border-default rounded-xl shadow-[0_24px_60px_-12px_rgba(20,20,18,0.18),0_8px_20px_-6px_rgba(20,20,18,0.08)] p-1.5">
          ${SORTS.map((s) => {
            const on = sortId === s.id;
            return `<button type="button" data-fav-sort-pick="${s.id}"
                            class="w-full flex items-center justify-between gap-2 bg-transparent border-0 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer text-left transition-colors hover:bg-surface-raised appearance-none focus:outline-none ${on ? "font-semibold text-[var(--color-cta-primary,#F5B800)]" : "text-text-primary"}">
                      <span>${escapeHtml(t(s.labelKey, { defaultValue: s.defaultLabel }))}</span>
                      ${on ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>` : ""}
                    </button>`;
          }).join("")}
        </div>
      </div>

      <div class="inline-flex items-center gap-0.5 h-8 p-0.5 bg-surface-raised rounded-md" role="tablist" aria-label="${t("favorites.products")}">
        ${viewBtn("grid", gridSvg, "Izgara")}
        ${viewBtn("list", listSvg, "Liste")}
      </div>
    </div>
  `;
}

function renderStockPill(en: FavEnrichment | undefined): string {
  const state = getStockState(en);
  if (state === "unknown") return "";
  const label = getStockLabel(en);
  if (!label) return "";
  const cls =
    state === "out"
      ? "bg-neutral-800/85 text-white [&_.dot]:bg-red-400"
      : state === "low"
        ? "bg-neutral-800/85 text-white [&_.dot]:bg-amber-400"
        : "bg-neutral-800/85 text-white [&_.dot]:bg-emerald-400";
  return `
    <span class="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-medium rounded-full ${cls}">
      <span class="dot inline-block w-1.5 h-1.5 rounded-full"></span>
      ${escapeHtml(label)}
    </span>
  `;
}

function renderSupplierLine(en: FavEnrichment | undefined): string {
  if (!en?.supplier) return "";
  const sup = en.supplier;
  return `
    <div class="text-[11px] text-text-tertiary inline-flex items-center gap-1 truncate">
      <span class="truncate">${escapeHtml(sup.name)}</span>
      ${
        sup.verified
          ? `<span class="text-[var(--color-cta-primary,#F5B800)] shrink-0" title="Doğrulanmış"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></span>`
          : ""
      }
    </div>
  `;
}

function renderProductCardGrid(p: FavoriteItem): string {
  const detailHref = `/pages/product-detail.html?id=${encodeURIComponent(p.id)}`;
  const lists = getLists();
  const enrichment = enrichmentMap.get(p.id);
  const tagChips = p.listIds
    .filter((id) => id !== DEFAULT_LIST_ID)
    .map((id) => lists.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
    .map(
      (l) =>
        `<span class="inline-flex items-center px-1.5 py-0 text-[9.5px] font-medium rounded-full bg-surface-raised text-text-secondary leading-[15px] shrink-0 whitespace-nowrap">${escapeHtml(l.name)}</span>`
    )
    .join("");

  return `
    <article class="group relative flex flex-col bg-white border border-[#eee] rounded-md overflow-hidden transition-all duration-150 hover:border-[var(--color-cta-primary,#F5B800)] hover:shadow-[0_4px_10px_-6px_rgba(20,20,18,0.12)]" data-fav-item-id="${p.id}">
      <a href="${detailHref}" class="relative block aspect-square overflow-hidden bg-[#fafafa] no-underline">
        <img src="${p.image}" alt="${escapeHtml(p.title)}"
             class="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.03]"
             loading="lazy" />
        ${renderStockPill(enrichment)}
      </a>
      <button type="button"
              class="fav-remove-item absolute top-1.5 right-1.5 w-8 h-8 inline-flex items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(20,20,18,0.12)] text-[#ef4444] cursor-pointer p-0 border-0 transition-transform duration-150 hover:scale-110 active:scale-95 appearance-none focus:outline-none focus-visible:border focus-visible:border-[var(--color-cta-primary,#F5B800)]"
              data-remove-id="${p.id}"
              aria-label="${t("favorites.removeFromAll")}"
              title="${t("favorites.removeFromAll")}">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      </button>
      <div class="flex flex-1 flex-col p-2 max-sm:p-1.5">
        ${renderSupplierLine(enrichment)}
        <a href="${detailHref}" class="no-underline text-inherit">
          <h4 class="text-[11.5px] leading-[1.3] text-text-primary font-normal line-clamp-2 m-0 min-h-[30px] group-hover:text-[var(--color-cta-primary,#F5B800)] transition-colors">${escapeHtml(p.title)}</h4>
        </a>
        <div class="text-[13px] font-bold text-text-primary leading-none tracking-[-0.01em] tabular-nums mt-1">${formatPrice(p.priceRange)}</div>
        <p class="text-[10.5px] text-text-tertiary m-0 leading-[13px] mt-0.5 truncate">${escapeHtml(p.minOrder)}</p>
        <div class="flex flex-nowrap gap-1 mt-1 h-[15px] overflow-hidden">${tagChips}</div>
        <div class="mt-auto pt-1.5">
          <button type="button" data-add-to-cart="${p.id}"
                  class="th-btn w-full h-7 px-2 text-[11px] font-semibold inline-flex items-center justify-center gap-1 appearance-none focus:outline-none">
            <svg class="shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.4 12.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.6L21 7H6"/></svg>
            <span class="truncate">${t("favorites.addToCart", { defaultValue: "Sepete ekle" })}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderProductRowList(p: FavoriteItem): string {
  const detailHref = `/pages/product-detail.html?id=${encodeURIComponent(p.id)}`;
  const lists = getLists();
  const tagChips = p.listIds
    .filter((id) => id !== DEFAULT_LIST_ID)
    .map((id) => lists.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
    .map(
      (l) =>
        `<span class="inline-flex items-center px-1.5 py-0 text-[10px] font-medium rounded-full bg-surface-raised text-text-secondary leading-[16px]">${escapeHtml(l.name)}</span>`
    )
    .join("");

  return `
    <article class="group relative flex items-center gap-3 bg-white border border-[#eee] rounded-lg p-2.5 transition-all duration-150 hover:border-[var(--color-cta-primary,#F5B800)] hover:shadow-[0_4px_12px_-6px_rgba(20,20,18,0.12)] max-sm:flex-col max-sm:items-start" data-fav-item-id="${p.id}">
      <a href="${detailHref}" class="relative w-[88px] h-[88px] shrink-0 rounded-md overflow-hidden bg-[#fafafa] no-underline max-sm:w-full max-sm:h-[160px]">
        <img src="${p.image}" alt="${escapeHtml(p.title)}"
             class="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.04]"
             loading="lazy" />
      </a>
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <a href="${detailHref}" class="no-underline text-inherit">
          <h4 class="text-[12.5px] leading-[1.4] text-text-primary font-medium line-clamp-2 m-0 group-hover:text-[var(--color-cta-primary,#F5B800)] transition-colors">${escapeHtml(p.title)}</h4>
        </a>
        <p class="text-[11px] text-text-tertiary m-0">${escapeHtml(p.minOrder)}</p>
        ${tagChips ? `<div class="flex flex-wrap gap-1">${tagChips}</div>` : ""}
      </div>
      <div class="flex flex-col items-end gap-1.5 shrink-0 max-sm:flex-row max-sm:items-center max-sm:w-full max-sm:justify-between">
        <div class="text-[14px] font-bold text-text-primary tracking-[-0.01em] tabular-nums whitespace-nowrap">${formatPrice(p.priceRange)}</div>
        <div class="inline-flex items-center gap-1">
          <button type="button" data-add-to-cart="${p.id}"
                  class="th-btn h-7 px-2.5 text-[11.5px] font-semibold inline-flex items-center justify-center gap-1 appearance-none focus:outline-none">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.4 12.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.6L21 7H6"/></svg>
            ${t("favorites.addToCart", { defaultValue: "Sepete ekle" })}
          </button>
          <button type="button"
                  class="fav-remove-item w-7 h-7 inline-flex items-center justify-center rounded-md text-[#ef4444] cursor-pointer p-0 border border-border-default bg-white hover:border-[#ef4444] hover:bg-[#fff5f5] transition-colors appearance-none focus:outline-none"
                  data-remove-id="${p.id}"
                  aria-label="${t("favorites.removeFromAll")}"
                  title="${t("favorites.removeFromAll")}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderPagination(total: number, page: number): string {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pageCount <= 1) return "";

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const pages: (number | "…")[] = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) pages.push(i);
    if (page < pageCount - 2) pages.push("…");
    pages.push(pageCount);
  }

  const btnBase =
    "inline-flex items-center justify-center w-7 h-7 rounded-md border text-[12px] font-medium cursor-pointer appearance-none focus:outline-none transition-colors";
  const btnIdle =
    "bg-white border-border-default text-text-secondary hover:border-text-secondary hover:text-text-primary";
  const btnOn =
    "bg-[var(--color-cta-primary,#F5B800)] border-[var(--color-cta-primary,#F5B800)] text-white hover:opacity-95";
  const btnDisabled = "opacity-40 cursor-not-allowed";

  const pageBtns = pages
    .map((p) =>
      p === "…"
        ? `<span class="inline-flex items-center justify-center w-7 h-7 text-text-tertiary text-[12px]">…</span>`
        : `<button type="button" data-fav-page="${p}" class="${btnBase} ${page === p ? btnOn : btnIdle}">${p}</button>`
    )
    .join("");

  const prev = `<button type="button" data-fav-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Önceki" class="${btnBase} ${btnIdle} ${page === 1 ? btnDisabled : ""}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>`;
  const next = `<button type="button" data-fav-page="${page + 1}" ${page === pageCount ? "disabled" : ""} aria-label="Sonraki" class="${btnBase} ${btnIdle} ${page === pageCount ? btnDisabled : ""}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>`;

  return `
    <nav class="flex flex-wrap items-center justify-between gap-2 mt-5 text-[12px]">
      <span class="text-text-tertiary">
        <b class="text-text-primary">${start}–${end}</b> / <b>${total}</b>
      </span>
      <div class="inline-flex items-center gap-1 flex-wrap">
        ${prev}${pageBtns}${next}
      </div>
    </nav>
  `;
}

function renderProductCards(items: FavoriteItem[]): string {
  // Apply search + filters + sort
  const q = searchQuery.trim().toLowerCase();
  let visible = q ? items.filter((p) => p.title.toLowerCase().includes(q)) : items;

  // Filter: kategori
  if (activeFilters.categories.length) {
    visible = visible.filter((p) => {
      const cat = enrichmentMap.get(p.id)?.category;
      return cat ? activeFilters.categories.includes(cat) : false;
    });
  }
  // Filter: tedarikçi
  if (activeFilters.suppliers.length) {
    visible = visible.filter((p) => {
      const sup = enrichmentMap.get(p.id)?.supplier?.name;
      return sup ? activeFilters.suppliers.includes(sup) : false;
    });
  }
  // Filter: stok durumu
  if (activeFilters.stock.length) {
    visible = visible.filter((p) => {
      const s = getStockState(enrichmentMap.get(p.id));
      return s !== "unknown" && activeFilters.stock.includes(s);
    });
  }
  // Filter: fiyat aralığı
  const min = activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : NaN;
  const max = activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : NaN;
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    visible = visible.filter((p) => {
      const v = parsePriceFromRange(p.priceRange);
      if (Number.isNaN(v)) return false;
      if (!Number.isNaN(min) && v < min) return false;
      if (!Number.isNaN(max) && v > max) return false;
      return true;
    });
  }

  visible = applySort(visible, sortId);

  const total = visible.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > pageCount) currentPage = pageCount;
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toolbar = renderToolbar(total);

  if (total === 0) {
    return `
      <div class="px-5 pt-5 pb-7 max-sm:px-2.5">
        ${toolbar}
        ${searchQuery
          ? `<div class="flex flex-col items-center text-center py-15 px-5">
              <h3 class="text-base font-bold text-text-primary mb-2.5">${t("favorites.noSearchResults", { defaultValue: "Sonuç bulunamadı" })}</h3>
              <p class="text-sm text-text-tertiary max-w-[380px]">${t("favorites.noSearchResultsDesc", { defaultValue: "Aramayı temizleyip tekrar deneyebilirsin." })}</p>
            </div>`
          : renderEmptyState()}
      </div>
    `;
  }

  const resultInfo = `
    <div class="flex items-center justify-between gap-2 mb-3 text-[12px] text-text-secondary">
      <span><b class="text-text-primary">${total}</b> ${t("favorites.itemsListed", { defaultValue: "ürün listelendi" })}</span>
    </div>
  `;

  const pagination = renderPagination(total, currentPage);

  if (viewMode === "list") {
    return `
      <div class="px-5 pt-5 pb-7 max-sm:px-2.5">
        ${toolbar}
        ${resultInfo}
        <div class="flex flex-col gap-2.5">${pageItems.map(renderProductRowList).join("")}</div>
        ${pagination}
      </div>
    `;
  }

  return `
    <div class="px-5 pt-5 pb-7 max-sm:px-2.5">
      ${toolbar}
      ${resultInfo}
      <div class="grid gap-2 sm:gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        ${pageItems.map(renderProductCardGrid).join("")}
      </div>
      ${pagination}
    </div>
  `;
}

function renderFavorites(): string {
  const tabBase =
    "fav-tabs__tab th-no-press relative inline-flex items-center gap-2 py-2 px-3 text-[13px] font-medium text-text-tertiary bg-transparent border-0 cursor-pointer transition-colors duration-150 hover:text-text-primary appearance-none focus:outline-none [&.fav-tabs__tab--active]:text-text-primary [&.fav-tabs__tab--active]:font-semibold [&.fav-tabs__tab--active]:after:content-[''] [&.fav-tabs__tab--active]:after:absolute [&.fav-tabs__tab--active]:after:left-3 [&.fav-tabs__tab--active]:after:right-3 [&.fav-tabs__tab--active]:after:-bottom-px [&.fav-tabs__tab--active]:after:h-0.5 [&.fav-tabs__tab--active]:after:bg-[var(--color-cta-primary,#F5B800)] [&.fav-tabs__tab--active]:after:rounded-sm";

  const productsCount = getTotalCount();
  const suppliersCount = getSellerTotalCount();

  const sidebarHeader = `
    <div class="flex items-center justify-between px-2 mb-2">
      <h3 class="text-[11px] uppercase tracking-[0.1em] font-semibold text-text-tertiary m-0">${t("favorites.myList")}</h3>
      <button type="button" data-action="create-list"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold rounded-full border border-dashed border-border-strong text-text-secondary hover:border-[var(--color-cta-primary,#F5B800)] hover:text-[var(--color-cta-primary,#F5B800)] hover:bg-surface-raised transition-colors appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta-primary,#F5B800)] cursor-pointer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        ${t("favorites.newList", { defaultValue: "Yeni" })}
      </button>
    </div>
  `;

  return `
    <div class="px-8 pt-5 pb-0 max-sm:px-3 max-sm:pt-4">
      <h1 class="text-[20px] font-semibold tracking-[-0.015em] text-text-primary m-0 leading-tight">${t("favorites.title")}</h1>
    </div>

    <div class="fav-tabs flex gap-1 px-6 max-sm:px-2 border-b border-border-default mt-2" data-tabgroup="fav">
      <button class="${tabBase} fav-tabs__tab--active" data-tab="fav-products">
        ${t("favorites.products")}
        <span class="inline-flex items-center px-1.5 py-0 text-[10px] font-bold rounded-full bg-[#fff4cc] text-[var(--color-cta-primary,#F5B800)] leading-[16px]">${productsCount}</span>
      </button>
      <button class="${tabBase}" data-tab="fav-suppliers">
        ${t("favorites.suppliers")}
        <span class="inline-flex items-center px-1.5 py-0 text-[10px] font-bold rounded-full bg-surface-raised text-text-secondary leading-[16px]">${suppliersCount}</span>
      </button>
    </div>

    <!-- Tab: Products -->
    <div class="fav-tab-content fav-tab-content--active hidden [&.fav-tab-content--active]:block" data-content="fav-products">
      <div class="fav-products grid grid-cols-[220px_minmax(0,1fr)] min-h-[400px] max-md:grid-cols-1">
        <aside class="fav-products__sidebar flex flex-col gap-1 py-6 pl-6 pr-3 max-md:pl-3 max-md:pr-3 max-md:border-b max-md:border-[#f0f0f0]">
          ${sidebarHeader}
          <div class="flex flex-col gap-0.5" id="fav-list-sidebar">
            ${renderSidebarLists()}
          </div>
        </aside>
        <div class="min-w-0 border-l border-border-default max-md:border-l-0 max-md:border-t" id="fav-products-container">
          <!-- Populated via JS -->
          ${renderEmptyState()}
        </div>
      </div>
    </div>

    <!-- Tab: Suppliers -->
    <div class="fav-tab-content hidden [&.fav-tab-content--active]:block" data-content="fav-suppliers">
      <div class="fav-products grid grid-cols-[220px_minmax(0,1fr)] min-h-[400px] max-md:grid-cols-1">
        <aside class="fav-products__sidebar flex flex-col gap-1 py-6 pl-6 pr-3 max-md:pl-3 max-md:pr-3 max-md:border-b max-md:border-[#f0f0f0]">
          ${sidebarHeader}
          <div class="flex flex-col gap-0.5" id="fav-supplier-list-sidebar">
            ${renderSidebarLists("suppliers")}
          </div>
        </aside>
        <div class="min-w-0 border-l border-border-default max-md:border-l-0 max-md:border-t" id="fav-suppliers-container">
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
  if (activeListFilter === "all") return getItems();
  if (activeListFilter === RECENT_ID) return getRecentItems();
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
  initToolbar();
  initFilterMenu();

  // Lazy enrichment: ilk render'dan sonra fetch et, bittiğinde re-render
  if (items.length > 0) {
    const fingerprint = items.map((i) => i.id).sort().join(",");
    if (fingerprint !== enrichmentLoadedFor && !enrichmentLoading) {
      void loadEnrichments(items).then(() => {
        const c = document.getElementById("fav-products-container");
        if (c) {
          c.innerHTML = renderProductCards(getFilteredItems());
          initRemoveButtons();
          initToolbar();
          initFilterMenu();
        }
      });
    }
  }
}

let _favSortOutsideWired = false;
function wireSortOutsideClickOnce(): void {
  if (_favSortOutsideWired) return;
  _favSortOutsideWired = true;
  document.addEventListener("mousedown", (e) => {
    const sortWrap = document.querySelector<HTMLElement>("[data-fav-sort-wrap]");
    if (!sortWrap) return;
    if (sortWrap.contains(e.target as Node)) return;
    const sortMenu = sortWrap.querySelector<HTMLElement>("[data-fav-sort-menu]");
    sortMenu?.classList.add("hidden");
  });
}

let _favFilterOutsideWired = false;
function wireFilterOutsideClickOnce(): void {
  if (_favFilterOutsideWired) return;
  _favFilterOutsideWired = true;
  document.addEventListener("mousedown", (e) => {
    const wrap = document.querySelector<HTMLElement>("[data-fav-filter-wrap]");
    if (!wrap) return;
    if (wrap.contains(e.target as Node)) return;
    const menu = wrap.querySelector<HTMLElement>("[data-fav-filter-menu]");
    menu?.classList.add("hidden");
  });
}

function initFilterMenu(): void {
  const wrap = document.querySelector<HTMLElement>("[data-fav-filter-wrap]");
  if (!wrap) return;

  const toggle = wrap.querySelector<HTMLButtonElement>("[data-fav-filter-toggle]");
  const menu = wrap.querySelector<HTMLElement>("[data-fav-filter-menu]");
  toggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu?.classList.toggle("hidden");
  });

  wrap.querySelectorAll<HTMLInputElement>("[data-fav-filter-group]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const group = cb.dataset.favFilterGroup;
      const val = cb.dataset.favFilterVal || "";
      if (group === "cat") {
        const set = new Set(activeFilters.categories);
        cb.checked ? set.add(val) : set.delete(val);
        activeFilters.categories = Array.from(set);
      } else if (group === "sup") {
        const set = new Set(activeFilters.suppliers);
        cb.checked ? set.add(val) : set.delete(val);
        activeFilters.suppliers = Array.from(set);
      } else if (group === "stock") {
        const v = val as "in" | "low" | "out";
        const set = new Set(activeFilters.stock);
        cb.checked ? set.add(v) : set.delete(v);
        activeFilters.stock = Array.from(set) as Array<"in" | "low" | "out">;
      }
    });
  });

  const minInput = wrap.querySelector<HTMLInputElement>("[data-fav-filter-min]");
  const maxInput = wrap.querySelector<HTMLInputElement>("[data-fav-filter-max]");
  minInput?.addEventListener("input", () => {
    activeFilters.minPrice = minInput.value;
  });
  maxInput?.addEventListener("input", () => {
    activeFilters.maxPrice = maxInput.value;
  });

  wrap.querySelector<HTMLButtonElement>("[data-fav-filter-reset]")?.addEventListener("click", () => {
    clearAllFilters();
    resetPagination();
    menu?.classList.add("hidden");
    loadFavoritesData();
  });
  wrap.querySelector<HTMLButtonElement>("[data-fav-filter-apply]")?.addEventListener("click", () => {
    resetPagination();
    menu?.classList.add("hidden");
    loadFavoritesData();
  });

  wireFilterOutsideClickOnce();
}

function initToolbar(): void {
  const search = document.querySelector<HTMLInputElement>("[data-fav-search]");
  search?.addEventListener("input", (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    resetPagination();
    loadFavoritesData();
    const next = document.querySelector<HTMLInputElement>("[data-fav-search]");
    if (next) {
      next.focus();
      const v = next.value;
      next.setSelectionRange(v.length, v.length);
    }
  });

  document.querySelector<HTMLButtonElement>("[data-fav-search-clear]")?.addEventListener("click", () => {
    searchQuery = "";
    resetPagination();
    loadFavoritesData();
  });

  const sortWrap = document.querySelector<HTMLElement>("[data-fav-sort-wrap]");
  const sortToggle = sortWrap?.querySelector<HTMLButtonElement>("[data-fav-sort-toggle]");
  const sortMenu = sortWrap?.querySelector<HTMLElement>("[data-fav-sort-menu]");
  sortToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    sortMenu?.classList.toggle("hidden");
  });
  sortMenu?.querySelectorAll<HTMLButtonElement>("[data-fav-sort-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const picked = btn.dataset.favSortPick as SortId | undefined;
      if (!picked) return;
      sortId = picked;
      resetPagination();
      loadFavoritesData();
    });
  });
  wireSortOutsideClickOnce();

  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.view;
      if (v === "grid" || v === "list") {
        viewMode = v;
        loadFavoritesData();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-fav-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const next = Number(btn.dataset.favPage);
      if (!Number.isFinite(next) || next < 1) return;
      currentPage = next;
      loadFavoritesData();
      const main = document.getElementById("fav-products-container");
      main?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
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
      resetPagination();

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

        tabs.forEach((t) => t.classList.remove("fav-tabs__tab--active"));
        tab.classList.add("fav-tabs__tab--active");

        const parent = tabGroup.parentElement;
        if (!parent) return;
        parent.querySelectorAll<HTMLElement>(".fav-tab-content").forEach((panel) => {
          panel.classList.toggle("fav-tab-content--active", panel.dataset.content === targetId);
        });
      });
    });
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
