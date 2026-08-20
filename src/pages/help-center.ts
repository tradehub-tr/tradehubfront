/**
 * Help Center Page — Entry Point
 */

// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import '../style.css'
import { initFlowbite } from 'flowbite'

import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
// B-2: help Alpine modülü page-specific (helpCenter bu sayfada).
import '../alpine/help'
import { HelpCenterLayout, HelpCenterHeader, initHelpCenterLangSelector } from '../components/help-center'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Dedicated Help Center Header -->
  ${HelpCenterHeader()}

  <!-- Help Center Page Content -->
  <main>
    ${HelpCenterLayout()}
  </main>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

initFlowbite();
initHelpCenterLangSelector();
startAlpine();
