/**
 * Buyer Dashboard Page — Entry Point
 * Assembles header, buyer dashboard content, and footer.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
// B-2: sidebar Alpine modülü page-specific (dashboard sidebar bu sayfada).
import '../alpine/sidebar'
// B-2: orders + dashboard Alpine modülleri page-specific (buyer-dashboard sayfası).
import '../alpine/orders'
import '../alpine/dashboard'
import { t } from '../i18n'
import { requireAuth } from '../utils/auth-guard'
import { getSessionUser } from '../utils/auth'
import { initCurrency } from '../services/currencyService'

// Block page until auth is confirmed
await requireAuth();
const sessionUser = await getSessionUser();
const emailVerified = sessionUser?.email_verified ?? true;

// Döviz kurlarını render'dan ÖNCE yükle — aksi halde right-panel (favoriler +
// gezinme geçmişi) fiyatları DEFAULT_RATES (bayat) ile çevrilir.
await initCurrency();

// Header components (simplified for dashboard — no search bar / mega menu)
import { TopBar, initHeaderCart } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel, initFloatingPanel } from '../components/floating'

// Buyer Dashboard components
import { BuyerDashboardLayout, initBuyerDashboardLayout } from '../components/buyer-dashboard'
import { renderSidebarColumn, initSidebar } from '../components/sidebar'
import { KybStatusWidget } from '../components/kyb/KybStatusWidget'
import { VerificationStatusBanner } from '../components/buyer-dashboard/VerificationStatusBanner'
import { api } from '../utils/api'

// KYB status: only fetch for sellers / pending applicants (silent fail)
let kybInfo: { status?: string; rejection_reason?: string | null } | undefined;
if (sessionUser && (sessionUser.is_seller || sessionUser.pending_seller_application)) {
  try {
    const res = await api<{
      message: { exists: boolean; status?: string; rejection_reason?: string | null };
    }>("/method/tradehub_core.api.v1.kyb.get_kyb_status");
    if (res.message?.exists) {
      kybInfo = { status: res.message.status, rejection_reason: res.message.rejection_reason };
    } else {
      kybInfo = { status: "" };
    }
  } catch {
    /* ignore */
  }
}

function renderMainContent(): string {
  const defaultUser = { avatar: '', username: '', profileHref: '/profile' };
  // Sprint 2.6: Yeni VerificationStatusBanner (KYC + KYB state machine, 9 state).
  // Eski KybStatusWidget yine korunur — Verified durumunda küçük badge gösterir.
  const verificationBanner = VerificationStatusBanner(sessionUser);
  const widget = KybStatusWidget(sessionUser, kybInfo);
  const dashboard = BuyerDashboardLayout({
    data: { user: defaultUser, stats: [], notifications: [], browsingHistory: [], promotions: [] },
    emailVerified,
    userEmail: sessionUser?.email ?? '',
  });
  return verificationBanner + widget + dashboard;
}

function getBreadcrumbItems(): { label: string; href?: string }[] {
  return [{ label: t('header.myAccount') }];
}

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <h1 class="sr-only">Alıcı Kontrol Paneli</h1>
  <!-- Simplified Dashboard Header (TopBar only, no search/mega menu) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) bg-white">
    ${TopBar({ compact: true })}
  </div>

  <!-- Page body: Sidebar spans entire page including footer -->
  <div class="bg-[#F5F5F5] min-h-screen">
    <div class="container-boxed flex gap-1 md:gap-[14px]">
      <!-- Sidebar Column -->
      ${renderSidebarColumn()}

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
initLanguageSelector();

initBuyerDashboardLayout();
mountChatPopup();
initChatTriggers();
import("../components/buyer-dashboard/LockedFeatureModal").then((m) => m.initLockedFeatureModal());
initSidebar()
startAlpine();

// Email doğrulama akışı artık global EmailVerificationBanner tarafından
// yönetiliyor (TopBar içinde mount edilir, tüm sayfalarda çalışır). Buradaki
// dashboard-spesifik handler kaldırıldı.
