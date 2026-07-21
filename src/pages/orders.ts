/**
 * Orders Page — Entry Point
 * "Siparişlerim" — order management page.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'

import { TopBar, initHeaderCart } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
// B-2: sidebar Alpine modülü page-specific (dashboard sidebar bu sayfada).
import '../alpine/sidebar'
// B-2: orders + remittance + orderItemsDrawer Alpine modülleri page-specific (core'dan çıkarıldı).
import '../alpine/orders'
import '../alpine/remittance'
import '../alpine/orderItemsDrawer'
import { renderSidebarColumn, initSidebar } from '../components/sidebar'
import { OrdersPageLayout, initOrdersPageLayout } from '../components/orders'
import { WriteReviewModal } from '../components/product/WriteReviewModal'
import { requireAuth } from '../utils/auth-guard'

await requireAuth();

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Compact Dashboard Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) bg-white">
    ${TopBar({ compact: true, hideNotice: true })}
  </div>

  <!-- Page body: Sidebar + Orders -->
  <div class="bg-[#F5F5F5] min-h-screen">
    <div class="container-boxed flex gap-1 md:gap-[14px]">
      <!-- Sidebar Column -->
      ${renderSidebarColumn()}

      <!-- Content Column -->
      <div class="flex-1 min-w-0 pt-4 pb-4">
        <main>
          ${OrdersPageLayout()}
        </main>
      </div>
    </div>
  </div>

  ${WriteReviewModal()}

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

initFlowbite();
mountChatPopup();
initChatTriggers();
initSidebar()
startAlpine();
initHeaderCart();
initLanguageSelector();
initOrdersPageLayout();
