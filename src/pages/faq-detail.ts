/**
 * FAQ Detail Page — Entry Point
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
// B-2: help Alpine modülü page-specific (faqDetail bu sayfada).
import '../alpine/help'
import { FAQDetailLayout, HelpCenterHeader, initHelpCenterLangSelector } from '../components/help-center'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Dedicated Help Center Header -->
  ${HelpCenterHeader({ activePage: 'faq' })}

  <!-- FAQ Detail Content -->
  <main>
    ${FAQDetailLayout()}
  </main>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

initFlowbite();
initHelpCenterLangSelector();
startAlpine();
