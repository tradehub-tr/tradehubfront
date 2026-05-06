/**
 * CheckoutMinimalHeader — Checkout akışı için sade üst çubuk.
 * Sol: iSTOC logosu (ana sayfa).
 * Sağ: yalnız profil ikonu → Flowbite dropdown (TopBar ile aynı davranış).
 * Amazon/Shopify checkout pattern'i: kullanıcı sipariş tamamlamaya odaklansın
 * diye arama, sepet, kategori gibi bileşenler yoktur.
 */

import { getUser, logout, isLoggedIn } from "../../utils/auth";
import { getSellerStoreUrl } from "../../utils/seller";
import { t } from "../../i18n";

/** Giriş yapılmışsa dropdown, aksi halde "Giriş Yap" linki döner. */
function renderUserSection(): string {
  if (!isLoggedIn()) {
    return `
      <a
        href="/pages/auth/login.html"
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-[14px] text-[#333] hover:text-[var(--color-primary-500)] hover:bg-[#f9fafb] transition-colors no-underline"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
          <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0"/>
        </svg>
        <span class="hidden sm:inline font-medium">${t("header.login", { defaultValue: "Giriş Yap" })}</span>
      </a>
    `;
  }

  const user = getUser();
  const displayName = user?.full_name ?? t("topbar.defaultUser");

  return `
    <div class="relative">
      <button
        id="checkout-user-dropdown-btn"
        data-dropdown-toggle="checkout-user-dropdown-menu"
        data-dropdown-placement="bottom-end"
        class="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#f9fafb] transition-colors cursor-pointer shrink-0"
        aria-label="${t("header.myAccount")}"
      >
        <svg class="w-6 h-6 text-[#333]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
        </svg>
      </button>

      <div
        id="checkout-user-dropdown-menu"
        class="z-50 hidden bg-white rounded-lg shadow-lg border border-gray-200 w-[220px] py-2"
      >
        <div class="px-4 py-2 border-b border-gray-100">
          <p class="text-[14px] font-semibold text-[#222]">${t("header.hello", { name: displayName })}</p>
        </div>
        <ul class="py-1">
          <li><a href="/pages/dashboard/buyer-dashboard.html" class="block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors">${t("header.myDashboard")}</a></li>
          ${user?.has_seller_profile ? `<li><a href="${getSellerStoreUrl(user!)}" class="block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors">${t("header.myStore")}</a></li>` : ""}
          <li><a href="/pages/dashboard/orders.html" class="block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors">${t("header.myOrders")}</a></li>
          <!-- DISABLED: Mesajlarım — ileride geliştirilecek (backend chat altyapısı yok). Tek satırlık <li> aynen geri açılır. -->
          <!-- <li><a href="/pages/dashboard/messages.html" class="block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors">${t("header.myMessages")}</a></li> -->
          <li><a href="/pages/dashboard/inquiries.html" class="block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors">${t("header.myRfq")}</a></li>
          <li><a href="/pages/dashboard/favorites.html" class="block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors">${t("header.myFavorites")}</a></li>
          <li><a href="/pages/dashboard/settings.html" class="block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors">${t("header.accountSettings")}</a></li>
        </ul>
        <div class="border-t border-gray-100 pt-1">
          <button id="checkout-logout-btn" class="w-full text-left block px-4 py-2 text-[13px] text-[#222] hover:bg-gray-50 transition-colors cursor-pointer">${t("header.logout")}</button>
        </div>
      </div>
    </div>
  `;
}

export function CheckoutMinimalHeader(): string {
  return `
    <header class="w-full bg-white border-b border-[#e5e5e5]">
      <div class="max-w-[1680px] mx-auto px-4 h-[60px] flex items-center justify-between">
        <a href="/" class="flex items-center shrink-0" aria-label="Ana Sayfa">
          <img src="/images/istoc-logo.png" alt="iSTOC" class="h-7 sm:h-8" />
        </a>
        ${renderUserSection()}
      </div>
    </header>
  `;
}

/** Logout düğmesine click handler — CheckoutMinimalHeader kullanan sayfalardan çağrılır. */
export function initCheckoutMinimalHeader(): void {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.id === "checkout-logout-btn" || target.closest("#checkout-logout-btn")) {
      e.preventDefault();
      void logout();
    }
  });
}
