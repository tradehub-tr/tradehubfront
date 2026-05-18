/**
 * Sidebar Component — Main sidebar composition
 * Composes SidebarMenuItem and SidebarFlyout for all menu sections.
 * initSidebar() handles hover flyout with 150ms bridge, single flyout,
 * responsive breakpoint at 1024px, and 200ms width transition.
 */

import { getSidebarSections } from "./sidebarData";
import { renderSidebarMenuItem } from "./SidebarMenuItem";
import { renderSidebarFlyout } from "./SidebarFlyout";
import type { SidebarSection, SidebarMenuItem } from "../../types/buyerDashboard";
import { getUser } from "../../utils/auth";

/* ════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════ */

/**
 * Maps a section title string to its i18n key.
 * Used to attach data-i18n attributes for live language switching.
 */
const sectionTitleI18nKeys: Record<string, string> = {
  onlineTrading: "dashboard.onlineTrading",
  valueAddedServices: "dashboard.valueAddedServices",
  settings: "dashboard.settings",
};

/**
 * Determines the i18n key for a section based on the items it contains.
 */
function getSectionI18nKey(section: SidebarSection): string | undefined {
  if (!section.title) return undefined;
  const firstItemId = section.items[0]?.id;
  if (firstItemId === "messages" || firstItemId === "inquiries")
    return sectionTitleI18nKeys.onlineTrading;
  if (firstItemId === "subscription") return sectionTitleI18nKeys.valueAddedServices;
  if (firstItemId === "settings") return sectionTitleI18nKeys.settings;
  return undefined;
}

/**
 * Sprint 2.6: Item visibility + lockable state.
 * - requireSeller (legacy): sadece is_seller veya pending_seller_application
 * - lockable: "kyc" | "kyb" — her zaman görünür ama session state'e göre locked
 *   olabilir. Locked item gri + cursor-not-allowed + tıklanırsa modal.
 */
function getItemState(item: SidebarMenuItem): { visible: boolean; locked: boolean } {
  const user = getUser();

  // Legacy: requireSeller flag — sadece satıcı/başvuru sahibi görür
  if (item.requireSeller) {
    if (!user) return { visible: false, locked: false };
    const isSeller = Boolean(user.is_seller || user.pending_seller_application);
    return { visible: isSeller, locked: false };
  }

  // Sprint 2.6: lockable item — herkes görür, kilit session state'inden gelir
  if (item.lockable === "kyc") {
    return { visible: true, locked: Boolean(user?.kyc_locked) };
  }
  if (item.lockable === "kyb") {
    return { visible: true, locked: Boolean(user?.kyb_locked) };
  }

  return { visible: true, locked: false };
}

function renderSection(section: SidebarSection, expanded: boolean): string {
  let title = "";
  if (section.title && expanded) {
    const i18nKey = getSectionI18nKey(section);
    const i18nAttr = i18nKey ? ` data-i18n="${i18nKey}"` : "";
    title = `<h3 class="sidebar__section-title hidden px-7 pt-5 pb-2 text-xs font-normal uppercase tracking-wider text-gray-400 dark:text-gray-500 xl:block"${i18nAttr}>${section.title}</h3>`;
  }

  const visibleItems = section.items
    .map((item) => ({ item, state: getItemState(item) }))
    .filter(({ state }) => state.visible);
  if (visibleItems.length === 0) return "";

  const items = visibleItems
    .map(({ item, state }) => {
      const menuItem = renderSidebarMenuItem({ item, expanded, locked: state.locked });
      const flyout = item.submenu?.length ? renderSidebarFlyout({ item }) : "";
      return `
        <div class="sidebar__item-wrapper relative" data-sidebar-wrapper="${item.id}">
          ${menuItem}
          ${flyout}
        </div>
      `;
    })
    .join("");

  return `
    <div class="sidebar__section">
      ${title}
      ${items}
    </div>
  `;
}

/**
 * Renders the full sidebar HTML.
 */
export function renderSidebar(expanded = true): string {
  const sidebarSections = getSidebarSections();

  const sections = sidebarSections.map((s) => renderSection(s, expanded)).join("");
  const widthClass = expanded ? "w-[52px] md:w-[72px] xl:w-[260px]" : "w-[52px] md:w-[72px]";

  return `
    <aside
      id="buyer-sidebar"
      x-data="sidebar"
      @mouseenter.capture="handleMouseEnter($event)"
      @mouseleave.capture="handleMouseLeave($event)"
      @scroll.window.passive="handleScroll()"
      @resize.window.passive="handleResize()"
      class="sidebar sidebar--${expanded ? "expanded" : "collapsed"} sticky top-[42px] z-20 flex ${widthClass} flex-col bg-[#F5F5F5] dark:bg-gray-900 rounded-lg h-[calc(100vh-42px)] transition-shadow duration-300 hover:shadow-[0_0_12px_0_rgba(0,0,0,0.12)]"
      role="navigation"
      aria-label="Buyer dashboard sidebar"
    >
      <div class="sidebar__menu flex-1 py-3">
        ${sections}
      </div>
    </aside>
  `;
}

/* ════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════ */

/**
 * Transitional no-op. Sidebar interactivity is now handled by the Alpine.js
 * 'sidebar' component registered in alpine.ts. All 6 event listeners
 * (4x mouseenter/mouseleave capture, scroll, resize) are replaced by
 * Alpine directives on the <aside x-data="sidebar"> element.
 *
 * Remove this call from page entry files and use startAlpine() instead.
 */
export function initSidebar(): void {
  // No-op — Alpine handles sidebar interactivity via x-data="sidebar"
}
