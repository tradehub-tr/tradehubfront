/**
 * Accessibility Page — Entry Point
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { HelpCenterHeader, initHelpCenterLangSelector } from '../components/help-center'
import { LegalPageLayout } from '../components/legal'
import { accessibilityContent } from '../data/legalContent'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  ${HelpCenterHeader({ activePage: 'accessibility' })}
  <main>
    ${LegalPageLayout(accessibilityContent())}
  </main>
  ${FloatingPanel()}
`;

initFlowbite();
initHelpCenterLangSelector();
startAlpine();
