/**
 * Sidebar Data — Menu structure and section definitions
 * 4 sections + bottom discover link, following SidebarSection/SidebarMenuItem types
 * All labels use i18n translation keys resolved via t() at render time.
 */

import type { SidebarSection, SidebarMenuItem } from "../../types/buyerDashboard";
import { t } from "../../i18n";
import { getUser } from "../../utils/auth";

/* ════════════════════════════════════════════════════
   MENU SECTIONS
   ════════════════════════════════════════════════════ */

/**
 * Returns sidebar sections with translated labels.
 * Must be called at render time (not at module scope) so that
 * the current language is used for every render.
 */
export function getSidebarSections(): SidebarSection[] {
  return [
    /* ──── Dashboard (standalone) ──── */
    {
      items: [
        {
          id: "dashboard",
          label: t("dashboard.myDashboard"),
          icon: "dashboard",
          href: "/pages/dashboard/buyer-dashboard.html",
        },
      ],
    },

    /* ──── Online Trading ──── */
    {
      title: t("dashboard.onlineTrading"),
      items: [
        {
          id: "messages",
          label: t("dashboard.myMessages"),
          icon: "messages",
          href: "/pages/dashboard/messages.html",
          submenu: [
            { label: t("dashboard.supplierMessages"), href: "/pages/dashboard/messages.html" },
            { label: t("dashboard.rfqInquiries"), href: "/pages/dashboard/inquiries.html" },
            { label: t("dashboard.myContacts"), href: "/pages/dashboard/contacts.html" },
          ],
        },
        {
          id: "orders",
          label: t("dashboard.myOrders"),
          icon: "orders",
          href: "/pages/dashboard/orders.html",
          submenu: [
            { label: t("dashboard.allOrders"), href: "/pages/dashboard/orders.html" },
            {
              label: t("dashboard.refundsAfterSales"),
              href: "/pages/dashboard/orders.html#refunds",
            },
            { label: t("dashboard.myReviews"), href: "/pages/dashboard/orders.html#reviews" },
          ],
        },
        {
          id: "payment",
          label: t("dashboard.payment"),
          icon: "payment",
          href: "/pages/dashboard/payment.html",
          submenu: [
            {
              label: t("dashboard.paymentManagement"),
              href: "/pages/dashboard/payment.html#payment-management",
              group: t("sidebar.groupSummary"),
            },
            {
              label: t("dashboard.transactions"),
              href: "/pages/dashboard/payment.html#transactions",
              group: t("sidebar.groupSummary"),
            },
          ],
        },
        {
          id: "saved",
          label: t("dashboard.savedHistory"),
          icon: "saved",
          href: "/pages/dashboard/favorites.html",
          submenu: [
            {
              label: t("dashboard.myFavorites"),
              href: "/pages/dashboard/favorites.html#favorites",
            },
            {
              label: t("dashboard.browsingHistory"),
              href: "/pages/dashboard/favorites.html#browsing-history",
            },
          ],
        },
      ],
    },

    /* ──── Settings ──── */
    {
      title: t("dashboard.settings"),
      items: [
        {
          id: "settings",
          label: t("dashboard.accountSettings"),
          icon: "settings",
          href: "/pages/dashboard/settings.html",
        },
        {
          id: "addresses",
          label: t("dashboard.myAddresses"),
          icon: "addresses",
          href: "/pages/dashboard/addresses.html",
        },
        {
          id: "kyc",
          label: t("dashboard.kycVerification"),
          icon: "user-check",
          href: "/pages/dashboard/kyc.html",
          lockable: "kyc",
        },
        {
          id: "kyb",
          label: t("dashboard.kybVerification"),
          icon: "shield-check",
          href: "/pages/dashboard/kyb.html",
          lockable: "kyb",
        },
      ],
    },
  ];
}

/**
 * Sprint 2.6: Item visibility + lockable state.
 * - requireSeller (legacy): sadece is_seller veya pending_seller_application
 * - lockable: "kyc" | "kyb" — her zaman görünür ama session state'e göre locked
 *   olabilir. Locked item gri + cursor-not-allowed + tıklanırsa modal.
 *
 * Rail (Sidebar.ts) ve mobil drawer (MobileDashboardNav.ts) aynı görünürlük
 * mantığını paylaşır — tekilleştirilmiş halde burada tutulur.
 */
export function getItemState(item: SidebarMenuItem): { visible: boolean; locked: boolean } {
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

/* ──── Bottom sticky discover link ──── */

export function getDiscoverItem(): SidebarMenuItem {
  return {
    id: "discover",
    label: t("dashboard.exploreSellerSite"),
    icon: "discover",
    href: "#discover",
  };
}

// NOTE: Eski `sidebarSections` / `discoverItem` const export'lari kaldirildi —
// modul yuklenirken (i18n hazir olmadan) t() cagirip yanlis/bos ceviri
// donduruyorlardi. Tuketiciler zaten getSidebarSections()/getDiscoverItem()
// fonksiyonlarini render aninda cagiriyor.
