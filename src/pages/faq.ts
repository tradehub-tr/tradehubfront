/**
 * FAQ Page — Entry Point
 */

// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import '../style.css'
import { initFlowbite } from 'flowbite'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
// B-2: help Alpine modülü page-specific (faqPage bu sayfada).
import '../alpine/help'
import { FAQPageLayout, HelpCenterHeader, initHelpCenterLangSelector } from '../components/help-center'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Dedicated Help Center Header -->
  ${HelpCenterHeader({ activePage: 'faq' })}

  <!-- FAQ Page Content -->
  <main>
    ${FAQPageLayout()}
  </main>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

initFlowbite();
initHelpCenterLangSelector();
startAlpine();
