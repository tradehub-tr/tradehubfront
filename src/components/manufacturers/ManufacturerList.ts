import { t } from "../../i18n";
import { isSellerFavorited, getFavoriteSellers } from "../../stores/sellerFavorites";
import { openSellerFavoritesDropdown } from "../favorites/SellerFavoritesDropdown";
import { VerificationBadgeTemplate } from "../seller/VerificationBadge";

declare global {
  interface Window {
    /** Üretici kartı istatistik satırı parçaları (yıl · personel · m² · ciro) */
    __sellerStatsParts?: (seller: Record<string, unknown>) => string[];
    /** Üretici kartı servis satırı (işletme tipi · ihracat) — mevcut alanlardan türetilir */
    __sellerServicesText?: (seller: Record<string, unknown>) => string;
  }
}

// `founded_year` ham değeri 4-haneli kuruluş yılı ("1985") ya da doğrudan yıl
// sayısı ("8") olabilir; ikisini de faaliyet süresine çevir.
function parseSellerYears(foundedYear: unknown): number | null {
  const n = parseInt(String(foundedYear ?? "").replace(/\D/g, ""), 10);
  if (!n) return null;
  const currentYear = new Date().getFullYear();
  if (n >= 1900 && n <= currentYear) return currentYear - n;
  if (n > 0 && n < 200) return n;
  return null;
}

// Alibaba-tarzı istatistik satırı: yıl · personel · fabrika m² · yıllık ciro.
// Yalnız dolu alanlar görünür.
function sellerStatsParts(seller: Record<string, unknown>): string[] {
  const parts: string[] = [];
  const years = parseSellerYears(seller.founded_year);
  if (years) parts.push(`${years} ${t("mfr.list.yearUnit")}`);
  const staff = String(seller.staff_count ?? "").trim();
  if (staff) parts.push(`${staff} ${t("mfr.list.staffUnit")}`);
  const area = String(seller.factory_size ?? "").trim();
  if (area) parts.push(/m²|m2|㎡/i.test(area) ? area : `${area} m²`);
  const revenue = String(seller.annual_revenue ?? "").trim();
  if (revenue) parts.push(revenue);
  return parts;
}

// Servis satırı — DocType'ta ayrı alan yok; işletme tipi + ana pazarlardan türetilir.
function sellerServicesText(seller: Record<string, unknown>): string {
  const parts: string[] = [];
  const bizMap: Record<string, string> = {
    Manufacturer: t("mfr.list.bizManufacturer"),
    Wholesaler: t("mfr.list.bizWholesaler"),
    Retailer: t("mfr.list.bizRetailer"),
  };
  const bt = String(seller.business_type ?? "").trim();
  if (bt) parts.push(bizMap[bt] || t("mfr.list.bizSupplier"));
  const markets = String(seller.main_markets ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (markets.length) parts.push(`${t("mfr.list.exportLabel")}: ${markets.join(", ")}`);
  return parts.join(" · ");
}

export function ManufacturerList(opts: { mobileFilter?: boolean } = {}): string {
  // Mobil toolbar — yalnız filtreli görünümde (sidebar `<lg` gizliyken). "Filtrele"
  // butonu `mfr-filter-open` event'i ile bottom sheet'i açar (ManufacturerFilterSheet dinler).
  const mobileToolbar = opts.mobileFilter
    ? `
      <div class="lg:hidden flex items-center gap-2.5 mb-3">
        <button
          type="button"
          @click="$dispatch('mfr-filter-open')"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-gray-300 bg-white text-[13px] font-semibold text-[#222] cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 5h16M7 12h10M10 19h4"/></svg>
          ${t("mfr.list.filter")}
        </button>
        <span x-show="!loading" class="text-[13px] text-gray-500">
          <b class="text-[#222]" x-text="sellers.length"></b> ${t("products.unitFoundManufacturer")}
        </span>
      </div>
    `
    : "";
  return `
    <div
      x-data="{
        sellers: [],
        loading: true,
        searchedKeyword: '',
        _cv: 0,
        favCodes: new Set(window.__getSellerFavs ? window.__getSellerFavs() : []),
        isFav(code) { return this.favCodes.has(code); },
        openFavMenu(ev, seller) {
          if (window.__openSellerFavMenu) {
            window.__openSellerFavMenu(ev.currentTarget, seller);
          }
        },
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
        loadingMore: false,
        buildParams() {
          const params = new URLSearchParams(window.location.search);
          const api = new URLSearchParams({ page: String(this.page), page_size: String(this.pageSize) });
          const q = (params.get('q') || '').trim();
          const catSlug = (params.get('cat') || '').trim();
          const catId = (params.get('category') || '').trim();
          const verified = (params.get('verified') || '').trim();
          if (q) api.set('keyword', q);
          if (catSlug) api.set('category', catSlug);
          else if (catId) api.set('category', catId);
          if (verified) api.set('verified', verified);
          this.searchedKeyword = q || catSlug || catId || '';
          return api;
        },
        async fetchSellers() {
          this.loading = true;
          this.page = 1;
          const apiBase = window.API_BASE || '/api';
          try {
            const res = await fetch(
              apiBase + '/method/tradehub_core.api.seller.get_sellers?' + this.buildParams().toString(),
              { credentials: 'omit' }
            ).then(r => r.json());
            this.sellers = res.message?.sellers || [];
            this.total = res.message?.total ?? this.sellers.length;
            this.hasMore = this.sellers.length < this.total;
          } catch (e) {
            this.sellers = []; this.total = 0; this.hasMore = false;
          }
          this.loading = false;
        },
        async loadMore() {
          if (this.loadingMore || this.loading || !this.hasMore) return;
          this.loadingMore = true;
          this.page += 1;
          const apiBase = window.API_BASE || '/api';
          try {
            const res = await fetch(
              apiBase + '/method/tradehub_core.api.seller.get_sellers?' + this.buildParams().toString(),
              { credentials: 'omit' }
            ).then(r => r.json());
            const more = res.message?.sellers || [];
            this.sellers = this.sellers.concat(more);
            this.total = res.message?.total ?? this.total;
            this.hasMore = more.length > 0 && this.sellers.length < this.total;
          } catch (e) {
            this.hasMore = false;
          }
          this.loadingMore = false;
        },
        init() {
          document.addEventListener('currency-changed', () => { this._cv++; });
          document.addEventListener('manufacturer-filters-changed', () => { this.fetchSellers(); });
          window.addEventListener('seller-favorites-changed', () => {
            this.favCodes = new Set(window.__getSellerFavs ? window.__getSellerFavs() : []);
          });
          const sentinel = this.$root.querySelector('[data-mfr-sentinel]');
          if (sentinel && 'IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
              if (entries[0].isIntersecting) this.loadMore();
            }, { rootMargin: '600px' }).observe(sentinel);
          }
          this.fetchSellers();
        }
      }"
    >
      ${mobileToolbar}

      <!-- Loading state — Alibaba tarzı arama süreci paneli + iskelet kartlar -->
      <div x-show="loading" class="flex flex-col gap-3">
        <template x-if="searchedKeyword">
          <div class="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-1">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-orange-600 font-semibold text-[14px]">${t("checkoutMfr.searchProcess")}</span>
              <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
            </div>
            <div class="flex items-start gap-2 text-[13px] text-gray-700 mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0 animate-pulse"></span>
              <div class="flex-1">
                <span>${t("checkoutMfr.searchingResults")}</span>
                <div class="mt-1 inline-flex items-center gap-1 text-orange-600 text-[12px] bg-white border border-orange-200 rounded px-2 py-0.5">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  <span x-text="searchedKeyword"></span>
                </div>
              </div>
            </div>
            <div class="flex items-start gap-2 text-[13px] text-gray-700">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-300 mt-1.5 shrink-0 animate-pulse"></span>
              <span>${t("checkoutMfr.selectingSuppliers")}</span>
            </div>
          </div>
        </template>
        <template x-for="i in 4" :key="i">
          <div class="bg-orange-50/50 border border-orange-100/60 rounded-lg p-5 animate-pulse">
            <div class="h-4 w-1/3 bg-orange-100 rounded mb-3"></div>
            <div class="flex gap-3">
              <div class="h-24 w-24 bg-orange-100/80 rounded"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-orange-100/80 rounded w-3/4"></div>
                <div class="h-3 bg-orange-100/80 rounded w-1/2"></div>
                <div class="h-3 bg-orange-100/60 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty state -->
      <div x-show="!loading && sellers.length === 0" class="bg-white rounded-lg p-12 text-center text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        <p class="text-[14px]">${t("checkoutMfr.noSellersFound")}</p>
      </div>

      <!-- Seller cards — minimal premium; container-query reflow (sidebar genişliğine göre) -->
      <div x-show="!loading" class="flex flex-col gap-2.5 @min-[560px]/sc:gap-3 @container/sc">
        <template x-for="seller in sellers" :key="seller.seller_code">
          <div class="relative bg-white rounded-md border border-gray-200 p-3.5 @min-[560px]/sc:p-4 transition-shadow duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <!-- Favori: sağ üst (satır pe-7 ile yer açar → çakışma yok) -->
            <button
              type="button"
              data-seller-favorite-btn
              @click.prevent.stop="openFavMenu($event, seller)"
              :class="isFav(seller.seller_code) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'"
              class="hidden @min-[560px]/sc:block th-no-press absolute top-2.5 end-2.5 z-10 transition-colors cursor-pointer bg-transparent border-none p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              :aria-pressed="isFav(seller.seller_code)"
              aria-label="${t("mfr.list.addToFavorites")}"
            >
              <svg class="w-[22px] h-[22px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>

            <!-- Tek sıra: kimlik solda (flex-1) · 3 ürün sağda -->
            <div class="flex flex-col @min-[620px]/sc:flex-row @min-[620px]/sc:items-center gap-3 @min-[620px]/sc:gap-5 pe-7">
              <a
                :href="'/magaza/' + seller.seller_code"
                class="group flex items-start min-w-0 @min-[620px]/sc:flex-1 no-underline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <div class="w-12 h-12 @min-[560px]/sc:w-14 @min-[560px]/sc:h-14 border border-gray-200 rounded-md overflow-hidden shrink-0 me-3 bg-gray-50 flex items-center justify-center">
                  <img x-show="seller.logo" :src="seller.logo" :alt="seller.seller_name" loading="lazy" class="w-full h-full object-contain p-1" />
                  <svg x-show="!seller.logo" class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h3 class="text-[15px] @min-[560px]/sc:text-[16px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:underline underline-offset-2 decoration-1" x-text="seller.seller_name"></h3>
                    ${VerificationBadgeTemplate("seller.verifications || []")}
                  </div>

                  <!-- İstatistik satırı: yıl · personel · m² · ciro -->
                  <template x-if="window.__sellerStatsParts && window.__sellerStatsParts(seller).length">
                    <div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[12px] @min-[560px]/sc:text-[12.5px] text-gray-600">
                      <template x-for="(part, si) in window.__sellerStatsParts(seller)" :key="si">
                        <span class="inline-flex items-center gap-x-1.5 whitespace-nowrap">
                          <span x-show="si > 0" class="w-[3px] h-[3px] rounded-full bg-gray-400" aria-hidden="true"></span>
                          <span x-text="part"></span>
                        </span>
                      </template>
                    </div>
                  </template>

                  <!-- Servis satırı: tek satır, küçük -->
                  <template x-if="window.__sellerServicesText && window.__sellerServicesText(seller)">
                    <div class="mt-1 text-[11.5px] @min-[560px]/sc:text-[12px] text-gray-600 line-clamp-1" x-text="window.__sellerServicesText(seller)"></div>
                  </template>
                </div>
              </a>

              <!-- 3 ürün: mobilde tam genişlik 3'lü grid, desktop'ta sağda sabit kare sıra -->
              <template x-if="seller.products && seller.products.length > 0">
                <div class="grid grid-cols-3 gap-2 mt-1 @min-[620px]/sc:mt-0 @min-[620px]/sc:flex @min-[620px]/sc:gap-2.5 shrink-0">
                  <template x-for="p in seller.products.slice(0, 3)" :key="p.name">
                    <a
                      :href="'/urun/' + encodeURIComponent(p.slug || p.name)"
                      class="block aspect-square @min-[620px]/sc:aspect-auto @min-[620px]/sc:w-[84px] @min-[620px]/sc:h-[84px] rounded-md overflow-hidden border border-gray-100 bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      :aria-label="p.product_name"
                    >
                      <img x-show="p.image" :src="p.image" :alt="p.product_name" loading="lazy" class="w-full h-full object-cover" />
                      <div x-show="!p.image" class="w-full h-full flex items-center justify-center text-gray-300">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                      </div>
                    </a>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- Sonsuz scroll sentinel + yükleniyor göstergesi -->
        <div data-mfr-sentinel aria-hidden="true" class="h-px"></div>
        <div x-show="loadingMore" class="py-4 flex justify-center" role="status" aria-live="polite">
          <svg class="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span class="sr-only">${t("common.loading")}</span>
        </div>
      </div>
    </div>
  `;
}

// Kept for backwards-compat export — no-op since cards are now Alpine-rendered
export function initFactorySliders(): void {
  if (typeof window === "undefined") return;
  // Alpine inline x-data'dan çağrılabilir global helper'lar
  window.__sellerStatsParts = sellerStatsParts;
  window.__sellerServicesText = sellerServicesText;
  window.__getSellerFavs = (): string[] => getFavoriteSellers().map((s) => s.code);
  window.__isSellerFav = (code: string): boolean => isSellerFavorited(code);
  window.__openSellerFavMenu = (anchor: HTMLElement, seller: SellerCardSummary): void => {
    const code = seller?.seller_code || seller?.code;
    if (!code) return;
    openSellerFavoritesDropdown(anchor, {
      code,
      name: seller.seller_name || seller.name || "",
      city: seller.city,
      country: seller.country,
      logo: seller.logo,
      cover: seller.cover_image || seller.banner_image,
      rating: seller.rating,
      reviewCount: seller.review_count,
    });
  };
}
