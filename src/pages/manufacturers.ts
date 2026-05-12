import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, MobileSearchTabs, initMobileDrawer, initStickyHeaderSearch, MegaMenu, initMegaMenu } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'
import { initCurrency } from '../services/currencyService'

// Manufacturers specific components
import { ManufacturersLayout, initHorizontalCategoryBar, initCategoryFlyout, initFactorySliders, initManufacturerFilters } from '../components/manufacturers'
import { getCategoryIcon, getIconByName } from '../components/header/MegaMenu';
(window as any).__getCatIcon = (iconClass: string, name: string) =>
  iconClass ? getCategoryIcon(iconClass) : getIconByName(name);

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');

appEl.innerHTML = `
  <!-- Sticky Header (global, stays sticky across full page) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
  </div>

  <!-- Mobile Search Tabs (Products | Manufacturers) — non-sticky -->
  ${MobileSearchTabs('manufacturers')}

  <!-- Mega Menu (fixed overlay, positioned by JS) -->
  ${MegaMenu()}

  <!-- Main Content -->
  <main class="flex-1 min-w-0 bg-[#f0f2f5] dark:bg-gray-900 pb-12">
    <div class="container-boxed">
      ${Breadcrumb([{ label: t('search.manufacturers') }])}
    </div>
    ${ManufacturersLayout()}
  </main>

  <!-- Footer Section -->
  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`

// Initialize custom component behaviors FIRST (before Flowbite can interfere)
initMegaMenu();

// Initialize Flowbite for other interactive components
initFlowbite();

// Alpine data() ve global helper kayıtları startAlpine'den ÖNCE
// — alpine:init bir kez tetiklenir, x-data anında değerlendirilir
initManufacturerFilters();
initFactorySliders(); // window.__getSellerFavs / __toggleSellerFav helper'larını yayar

// Initialize Alpine.js (FloatingPanel is now Alpine-driven)
initCurrency();
mountChatPopup();
initChatTriggers();
startAlpine();

// Initialize remaining custom behaviors
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();
initAnimatedPlaceholder('#topbar-compact-search-input');

// Initialize Manufacturers specific behaviors if any
initHorizontalCategoryBar();
initCategoryFlyout();
