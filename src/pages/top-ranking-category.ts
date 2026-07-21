/**
 * Top Ranking Category Page — Entry Point
 *
 * URL: /pages/top-ranking-category.html?cat=<slug>&sort=<key>&page=<1|2>
 *
 * Bir kategoriye özgü Top 100 sayfası. Mevcut `searchListings` API'sini
 * `category + sort_by + page_size=50` ile çağırır; sıra rozetlerini
 * (page-1)*50 + index + 1 ile hesaplar; klasik sayfalama gösterir.
 */

import "../style.css";
import Alpine from "alpinejs";
import { initFlowbite } from "flowbite";
import { t } from "../i18n";

import {
  TopBar,
  SubHeader,
  MegaMenu,
  initMegaMenu,
  initHeaderCart,
} from "../components/header";
import { initLanguageSelector } from "../components/header/TopBar";
import { mountChatPopup, initChatTriggers } from "../components/chat-popup";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { FooterLinks } from "../components/footer";
import { FloatingPanel } from "../components/floating";
import { startAlpine } from "../alpine";
// B-2: loginModal ayrı modül (misafir login modalı bu sayfada).
import "../alpine/loginModal";
import {
  TopRankingStickyMobileHeader,
  TopRankingMobileHeader,
  TopRankingSortPills,
} from "../components/top-ranking";
import {
  TopRankingCategoryHero,
  TopRankingCategoryGrid,
  TopRankingCategoryPagination,
} from "../components/top-ranking-category";
import { renderListingCard, initProductSliders } from "../components/shared/ListingCard";
import { BottomSheet } from "../components/shared/BottomSheet";
import {
  initCategoryDrillSheet,
  categoryDrillSkeleton,
  type CategoryDrillController,
  type DrillCategory,
} from "../components/shared/CategoryDrillSheet";
import { ListingCartDrawer, initListingCartDrawer } from "../components/products";
import { applyListingSocialProof } from "../components/products/initListingSocialProof";
import {
  initListingFavoriteTriggers,
  syncListingFavoriteHearts,
} from "../components/products/initListingFavorites";
import { LoginModal } from "../components/product";
import { searchListings } from "../services/listingService";
import { initCurrency } from "../services/currencyService";
import { loadCategories, type ApiCategory } from "../services/categoryService";
import type { ProductListingCard } from "../types/productListing";
import { initAnimatedPlaceholder } from "../utils/animatedPlaceholder";
import { saveRecentCategory } from "../services/recentHistoryService";

const PAGE_SIZE = 50;
const MAX_PAGES = 2;

type SortKey = "hot-selling" | "most-popular" | "best-reviewed";

const SORT_KEY_TO_BACKEND: Record<SortKey, string> = {
  "hot-selling": "orders",
  "most-popular": "views",
  "best-reviewed": "rating",
};

const VALID_SORTS: SortKey[] = ["hot-selling", "most-popular", "best-reviewed"];

function parseSearchParams(): { cat: string; sort: SortKey; page: number } {
  const sp = new URLSearchParams(window.location.search);
  const cat = (sp.get("cat") || "").trim();
  const sortRaw = (sp.get("sort") || "hot-selling").trim() as SortKey;
  const sort: SortKey = VALID_SORTS.includes(sortRaw) ? sortRaw : "hot-selling";
  const pageRaw = parseInt(sp.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 && pageRaw <= MAX_PAGES ? pageRaw : 1;
  return { cat, sort, page };
}

/** Paylaşılan mobil drill sheet'in controller'ı — openCategoryDropdown mobil dalında açılır. */
let drillCtl: CategoryDrillController | null = null;

function syncUrl(cat: string, sort: SortKey, page: number): void {
  const sp = new URLSearchParams();
  if (cat) sp.set("cat", cat);
  sp.set("sort", sort);
  sp.set("page", String(page));
  const url = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, "", url);
}

Alpine.data("topRankingCategoryPage", () => ({
  // URL state
  category: "",
  page: 1,
  activeSort: "hot-selling" as SortKey,

  // Data
  products: [] as ProductListingCard[],
  totalProducts: 0,
  totalPages: 1,
  loading: false,
  categoryName: "",
  apiCategories: [] as ApiCategory[],

  // Mobil in-hero arama — bu kategorinin sıralamasını filtreler (TopDeals deseni)
  showSearch: false,
  searchQuery: "",

  // Mevcut TopRankingFilters'ın beklediği state
  // (ana TopRanking sayfasındakiyle uyumlu; dropdown'un çalışması için gerekli)
  categoryDropdownOpen: false,
  categoryDropdownLevel: 1 as 1 | 2,
  selectedMainCategory: null as string | null,
  pendingSubCategory: null as string | null,
  // Dropdown'da "Tümü" gözükmesi için
  activeTab: "all" as string,
  activeCategory: "all" as string,

  init() {
    const parsed = parseSearchParams();
    this.category = parsed.cat;
    this.activeSort = parsed.sort;
    this.page = parsed.page;
    this.activeCategory = parsed.cat || "all";
    this.activeTab = parsed.cat || "all";
    this.selectedMainCategory = parsed.cat || null;

    loadCategories()
      .then((cats) => {
        this.apiCategories = cats;
        this.resolveCategoryName();
        this.initDrillSheet();
      })
      .catch((err) => console.warn("[TopRankingCategory] Category load failed:", err));

    initCurrency()
      .then(() => this.fetchPage())
      .catch((err) => console.warn("[TopRankingCategory] Init failed:", err));
  },

  resolveCategoryName(): void {
    if (!this.category) {
      this.categoryName = "";
      return;
    }
    for (const main of this.apiCategories) {
      if (main.slug === this.category) {
        this.categoryName = main.name;
        saveRecentCategory({ slug: this.category, name: main.name });
        return;
      }
      const sub = main.children?.find((c) => c.slug === this.category);
      if (sub) {
        this.categoryName = sub.name;
        saveRecentCategory({ slug: this.category, name: sub.name });
        return;
      }
    }
    // Bulunamadı — boş bırak (template fallback gösterebilir)
    this.categoryName = "";
  },

  async fetchPage(): Promise<void> {
    if (!this.category) {
      this.products = [];
      this.totalProducts = 0;
      this.totalPages = 1;
      return;
    }
    if (this.loading) return;
    this.loading = true;
    try {
      const params: Record<string, unknown> = {
        category: this.category,
        sort_by: SORT_KEY_TO_BACKEND[this.activeSort],
        page: this.page,
        page_size: PAGE_SIZE,
      };
      // Kategori kapsamı korunur — arama yalnız bu sıralamanın içini daraltır.
      const q = this.searchQuery.trim();
      if (q) params.query = q;
      const result = await searchListings(params);
      this.products = result.products || [];
      this.totalProducts = result.searchHeader?.totalProducts || this.products.length;
      this.totalPages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(this.totalProducts / PAGE_SIZE)));
      // page clamp (kategori 1 sayfaya düştüyse ve URL'de page=2 vardıysa)
      if (this.page > this.totalPages) {
        this.page = this.totalPages;
        syncUrl(this.category, this.activeSort, this.page);
      }
      this.$nextTick(() => this.afterGridRender());
    } catch (err) {
      console.warn("[TopRankingCategory] fetchPage failed:", err);
      this.products = [];
      this.totalProducts = 0;
      this.totalPages = 1;
    } finally {
      this.loading = false;
    }
  },

  setSort(sortMode: string): void {
    if (this.activeSort === sortMode) return;
    this.activeSort = sortMode as SortKey;
    this.page = 1;
    syncUrl(this.category, this.activeSort, this.page);
    this.fetchPage();
  },

  /* ── Mobil in-hero arama (topDealsPage ile aynı akış) ── */
  openSearch(): void {
    this.showSearch = true;
    this.$nextTick(() => {
      const input = (this.$refs as Record<string, HTMLElement>).rankingSearchInput as
        | HTMLInputElement
        | undefined;
      input?.focus();
    });
  },

  closeSearch(): void {
    this.showSearch = false;
    // Grid'i yalnız gerçekten uygulanmış bir sorgu varsa sıfırla.
    if (this.searchQuery) {
      this.searchQuery = "";
      this.page = 1;
      this.fetchPage();
    }
  },

  clearSearch(): void {
    this.searchQuery = "";
    this.page = 1;
    this.fetchPage();
    this.$nextTick(() => {
      const input = (this.$refs as Record<string, HTMLElement>).rankingSearchInput as
        | HTMLInputElement
        | undefined;
      input?.focus();
    });
  },

  submitSearch(): void {
    this.page = 1;
    this.fetchPage();
  },

  goToPage(n: number): void {
    if (n < 1 || n > this.totalPages || n === this.page) return;
    this.page = n;
    syncUrl(this.category, this.activeSort, this.page);
    this.fetchPage().then(() => {
      const el = document.getElementById("trc-grid-anchor");
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  },

  /* Kart etkileşim altyapısı her grid render'ından sonra tazelenir
     (top-deals.ts afterGridRender'ıyla aynı sıra). */
  afterGridRender(): void {
    initListingCartDrawer(this.products);
    initProductSliders();
    applyListingSocialProof(this.products);
    syncListingFavoriteHearts();
  },

  renderCard(product: ProductListingCard, rank: number): string {
    return renderListingCard(product, { rank });
  },

  /** Paylaşılan mobil drill-down kategori sheet'i (top-deals ile aynı component). */
  initDrillSheet(): void {
    const drillCategories: DrillCategory[] = [
      { name: t("topRankingPage.tabAll"), slug: "all" },
      ...this.apiCategories,
    ];
    drillCtl = initCategoryDrillSheet({
      sheetId: "tr-cat-sheet",
      listSelector: "[data-tr-cat-list]",
      categories: drillCategories,
      rootLabel: t("mobileCategory.allCategories"),
      allInCategoryLabel: (name: string) => t("mobileCategory.allInCategory", { name }),
      onSelect: (slug: string) => {
        if (!slug || slug === "all") {
          window.location.href = "/cok-satanlar";
          return;
        }
        if (slug === this.category) return;
        window.location.href = `/pages/top-ranking-category.html?cat=${encodeURIComponent(slug)}&sort=${this.activeSort}&page=1`;
      },
      getActiveSlug: () => this.category,
    });
  },

  // Mevcut TopRankingFilters dropdown'unun beklediği metodlar
  openCategoryDropdown(): void {
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) {
      drillCtl?.open();
      return;
    }
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
    // Dropdown level seçilmiş kategoriye göre
    if (this.selectedMainCategory) {
      const mainCat = this.apiCategories.find((c) => c.slug === this.selectedMainCategory);
      const hasChildren = !!(mainCat?.children && mainCat.children.length > 0);
      this.categoryDropdownLevel = hasChildren ? 2 : 1;
    } else {
      this.categoryDropdownLevel = 1;
    }
  },

  openCategoryLevel2(mainCatId: string): void {
    this.selectedMainCategory = mainCatId;
    this.pendingSubCategory = null;
    this.categoryDropdownLevel = 2;
  },

  goBackToLevel1(): void {
    this.categoryDropdownLevel = 1;
  },

  /**
   * Dropdown'da seçim uygulandığında: ana kategori veya alt kategori seçildiyse
   * yeni Top Ranking Category sayfasına git; "Tümü" seçildiyse ana top-ranking
   * sayfasına dön.
   */
  applyCategoryFilter(): void {
    this.categoryDropdownOpen = false;
    const mainCat = this.selectedMainCategory;
    const finalCat = this.pendingSubCategory || mainCat;
    if (!finalCat) {
      // "Tümü" → ana top-ranking sayfasına git
      window.location.href = "/cok-satanlar";
      return;
    }
    // Aynı kategori seçildiyse fetch yap (sayfa yenileme yerine)
    if (finalCat === this.category) {
      return;
    }
    const sp = new URLSearchParams();
    sp.set("cat", finalCat);
    sp.set("sort", this.activeSort);
    sp.set("page", "1");
    window.location.href = `/pages/top-ranking-category.html?${sp.toString()}`;
  },

  get selectedCategoryLabel(): string {
    if (!this.category) return t("topRankingPage.allCategories");
    return this.categoryName || this.category;
  },

  $t(key: string, params?: Record<string, unknown>): string {
    return t(key, params);
  },
}));

/* ── Page Assembly ── */

const parsed = parseSearchParams();

const breadcrumbItems = [
  { label: t("topRankingCategoryPage.breadcrumb"), href: "/cok-satanlar" },
  { label: parsed.cat || t("topRankingCategoryPage.missingCategory") },
];

const appEl = document.querySelector<HTMLDivElement>("#app")!;
appEl.classList.add("relative");
appEl.innerHTML = `
  <div id="sticky-header" class="hidden lg:block z-[30] border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>

  ${MegaMenu()}

  ${TopRankingStickyMobileHeader()}

  <main x-data="topRankingCategoryPage">
    <div id="trc-mobile-hero-sentinel">
      ${TopRankingMobileHeader()}
    </div>

    <section class="relative z-20" style="background: linear-gradient(0deg, var(--color-primary-100, #fdf0c3) 1%, var(--color-primary-50, #fef9e7) 100%);">
      <div class="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-10 start-[5%] w-48 h-48 rounded-full bg-primary-200/20"></div>
        <div class="absolute top-1/3 end-[3%] w-36 h-36 rounded-full bg-primary-200/15"></div>
      </div>
      <div class="hidden lg:block relative z-10 container-boxed pt-2 lg:pt-3">
        ${Breadcrumb(breadcrumbItems)}
      </div>
      ${TopRankingCategoryHero()}
    </section>

    <div id="sticky-tabs" class="sticky top-0 z-10 bg-surface transition-shadow duration-200">
      <div class="container-boxed">
        ${TopRankingSortPills()}
      </div>
    </div>

    <!-- isolate: kart içi z-index'ler (favori z-30, rozet z-20) bu bölümde hapsolur,
         sticky sıralama barının (z-10) üstüne çıkamaz -->
    <section id="trc-grid-anchor" class="isolate pb-8 lg:pb-12" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        ${TopRankingCategoryGrid()}
        ${TopRankingCategoryPagination()}
      </div>
    </section>
  </main>

  <footer>
    ${FooterLinks()}
  </footer>

  ${LoginModal()}
  ${ListingCartDrawer()}

  <!-- Mobil kategori drill-down sheet'i (paylaşılan component; TopRankingFilters mobil dalı açar) -->
  ${BottomSheet(
    { id: "tr-cat-sheet", titleKey: "mobileCategory.allCategories", hiddenAt: "lg:hidden" },
    categoryDrillSkeleton("data-tr-cat-list")
  )}

  ${FloatingPanel()}
`;

initMegaMenu();
initFlowbite();
mountChatPopup();
initChatTriggers();
startAlpine();
initHeaderCart();
initLanguageSelector();
initListingFavoriteTriggers();
initAnimatedPlaceholder("#topbar-compact-search-input");
