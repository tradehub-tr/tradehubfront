/**
 * Cookie Policy Page — Entry Point
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { LegalPageLayout, CookieConsentUI } from '../components/legal'
import { cookiesContent } from '../data/legalContent'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}
  <main>
    ${LegalPageLayout(cookiesContent())}
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16">
      ${CookieConsentUI()}
    </div>
  </main>
  <footer>
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
