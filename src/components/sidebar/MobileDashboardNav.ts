/**
 * MobileDashboardNav — Dashboard sayfalarının mobil navigasyonu.
 * İkon rail'in yerini alır: header'daki avatar çipi soldan drawer açar
 * (etiketli dashboard menüsü, lg altı). Dashboard'da alt nav çubuğu YOK —
 * kullanıcı kararı, storefront hamburger'ıyla karışıyordu.
 * initSidebar() içinden body'ye inject edilir; masaüstü sidebar'ı değişmez.
 */

import { getSidebarSections, getItemState } from "./sidebarData";
import { sidebarIcons, type SidebarIconKey } from "./sidebarIcons";
import type { SidebarMenuItem } from "../../types/buyerDashboard";
import { t } from "../../i18n";
import { getUser } from "../../utils/auth";
import { escapeHtml } from "../../utils/sanitize";

function icon(name: string): string {
  return sidebarIcons[name as SidebarIconKey] ?? "";
}

/**
 * Rail (Sidebar.ts) ile aynı karşılaştırma: href hash içeriyorsa
 * pathname+hash eşleştirilir, yoksa yalnız pathname — orders alt öğeleri
 * (#refunds, #reviews) aksi halde hepsi aynı anda bold görünür.
 */
function isCurrentPage(href: string): boolean {
  const [path, hash] = href.split("#");
  if (window.location.pathname !== path) return false;
  return hash ? window.location.hash === `#${hash}` : !window.location.hash;
}

/* ──── Drawer ──── */

function renderDrawerItem(item: SidebarMenuItem, locked: boolean): string {
  const active = isCurrentPage(item.href);
  const rowCls = active
    ? "bg-amber-50 text-gray-900 font-semibold"
    : "text-gray-700 hover:bg-gray-50";
  const iconCls = active ? "text-primary-600" : "text-gray-500";

  // Sprint 2.6 — rail'deki locked görünümüyle tutarlı: gri + cursor-not-allowed,
  // href'siz <button data-locked-feature> ile aynı LockedFeatureModal tetikleyici
  // (global body click delegation — bkz. LockedFeatureModal.ts).
  if (locked) {
    return `
      <button
        type="button"
        data-locked-feature="${item.lockable}"
        class="flex w-full items-center gap-3 px-4 py-2.5 text-start text-gray-400 opacity-50 cursor-not-allowed"
      >
        <span class="shrink-0">${icon(item.icon)}</span>
        <span class="text-sm min-w-0 truncate">${item.label}</span>
      </button>
    `;
  }

  if (item.submenu?.length) {
    const open = item.submenu.some((s) => isCurrentPage(s.href)) || active;
    const sub = item.submenu
      .map(
        (s) =>
          `<a href="${s.href}" class="block ps-[46px] pe-4 py-2 text-[13px] no-underline ${isCurrentPage(s.href) ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"}">${s.label}</a>`
      )
      .join("");
    return `
      <details class="group/dditem"${open ? " open" : ""}>
        <summary class="flex items-center gap-3 px-4 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden ${rowCls}">
          <span class="${iconCls} shrink-0">${icon(item.icon)}</span>
          <span class="text-sm flex-1 min-w-0 truncate">${item.label}</span>
          <svg class="w-3.5 h-3.5 text-gray-400 transition-transform duration-150 motion-reduce:transition-none group-open/dditem:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="pb-1">${sub}</div>
      </details>
    `;
  }

  return `
    <a href="${item.href}" class="flex items-center gap-3 px-4 py-2.5 no-underline ${rowCls}">
      <span class="${iconCls} shrink-0">${icon(item.icon)}</span>
      <span class="text-sm min-w-0 truncate">${item.label}</span>
    </a>
  `;
}

function renderUserCard(): string {
  const user = getUser();
  if (!user) return "";
  const initial = escapeHtml((user.full_name || user.email || "?").charAt(0).toUpperCase());
  const fullName = escapeHtml(user.full_name || user.email);
  const email = escapeHtml(user.email);
  return `
    <div class="mx-4 mt-3 mb-1 rounded-lg bg-gray-50 px-3.5 py-3 flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 uppercase shrink-0">${initial}</div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-gray-900 m-0 truncate">${fullName}</p>
        <p class="text-[11px] text-gray-500 m-0 truncate">${email}</p>
      </div>
    </div>
  `;
}

function renderDrawer(): string {
  const sections = getSidebarSections()
    .map((section) => {
      const items = section.items
        .map((item) => ({ item, state: getItemState(item) }))
        .filter(({ state }) => state.visible)
        .map(({ item, state }) => renderDrawerItem(item, state.locked))
        .join("");
      if (!items) return "";
      const title = section.title
        ? `<h3 class="px-4 pt-4 pb-1 text-[11px] font-normal uppercase tracking-wider text-gray-400 m-0">${section.title}</h3>`
        : "";
      return title + items;
    })
    .join("");

  return `
    <div id="dash-drawer-backdrop" class="fixed inset-0 z-(--z-backdrop) bg-black/40 hidden lg:hidden"></div>
    <div id="dash-drawer-panel" class="fixed top-0 bottom-0 start-0 z-(--z-backdrop) w-[280px] bg-white shadow-xl flex flex-col -translate-x-full rtl:translate-x-full transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden" role="navigation" aria-label="${t("dashboard.myDashboard")}">
      <div class="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
        <img src="/images/istoc-logo.png" alt="iStoc" width="87" height="32" class="h-7 w-auto" />
        <button type="button" data-dash-drawer-close aria-label="${t("common.cancel")}" class="th-no-press appearance-none border-none bg-transparent cursor-pointer w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 focus:outline-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      ${renderUserCard()}
      <nav class="flex-1 overflow-y-auto py-2">${sections}</nav>
    </div>
  `;
}

/* ──── Init ──── */

export function initMobileDashboardNav(): void {
  if (document.getElementById("dash-mobile-nav")) return;

  const host = document.createElement("div");
  host.id = "dash-mobile-nav";
  host.innerHTML = renderDrawer();
  document.body.appendChild(host);

  // Header'daki avatar çipini görünür yap (drawer'sız compact sayfalarda gizli kalır)
  document.getElementById("dash-drawer-btn")?.classList.replace("hidden", "inline-flex");

  const backdrop = document.getElementById("dash-drawer-backdrop")!;
  const panel = document.getElementById("dash-drawer-panel")!;

  const setOpen = (open: boolean): void => {
    backdrop.classList.toggle("hidden", !open);
    panel.classList.toggle("-translate-x-full", !open);
    panel.classList.toggle("rtl:translate-x-full", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  document.body.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-dash-drawer-open]")) setOpen(true);
    else if (target.closest("[data-dash-drawer-close]") || target === backdrop) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.classList.contains("hidden")) setOpen(false);
  });
}
