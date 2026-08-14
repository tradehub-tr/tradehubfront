/**
 * Alıcı panosu sayfa kabuğu.
 *
 * Dört yeni lojistik sayfası aynı iskeleti kuruyordu: sticky header, sol
 * menü, breadcrumb, içerik, footer, floating panel, bottom nav — ve peşinden
 * yedi `init*` çağrısı. Dördünde tekrarlamak, birinde bir init çağrısını
 * unutmak demekti (`initSidebar` unutulursa menü sessizce çalışmaz).
 *
 * Mevcut sayfalar bu kabuğu kullanmıyor; onlara DOKUNULMADI. Burada amaç
 * geçmişi düzeltmek değil, yeni sayfaların aynı hatayı dört kez yapmasını
 * önlemek.
 */
import { initFlowbite } from "flowbite";

import { mountChatPopup, initChatTriggers } from "../components/chat-popup";
import { FloatingPanel, initFloatingPanel, BottomNav, initBottomNav } from "../components/floating";
import { FooterLinks } from "../components/footer";
import { TopBar, initHeaderCart } from "../components/header";
import { initLanguageSelector } from "../components/header/TopBar";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { renderSidebarColumn, initSidebar } from "../components/sidebar";

export interface DashboardShellOptions {
  /** Breadcrumb kalemleri — sonuncusu bağlantısız (bulunulan sayfa). */
  breadcrumb: { label: string; href?: string }[];
  /** İçerik alanının id'si — sayfa sonradan buraya yazıyor. */
  contentId: string;
  /** İlk çizimde gösterilecek içerik (genelde "yükleniyor"). */
  initialContent?: string;
}

/**
 * Kabuğu `#app` içine kurar ve içerik elemanını döndürür.
 *
 * `startAlpine()` BURADA çağrılmıyor: içerik sonradan doluyor ve Alpine
 * yalnız bir kez başlatılabiliyor. Sayfa, içeriği yazdıktan sonra kendisi
 * çağırıyor (kök `alpinejs.md` §3.6).
 */
export function mountDashboardShell(options: DashboardShellOptions): HTMLElement {
  const { breadcrumb, contentId, initialContent = "" } = options;

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
          <div class="pt-4">${Breadcrumb(breadcrumb)}</div>
          <main class="space-y-4 py-4" id="${contentId}">${initialContent}</main>
          <footer>${FooterLinks()}</footer>
        </div>
      </div>
    </div>

    ${FloatingPanel()}
    ${BottomNav()}
  `;

  initFlowbite();
  initHeaderCart();
  initFloatingPanel();
  initLanguageSelector();
  initSidebar();
  mountChatPopup();
  initChatTriggers();
  initBottomNav();

  return document.querySelector<HTMLElement>(`#${contentId}`)!;
}

/** Beyaz kart — dört sayfada aynı. */
export function shellCard(inner: string): string {
  return `<section class="rounded-md border border-gray-200 bg-white p-4 sm:p-6">${inner}</section>`;
}
