/**
 * Seller Shop — Dynamic Storefront Page
 * Renders sections dynamically based on seller's layout configuration.
 * Fixed: TopBar (header), StoreNav (navigation), Footer
 * Dynamic: All sections between nav and footer, order/visibility from API
 */
import '../style.css';
import '../styles/seller/seller-storefront.css';
import { initFlowbite } from 'flowbite';
import 'swiper/swiper-bundle.css';
import { startAlpine } from '../alpine';
import { initCurrency } from '../services/currencyService';

// Components
import { TopBar } from '../components/header';
import { initLanguageSelector } from '../components/header/TopBar';

// Alpine store
import '../alpine/sellerShop';

// Section registry
import { renderDynamicSections, SECTION_RENDERERS_REF } from '../utils/seller/section-registry';
import type { LayoutConfig } from '../utils/seller/section-registry';

// ─── Pre-fetch layout for SSR-like initial render ───────
const API_BASE = (window as any).API_BASE || '/api';
const sellerCode = new URLSearchParams(window.location.search).get('seller') || '';

function getDefaultLayout(): LayoutConfig {
  return {
    sections: [
      { type: 'hero_banner', order: 1, enabled: true, settings: { mode: 'slider', autoplay: true, delay: 5000 } },
      { type: 'category_grid', order: 2, enabled: true, settings: { columns: 4 } },
      { type: 'hot_products', order: 3, enabled: true, settings: {} },
    ],
  };
}

async function getInitialLayout(): Promise<LayoutConfig> {
  if (!sellerCode) return getDefaultLayout();

  try {
    const res = await fetch(
      `${API_BASE}/method/tradehub_core.api.seller.get_storefront_layout?seller_code=${sellerCode}`,
      { credentials: 'omit' }
    );
    const data = await res.json();
    if (data?.message?.sections) {
      return { sections: data.message.sections, theme: data.message.theme };
    }
  } catch {
    // Fall back to default layout
  }

  return getDefaultLayout();
}

// ─── Render ─────────────────────────────────────────────
async function renderPage() {
  const layout = await getInitialLayout();
  const appEl = document.querySelector<HTMLDivElement>('#app')!;

  appEl.innerHTML = `
    <!-- MAIN PLATFORM HEADER -->
    ${TopBar()}

    <main class="seller-shop flex flex-col min-h-screen" x-data="sellerShop">

      <!-- LOADING STATE -->
      <div x-show="loading" class="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 w-full">
        <div class="animate-pulse space-y-6">
          <div class="h-[300px] bg-gray-200 rounded-lg"></div>
          <div class="grid grid-cols-4 gap-4">
            <div class="h-32 bg-gray-200 rounded-lg"></div>
            <div class="h-32 bg-gray-200 rounded-lg"></div>
            <div class="h-32 bg-gray-200 rounded-lg"></div>
            <div class="h-32 bg-gray-200 rounded-lg"></div>
          </div>
          <div class="grid grid-cols-4 gap-4">
            <div class="h-48 bg-gray-200 rounded-lg"></div>
            <div class="h-48 bg-gray-200 rounded-lg"></div>
            <div class="h-48 bg-gray-200 rounded-lg"></div>
            <div class="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      <!-- SELLER NOT FOUND -->
      <div x-show="!loading && !seller" class="max-w-[1200px] mx-auto px-4 lg:px-8 py-20 text-center w-full">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349"/></svg>
        </div>
        <h2 class="text-lg font-bold text-gray-700 mb-1">Magaza bulunamadi</h2>
        <p class="text-sm text-gray-400">Bu satici icin bir magaza sayfasi henuz olusturulmamis.</p>
      </div>

      <!-- DYNAMIC SECTIONS -->
      <div x-show="!loading && seller" x-cloak>

        <!-- ═══ STORE HEADER (sabit — herkeste ayni yapi, icerik dinamik) ═══ -->
        <div class="border-b border-gray-200 bg-cover bg-center bg-no-repeat"
             :style="seller?.header_bg_image ? 'background-image: url(' + seller.header_bg_image + ')' : 'background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'">
          <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-5"
               :style="seller?.header_bg_image ? 'background: rgba(255,255,255,0.85)' : ''">
            <div class="flex items-start gap-5">

              <!-- Logo (arka plan yok, radius dinamik) -->
              <div class="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] overflow-hidden shrink-0"
                   :style="'border-radius:' + (seller?.logo_radius || '8') + 'px'">
                <img x-show="seller?.logo" :src="seller.logo" :alt="seller?.seller_name"
                     class="w-full h-full object-cover"
                     :style="'border-radius:' + (seller?.logo_radius || '8') + 'px'" />
                <div x-show="!seller?.logo" class="w-full h-full bg-gray-100 flex items-center justify-center"
                     :style="'border-radius:' + (seller?.logo_radius || '8') + 'px'">
                  <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2 7l10-5 10 5v10l-10 5-10-5V7z"/></svg>
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 pt-1">
                <!-- Verified badge (sag ust) -->
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <!-- Company Name -->
                    <h1 class="text-[22px] sm:text-[26px] font-bold text-[#222] leading-tight mb-1.5 truncate" x-text="seller?.seller_name || ''"></h1>

                    <!-- Badges row -->
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                      <template x-if="seller?.verified">
                        <img src="/src/assets/images/verifiedminilogo.png" alt="Verified" class="h-[14px] w-auto" />
                      </template>
                      <template x-if="seller?.business_type">
                        <span class="text-[13px] text-[#666]" x-text="seller.business_type"></span>
                      </template>
                      <template x-if="seller?.founded_year || seller?.member_since">
                        <span class="text-[13px] text-[#666]">
                          <span class="mx-1 text-[#ccc]">&middot;</span>
                          <span x-text="(new Date().getFullYear() - (seller?.founded_year || 2010)) + ' yil'"></span>
                        </span>
                      </template>
                      <template x-if="seller?.city || seller?.country">
                        <span class="text-[13px] text-[#666]">
                          <span class="mx-1 text-[#ccc]">&middot;</span>
                          <span x-text="[seller?.city, seller?.country].filter(Boolean).join(', ')"></span>
                        </span>
                      </template>
                    </div>

                    <!-- Main products / description -->
                    <p class="text-[13px] text-[#555] leading-relaxed line-clamp-2 mb-2" x-show="seller?.description || seller?.short_description" x-text="'Ana urunler: ' + (seller?.description || seller?.short_description || '')"></p>

                    <!-- Email -->
                    <div class="flex items-center gap-1.5 text-[13px] text-[#666]" x-show="seller?.email">
                      <svg class="w-4 h-4 text-[#999] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                      <span x-text="seller?.email"></span>
                    </div>
                  </div>

                  <!-- CTA Buttons (sag taraf) -->
                  <div class="hidden sm:flex flex-col gap-2 shrink-0">
                    <div x-show="seller?.verified" class="flex items-baseline gap-1 mb-1 justify-end">
                      <img src="/src/assets/images/verifiedminilogo.png" alt="Verified" class="h-[16px] w-auto self-baseline" />
                      <img src="/src/assets/images/istoc-logo.png" alt="iSTOC" class="h-[10px] w-auto self-baseline" style="vertical-align: baseline;" />
                      <span class="text-[10px] text-[#999] font-medium">ile</span>
                    </div>
                    <button
                      class="bg-[#cc9900] hover:bg-[#b38600] text-white text-[12px] font-medium rounded-md px-5 py-2 transition-all whitespace-nowrap hover:shadow-sm"
                      @click="switchPage('contacts')">
                      Tedarikçiye Ulasin
                    </button>
                    <a :href="'/pages/seller/seller-storefront.html?seller=' + sellerCode"
                       class="border border-gray-200 bg-white text-[12px] font-medium text-[#555] rounded-md px-5 py-2 text-center hover:border-gray-300 hover:text-[#333] transition-all whitespace-nowrap">
                      Profili Goruntule
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mobile CTA -->
            <div class="flex sm:hidden gap-2 mt-4">
              <button
                class="flex-1 bg-[#cc9900] hover:bg-[#b38600] text-white text-[12px] font-medium rounded-md py-2 transition-all"
                @click="switchPage('contacts')">
                Tedarikçiye Ulasin
              </button>
              <a :href="'/pages/seller/seller-storefront.html?seller=' + sellerCode"
                 class="flex-1 border border-gray-200 bg-white text-[12px] font-medium text-[#555] rounded-md py-2 text-center hover:border-gray-300 transition-all">
                Profil
              </a>
            </div>
          </div>
        </div>

        <!-- ═══ STORE NAV BAR (sayfa bazli gecis — mobilde toggle) ═══ -->
        <div class="sticky top-0 z-30" style="background-color: #1f1f1f;" :style="layout.theme?.navBgColor ? 'background-color:' + layout.theme.navBgColor : ''"
             x-data="{ mobileNav: false, mobileSearch: false }">
          <div class="max-w-[1200px] mx-auto px-4 lg:px-8 flex items-center justify-between h-[42px]">

            <!-- Hamburger (mobil) -->
            <button @click="mobileNav = !mobileNav" class="sm:hidden flex items-center justify-center w-8 h-8 text-white/80 hover:text-white">
              <svg x-show="!mobileNav" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              <svg x-show="mobileNav" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <!-- Aktif sayfa adi (mobil) -->
            <span class="sm:hidden text-[13px] font-medium text-white"
                  x-text="activePage === 'home' ? 'Ana Sayfa' : activePage === 'products' ? 'Urunler' : activePage === 'profile' ? 'Profil' : 'Kisiler'"></span>

            <!-- Nav Items (desktop) -->
            <nav class="hidden sm:flex items-center gap-0 h-full">
              <a href="#" @click.prevent="switchPage('home')"
                 class="px-4 h-full flex items-center text-[13px] font-medium transition-colors"
                 :class="activePage === 'home' ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'">
                Ana Sayfa
              </a>

              <!-- Urunler (dropdown) -->
              <div class="relative h-full" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
                <button @click="switchPage('products')"
                   class="px-4 h-full flex items-center gap-1.5 text-[13px] font-medium transition-colors"
                   :class="activePage === 'products' ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'">
                  Urunler
                  <svg class="w-3 h-3 transition-transform" :class="open ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div x-show="open" x-transition.opacity.duration.150ms
                     class="absolute top-full left-0 rounded-b-md shadow-lg min-w-[200px] py-1 z-50"
                     style="background-color: var(--store-nav-bg);">
                  <a href="#" @click.prevent="filterByCategory(''); switchPage('products'); open = false"
                     class="block px-4 py-2 text-[13px] font-medium hover:bg-white/10 transition-colors"
                     style="color: var(--store-nav-text, #fff);">Tum Urunler</a>
                  <template x-for="cat in categories" :key="cat.name">
                    <a href="#" @click.prevent="filterByCategory(cat.name); switchPage('products'); open = false"
                       class="block px-4 py-2 text-[13px] hover:bg-white/10 transition-colors"
                       style="color: var(--store-nav-text, #fff);"
                       x-text="cat.category_name || cat.name"></a>
                  </template>
                </div>
              </div>

              <!-- Profil -->
              <div class="relative h-full" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
                <button @click="switchPage('profile')"
                   class="px-4 h-full flex items-center gap-1.5 text-[13px] font-medium transition-colors"
                   :class="activePage === 'profile' ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'">
                  Profil
                  <svg class="w-3 h-3 transition-transform" :class="open ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div x-show="open" x-transition.opacity.duration.150ms
                     class="absolute top-full left-0 rounded-b-md shadow-lg min-w-[180px] py-1 z-50"
                     style="background-color: var(--store-nav-bg);">
                  <a href="#" @click.prevent="switchPage('profile'); open = false"
                     class="block px-4 py-2 text-[13px] hover:bg-white/10 transition-colors"
                     style="color: var(--store-nav-text, #fff);">Sirket Profili</a>
                  <a :href="'/pages/seller/seller-storefront.html?seller=' + sellerCode"
                     class="block px-4 py-2 text-[13px] hover:bg-white/10 transition-colors"
                     style="color: var(--store-nav-text, #fff);">Detayli Profil</a>
                </div>
              </div>

              <a href="#" @click.prevent="switchPage('contacts')"
                 class="px-4 h-full flex items-center text-[13px] font-medium transition-colors"
                 :class="activePage === 'contacts' ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'">
                Kisiler
              </a>
            </nav>

            <!-- Search (desktop) -->
            <div class="hidden sm:flex items-center gap-2">
              <div class="relative">
                <input type="text" placeholder="Bu Magazada Ara"
                       class="w-[180px] lg:w-[240px] h-[30px] text-[12px] border border-white/30 rounded pl-3 pr-8 bg-white/10 text-white placeholder-white/50 focus:bg-white focus:text-gray-800 focus:placeholder-gray-400 focus:border-white transition-colors" />
                <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
            </div>

            <!-- Search icon (mobil) -->
            <button @click="mobileSearch = !mobileSearch" class="sm:hidden flex items-center justify-center w-8 h-8 text-white/70 hover:text-white">
              <svg x-show="!mobileSearch" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/></svg>
              <svg x-show="mobileSearch" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Mobil Search Bar -->
          <div x-show="mobileSearch" x-transition.origin.top
               class="sm:hidden px-4 py-2.5 border-t border-white/10">
            <div class="relative">
              <input type="text" placeholder="Bu Magazada Ara" autofocus
                     class="w-full h-[36px] text-[13px] border border-white/20 rounded-md pl-3 pr-9 bg-white/10 text-white placeholder-white/50 focus:bg-white focus:text-gray-800 focus:placeholder-gray-400 focus:border-white transition-colors" />
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
          </div>

          <!-- Mobil Menu (toggle) -->
          <div x-show="mobileNav" x-transition.origin.top
               class="sm:hidden border-t border-white/10">
            <a href="#" @click.prevent="switchPage('home'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium border-b border-white/5 transition-colors"
               :class="activePage === 'home' ? 'text-white bg-white/10' : 'text-white/70'">
              Ana Sayfa
            </a>
            <a href="#" @click.prevent="switchPage('products'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium border-b border-white/5 transition-colors"
               :class="activePage === 'products' ? 'text-white bg-white/10' : 'text-white/70'">
              Urunler
            </a>
            <a href="#" @click.prevent="switchPage('profile'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium border-b border-white/5 transition-colors"
               :class="activePage === 'profile' ? 'text-white bg-white/10' : 'text-white/70'">
              Profil
            </a>
            <a href="#" @click.prevent="switchPage('contacts'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium transition-colors"
               :class="activePage === 'contacts' ? 'text-white bg-white/10' : 'text-white/70'">
              Kisiler
            </a>
          </div>
        </div>

        <!-- ═══ FLOATING CONTACT BUTTONS (sag kenar) ═══ -->
        <div class="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-0.5">
          <button @click="switchPage('contacts')"
                  class="w-[52px] h-[52px] bg-[#cc9900] hover:bg-[#b38600] text-white flex flex-col items-center justify-center rounded-l-md shadow-lg transition-colors">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
            <span class="text-[8px] font-bold leading-none">Contact</span>
            <span class="text-[8px] font-bold leading-none">Supplier</span>
          </button>
          <button class="w-[52px] h-[52px] bg-white hover:bg-gray-50 text-[#cc9900] border border-gray-200 flex flex-col items-center justify-center rounded-l-md shadow-lg transition-colors">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
            <span class="text-[8px] font-bold leading-none text-gray-500">Chat</span>
            <span class="text-[8px] font-bold leading-none text-gray-500">Now!</span>
          </button>
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- PAGE: ANA SAYFA (dinamik bolumler — hero, kategoriler, populer urunler) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div x-show="activePage === 'home'" x-transition.opacity.duration.200ms>
          ${renderDynamicSections(layout)}
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- PAGE: URUNLER (kategori sidebar + urun grid) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div x-show="activePage === 'products'" x-transition.opacity.duration.200ms>
          ${SECTION_RENDERERS_REF.category_listing({ showSort: true, viewModes: ['grid', 'list'], columns: 4 })}
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- PAGE: PROFIL (sirket bilgisi + sertifikalar + galeri) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div x-show="activePage === 'profile'" x-transition.opacity.duration.200ms>
          ${SECTION_RENDERERS_REF.company_info({})}
          ${SECTION_RENDERERS_REF.certificates({})}
          ${SECTION_RENDERERS_REF.gallery({ columns: 4 })}
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- PAGE: KISILER (iletisim bilgileri) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div x-show="activePage === 'contacts'" x-transition.opacity.duration.200ms>
          ${SECTION_RENDERERS_REF.contact_form({})}
        </div>

      </div>

    </main>
  `;

  // Initialize
  initFlowbite();
  initLanguageSelector();
  initCurrency();
  startAlpine();

  // Init Swipers after Alpine is ready
  setTimeout(() => {
    initShopSwipers();
  }, 500);
}

function initShopSwipers() {
  // @ts-ignore — Swiper loaded via CSS import
  const Swiper = (window as any).Swiper;
  if (!Swiper) return;

  // Hero banner swiper
  const heroEl = document.querySelector('.store-hero__swiper');
  if (heroEl) {
    new Swiper(heroEl, {
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.store-hero__pagination', clickable: true },
    });
  }

  // Hot products swiper
  const hotEl = document.querySelector('.hot-products-swiper');
  if (hotEl) {
    new Swiper(hotEl, {
      slidesPerView: 2,
      spaceBetween: 12,
      navigation: { nextEl: '.hot-next', prevEl: '.hot-prev' },
      breakpoints: {
        640: { slidesPerView: 3 },
        1024: { slidesPerView: 5 },
      },
    });
  }
}

// Start
renderPage();
