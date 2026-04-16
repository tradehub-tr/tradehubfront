/**
 * Tickets List Page — Entry Point (login zorunlu)
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { HelpCenterHeader, initHelpCenterLangSelector } from '../components/help-center'
import { TicketsListLayout } from '../components/help-center/TicketsListLayout'
import { requireAuth } from '../utils/auth-guard'

await requireAuth()

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  ${HelpCenterHeader({ activePage: 'tickets' })}
  <main>
    ${TicketsListLayout()}
  </main>
  ${FloatingPanel()}
`;

initFlowbite();
initHelpCenterLangSelector();
startAlpine();
