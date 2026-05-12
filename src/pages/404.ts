/**
 * 404 Page — Entry Point
 * Eski bildirim URL'lerini (ör. /buyer-dashboard?tab=orders&order=XXX)
 * doğru yola yönlendirmeyi de üstleniyor.
 */
import '../style.css'

(function redirectLegacyPaths() {
  if (window.location.pathname.startsWith('/buyer-dashboard')) {
    const orderNum = new URLSearchParams(window.location.search).get('order');
    const target = orderNum
      ? `/pages/dashboard/orders.html?order=${encodeURIComponent(orderNum)}`
      : '/pages/dashboard/orders.html';
    window.location.replace(target);
  }
})();
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { NotFoundSection, ExploreDeals, initExploreDeals } from '../components/404'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}
  <main class="flex-1 min-w-0 bg-white dark:bg-secondary-950">
    ${NotFoundSection()}
    ${ExploreDeals()}
  </main>
  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`;

initMegaMenu();
initFlowbite();
mountChatPopup();
initChatTriggers();
startAlpine();
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();
initExploreDeals();
