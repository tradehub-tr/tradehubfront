import { t } from '../../i18n';
// Currency formatting via window.csFormatPrice / window.csFormatPriceRange (set by currencyService)

// ─── Shared Types ──────────────────────────────────────────────
export interface SellerReview {
  id: string;
  reviewerName: string;
  country: string;
  countryFlag: string;
  date: string;
  comment: string;
  productName: string;
  productImage: string;
  productPrice: string;
}

export interface SellerPerformanceStats {
  rating: number;
  reviewCount: number;
  responseTime: string;
  onTimeDeliveryRate: string;
  transactions: number;
  supplierServiceScore: number;
  onTimeShipmentScore: number;
  productQualityScore: number;
}

// ─── Shared Helpers (inlined into x-data) ──────────────────────
const SHARED_FORMAT_PRICE = `
  formatPrice(p) {
    if (!p.price_min) return '';
    const min = parseFloat(p.price_min);
    const max = p.price_max ? parseFloat(p.price_max) : 0;
    const cur = p.currency || 'TRY';
    if (max > min && window.csFormatPriceRange) return window.csFormatPriceRange(min, max, cur);
    if (window.csFormatPrice) return window.csFormatPrice(min, cur);
    return min.toFixed(2);
  }
`;

const SELLER_CODE_INIT = `new URLSearchParams(window.location.search).get('seller') || ''`;

// ─── Main Products Carousel (always visible above tabs) ────────
function MainProductsCarousel(): string {
  return `
    <div
      x-data="{
        sellerCode: ${SELLER_CODE_INIT},
        products: [],
        loading: true,
        async init() {
          if (!this.sellerCode) { this.loading = false; return; }
          try {
            const apiBase = (window.API_BASE || '/api');
            const res = await fetch(apiBase + '/method/tradehub_core.api.seller.get_seller_products?seller_code=' + this.sellerCode + '&page_size=10', { credentials: 'omit' }).then(r => r.json());
            const real = res.message?.products || [];
            if (real.length > 0) this.products = real;
          } catch(e) {}
          this.loading = false;
        },
        ${SHARED_FORMAT_PRICE}
      }"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[18px] font-bold text-gray-900 uppercase">${t('seller.sf.mainProducts')}</h3>
        <div class="flex items-center gap-2">
          <button class="main-products-prev w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label="Previous">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="main-products-next w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label="Next">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div x-show="loading" class="flex gap-4 overflow-hidden">
        <template x-for="i in 5">
          <div class="animate-pulse bg-gray-100 rounded-md min-w-[180px] aspect-[3/4] flex-shrink-0"></div>
        </template>
      </div>

      <!-- Empty -->
      <div x-show="!loading && products.length === 0" class="text-gray-400 text-[14px] py-8 text-center">
        ${t('seller.sf.noProducts')}
      </div>

      <!-- Swiper Carousel -->
      <div x-show="!loading && products.length > 0" class="main-products-swiper swiper">
        <div class="swiper-wrapper">
          <template x-for="(p, idx) in products" :key="p.name">
            <div class="swiper-slide">
              <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="block no-underline group">
                <div class="relative rounded-md overflow-hidden border border-gray-200 bg-white aspect-square mb-3">
                  <img x-show="p.image" :src="p.image" :alt="p.product_name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div x-show="!p.image" class="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-6 6 6"/></svg>
                  </div>
                  <!-- Video play overlay -->
                  <div x-show="p.video_url" class="absolute inset-0 flex items-center justify-center">
                    <div class="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <!-- Category + Badge -->
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[12px] text-gray-400" x-text="p.category || 'Main product'"></span>
                    <span x-show="p.badge" class="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded" x-text="p.badge"></span>
                  </div>
                  <div class="text-[13px] text-gray-800 line-clamp-2 leading-snug mb-1.5" x-text="p.product_name"></div>
                  <div class="text-[14px] font-bold text-gray-900 mb-1" x-text="formatPrice(p)"></div>
                  <div class="text-[12px] text-gray-500" x-show="p.moq" x-text="'Min. Sipari\u015f ' + p.moq + ' ' + (p.moq_unit || 'Adet')"></div>
                  <div class="text-[12px] text-gray-400 mt-0.5" x-show="p.sold_count" x-text="p.sold_count + ' sold'"></div>
                </div>
              </a>
            </div>
          </template>
        </div>
      </div>
    </div>
  `;
}

// ─── Overview Tab (Genel Bakis) ────────────────────────────────
function OverviewTab(): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'overview'" x-transition.opacity.duration.300ms id="tab-overview">

      <!-- Single white card for entire profile (iSTOC-style) -->
      <section class="bg-white rounded-md border border-gray-200 p-6 mb-6"
        x-data="{
          get certList() {
            if (!this.seller?.certifications) return [];
            return this.seller.certifications.split(',').map(c => c.trim()).filter(Boolean);
          }
        }"
      >

        <!-- Profile Header -->
        <div class="flex items-center justify-between flex-wrap gap-3 pb-6 mb-6 border-b border-gray-100">
          <h3 class="text-[18px] font-bold text-gray-900">${t('seller.sf.profile')}</h3>
          <div class="flex items-center gap-4">
            <a href="#" class="text-[13px] text-blue-600 hover:underline flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              ${t('seller.sf.downloadReport')}
            </a>
            <span x-show="seller?.verified || seller?.is_verified" class="inline-flex items-baseline gap-1 text-[13px] font-semibold">
              <img src="/src/assets/images/verifiedminilogo.png" alt="Verified" class="h-[16px] w-auto self-baseline" />
              <img src="/src/assets/images/istoc-logo.png" alt="iSTOC" class="h-[10px] w-auto self-baseline" />
              <span class="text-[10px] text-[#999] font-medium">ile</span>
            </span>
          </div>
        </div>

        <!-- Genel Bakış -->
        <div class="pb-6 mb-6 border-b border-gray-100">
          <h4 class="text-[16px] font-bold text-gray-900 mb-5">${t('seller.sf.generalOverview')}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[14px]">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.registrationDate')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.founded_year || '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.floorArea')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.factory_size ? seller.factory_size + ' m\u00B2' : '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.businessType')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.business_type || '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.employees')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.staff_count || '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.annualRevenue')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.annual_revenue || '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.mainMarkets')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.main_markets || '\u2014'"></span>
            </div>
          </div>
        </div>

        <!-- Sertifikalar -->
        <div class="pb-6 mb-6 border-b border-gray-100">
          <h4 class="text-[16px] font-bold text-gray-900 mb-5">${t('seller.sf.certificates')}</h4>
          <div x-show="certList.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <template x-for="(cert, idx) in certList" :key="idx">
              <div class="bg-white border border-gray-200 rounded-md p-4 flex flex-col items-center text-center hover:shadow-sm transition-shadow">
                <div class="w-full aspect-[3/4] bg-gray-50 rounded flex items-center justify-center mb-3">
                  <svg class="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <span class="text-[13px] font-bold text-gray-900" x-text="cert"></span>
              </div>
            </template>
          </div>
          <div x-show="certList.length === 0" class="text-gray-400 text-[14px] py-4 text-center">
            ${t('seller.sf.noCertificates')}
          </div>
        </div>

        <!-- Üretim Özellikleri -->
        <div class="pb-6 mb-6 border-b border-gray-100">
          <h4 class="text-[16px] font-bold text-gray-900 mb-5">${t('seller.sf.qualityControlSection')}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[14px]">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.businessType')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.business_type || '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.allProductionLines')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.production_lines || '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.floorArea')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.factory_size ? seller.factory_size + ' m\u00B2' : '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.employees')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.staff_count || '\u2014'"></span>
            </div>
          </div>
        </div>

        <!-- Kalite Kontrol -->
        <div>
          <h4 class="text-[16px] font-bold text-gray-900 mb-5">${t('seller.sf.qualityControl')}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[14px]">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.rawMaterialSupport')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.raw_material_traceability || '\u2014'"></span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">${t('seller.sf.inspectionMethod')}</span>
              <span class="text-gray-900 font-medium" x-text="seller?.inspection_method || '\u2014'"></span>
            </div>
          </div>
        </div>

      </section>

      <!-- Hizmet (Service) Card -->
      <section class="bg-white rounded-md border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between flex-wrap gap-3 pb-6 mb-6 border-b border-gray-100">
          <h3 class="text-[18px] font-bold text-gray-900">${t('seller.sf.serviceTab')}</h3>
          <span x-show="seller?.verified || seller?.is_verified" class="inline-flex items-baseline gap-1 text-[13px] font-semibold">
            <img src="/src/assets/images/verifiedminilogo.png" alt="Verified" class="h-[16px] w-auto self-baseline" />
            <img src="/src/assets/images/istoc-logo.png" alt="iSTOC" class="h-[10px] w-auto self-baseline" />
            <span class="text-[10px] text-[#999] font-medium">ile</span>
          </span>
        </div>

        <!-- Customization services -->
        <div class="flex items-center gap-2 mb-4 text-[14px] text-gray-700">
          <svg class="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/></svg>
          <span class="font-medium">${t('seller.sf.customizationServices')}</span>
        </div>

        <div class="flex flex-col sm:flex-row gap-4"
          x-data="{
            sellerCode: ${SELLER_CODE_INIT},
            serviceProducts: [],
            async init() {
              if (!this.sellerCode) return;
              try {
                const apiBase = (window.API_BASE || '/api');
                const res = await fetch(apiBase + '/method/tradehub_core.api.seller.get_seller_products?seller_code=' + this.sellerCode + '&page_size=3', { credentials: 'omit' }).then(r => r.json());
                const real = res.message?.products || [];
                if (real.length > 0) this.serviceProducts = real;
              } catch(e) {}
            },
            ${SHARED_FORMAT_PRICE}
          }"
        >
          <!-- Info card -->
          <div class="bg-gray-50 rounded-md p-5 sm:w-[260px] shrink-0">
            <h4 class="text-[16px] font-bold text-gray-900 mb-3">${t('seller.sf.lowMoqCustomization')}</h4>
            <ul class="text-[13px] text-gray-600 space-y-1.5">
              <li class="flex items-center gap-1.5">
                <span class="w-1 h-1 bg-gray-400 rounded-full shrink-0"></span>
                <span x-text="(navCategories?.length || 2) + '${t('seller.sf.categoriesAvailable')}'"></span>
              </li>
              <li class="flex items-center gap-1.5">
                <span class="w-1 h-1 bg-gray-400 rounded-full shrink-0"></span>
                <span x-text="(seller?.total_orders || 269) + '${t('seller.sf.productsAvailable')}'"></span>
              </li>
            </ul>
            <button @click="setTab('products')" class="mt-4 text-[13px] border border-gray-300 rounded-full px-4 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors">
              ${t('seller.sf.viewMore')}
            </button>
          </div>

          <!-- Product thumbnails -->
          <div class="flex-1 flex gap-3 overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-3">
            <template x-for="(p, idx) in serviceProducts.slice(0, 3)" :key="p.name">
              <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="block no-underline group shrink-0 w-[140px] sm:w-auto">
                <div class="relative rounded-md overflow-hidden bg-gray-100 aspect-square mb-2">
                  <img x-show="p.image" :src="p.image" :alt="p.product_name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div class="text-[12px] text-gray-800 line-clamp-2 leading-snug mb-0.5" x-text="p.product_name"></div>
                <div class="text-[13px] font-semibold text-gray-900" x-text="formatPrice(p)"></div>
                <div class="text-[11px] text-gray-500" x-show="p.moq" x-text="'Min. Sipari\u015f ' + p.moq + ' ' + (p.moq_unit || 'Adet')"></div>
              </a>
            </template>
          </div>
        </div>
      </section>

      <!-- Şirket Değerlendirmeleri (Company Reviews) Card -->
      <section class="bg-white rounded-md border border-gray-200 p-6 mb-6">
        <h3 class="text-[18px] font-bold text-gray-900 mb-6">
          ${t('seller.sf.companyReviews')}
          <span class="text-gray-500 font-normal" x-text="'(' + (seller?.review_count || 0) + ')'"></span>
        </h3>

        <!-- Rating summary -->
        <div class="flex flex-col sm:flex-row gap-8 pb-6 mb-6 border-b border-gray-100">
          <!-- Big rating number -->
          <div class="shrink-0">
            <span class="text-[48px] font-bold text-gray-900 leading-none" x-text="seller?.rating ? seller.rating.toFixed(1) : '\u2014'"></span>
            <span class="text-[18px] text-gray-400">/5</span>
            <div class="text-[14px] font-medium text-gray-700 mt-1">${t('seller.sf.satisfactory')}</div>
          </div>
          <!-- Rating bars -->
          <div class="flex-1 flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="text-[13px] text-gray-600 w-[160px] shrink-0">${t('seller.sf.supplierService')}</span>
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-(--btn-bg) rounded-full" :style="'width:' + ((seller?.rating || 0) / 5 * 100) + '%'"></div></div>
              <span class="text-[13px] font-medium text-gray-900 w-8 text-right" x-text="seller?.rating ? seller.rating.toFixed(1) : '\u2014'"></span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[13px] text-gray-600 w-[160px] shrink-0">${t('seller.sf.onTimeDeliveryRate')}</span>
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-(--btn-bg) rounded-full" :style="'width:' + (seller?.on_time_delivery || 0) + '%'"></div></div>
              <span class="text-[13px] font-medium text-gray-900 w-8 text-right" x-text="seller?.on_time_delivery ? (seller.on_time_delivery / 20).toFixed(1) : '\u2014'"></span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[13px] text-gray-600 w-[160px] shrink-0">${t('seller.sf.productQuality')}</span>
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-(--btn-bg) rounded-full" :style="'width:' + ((seller?.rating || 0) / 5 * 100) + '%'"></div></div>
              <span class="text-[13px] font-medium text-gray-900 w-8 text-right" x-text="seller?.rating ? (seller.rating - 0.1).toFixed(1) : '\u2014'"></span>
            </div>
          </div>
        </div>

        <!-- Reviews list placeholder -->
        <div class="text-gray-400 text-[14px] py-4 text-center">
          ${t('seller.sf.noReviewsYet')}
        </div>

        <!-- View all reviews button -->
        <div class="text-center mt-4">
          <button @click="setTab('reviews')" class="text-[14px] border border-gray-300 rounded-full px-6 py-2 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            ${t('seller.sf.viewAllReviews')}
          </button>
        </div>
      </section>

      <!-- Ürünler (Products) Card -->
      <section class="bg-white rounded-md border border-gray-200 p-6 mb-6"
        x-data="{
          sellerCode: ${SELLER_CODE_INIT},
          overviewProducts: [],
          loading: true,
          async init() {
            if (!this.sellerCode) { this.loading = false; return; }
            try {
              const apiBase = (window.API_BASE || '/api');
              const res = await fetch(apiBase + '/method/tradehub_core.api.seller.get_seller_products?seller_code=' + this.sellerCode + '&page_size=8', { credentials: 'omit' }).then(r => r.json());
              const real = res.message?.products || [];
              if (real.length > 0) this.overviewProducts = real;
            } catch(e) {}
            this.loading = false;
          },
          ${SHARED_FORMAT_PRICE}
        }"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-bold text-gray-900">${t('seller.sf.productsTab')}</h3>
        </div>

        <!-- Loading -->
        <div x-show="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <template x-for="i in 4"><div class="animate-pulse bg-gray-100 rounded-md aspect-square"></div></template>
        </div>

        <!-- Products grid -->
        <div x-show="!loading && overviewProducts.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <template x-for="(p, idx) in overviewProducts" :key="p.name">
            <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="block no-underline group">
              <div class="relative rounded-md overflow-hidden bg-gray-100 aspect-square mb-2">
                <img x-show="p.image" :src="p.image" :alt="p.product_name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div x-show="!p.image" class="w-full h-full flex items-center justify-center text-gray-200">
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                <div x-show="p.video_url" class="absolute inset-0 flex items-center justify-center">
                  <div class="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
              <div class="text-[11px] sm:text-[12px] text-gray-800 line-clamp-2 leading-snug mb-0.5" x-text="p.product_name"></div>
              <div class="text-[12px] sm:text-[13px] font-semibold text-gray-900 mb-0.5" x-text="formatPrice(p)"></div>
              <div class="text-[10px] sm:text-[11px] text-gray-500">
                <span x-show="p.moq" x-text="'Min. Sipari\u015f ' + p.moq + ' ' + (p.moq_unit || 'Adet')"></span>
                <span x-show="p.sold_count" class="text-gray-400 ml-1" x-text="p.sold_count + ' sold'"></span>
              </div>
            </a>
          </template>
        </div>

        <!-- Empty -->
        <div x-show="!loading && overviewProducts.length === 0" class="text-gray-400 text-[14px] py-8 text-center">
          ${t('seller.sf.noProducts')}
        </div>
      </section>

    </div>
  `;
}

// ─── Reviews Tab (Yorumlar) ────────────────────────────────────
function ReviewsTab(): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'reviews'" x-transition.opacity.duration.300ms id="tab-reviews"
      x-data="{
        sellerCode: ${SELLER_CODE_INIT},
        seller: null,
        reviews: [],
        total: 0,
        loading: true,
        async init() {
          if (!this.sellerCode) { this.loading = false; return; }
          try {
            const apiBase = (window.API_BASE || '/api');
            const [sellerRes, reviewRes] = await Promise.all([
              fetch(apiBase + '/method/tradehub_core.api.seller.get_seller?slug=' + this.sellerCode, {credentials:'omit'}).then(r=>r.json()),
              fetch(apiBase + '/method/tradehub_core.api.seller.get_reviews?seller_code=' + this.sellerCode + '&page_size=10', {credentials:'omit'}).then(r=>r.json())
            ]);
            this.seller = sellerRes.message || null;
            this.reviews = reviewRes.message?.reviews || [];
            this.total = reviewRes.message?.total || 0;
          } catch(e) { console.error('Reviews fetch error', e); }
          this.loading = false;
        },
        formatDate(d) {
          if (!d) return '';
          return new Date(d).toLocaleDateString('tr-TR', {day:'2-digit', month:'short', year:'numeric'});
        },
        maskName(n) {
          if (!n) return '\u2014';
          if (n.length <= 2) return n;
          return n[0] + '*'.repeat(Math.min(n.length - 2, 5)) + n[n.length - 1];
        },
        ratingPct(r) { return r ? ((r / 5) * 100) + '%' : '0%'; }
      }"
    >
      <section class="bg-white rounded-md border border-gray-200 p-6">

        <!-- Loading -->
        <div x-show="loading" class="space-y-4 animate-pulse">
          <div class="h-6 bg-gray-100 rounded w-1/3"></div>
          <div class="h-16 bg-gray-100 rounded"></div>
          <div class="h-24 bg-gray-100 rounded"></div>
          <div class="h-24 bg-gray-100 rounded"></div>
        </div>

        <template x-if="!loading">
          <div>
            <h3 class="text-[18px] font-bold text-gray-900 mb-8">${t('seller.sf.companyReviews')} (<span x-text="total"></span>)</h3>

            <!-- Rating Summary -->
            <div class="flex flex-col md:flex-row gap-10 mb-10 pb-10 border-b border-gray-100">
              <!-- Score -->
              <div class="flex flex-col items-center md:items-start">
                <div class="text-[48px] font-bold text-gray-900 leading-none">
                  <span x-text="seller?.average_rating ? seller.average_rating.toFixed(1) : '\u2014'"></span>
                  <span class="text-[16px] text-gray-500 font-normal">/5</span>
                </div>
                <div class="text-[14px] text-amber-600 font-semibold mt-1">${t('seller.sf.satisfied')}</div>
              </div>

              <!-- Progress Bars -->
              <div class="flex-1 max-w-md space-y-3">
                <!-- Supplier Service -->
                <div class="flex items-center gap-3">
                  <span class="text-[13px] text-gray-600 w-40 shrink-0">${t('seller.sf.supplierService')}</span>
                  <div class="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div class="h-full bg-(--btn-bg) rounded-full transition-all duration-500" :style="'width:' + ratingPct(seller?.average_rating)"></div>
                  </div>
                  <span class="text-[13px] text-gray-700 font-medium w-8 text-right" x-text="seller?.average_rating ? seller.average_rating.toFixed(1) : '\u2014'"></span>
                </div>
                <!-- On-Time Shipment -->
                <div class="flex items-center gap-3">
                  <span class="text-[13px] text-gray-600 w-40 shrink-0">${t('seller.sf.onTimeShipment')}</span>
                  <div class="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div class="h-full bg-(--btn-bg) rounded-full transition-all duration-500" :style="'width:' + ratingPct(seller?.average_rating)"></div>
                  </div>
                  <span class="text-[13px] text-gray-700 font-medium w-8 text-right" x-text="seller?.average_rating ? seller.average_rating.toFixed(1) : '\u2014'"></span>
                </div>
                <!-- Product Quality -->
                <div class="flex items-center gap-3">
                  <span class="text-[13px] text-gray-600 w-40 shrink-0">${t('seller.sf.productQuality')}</span>
                  <div class="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div class="h-full bg-(--btn-bg) rounded-full transition-all duration-500" :style="'width:' + ratingPct(seller?.average_rating)"></div>
                  </div>
                  <span class="text-[13px] text-gray-700 font-medium w-8 text-right" x-text="seller?.average_rating ? seller.average_rating.toFixed(1) : '\u2014'"></span>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div x-show="reviews.length === 0" class="text-center py-12 text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p class="text-[14px]">${t('seller.sf.noReviews')}</p>
            </div>

            <!-- Reviews List -->
            <div x-show="reviews.length > 0" class="space-y-6">
              <template x-for="review in reviews" :key="review.name">
                <div class="border-b border-gray-50 pb-6 last:border-b-0">
                  <div class="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <!-- Left: Reviewer Info -->
                    <div class="w-full sm:w-44 flex-shrink-0">
                      <div class="flex items-center gap-2 mb-1">
                        <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-500" x-text="(review.reviewer_name || '?')[0].toUpperCase()"></div>
                        <div>
                          <div class="text-[13px] font-medium text-gray-900" x-text="maskName(review.reviewer_name)"></div>
                          <div class="text-[11px] text-gray-400" x-text="formatDate(review.creation)"></div>
                        </div>
                      </div>
                      <template x-if="review.rating">
                        <div class="flex gap-0.5 mt-1 ml-10">
                          <template x-for="i in 5" :key="i">
                            <svg :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-200'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          </template>
                        </div>
                      </template>
                    </div>

                    <!-- Right: Comment & Product -->
                    <div class="flex-1">
                      <p class="text-[14px] text-gray-700 leading-relaxed mb-3" x-text="review.comment"></p>
                      <template x-if="review.product_name">
                        <div class="flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                          <div class="w-12 h-12 bg-gray-200 rounded shrink-0 overflow-hidden flex items-center justify-center">
                            <template x-if="review.product_image">
                              <img :src="review.product_image" :alt="review.product_name" class="w-full h-full object-cover" />
                            </template>
                            <template x-if="!review.product_image">
                              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                            </template>
                          </div>
                          <div class="min-w-0">
                            <span class="text-[12px] text-gray-600 line-clamp-1 block" x-text="review.product_name"></span>
                            <span x-show="review.product_price" class="text-[12px] text-gray-900 font-medium" x-text="review.product_price"></span>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div x-show="reviews.length > 0" class="mt-8 text-center">
              <button class="px-6 py-2.5 border border-gray-300 rounded-full text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                ${t('seller.sf.browseAllReviews')}
              </button>
            </div>
          </div>
        </template>

      </section>
    </div>
  `;
}

// ─── Products Tab (Urunler) ────────────────────────────────────
function ProductsTab(): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'products'" x-transition.opacity.duration.300ms id="tab-products"
      x-data="{
        sellerCode: ${SELLER_CODE_INIT},
        prodCat: 'all',
        categories: [],
        products: [],
        loading: true,
        currentPage: 1,
        pageSize: 20,
        get totalPages() {
          const filtered = this.filteredProducts();
          return Math.ceil(filtered.length / this.pageSize) || 1;
        },
        get paginatedProducts() {
          const filtered = this.filteredProducts();
          const start = (this.currentPage - 1) * this.pageSize;
          return filtered.slice(start, start + this.pageSize);
        },
        async init() {
          try {
            const apiBase = (window.API_BASE || '/api');
            const [catRes, prodRes] = await Promise.all([
              fetch(apiBase + '/method/tradehub_core.api.seller.get_seller_categories?seller_code=' + this.sellerCode, {credentials:'omit'}).then(r=>r.json()),
              fetch(apiBase + '/method/tradehub_core.api.seller.get_seller_products?seller_code=' + this.sellerCode + '&page_size=80', {credentials:'omit'}).then(r=>r.json())
            ]);
            this.categories = catRes.message?.categories || [];
            this.products = prodRes.message?.products || [];
          } catch(e) { console.error('Products fetch error', e); }
          this.loading = false;
        },
        filteredProducts() {
          if (this.prodCat === 'all') return this.products;
          if (this.prodCat === 'featured') return this.products.filter(p => p.is_featured);
          if (this.prodCat === 'discount') return this.products.filter(p => p.discount_percent > 0);
          return this.products.filter(p => String(p.category) === String(this.prodCat));
        },
        setCategory(cat) {
          this.prodCat = cat;
          this.currentPage = 1;
        },
        ${SHARED_FORMAT_PRICE}
      }"
    >
      <!-- Category Filter Tabs -->
      <div class="bg-white rounded-md border border-gray-200 mb-4">
        <div class="flex overflow-x-auto no-scrollbar px-4 gap-1">
          <button @click="setCategory('all')" :class="prodCat === 'all' ? 'text-amber-700 border-b-2 border-amber-500 font-semibold' : 'text-gray-600 hover:text-gray-900'" class="whitespace-nowrap px-4 py-3 text-[13px] transition-colors shrink-0">
            ${t('seller.sf.all')}
          </button>
          <button @click="setCategory('featured')" :class="prodCat === 'featured' ? 'text-amber-700 border-b-2 border-amber-500 font-semibold' : 'text-gray-600 hover:text-gray-900'" class="whitespace-nowrap px-4 py-3 text-[13px] transition-colors shrink-0">
            ${t('seller.sf.topSelling')}
          </button>
          <button @click="setCategory('discount')" :class="prodCat === 'discount' ? 'text-amber-700 border-b-2 border-amber-500 font-semibold' : 'text-gray-600 hover:text-gray-900'" class="whitespace-nowrap px-4 py-3 text-[13px] transition-colors shrink-0">
            ${t('seller.sf.superDiscount')}
          </button>
          <template x-for="cat in categories" :key="cat.name">
            <button @click="setCategory(String(cat.name))" :class="String(prodCat) === String(cat.name) ? 'text-amber-700 border-b-2 border-amber-500 font-semibold' : 'text-gray-600 hover:text-gray-900'" class="whitespace-nowrap px-4 py-3 text-[13px] transition-colors shrink-0" x-text="cat.category_name"></button>
          </template>
        </div>
      </div>

      <!-- Product Grid -->
      <div class="bg-white rounded-md border border-gray-200 p-4 xl:p-6">
        <!-- Loading -->
        <div x-show="loading" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          <template x-for="i in 8">
            <div class="animate-pulse bg-gray-100 rounded-md aspect-square"></div>
          </template>
        </div>

        <!-- Empty -->
        <div x-show="!loading && filteredProducts().length === 0" class="text-center py-16 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-6 6 6"/></svg>
          <p class="text-[14px]">${t('seller.sf.noProducts')}</p>
        </div>

        <!-- Products -->
        <div x-show="!loading && filteredProducts().length > 0">
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 product-grid">
            <template x-for="(p, idx) in paginatedProducts" :key="p.name">
              <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="product-card flex flex-col gap-2 overflow-hidden text-sm text-start no-underline group">
                <div class="product-card__image-area relative rounded-md overflow-hidden bg-gray-100 aspect-square">
                  <img x-show="p.image" :src="p.image" :alt="p.product_name" class="product-card__img block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div x-show="!p.image" class="w-full h-full flex items-center justify-center text-gray-200">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-6 6 6"/></svg>
                  </div>
                  <!-- Video play overlay -->
                  <div x-show="p.video_url" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <!-- Certification badges -->
                  <template x-if="p.certifications">
                    <div class="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      <template x-for="badge in (p.certifications || '').split(',').slice(0,2)" :key="badge">
                        <span class="bg-white/90 text-[10px] text-gray-700 font-medium px-1.5 py-0.5 rounded shadow-sm" x-text="badge.trim()"></span>
                      </template>
                    </div>
                  </template>
                </div>
                <div class="flex flex-col gap-1 px-0.5">
                  <div class="product-card__title line-clamp-2 text-[13px] leading-snug text-gray-800" x-text="p.product_name"></div>
                  <div class="product-card__price font-semibold text-[14px] text-gray-900" x-text="formatPrice(p)"></div>
                  <div class="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span x-show="p.moq" x-text="'${t('seller.sf.minOrder')} ' + p.moq + ' ' + (p.moq_unit || 'Adet')"></span>
                    <span x-show="p.moq && p.sold_count" class="text-gray-300">&middot;</span>
                    <span x-show="p.sold_count" x-text="p.sold_count + ' ${t('seller.sf.sold')}'"></span>
                  </div>
                </div>
              </a>
            </template>
          </div>

          <!-- Pagination -->
          <div x-show="totalPages > 1" class="flex items-center justify-center gap-1 mt-8">
            <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <template x-for="pg in totalPages" :key="pg">
              <button @click="currentPage = pg" :class="currentPage === pg ? 'bg-(--btn-bg) text-white border-amber-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'" class="w-8 h-8 flex items-center justify-center rounded border text-[13px] font-medium transition-colors" x-text="pg"></button>
            </template>
            <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Videos Tab (Videolar) ─────────────────────────────────────
function VideosTab(): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'videos'" x-transition.opacity.duration.300ms id="tab-videos"
      x-data="{
        sellerCode: ${SELLER_CODE_INIT},
        videos: [],
        loading: true,
        showModal: false,
        activeVideo: null,
        visibleCount: 12,
        async init() {
          if (!this.sellerCode) { this.loading = false; return; }
          try {
            const apiBase = (window.API_BASE || '/api');
            const res = await fetch(apiBase + '/method/tradehub_core.api.seller.get_seller_products?seller_code=' + this.sellerCode + '&page_size=50', { credentials: 'omit' }).then(r => r.json());
            const products = res.message?.products || [];
            this.videos = products.filter(p => p.video_url);
          } catch(e) { console.error('Videos fetch error', e); }
          this.loading = false;
        },
        getYoutubeId(url) {
          if (!url) return null;
          const m = url.match(/(?:youtube\\.com\\/(?:watch\\?v=|embed\\/)|youtu\\.be\\/)([\\w-]{11})/);
          return m ? m[1] : null;
        },
        getThumbnail(v) {
          const ytId = this.getYoutubeId(v.video_url);
          if (ytId) return 'https://img.youtube.com/vi/' + ytId + '/mqdefault.jpg';
          return v.image || '';
        },
        isYoutube(url) {
          return url && (url.includes('youtube.com') || url.includes('youtu.be'));
        },
        isVimeo(url) {
          return url && url.includes('vimeo.com');
        },
        getEmbedUrl(url) {
          if (!url) return '';
          const ytId = this.getYoutubeId(url);
          if (ytId) return 'https://www.youtube.com/embed/' + ytId + '?autoplay=1';
          if (this.isVimeo(url)) {
            const vimeoMatch = url.match(/vimeo\\.com\\/(\\d+)/);
            return vimeoMatch ? 'https://player.vimeo.com/video/' + vimeoMatch[1] + '?autoplay=1' : url;
          }
          return url;
        },
        openVideo(v) {
          this.activeVideo = v;
          this.showModal = true;
          document.body.style.overflow = 'hidden';
        },
        closeModal() {
          this.showModal = false;
          this.activeVideo = null;
          document.body.style.overflow = '';
        }
      }"
      @keydown.escape.window="closeModal()"
    >
      <div class="bg-white rounded-md border border-gray-200 p-4 xl:p-6">

        <!-- Loading -->
        <div x-show="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <template x-for="i in 8">
            <div class="animate-pulse bg-gray-100 rounded-md aspect-video"></div>
          </template>
        </div>

        <!-- Empty -->
        <div x-show="!loading && videos.length === 0" class="text-center py-16 text-gray-400">
          <svg class="w-14 h-14 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <p class="text-[14px]">${t('seller.sf.noVideos')}</p>
        </div>

        <!-- Video Grid -->
        <div x-show="!loading && videos.length > 0">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <template x-for="(v, idx) in videos.slice(0, visibleCount)" :key="v.name">
              <div class="cursor-pointer group" @click="openVideo(v)">
                <div class="relative rounded-md overflow-hidden bg-gray-100 aspect-video mb-2">
                  <!-- Thumbnail -->
                  <img x-show="getThumbnail(v)" :src="getThumbnail(v)" :alt="v.product_name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div x-show="!getThumbnail(v)" class="w-full h-full flex items-center justify-center text-gray-300">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </div>
                  <!-- Play button overlay -->
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors">
                      <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <!-- Duration badge (placeholder) -->
                  <div class="absolute top-2 left-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <span>0:44</span>
                  </div>
                </div>
                <div class="text-[13px] text-gray-800 line-clamp-2 leading-snug" x-text="v.product_name"></div>
              </div>
            </template>
          </div>

          <!-- View More -->
          <div x-show="videos.length > visibleCount" class="text-center mt-6">
            <button @click="visibleCount += 12" class="px-6 py-2.5 border border-gray-300 rounded-full text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              ${t('seller.sf.viewMore')}
            </button>
          </div>
        </div>
      </div>

      <!-- Video Modal -->
      <template x-if="showModal && activeVideo">
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" @click.self="closeModal()">
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/70" @click="closeModal()"></div>
          <!-- Modal Content -->
          <div class="relative z-10 bg-white rounded-md shadow-2xl w-full max-w-3xl overflow-hidden">
            <!-- Close button -->
            <button @click="closeModal()" class="absolute top-3 right-3 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <!-- Video Player -->
            <div class="aspect-video bg-black">
              <template x-if="isYoutube(activeVideo.video_url) || isVimeo(activeVideo.video_url)">
                <iframe :src="getEmbedUrl(activeVideo.video_url)" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </template>
              <template x-if="!isYoutube(activeVideo.video_url) && !isVimeo(activeVideo.video_url)">
                <video :src="activeVideo.video_url" class="w-full h-full" controls autoplay></video>
              </template>
            </div>
            <!-- Title -->
            <div class="p-4">
              <h4 class="text-[15px] font-medium text-gray-900" x-text="activeVideo.product_name"></h4>
            </div>
          </div>
        </div>
      </template>

    </div>
  `;
}

// ─── Contact Sidebar (Right) ──────────────────────────────────
function ContactSidebar(): string {
  return `
    <div class="company-profile__sidebar sticky top-0">
      <div class="bg-white rounded-md border border-gray-200 shadow-sm" style="padding: 24px 20px 20px;">

        <!-- Header Title -->
        <h3 class="text-[17px] font-bold text-gray-900 mb-5">${t('seller.sf.contactSupplierTitle')}</h3>

        <!-- Seller Logo & Name -->
        <div class="flex items-center gap-3 mb-5">
          <div class="w-12 h-12 flex items-center justify-center rounded-md overflow-hidden border border-gray-100 p-1 bg-gray-50 shrink-0">
            <img x-show="seller?.logo" :src="seller?.logo" :alt="seller?.seller_name || ''" class="w-full h-full object-contain" />
            <svg x-show="!seller?.logo" class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </div>
          <div class="min-w-0">
            <h4 class="text-[14px] font-medium text-gray-900 leading-tight line-clamp-2" x-text="seller?.seller_name || '\u2014'"></h4>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col gap-3 mb-5">
          <button @click="setTab('contact')" class="w-full bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white font-semibold py-3 px-4 rounded-full transition-colors text-[14px] shadow-sm company-profile__contact-btn">
            ${t('seller.sf.contactNow')}
          </button>
          <button @click="setTab('contact')" class="th-btn-outline w-full text-gray-900 font-medium py-3 px-4 text-[14px] company-profile__inquiry-btn">
            ${t('seller.sf.sendInquiry')}
          </button>
        </div>

        <!-- Divider + Visit Store -->
        <div class="border-t border-gray-100 pt-4">
          <a :href="'/pages/seller-storefront.html?seller=' + (seller?.slug || '')" class="flex items-center justify-center gap-2 text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/></svg>
            ${t('seller.sf.visitStore')}
          </a>
        </div>

      </div>
    </div>

    <!-- Mobile Contact Bar (shown on small screens) -->
    <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 flex gap-3 shadow-lg">
      <button @click="setTab('contact')" class="flex-1 bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white font-semibold py-2.5 px-4 rounded-full transition-colors text-[14px]">
        ${t('seller.sf.contactNow')}
      </button>
      <button @click="setTab('contact')" class="th-btn-outline flex-1 text-gray-900 font-medium py-2.5 px-4 text-[14px]">
        ${t('seller.sf.sendInquiry')}
      </button>
    </div>
  `;
}

// ─── Contact Tab (Iletisim - hidden tab for contact form) ─────
function ContactTab(): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'contact'" x-transition.opacity.duration.300ms id="tab-contact"
      x-data="{
        sellerCode: ${SELLER_CODE_INIT},
        seller: null,
        loading: true,
        msgText: '',
        msgSent: false,
        msgError: '',
        shareCard: true,
        sending: false,
        async init() {
          try {
            const apiBase = (window.API_BASE || '/api');
            const res = await fetch(apiBase + '/method/tradehub_core.api.seller.get_seller?slug=' + this.sellerCode, {credentials:'omit'}).then(r=>r.json());
            this.seller = res.message || null;
          } catch(e) { console.error('Contact fetch error', e); }
          this.loading = false;
        },
        async sendMsg() {
          if (!this.msgText || this.msgText.trim().length < 10) return;
          this.sending = true;
          this.msgError = '';
          try {
            const apiBase = (window.API_BASE || '/api');
            const params = new URLSearchParams({
              seller_code: this.sellerCode,
              message: this.msgText.trim(),
              share_business_card: this.shareCard ? '1' : '0'
            });
            const res = await fetch(apiBase + '/method/tradehub_core.api.seller.send_inquiry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              credentials: 'omit',
              body: params.toString()
            }).then(r => r.json());
            if (res.exc) throw new Error(res._error_message || 'Failed');
            this.msgSent = true;
            this.msgText = '';
          } catch(e) {
            this.msgError = 'Mesaj gonderilemedi. Lutfen tekrar deneyin.';
          }
          this.sending = false;
        }
      }"
    >
      <section class="bg-white rounded-md border border-gray-200 p-6">

        <!-- Loading -->
        <div x-show="loading" class="space-y-3 animate-pulse">
          <div class="h-6 bg-gray-100 rounded w-2/3 mx-auto"></div>
          <div class="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>

        <template x-if="!loading">
          <div class="max-w-lg mx-auto">
            <!-- Title -->
            <h2 class="text-[18px] font-bold text-gray-900 text-center mb-6">
              ${t('seller.sf.sendMessageToSupplier')}
            </h2>

            <!-- Seller contact info -->
            <div x-show="seller" class="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
              <template x-if="seller?.email">
                <div class="flex items-center gap-2 text-gray-700">
                  <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <a :href="'mailto:' + seller.email" class="hover:text-amber-600 transition-colors" x-text="seller.email"></a>
                </div>
              </template>
              <template x-if="seller?.phone">
                <div class="flex items-center gap-2 text-gray-700">
                  <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <a :href="'tel:' + seller.phone" class="hover:text-amber-600 transition-colors" x-text="seller.phone"></a>
                </div>
              </template>
            </div>

            <!-- Recipient -->
            <div class="flex items-center gap-2 mb-4">
              <span class="text-[14px] text-gray-500">${t('seller.sf.to')}</span>
              <span class="text-[14px] text-gray-900 font-semibold" x-text="seller?.seller_name || '\u2014'"></span>
            </div>

            <!-- Success message -->
            <div x-show="msgSent" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-[14px] text-green-700 text-center">
              Mesajiniz basariyla gonderildi!
            </div>

            <!-- Error message -->
            <div x-show="msgError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-[14px] text-red-700 text-center" x-text="msgError"></div>

            <!-- Message Area -->
            <div x-show="!msgSent" class="mb-4">
              <label class="text-[14px] text-gray-500 mb-1 block" for="contact-textarea">
                <span class="text-red-500">*</span> ${t('seller.sf.message')}
              </label>
              <div class="relative">
                <textarea
                  id="contact-textarea"
                  x-model="msgText"
                  class="th-input min-h-[120px] resize-y"
                  placeholder="${t('seller.sf.enterInquiryDetails')}"
                  maxlength="8000"
                  aria-required="true"
                  rows="5"
                ></textarea>
                <span class="absolute right-3 bottom-3 text-[12px] text-gray-400" x-text="msgText.length + '/8000'"></span>
              </div>
            </div>

            <!-- Send Button -->
            <div x-show="!msgSent" class="flex justify-center mb-4">
              <button @click="sendMsg()" :disabled="sending || !msgText || msgText.trim().length < 10" class="bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white font-semibold py-2.5 px-8 rounded-full transition-colors text-[14px] disabled:opacity-50 disabled:cursor-not-allowed">
                <span x-show="!sending">${t('seller.sf.send')}</span>
                <span x-show="sending">Gonderiliyor...</span>
              </button>
            </div>

            <!-- Business Card Checkbox -->
            <div x-show="!msgSent" class="flex items-center gap-2 justify-center">
              <input type="checkbox" id="business-card" x-model="shareCard"
                     class="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500" />
              <label for="business-card" class="text-[13px] text-gray-500">
                ${t('seller.sf.agreeBusinessCard')}
              </label>
            </div>
          </div>
        </template>

      </section>
    </div>
  `;
}

// ─── Main Wrapper ──────────────────────────────────────────────
export function CompanyProfileComponent(): string {
  return `
    <section class="company-profile bg-[#f5f5f5] pt-5 pb-8 min-h-screen" aria-label="${t('seller.sf.sellerProfile')}">
      <div class="max-w-[1200px] mx-auto px-4 lg:px-8">

        <div class="flex flex-col lg:flex-row gap-5">

          <!-- Main Content Area -->
          <div class="flex-1 min-w-0">

            <!-- 1. ANA ÜRÜNLER — white card -->
            <div class="bg-white rounded-md border border-gray-200" style="padding: 24px 40px;">
              ${MainProductsCarousel()}
            </div>

            <!-- 2. Gap (gray bg shows through) -->

            <!-- 3. Tab Navigation — on gray bg -->
            <div id="store-tab-nav" class="sticky top-0 z-40 bg-white border border-gray-200 rounded-md mt-5 mb-5" style="padding: 0 40px;">
              <div class="flex items-center gap-6 sm:gap-10 overflow-x-auto scrollbar-hide">
                <button @click="setTab('overview')"
                  :class="activeTab === 'overview' ? 'text-[#222] border-b-[3px] border-[#222] font-bold' : 'text-gray-500 border-b-[3px] border-transparent font-medium hover:text-gray-900'"
                  class="py-3.5 text-sm transition-colors whitespace-nowrap shrink-0">${t('seller.sf.myAccount')}</button>
                <button @click="setTab('service')"
                  :class="activeTab === 'service' ? 'text-[#222] border-b-[3px] border-[#222] font-bold' : 'text-gray-500 border-b-[3px] border-transparent font-medium hover:text-gray-900'"
                  class="py-3.5 text-sm transition-colors whitespace-nowrap shrink-0">${t('seller.sf.serviceTab')}</button>
                <button @click="setTab('reviews')"
                  :class="activeTab === 'reviews' ? 'text-[#222] border-b-[3px] border-[#222] font-bold' : 'text-gray-500 border-b-[3px] border-transparent font-medium hover:text-gray-900'"
                  class="py-3.5 text-sm transition-colors whitespace-nowrap shrink-0">${t('seller.sf.reviewsTab')}</button>
                <button @click="setTab('products')"
                  :class="activeTab === 'products' ? 'text-[#222] border-b-[3px] border-[#222] font-bold' : 'text-gray-500 border-b-[3px] border-transparent font-medium hover:text-gray-900'"
                  class="py-3.5 text-sm transition-colors whitespace-nowrap shrink-0">${t('seller.sf.productsTab')}</button>
                <button @click="setTab('videos')"
                  :class="activeTab === 'videos' ? 'text-[#222] border-b-[3px] border-[#222] font-bold' : 'text-gray-500 border-b-[3px] border-transparent font-medium hover:text-gray-900'"
                  class="py-3.5 text-sm transition-colors whitespace-nowrap shrink-0">${t('seller.sf.videoTips')}</button>
              </div>
            </div>

            <!-- 4. Tab Content — each section is its own white card -->
            ${OverviewTab()}
            ${ReviewsTab()}
            ${ProductsTab()}
            ${VideosTab()}
            ${ContactTab()}

          </div>

          <!-- Right Sidebar (220px fixed) -->
          <div class="hidden lg:block w-[220px] shrink-0">
            ${ContactSidebar()}
          </div>

        </div>
      </div>
    </section>
  `;
}
