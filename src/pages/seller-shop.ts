/**
 * Seller Shop — Dynamic Storefront Page
 * Renders sections dynamically based on seller's layout configuration.
 * Fixed: TopBar (header), StoreNav (navigation), Footer
 * Dynamic: All sections between nav and footer, order/visibility from API
 */
import '../style.css';
import { initFlowbite } from 'flowbite';
import 'swiper/swiper-bundle.css';
import { startAlpine } from '../alpine';
import { initCurrency } from '../services/currencyService';
import { t } from '../i18n';

// Components
import { TopBar } from '../components/header';
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar';
import { LoginModal } from '../components/product/LoginModal';

// Alpine store
import '../alpine/sellerShop';
// B-2: loginModal ayrı modül (misafir login modalı bu sayfada).
import '../alpine/loginModal';

// Section registry
import { renderDynamicSections, SECTION_RENDERERS_REF } from '../utils/seller/section-registry';
import type { LayoutConfig } from '../utils/seller/section-registry';

// Interactions (Swiper init, dropdowns, etc.)
import { initAllSwipers } from '../utils/seller/interactions';

// ─── Pre-fetch layout for SSR-like initial render ───────
const API_BASE = window.API_BASE || '/api';
// Gateway nginx "internal rewrite" yaptığı için browser URL `/magaza/<code>/dukkan`
// olarak kalır, `?seller=` query browser'da görünmez. Path'tan parse +
// fallback olarak query (direct dosya erişimleri için).
const _pathMatch = window.location.pathname.match(/^\/magaza\/([^/]+)/);
const _rawSellerCode =
  (_pathMatch && _pathMatch[1]) ||
  new URLSearchParams(window.location.search).get('seller') ||
  '';
// sellerCode is reflected into fetch URLs and href attributes → restrict to the
// slug charset so a path/query value cannot inject markup or break the URL.
const sellerCode = decodeURIComponent(_rawSellerCode).replace(/[^a-zA-Z0-9._-]/g, '');

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
        <div class="w-16 h-16 mx-auto mb-4 rounded-md bg-gray-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349"/></svg>
        </div>
        <h2 class="text-lg font-bold text-gray-700 mb-1">${t("sellPage.storeNotFound")}</h2>
        <p class="text-sm text-gray-400">${t("sellPage.storeNotFoundDesc")}</p>
      </div>

      <!-- DYNAMIC SECTIONS -->
      <div x-show="!loading && seller" x-cloak>

        <!-- ═══ STORE HEADER (sabit — herkeste ayni yapi, icerik dinamik) ═══ -->
        <div class="border-b border-gray-200 bg-cover bg-center bg-no-repeat"
             :style="seller?.header_bg_image ? 'background-image: url(' + seller.header_bg_image + ')' : 'background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'">
          <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-5"
               :style="seller?.header_bg_image ? 'background: rgba(255,255,255,0.85)' : ''">
            <div class="hidden sm:flex items-start gap-5">

              <!-- Logo (arka plan yok, radius dinamik) -->
              <div class="w-[140px] h-[140px] overflow-hidden shrink-0"
                   :style="'border-radius:' + (seller?.logo_radius || '8') + 'px'">
                <img x-show="seller?.logo" :src="seller?.logo" :alt="seller?.seller_name" width="140" height="140"
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
                        <span class="inline-flex items-center gap-1 text-green-700 dark:text-green-400 text-[13px] font-semibold">
                          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                          <span>${t("seller.sf.verifiedSupplier")}</span>
                        </span>
                      </template>
                      <template x-if="seller?.business_type">
                        <span class="text-[13px] text-[#666]" x-text="seller.business_type"></span>
                      </template>
                      <template x-if="seller?.founded_year || seller?.member_since">
                        <span class="text-[13px] text-[#666]">
                          <span class="mx-1 text-[#ccc]">&middot;</span>
                          <span x-text="(new Date().getFullYear() - (seller?.founded_year || 2010)) + ' ${t("sellPage.years")}'"></span>
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
                    <p class="text-[13px] text-[#555] leading-relaxed line-clamp-2 mb-2" x-show="seller?.description || seller?.short_description" x-text="seller?.description || seller?.short_description || ''"></p>

                    <!-- Email -->
                    <div class="flex items-center gap-1.5 text-[13px] text-[#666]" x-show="seller?.email">
                      <svg class="w-4 h-4 text-[#999] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                      <span x-text="seller?.email"></span>
                    </div>
                  </div>

                  <!-- CTA Buttons (sag taraf) -->
                  <div class="hidden sm:flex flex-col gap-2 shrink-0">
                    <div x-show="seller?.verified" class="flex items-baseline gap-1 mb-1 justify-end text-green-700 dark:text-green-400">
                      <svg class="w-4 h-4 self-center" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span class="text-[12px] font-semibold">${t("seller.sf.verifiedSupplier")}</span>
                      <img src="/images/istoc-logo.png" alt="iStoc" width="87" height="32" class="h-[10px] w-auto self-baseline ms-1" />
                      <span class="text-[10px] text-[#999] font-medium">${t("sellPage.with")}</span>
                    </div>
                    <button
                      class="bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-[12px] font-medium border border-(--btn-border-color,#d39c00) rounded-[var(--radius-button,8px)] px-5 py-2 active:scale-[0.97] transition-[background-color,transform] duration-150 motion-reduce:transition-none motion-reduce:active:scale-100 whitespace-nowrap"
                      @click="switchPage('contacts')">
                      ${t("sellPage.contactSupplier")}
                    </button>
                    <a href="/magaza/${sellerCode}"
                       class="th-btn-outline text-[12px] font-medium text-[#555] px-5 py-2 text-center hover:text-[#333] whitespace-nowrap">
                      ${t("sellPage.viewProfile")}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mobile header (kompakt satir + esit yukseklikli aksiyon seridi) -->
            <div class="sm:hidden">
              <div class="flex items-center gap-3">
                <div class="w-[50px] h-[50px] shrink-0 overflow-hidden border border-gray-200 bg-white"
                     :style="'border-radius:' + (seller?.logo_radius || '8') + 'px'">
                  <img x-show="seller?.logo" :src="seller?.logo" :alt="seller?.seller_name" width="140" height="140"
                       class="w-full h-full object-contain" />
                  <div x-show="!seller?.logo" class="w-full h-full bg-gray-100 flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2 7l10-5 10 5v10l-10 5-10-5V7z"/></svg>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <p class="text-[17px] font-bold text-[#222] leading-tight truncate" x-text="seller?.seller_name || ''"></p>
                    <span x-show="seller?.verified"
                          class="w-[15px] h-[15px] rounded-full bg-green-700 flex items-center justify-center shrink-0"
                          role="img" aria-label="${t("seller.sf.verifiedSupplier")}" title="${t("seller.sf.verifiedSupplier")}">
                      <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-8 8a1 1 0 01-1.415 0l-4-4a1 1 0 111.415-1.415L8 12.586l7.29-7.296a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    </span>
                  </div>
                  <p class="text-[12px] text-[#777] truncate"
                     x-text="[seller?.business_type, (seller?.founded_year || seller?.member_since) ? ((new Date().getFullYear() - (seller?.founded_year || 2010)) + ' ${t("sellPage.years")}') : '', [seller?.city, seller?.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')"></p>
                </div>
              </div>
              <div class="grid grid-cols-[1fr_40px_40px] gap-2 mt-3">
                <button
                  class="h-10 text-white text-[12px] font-medium border rounded-[var(--radius-button,8px)] active:scale-[0.97] transition-[background-color,transform] duration-150 motion-reduce:transition-none motion-reduce:active:scale-100"
                  style="background-color: #1f1f1f; border-color: #1f1f1f;"
                  :style="layout.theme?.navBgColor ? 'background-color:' + layout.theme.navBgColor + ';border-color:' + layout.theme.navBgColor : ''"
                  @click="switchPage('contacts')">
                  ${t("sellPage.contactSupplier")}
                </button>
                <a href="/magaza/${sellerCode}"
                   class="h-10 flex items-center justify-center rounded-[var(--radius-button,8px)] border-[1.5px] border-gray-200 bg-white text-[#555] hover:text-[#222] hover:border-gray-300 transition-colors duration-150"
                   aria-label="${t("sellPage.profile")}">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5"/></svg>
                </a>
                <button type="button"
                        class="th-no-press h-10 flex items-center justify-center rounded-[var(--radius-button,8px)] border-[1.5px] border-gray-200 bg-white text-[#555] hover:text-[#222] hover:border-gray-300 transition-colors duration-150"
                        aria-label="${t("product.share")}"
                        @click="shareShop()">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path stroke-linecap="round" d="m8.3 10.8 6.4-3.6M8.3 13.2l6.4 3.6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ STORE NAV BAR (sayfa bazli gecis — mobilde toggle) ═══ -->
        <div class="sticky top-0 z-(--z-sticky)" style="background-color: #1f1f1f;" :style="layout.theme?.navBgColor ? 'background-color:' + layout.theme.navBgColor : ''"
             x-data="{ mobileNav: false, mobileSearch: false }">
          <div class="max-w-[1200px] mx-auto px-4 lg:px-8 flex items-center justify-between h-[42px]">

            <!-- Hamburger (mobil) -->
            <button @click="mobileNav = !mobileNav" class="sm:hidden flex items-center justify-center w-8 h-8 text-white/80 hover:text-white">
              <svg x-show="!mobileNav" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              <svg x-show="mobileNav" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <!-- Aktif sayfa adi (mobil) -->
            <span class="sm:hidden text-[13px] font-medium text-white"
                  x-text="activePage === 'home' ? '${t("sellPage.navHome")}' : activePage === 'products' ? '${t("sellPage.navProducts")}' : activePage === 'profile' ? '${t("sellPage.profile")}' : '${t("sellPage.navContacts")}'"></span>

            <!-- Nav Items (desktop) -->
            <nav class="hidden sm:flex items-center gap-0 h-full">
              <a href="#" @click.prevent="switchPage('home')"
                 class="px-4 h-full flex items-center text-[13px] font-medium transition-colors"
                 :class="activePage === 'home' ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'">
                ${t("sellPage.navHome")}
              </a>

              <!-- Urunler (dropdown) -->
              <div class="relative h-full" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
                <button @click="switchPage('products')"
                   class="px-4 h-full flex items-center gap-1.5 text-[13px] font-medium transition-colors"
                   :class="activePage === 'products' ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'">
                  ${t("sellPage.navProducts")}
                  <svg class="w-3 h-3 transition-transform" :class="open ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div x-show="open" x-transition.opacity.duration.150ms
                     class="absolute top-full start-0 rounded-b-md shadow-lg min-w-[200px] py-1 z-50"
                     style="background-color: var(--store-nav-bg);">
                  <a href="#" @click.prevent="filterByCategory(''); switchPage('products'); open = false"
                     class="block px-4 py-2 text-[13px] font-medium hover:bg-white/10 transition-colors"
                     style="color: var(--store-nav-text, #fff);">${t("sellPage.allProducts")}</a>
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
                  ${t("sellPage.profile")}
                  <svg class="w-3 h-3 transition-transform" :class="open ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div x-show="open" x-transition.opacity.duration.150ms
                     class="absolute top-full start-0 rounded-b-md shadow-lg min-w-[180px] py-1 z-50"
                     style="background-color: var(--store-nav-bg);">
                  <a href="#" @click.prevent="switchPage('profile'); open = false"
                     class="block px-4 py-2 text-[13px] hover:bg-white/10 transition-colors"
                     style="color: var(--store-nav-text, #fff);">${t("sellPage.companyProfile")}</a>
                  <a href="/magaza/${sellerCode}"
                     class="block px-4 py-2 text-[13px] hover:bg-white/10 transition-colors"
                     style="color: var(--store-nav-text, #fff);">${t("sellPage.detailedProfile")}</a>
                </div>
              </div>

              <a href="#" @click.prevent="switchPage('contacts')"
                 class="px-4 h-full flex items-center text-[13px] font-medium transition-colors"
                 :class="activePage === 'contacts' ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'">
                ${t("sellPage.navContacts")}
              </a>
            </nav>

            <!-- Search (desktop) -->
            <div class="hidden sm:flex items-center gap-2">
              <div class="relative">
                <input type="text" placeholder="${t("sellPage.searchInStore")}"
                       class="w-[180px] lg:w-[240px] h-[30px] text-[12px] border border-white/30 rounded ps-3 pe-8 bg-white/10 text-white placeholder-white/50 focus:bg-white focus:text-gray-800 focus:placeholder-gray-400 focus:border-white transition-colors" />
                <svg class="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
            </div>

            <!-- Search icon (mobil) -->
            <button @click="mobileSearch = !mobileSearch" class="sm:hidden flex items-center justify-center w-8 h-8 text-white/70 hover:text-white">
              <svg x-show="!mobileSearch" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/></svg>
              <svg x-show="mobileSearch" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Mobil Search Bar -->
          <div x-show="mobileSearch"
               x-transition:enter="origin-top transition ease-out duration-150 motion-reduce:transition-none"
               x-transition:enter-start="opacity-0 scale-95 motion-reduce:scale-100"
               x-transition:enter-end="opacity-100 scale-100"
               x-transition:leave="origin-top transition ease-out duration-150 motion-reduce:transition-none"
               x-transition:leave-start="opacity-100 scale-100"
               x-transition:leave-end="opacity-0 scale-95 motion-reduce:scale-100"
               class="sm:hidden px-4 py-2.5 border-t border-white/10">
            <div class="relative">
              <input type="text" placeholder="${t("sellPage.searchInStore")}" autofocus
                     class="w-full h-[36px] text-[13px] border border-white/20 rounded-md ps-3 pe-9 bg-white/10 text-white placeholder-white/50 focus:bg-white focus:text-gray-800 focus:placeholder-gray-400 focus:border-white transition-colors" />
              <svg class="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
          </div>

          <!-- Mobil Menu (toggle) -->
          <div x-show="mobileNav"
               x-transition:enter="origin-top transition ease-out duration-150 motion-reduce:transition-none"
               x-transition:enter-start="opacity-0 scale-95 motion-reduce:scale-100"
               x-transition:enter-end="opacity-100 scale-100"
               x-transition:leave="origin-top transition ease-out duration-150 motion-reduce:transition-none"
               x-transition:leave-start="opacity-100 scale-100"
               x-transition:leave-end="opacity-0 scale-95 motion-reduce:scale-100"
               class="sm:hidden border-t border-white/10">
            <a href="#" @click.prevent="switchPage('home'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium border-b border-white/5 transition-colors"
               :class="activePage === 'home' ? 'text-white bg-white/10' : 'text-white/70'">
              ${t("sellPage.navHome")}
            </a>
            <a href="#" @click.prevent="switchPage('products'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium border-b border-white/5 transition-colors"
               :class="activePage === 'products' ? 'text-white bg-white/10' : 'text-white/70'">
              ${t("sellPage.navProducts")}
            </a>
            <a href="#" @click.prevent="switchPage('profile'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium border-b border-white/5 transition-colors"
               :class="activePage === 'profile' ? 'text-white bg-white/10' : 'text-white/70'">
              ${t("sellPage.profile")}
            </a>
            <a href="#" @click.prevent="switchPage('contacts'); mobileNav = false"
               class="block px-5 py-3 text-[13px] font-medium transition-colors"
               :class="activePage === 'contacts' ? 'text-white bg-white/10' : 'text-white/70'">
              ${t("sellPage.navContacts")}
            </a>
          </div>
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

    <!-- Login modal (contact bilgileri için) -->
    ${LoginModal()}
  `;

  // Initialize
  initFlowbite();
  initLanguageSelector();
  initCurrency();
  mountChatPopup();
  initChatTriggers();
  startAlpine();

  // Init Swipers after Alpine is ready
  // initAllSwipers (interactions.ts) Swiper'i bundler ile import eder — window.Swiper global'i gerekmez.
  // Hero banner: Navigation + Autoplay + Pagination ile dinamik init (data-hero-* attribute'lari okur)
  setTimeout(() => {
    initAllSwipers();
  }, 500);
}

// Start
renderPage();
