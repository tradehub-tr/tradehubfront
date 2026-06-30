import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, initMobileDrawer, initStickyHeaderSearch, MegaMenu, initMegaMenu } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel, BottomNav, initBottomNav } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'
import { initCurrency } from '../services/currencyService'

// Products SubHeader (shared tabs + breadcrumb component between products/manufacturers)
import { SubHeader, updateSubHeader } from '../components/products'

// Category resolution for keyword display (same flow as products page)
import { findCategoryBySlug, findCategoryById, onCategoriesLoaded, loadCategories } from '../services/categoryService'
import { pushRecentCategory, getRecentCategories } from '../utils/recentCategories'

// Manufacturers specific components
import { ManufacturersLayout, initHorizontalCategoryBar, initCategoryFlyout, initFactorySliders, initManufacturerFilters } from '../components/manufacturers'
import { initVerificationHelpers } from '../components/seller'
import { getCategoryIcon, getIconByName } from '../components/header/MegaMenu';
window.__getCatIcon = (iconClass: string, name: string) =>
  iconClass ? getCategoryIcon(iconClass) : getIconByName(name);

// Sidebar kişiselleştirme sinyali — son ziyaret edilen kategori slug'ları (en yeni başta).
// ManufacturersHero "Kategoriye göre tedarik edin" sidebar'ı bu listeyi başa alıp 6 ile sınırlar.
window.__getRecentCategorySlugs = (): string[] =>
  getRecentCategories(12).map((c) => c.slug);

// ManufacturersHero "Kategoriye göre tedarik edin" sidebar'ı Alpine inline init()
// içinden çağırır — merkezi categoryService cache'ini paylaşsın diye köprü.
window.__loadCategories = () => loadCategories();

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');

// URL params drive cross-page tab links so Ürünler/Üreticiler navigation preserves category
const urlParams = new URLSearchParams(window.location.search);
const categoryParam = urlParams.get('category') || urlParams.get('cat') || undefined;
const queryParam = urlParams.get('q') || undefined;

// Initial keyword for title — slug is shown until async category lookup resolves the real name
const initialKeyword = queryParam
  ? queryParam.replace(/\+/g, ' ')
  : (categoryParam || '');

appEl.innerHTML = `
  <!-- Sticky Header (global, stays sticky across full page) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
  </div>

  <!-- Mega Menu (fixed overlay, positioned by JS) -->
  ${MegaMenu()}

  <!-- Main Content -->
  <main class="flex-1 min-w-0 bg-[#f0f2f5] dark:bg-gray-900 pb-12">
    <div class="container-boxed pt-4">
      ${SubHeader({
        activeTab: 'manufacturers',
        breadcrumb: [{ label: t('search.manufacturers') }],
        categoryParam,
        queryParam,
        keyword: initialKeyword,
        showSortView: false,
        showMeta: false,
      })}
    </div>
    ${ManufacturersLayout()}
  </main>

  <!-- Footer Section -->
  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}

  <!-- Bottom Navigation (mobile/tablet) -->
  ${BottomNav()}
`

// Initialize custom component behaviors FIRST (before Flowbite can interfere)
initMegaMenu();

// Initialize Flowbite for other interactive components
initFlowbite();

// Alpine data() ve global helper kayıtları startAlpine'den ÖNCE
// — alpine:init bir kez tetiklenir, x-data anında değerlendirilir
initManufacturerFilters();
initFactorySliders(); // window.__getSellerFavs / __toggleSellerFav helper'larını yayar
initVerificationHelpers(); // window.__verifiedByText / __downloadReportText

// Initialize Alpine.js (FloatingPanel is now Alpine-driven)
initCurrency();
mountChatPopup();
initChatTriggers();
startAlpine();

// Initialize remaining custom behaviors
initStickyHeaderSearch();
initMobileDrawer();
initBottomNav();
initLanguageSelector();
initAnimatedPlaceholder('#topbar-compact-search-input');

// Kategoriler async yüklendiğinde başlıktaki keyword'u gerçek kategori adıyla güncelle
// + sidebar personalization için recent-categories listesine kaydet (products.ts ile aynı pattern)
if (categoryParam) {
  onCategoriesLoaded(() => {
    const cat = findCategoryBySlug(categoryParam) || findCategoryById(categoryParam);
    if (cat) {
      pushRecentCategory({ slug: cat.slug, name: cat.name, image: cat.image });
      if (cat.name !== initialKeyword) {
        updateSubHeader({ keyword: cat.name });
      }
    } else {
      pushRecentCategory({ slug: categoryParam, name: categoryParam });
    }
  });
}

// Initialize Manufacturers specific behaviors if any
initHorizontalCategoryBar();
initCategoryFlyout();
