/**
 * HelpCenterHeader Component
 * Dedicated Help Center header — logo + "Help Center for Buyer" title on the left,
 * navigation as full-height tabs on desktop, equal-width tab row below lg.
 */

import { t, getCurrentLang } from "../../i18n";
import { waitForAuth } from "../../utils/auth";

const languageOptions = [
  { code: "TR", name: "Türkçe" },
  { code: "EN", name: "English" },
];

const getBaseUrl = (): string => {
  const viteBase = typeof import.meta !== "undefined" ? import.meta.env?.BASE_URL : undefined;
  if (viteBase && viteBase !== "/") return viteBase;
  if (window.location.pathname.startsWith("/tradehub/")) return "/tradehub/";
  return "/";
};

type ActivePage =
  | "home"
  | "faq"
  | "ticket-new"
  | "tickets"
  | "terms"
  | "privacy"
  | "cookies"
  | "returns"
  | "notice"
  | "product-listing"
  | "ip"
  | "accessibility"
  | "distance-sales"
  | "kvkk";

interface HelpCenterHeaderOptions {
  activePage?: ActivePage;
}

const NAV_LINKS: { id: ActivePage; label: string; href: string; authOnly?: boolean }[] = [
  { id: "home", label: t("helpCenter.navHome"), href: "/yardim-merkezi" },
  { id: "faq", label: t("helpCenter.navFaq"), href: "/sss" },
  {
    id: "ticket-new",
    label: t("helpCenter.navNewTicket"),
    href: "/destek/yeni",
    authOnly: true,
  },
  {
    id: "tickets",
    label: t("helpCenter.navMyTickets"),
    href: "/destek/taleplerim",
    authOnly: true,
  },
];

/**
 * Tek nav link şablonu — iki yüzeyde de tipografi kendi içinde tutarlıdır,
 * aktiflik yalnız renk + çizgiyle anlatılır (hover/aktifte layout shift yok).
 * - desktop: header tam yüksekliğinde tab (border-b-2 transparent/amber)
 * - menu:    tam ekran ink menü linki — kademeli giriş Alpine `open` state'ine bağlı
 */
function navLink(
  link: (typeof NAV_LINKS)[number],
  activePage: ActivePage,
  variant: "desktop" | "menu",
  index = 0
): string {
  const isActive = activePage === link.id;
  if (variant === "menu") {
    return `
    <a
      href="${link.href}"
      ${link.authOnly ? 'data-auth-only="1"' : ""}
      class="${link.authOnly ? "hidden " : ""}px-1 py-3 text-[21px] font-bold tracking-tight transition-[color,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
        isActive ? "text-primary-300" : "text-stone-200 hover:text-white"
      }"
      :class="open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      style="transition-delay:${80 + index * 60}ms"
      ${isActive ? 'aria-current="page"' : ""}
    >${link.label}<span class="block w-6 h-0.5 rounded-full mt-2 ${isActive ? "bg-primary-500" : "bg-transparent"}"></span></a>
  `;
  }
  const state = isActive
    ? "text-primary-600 border-primary-500"
    : "text-gray-600 border-transparent hover:text-gray-900";
  return `
    <a
      href="${link.href}"
      ${link.authOnly ? 'data-auth-only="1"' : ""}
      class="${link.authOnly ? "hidden " : ""}flex items-center px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${state}"
      ${isActive ? 'aria-current="page"' : ""}
    ><span class="truncate">${link.label}</span></a>
  `;
}

export function HelpCenterHeader(opts: HelpCenterHeaderOptions = {}): string {
  const { activePage = "home" } = opts;
  const baseUrl = getBaseUrl();

  const currentLang = getCurrentLang();
  const currentLangCode = currentLang === "tr" ? "TR" : "EN";
  const currentLangOption = languageOptions.find((l) => l.code === currentLangCode);
  const currentLangLabel = currentLangOption ? currentLangOption.name : "English";

  return `
    <header
      x-data="{ open: false }"
      @keydown.escape.window="open = false"
      @resize.window="if (window.innerWidth >= 768) open = false"
      x-effect="document.documentElement.classList.toggle('overflow-hidden', open)"
      class="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
    >
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-stretch justify-between h-12 lg:h-[56px]">

        <!-- Left: Logo + title -->
        <div class="flex items-center gap-2.5 min-w-0">
          <a href="${baseUrl}" class="flex items-center hover:opacity-80 transition-opacity shrink-0">
            <img src="${baseUrl}images/istoc-logo.png" alt="iStoc" width="87" height="32" class="h-[22px] lg:h-[26px] w-auto" />
          </a>
          <span class="block w-px h-5 bg-gray-200 shrink-0" aria-hidden="true"></span>
          <span class="flex items-center gap-1.5 min-w-0 text-[13px] lg:text-[15px] font-semibold text-gray-700 tracking-tight">
            <svg class="w-4 h-4 text-primary-500 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
            </svg>
            <!-- 768-919px bandında nav ile çakışmaması için başlık metni gizlenir, ikon kimliği taşır -->
            <span class="truncate lg:hidden min-[920px]:inline">${t("helpCenter.headerTitle")}</span>
          </span>
        </div>

        <!-- Right: Nav links (lg:+) + language selector -->
        <div class="flex items-stretch shrink-0 ms-2">
          <nav class="hidden lg:flex items-stretch gap-1" aria-label="${t("helpCenter.headerTitle")}">
            ${NAV_LINKS.map((link) => navLink(link, activePage, "desktop")).join("")}
          </nav>

          <!-- Language Selector (desktop — mobilde menü içinden değiştirilir) -->
          <div class="hidden lg:block relative shrink-0 ms-2 self-center">
            <button
              data-popover-target="hc-popover-language"
              data-popover-placement="bottom-end"
              class="th-no-press flex items-center justify-center gap-1.5 h-10 px-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer rounded-md hover:bg-gray-100"
              type="button"
              aria-label="${t("header.language") || "Dil"}"
            >
              <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-4.247m0 0A8.959 8.959 0 0 1 3 12c0-1.177.227-2.302.637-3.332" />
              </svg>
              <span class="hidden lg:inline font-medium">${currentLangLabel}</span>
            </button>

            <!-- Language Popover -->
            <div data-popover id="hc-popover-language" role="tooltip"
              class="absolute z-50 invisible inline-block w-64 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 transition-opacity duration-150 motion-reduce:transition-none"
            >
              <div class="p-4">
                <h3 class="text-sm font-bold text-gray-900 mb-3">${t("header.language") || "Dil"}</h3>
                <select id="hc-lang-select" class="th-input th-input-sm cursor-pointer">
                  ${languageOptions
                    .map(
                      (lang) => `
                    <option value="${lang.code}" ${lang.code === currentLangCode ? "selected" : ""}>${lang.name}</option>
                  `
                    )
                    .join("")}
                </select>
                <button type="button" id="hc-lang-save-btn" class="th-btn mt-3 w-full px-4 py-2 text-sm font-medium cursor-pointer">
                  ${t("common.save") || "Kaydet"}
                </button>
              </div>
              <div data-popper-arrow></div>
            </div>
          </div>

          <!-- Hamburger (lg altı) — üç çizgi ↔ X morph -->
          <button
            type="button"
            class="th-no-press lg:hidden flex flex-col items-center justify-center gap-[5px] size-11 -me-1 self-center rounded-md"
            @click="open = !open"
            :aria-expanded="open ? 'true' : 'false'"
            aria-controls="hc-mobile-menu"
            aria-label="${t("helpCenter.menuLabel")}"
          >
            <span class="block w-[18px] h-0.5 rounded-full bg-gray-800 transition-transform duration-[250ms] ease-out motion-reduce:transition-none" :class="open ? 'translate-y-[7px] rotate-45' : ''"></span>
            <span class="block w-[18px] h-0.5 rounded-full bg-gray-800 transition-opacity duration-150 motion-reduce:transition-none" :class="open ? 'opacity-0' : ''"></span>
            <span class="block w-[18px] h-0.5 rounded-full bg-gray-800 transition-transform duration-[250ms] ease-out motion-reduce:transition-none" :class="open ? '-translate-y-[7px] -rotate-45' : ''"></span>
          </button>
        </div>

      </div>

      <!-- Tam ekran ink menü (lg altı) — header görünür kalır, panel altından açılır -->
      <div
        id="hc-mobile-menu"
        x-cloak
        class="lg:hidden fixed inset-x-0 top-12 bottom-0 z-40 bg-[#15130d] flex flex-col px-7 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-[opacity,transform,visibility] duration-300 ease-out motion-reduce:transition-none"
        :class="open ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'"
        :aria-hidden="!open"
      >
        <nav class="flex-1 flex flex-col justify-center gap-1" aria-label="${t("helpCenter.headerTitle")}">
          ${NAV_LINKS.map((link, i) => navLink(link, activePage, "menu", i)).join("")}
        </nav>
        <div
          class="border-t border-[#2e2a20] pt-4 flex items-center gap-2 transition-opacity duration-300 delay-300 motion-reduce:transition-none"
          :class="open ? 'opacity-100' : 'opacity-0'"
        >
          <svg class="w-4 h-4 text-stone-400 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-4.247m0 0A8.959 8.959 0 0 1 3 12c0-1.177.227-2.302.637-3.332" />
          </svg>
          ${languageOptions
            .map(
              (lang) => `
            <button
              type="button"
              data-hc-menu-lang="${lang.code}"
              class="th-no-press px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors motion-reduce:transition-none ${
                lang.code === currentLangCode
                  ? "border-primary-500 text-primary-300"
                  : "border-[#3d392c] text-stone-300 hover:text-white"
              }"
            >${lang.name}</button>
          `
            )
            .join("")}
        </div>
      </div>
    </header>
  `;
}

/**
 * Initialize the language selector in HelpCenterHeader.
 * Call this after the header HTML is inserted into the DOM and after initFlowbite().
 */
export function initHelpCenterLangSelector(): void {
  const langSelect = document.getElementById("hc-lang-select") as HTMLSelectElement | null;
  const saveBtn = document.getElementById("hc-lang-save-btn");
  const langMap: Record<string, string> = { TR: "tr", EN: "en" };

  const applyLang = (code: string) => {
    localStorage.setItem("i18nextLng", langMap[code] || "en");
    window.location.reload();
  };
  saveBtn?.addEventListener("click", () => applyLang(langSelect?.value || "EN"));
  // Mobil menü dil butonları — seçim anında uygulanır (popover'daki kaydet akışının kısayolu)
  document.querySelectorAll<HTMLButtonElement>("[data-hc-menu-lang]").forEach((btn) =>
    btn.addEventListener("click", () => applyLang(btn.dataset.hcMenuLang || ""))
  );

  // Auth durumuna göre "Talep Oluştur" + "Taleplerim" linklerini göster
  waitForAuth().then((user) => {
    if (!user) return;
    document.querySelectorAll<HTMLElement>('[data-auth-only="1"]').forEach((el) => {
      el.classList.remove("hidden");
    });
  });
}
