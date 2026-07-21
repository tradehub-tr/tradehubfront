/**
 * KYC Page — Entry Point (Sprint 2.6)
 *
 * Alıcı KYC doğrulama sayfası. Kurumsal (default) / Bireysel toggle ile
 * dinamik form alanları. Boxed white card layout (Image #8 stili).
 *
 * - Login zorunlu (Guest erişemez)
 * - Backend get_prefill_data → form ön doldurma (KYB'den de gelir)
 * - Submit → /api/method/...kyc.submit_kyc_documents
 */

import "../style.css";
import { initFlowbite } from "flowbite";
import { t } from "../i18n";
import { startAlpine } from "../alpine";
// B-2: sidebar Alpine modülü page-specific (dashboard sidebar bu sayfada).
import "../alpine/sidebar";
import { requireAuth } from "../utils/auth-guard";
import { api } from "../utils/api";
import { getUser } from "../utils/auth";

import { TopBar, initHeaderCart } from "../components/header";
import { initLanguageSelector } from "../components/header/TopBar";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { FooterLinks } from "../components/footer";
import { FloatingPanel, initFloatingPanel } from "../components/floating";
import { renderSidebarColumn, initSidebar } from "../components/sidebar";
import { KycLayout, initKycLayout } from "../components/kyc/KycLayout";
import { initLockedFeatureModal } from "../components/buyer-dashboard/LockedFeatureModal";

await requireAuth();

const user = getUser();
const kycLocked = Boolean(user?.kyc_locked);

function renderLockedFeature(): string {
  return `
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div class="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">${t("lockedFeature.kycTitle")}</h2>
        <p class="text-sm text-gray-600 mb-6">${t("lockedFeature.kycDesc")}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button id="kyc-start-flow"
            class="th-btn px-6 py-2.5 text-sm font-semibold">
            ${t("lockedFeature.kycCta")}
          </button>
          <a href="/pages/dashboard/buyer-dashboard.html"
             class="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md no-underline transition-colors">
            ${t("lockedFeature.returnDashboard")}
          </a>
        </div>
      </div>
    </div>
  `;
}

const appEl = document.querySelector<HTMLDivElement>("#app")!;
appEl.classList.add("relative");
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) bg-white">
    ${TopBar({ compact: true })}
  </div>

  <div class="bg-[#F5F5F5] min-h-screen">
    <div class="container-boxed flex gap-1 md:gap-[14px]">
      ${renderSidebarColumn()}

      <div class="flex-1 min-w-0">
        <div class="pt-4">
          ${Breadcrumb([
            { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
            { label: t("kycUi.pageTitle") },
          ])}
        </div>

        <main class="pb-8">
          ${kycLocked ? renderLockedFeature() : KycLayout()}
        </main>

        <footer>
          ${FooterLinks()}
        </footer>
      </div>
    </div>
  </div>

  ${FloatingPanel()}
`;

initFlowbite();
initHeaderCart();
initFloatingPanel();
initLanguageSelector();
initSidebar();
if (!kycLocked) {
  initKycLayout();
}
initLockedFeatureModal();

// "KYC Doldurmaya Başla" butonu — locked görünümden form'a geçiş için
// kullanıcının User Profile.kyc_status'unu Locked'tan Pending'e açmak gerekir.
// Sprint 2.6: bu trigger yeni endpoint ile yapılır. Şimdilik UX placeholder.
document.getElementById("kyc-start-flow")?.addEventListener("click", async () => {
  try {
    // api() CSRF token'ı bellekten yönetir; ham fetch + localStorage CSRF HTTP 400 veriyordu.
    await api("/method/tradehub_core.api.v1.kyc.unlock_for_self", { method: "POST" });
    window.location.reload();
  } catch (e) {
    console.warn("KYC unlock failed", e);
  }
});

startAlpine();
