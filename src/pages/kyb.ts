/**
 * KYB Page — Entry Point (Sprint 2.6)
 *
 * Belge Doğrulama (KYB Verification) — Sprint 2.6:
 * - Alıcı kullanıcı geldiğinde redirect ETMEZ; sayfa içinde locked banner +
 *   "Satıcı başvurusu yapın" CTA gösterir.
 * - Seller (veya pending application sahibi) ise normal KybLayout render.
 */

import "../style.css";
import { initFlowbite } from "flowbite";
import { t } from "../i18n";
import { startAlpine } from "../alpine";
// B-2: kyb Alpine modülü page-specific (alpine/index.ts core'undan çıkarıldı).
// startAlpine()'dan önce register etmeli — import hoisted.
import "../alpine/kyb";
import { requireAuth } from "../utils/auth-guard";
import { getUser } from "../utils/auth";
import { routeToSellerFlow } from "../utils/sellerRouter";

import { TopBar, initHeaderCart } from "../components/header";
import { initLanguageSelector } from "../components/header/TopBar";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { FooterLinks } from "../components/footer";
import { FloatingPanel, initFloatingPanel } from "../components/floating";
import { renderSidebarColumn, initSidebar } from "../components/sidebar";
import { KybLayout } from "../components/kyb/KybLayout";

// Sprint 2.6: Login zorunlu (requireAuth), Seller/Buyer ayrımı sayfa içinde.
await requireAuth();

const user = getUser();
const kybLocked = Boolean(user?.kyb_locked);

function renderLockedFeature(): string {
  return `
    <div class="max-w-2xl mx-auto px-4 py-8 max-sm:py-5">
      <div class="bg-white rounded-md border border-gray-200 p-8 max-sm:p-5 text-center shadow-sm">
        <div class="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">${t("lockedFeature.kybTitle")}</h2>
        <p class="text-sm text-gray-600 mb-6">${t("lockedFeature.kybDesc")}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" data-kyb-start-seller-flow
             class="th-btn px-6 py-2.5 text-sm font-semibold">
            ${t("lockedFeature.kybCta")}
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
            { label: t("kyb.title") },
          ])}
        </div>

        <main>
          ${kybLocked ? renderLockedFeature() : KybLayout()}
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

// KYB locked CTA — smart routing (sell.ts ile aynı logic)
document.body.addEventListener("click", async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-kyb-start-seller-flow]");
  if (!btn) return;
  e.preventDefault();
  await routeToSellerFlow();
});

startAlpine();
