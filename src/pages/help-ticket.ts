/**
 * Ticket Detail Page — Entry Point (?id=<name>) (login zorunlu)
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { HelpCenterHeader, initHelpCenterLangSelector } from '../components/help-center'
import { TicketDetailLayout } from '../components/help-center/TicketDetailLayout'
import { requireAuth } from '../utils/auth-guard'

await requireAuth()

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.classList.add('relative')
appEl.innerHTML = `
  ${HelpCenterHeader({ activePage: 'tickets' })}
  <main>
    ${TicketDetailLayout()}
  </main>
  ${FloatingPanel()}
`

initFlowbite()
initHelpCenterLangSelector()
startAlpine()
