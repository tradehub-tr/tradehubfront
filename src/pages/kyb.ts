/**
 * KYB Page — Entry Point
 * Belge Doğrulama (KYB Verification) — Sadece satıcı kullanıcılar için.
 * Buyer-only kullanıcı doğrudan URL ile gelirse silent redirect.
 */

import "../style.css";
import { initFlowbite } from "flowbite";
import { t } from "../i18n";
import { startAlpine } from "../alpine";
import { requireSeller } from "../utils/auth-guard";

import { TopBar, initMobileDrawer, initHeaderCart } from "../components/header";
import { initLanguageSelector } from "../components/header/TopBar";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { FooterLinks } from "../components/footer";
import { FloatingPanel, initFloatingPanel } from "../components/floating";
import { renderSidebar, initSidebar } from "../components/sidebar";
import { KybLayout } from "../components/kyb/KybLayout";

// Sadece satıcılar (veya başvurusu beklemede olanlar) görür; aksi durumda redirect
await requireSeller();

const appEl = document.querySelector<HTMLDivElement>("#app")!;
appEl.classList.add("relative");
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) bg-white">
    ${TopBar({ compact: true })}
  </div>

  <div class="bg-[#F5F5F5] min-h-screen">
    <div class="container-boxed flex gap-1 md:gap-[14px]">
      <div class="w-[52px] md:w-[72px] xl:w-[260px] flex-shrink-0 pt-4">
        ${renderSidebar()}
      </div>

      <div class="flex-1 min-w-0">
        <div class="pt-4">
          ${Breadcrumb([
            { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
            { label: t("kyb.title") },
          ])}
        </div>

        <main>
          ${KybLayout()}
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
initMobileDrawer();
initLanguageSelector();
initSidebar();

startAlpine();
