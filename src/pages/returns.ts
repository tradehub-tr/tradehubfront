/**
 * Returns Policy Page — Entry Point
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import '../style.css'
import { initFlowbite } from 'flowbite'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { HelpCenterHeader, initHelpCenterLangSelector } from '../components/help-center'
import { LegalPageLayout, ReturnProcessSteps, ReturnFAQ } from '../components/legal'
import { returnsContent } from '../data/legalContent'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  ${HelpCenterHeader({ activePage: 'returns' })}
  <main>
    ${LegalPageLayout(returnsContent())}
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16">
      ${ReturnProcessSteps()}
      ${ReturnFAQ()}
    </div>
  </main>
  ${FloatingPanel()}
`;

initFlowbite();
initHelpCenterLangSelector();
startAlpine();
