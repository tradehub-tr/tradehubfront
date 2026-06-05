/**
 * Doğrulanmış Tedarikçi Olun — Entry Point
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { InfoPageLayout } from '../components/info/InfoPageLayout'
import { t } from '../i18n'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}
  <main class="flex-1 min-w-0 bg-white">
    <div class="container-boxed">
      ${Breadcrumb([{ label: t('sellPage.verificationTitle') }])}
    </div>
    ${InfoPageLayout({
      title: t('sellPage.verificationTitle'),
      subtitle: t('sellPage.verificationSubtitle'),
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/></svg>',
      sections: [
        {
          title: t('sellPage.verificationBenefitsTitle'),
          content: `
            <p>${t('sellPage.verificationBenefitsP1')}</p>
            <p>${t('sellPage.verificationBenefitsP2')}</p>
            <p>${t('sellPage.verificationBenefitsP3')}</p>
          `
        },
        {
          title: t('sellPage.verificationRequirementsTitle'),
          content: `
            <p>${t('sellPage.verificationRequirementsP1')}</p>
            <p>${t('sellPage.verificationRequirementsP2')}</p>
          `
        },
        {
          title: t('sellPage.verificationProcessTitle'),
          content: `
            <p>${t('sellPage.verificationProcessP1')}</p>
            <p>${t('sellPage.verificationProcessP2')}</p>
          `
        },
        {
          title: t('sellPage.verificationLevelsTitle'),
          content: `
            <p><strong>${t('sellPage.verificationLevelBasicLabel')}</strong> ${t('sellPage.verificationLevelBasicDesc')}</p>
            <p><strong>${t('sellPage.verificationLevelAdvancedLabel')}</strong> ${t('sellPage.verificationLevelAdvancedDesc')}</p>
            <p><strong>${t('sellPage.verificationLevelPremiumLabel')}</strong> ${t('sellPage.verificationLevelPremiumDesc')}</p>
          `
        }
      ]
    })}
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
