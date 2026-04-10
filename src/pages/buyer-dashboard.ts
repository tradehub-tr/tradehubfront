/**
 * Buyer Dashboard Page — Entry Point
 * Assembles header, buyer dashboard content, and footer.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
import { t } from '../i18n'
import { requireAuth } from '../utils/auth-guard'
import { getSessionUser, resendVerificationEmail } from '../utils/auth'
import { showToast } from '../utils/toast'

// Block page until auth is confirmed
await requireAuth();
const sessionUser = await getSessionUser();
const emailVerified = sessionUser?.email_verified ?? true;

// Header components (simplified for dashboard — no search bar / mega menu)
import { TopBar, initMobileDrawer, initHeaderCart } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel, initFloatingPanel } from '../components/floating'

// Buyer Dashboard components
import { BuyerDashboardLayout, initBuyerDashboardLayout } from '../components/buyer-dashboard'
import { renderSidebar } from '../components/sidebar'

// Mock data (used for browsing history, promotions etc. — user data comes from Alpine)
import { getMockBuyerDashboardData } from '../data/mockBuyerDashboard'

function renderMainContent(): string {
  const dashData = getMockBuyerDashboardData();
  return BuyerDashboardLayout({ data: dashData });
}

function getBreadcrumbItems(): { label: string; href?: string }[] {
  return [{ label: t('header.myAccount') }];
}

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Simplified Dashboard Header (TopBar only, no search/mega menu) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header)" style="background-color:var(--header-scroll-bg)">
    ${TopBar({ compact: true })}
  </div>

  <!-- Page body: Sidebar spans entire page including footer -->
  <div class="bg-[#F5F5F5] min-h-screen">
    <div class="max-w-[1425px] mx-auto px-[clamp(0.5rem,0.3rem+1vw,1.5rem)] flex gap-1 md:gap-[14px]">
      <!-- Sidebar Column -->
      <div class="w-[52px] md:w-[72px] xl:w-[260px] flex-shrink-0 pt-4">
        ${renderSidebar()}
      </div>

      <!-- Content Column (main + footer) -->
      <div class="flex-1 min-w-0 overflow-hidden">
        <!-- Breadcrumb -->
        <div class="pt-4 max-sm:pt-3" id="bd-breadcrumb">
          ${Breadcrumb(getBreadcrumbItems())}
        </div>

        <!-- Main Content -->
        <main id="bd-main-content">
          ${renderMainContent()}
        </main>

        <!-- Footer -->
        <footer>
          ${FooterLinks()}
        </footer>
      </div>
    </div>
  </div>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

// Initialize behaviors
initFlowbite();
initHeaderCart();
initFloatingPanel();
initMobileDrawer();
initLanguageSelector();

initBuyerDashboardLayout();
startAlpine();

// Handle verify-email link click in slider
if (!emailVerified) {
  document.addEventListener('click', async (e) => {
    const link = (e.target as HTMLElement).closest('a[href="#verify-email"]');
    if (!link) return;
    e.preventDefault();
    try {
      await resendVerificationEmail();
      showToast({ message: t('dashboard.verificationEmailSent'), type: 'success' });
    } catch {
      showToast({ message: t('dashboard.verificationEmailFailed'), type: 'error' });
    }
  });
}
