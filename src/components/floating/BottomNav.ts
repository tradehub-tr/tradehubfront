/**
 * BottomNav Component
 * Mobile/tablet fixed bottom navigation bar (iSTOC-style).
 * Visible on screens below xl breakpoint.
 */

import { t } from "../../i18n";
import { onCategoriesLoaded } from "../../services/categoryService";
import type { ApiCategory } from "../../services/categoryService";
import { waitForAuth } from "../../utils/auth";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import {
  getSelectedCurrency,
  getSelectedCurrencyInfo,
  getSupportedCurrencies,
  setSelectedCurrency,
  onCurrencyChange,
} from "../../services/currencyService";

function renderCategoryOverlay(): string {
  return `
    <div id="cat-fullscreen-overlay" class="fixed inset-0 z-50 bg-white dark:bg-gray-900 xl:hidden hidden flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 h-12 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <button type="button" id="cat-fullscreen-back" class="th-no-press p-1 -ms-1 text-gray-700 dark:text-gray-300" aria-label="${t("common.back")}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <h2 class="text-base font-bold text-gray-900 dark:text-white" data-i18n="bottomNav.categories">${t("bottomNav.categories")}</h2>
        <div class="w-5"></div>
      </div>

      <!-- Body: sidebar + content -->
      <div class="flex flex-1 min-h-0">
        <!-- Left sidebar -->
        <div id="cat-fullscreen-sidebar" class="w-[90px] min-[400px]:w-[110px] sm:w-[130px] shrink-0 border-e border-gray-100 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800">
        </div>

        <!-- Right content -->
        <div id="cat-fullscreen-content" class="flex-1 overflow-y-auto px-2 min-[400px]:px-3 py-3 min-[400px]:py-4">
        </div>
      </div>
    </div>
  `;
}

function renderSubcatItem(name: string, slug: string, image?: string): string {
  const placeholder = `<svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75Z"/></svg>`;
  const imgHtml = image
    ? `<img src="${escapeHtml(sanitizeUrl(image))}" alt="${escapeHtml(name)}" class="w-full h-full object-cover rounded-full" loading="lazy" />`
    : placeholder;
  return `
    <a href="/pages/products.html?cat=${escapeHtml(slug)}" class="flex flex-col items-center gap-1">
      <div class="w-12 h-12 min-[400px]:w-14 min-[400px]:h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        ${imgHtml}
      </div>
      <span class="text-[10px] min-[400px]:text-[11px] text-gray-700 dark:text-gray-300 text-center leading-tight line-clamp-2 w-[56px] min-[400px]:w-[64px] sm:w-[72px]">${escapeHtml(name)}</span>
    </a>
  `;
}

export function initCategoryFullscreen(): void {
  const overlay = document.getElementById("cat-fullscreen-overlay");
  const sidebar = document.getElementById("cat-fullscreen-sidebar");
  const content = document.getElementById("cat-fullscreen-content");
  const backBtn = document.getElementById("cat-fullscreen-back");
  const catBtn = document.getElementById("bottom-nav-categories");

  if (!overlay || !sidebar || !content || !backBtn) return;

  function openOverlay(): void {
    overlay!.classList.remove("hidden");
    overlay!.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay(): void {
    overlay!.classList.add("hidden");
    overlay!.classList.remove("flex");
    document.body.style.overflow = "";
  }

  backBtn.addEventListener("click", closeOverlay);
  if (catBtn) catBtn.addEventListener("click", openOverlay);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeOverlay();
  });

  onCategoriesLoaded((cats: ApiCategory[]) => {
    if (!cats.length) return;

    function selectCategory(catId: string): void {
      sidebar!.querySelectorAll<HTMLButtonElement>(".cat-fs-item").forEach((btn) => {
        const isActive = btn.dataset.catId === catId;
        btn.classList.toggle("bg-white", isActive);
        btn.classList.toggle("dark:bg-gray-900", isActive);
        btn.classList.toggle("font-bold", isActive);
        btn.classList.toggle("border-s-2", isActive);
        btn.classList.toggle("border-s-primary-500", isActive);
        btn.classList.toggle("font-normal", !isActive);
        btn.classList.toggle("border-s-0", !isActive);
      });

      const cat = cats.find((c) => c.id === catId);
      if (!cat) return;

      const viewAllItem = `
        <a href="/pages/products.html?cat=${escapeHtml(cat.slug)}" class="flex flex-col items-center gap-1">
          <div class="w-12 h-12 min-[400px]:w-14 min-[400px]:h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
            </svg>
          </div>
          <span class="text-[10px] min-[400px]:text-[11px] text-gray-500 text-center leading-tight">${t("categoryBrowse.viewAll")}</span>
        </a>
      `;

      content!.innerHTML = `
        <div class="grid grid-cols-3 gap-x-2 min-[400px]:gap-x-3 gap-y-3 min-[400px]:gap-y-4">
          ${cat.children.map((ch) => renderSubcatItem(ch.name, ch.slug, ch.image)).join("")}
          ${viewAllItem}
        </div>
      `;
    }

    sidebar.innerHTML = cats
      .map(
        (cat, i) => `
        <button type="button"
          class="cat-fs-item th-no-press w-full text-start px-2 min-[400px]:px-3 py-2.5 min-[400px]:py-3 text-[11px] min-[400px]:text-[12px] sm:text-[13px] text-gray-700 dark:text-gray-300 transition-colors ${i === 0 ? "bg-white dark:bg-gray-900 font-bold border-s-2 border-s-primary-500" : "font-normal border-s-0"}"
          data-cat-id="${escapeHtml(cat.id)}"
        >${escapeHtml(cat.name)}</button>
      `
      )
      .join("");

    sidebar.querySelectorAll<HTMLButtonElement>(".cat-fs-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.catId;
        if (id) selectCategory(id);
      });
    });

    if (cats[0]) selectCategory(cats[0].id);
  });
}

function renderAccountMenuItem(
  href: string,
  iconBg: string,
  iconColor: string,
  iconPath: string,
  title: string,
  subtitle: string
): string {
  return `
    <a href="${href}" class="flex items-center gap-3 px-3 min-[400px]:px-4 py-2.5 min-[400px]:py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div class="w-8 h-8 min-[400px]:w-9 min-[400px]:h-9 rounded-md ${iconBg} flex items-center justify-center shrink-0">
        <svg class="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[13px] min-[400px]:text-sm text-gray-900 dark:text-white">${title}</p>
        <p class="text-[10px] min-[400px]:text-[11px] text-gray-400 mt-0.5">${subtitle}</p>
      </div>
      <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
      </svg>
    </a>
  `;
}

function renderAccountOverlay(): string {
  return `
    <div id="account-fullscreen-overlay" class="fixed inset-0 z-50 bg-white dark:bg-gray-900 xl:hidden hidden flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 h-12 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <button type="button" id="account-fullscreen-back" class="th-no-press p-1 -ms-1 text-gray-700 dark:text-gray-300" aria-label="${t("common.back")}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <h2 class="text-[14px] min-[400px]:text-base font-bold text-gray-900 dark:text-white" data-i18n="bottomNav.account">${t("bottomNav.account")}</h2>
        <div class="w-5"></div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto pb-20">
        <!-- Auth area: populated dynamically by initAccountFullscreen -->
        <div id="account-auth-area"></div>

        <!-- Siparişlerim -->
        <div class="mt-5">
          <p class="px-3 min-[400px]:px-4 text-[10px] min-[400px]:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">${t("accountMenu.orders")}</p>
          ${renderAccountMenuItem(
            "/pages/dashboard/orders.html",
            "bg-blue-50 dark:bg-blue-900/30",
            "text-blue-500",
            "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z",
            t("accountMenu.myOrders"),
            t("accountMenu.myOrdersDesc")
          )}
          ${renderAccountMenuItem(
            "/pages/trade-assurance.html",
            "bg-green-50 dark:bg-green-900/30",
            "text-green-500",
            "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
            t("accountMenu.tradeAssurance"),
            t("accountMenu.tradeAssuranceDesc")
          )}
        </div>

        <div class="h-2 bg-gray-50 dark:bg-gray-800 mt-2"></div>

        <!-- Keşfet -->
        <div class="mt-3">
          <p class="px-3 min-[400px]:px-4 text-[10px] min-[400px]:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">${t("accountMenu.discover")}</p>
          ${renderAccountMenuItem(
            "/pages/top-ranking.html",
            "bg-[var(--color-primary-50,#fff8e1)]",
            "text-[var(--color-primary-500,#f5b800)]",
            "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z",
            t("accountMenu.bestSellers"),
            t("accountMenu.bestSellersDesc")
          )}
          ${renderAccountMenuItem(
            "/pages/tailored-selections.html",
            "bg-[var(--color-primary-50,#fff8e1)]",
            "text-[var(--color-primary-500,#f5b800)]",
            "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z",
            t("accountMenu.personalSelections"),
            t("accountMenu.personalSelectionsDesc")
          )}
          ${renderAccountMenuItem(
            "/pages/top-deals.html",
            "bg-[var(--color-primary-50,#fff8e1)]",
            "text-[var(--color-primary-500,#f5b800)]",
            "M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z M6 6h.008v.008H6V6Z",
            t("accountMenu.bestDeals"),
            t("accountMenu.bestDealsDesc")
          )}
          ${renderAccountMenuItem(
            "/pages/seller/sell.html",
            "bg-purple-50 dark:bg-purple-900/30",
            "text-purple-500",
            "M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z",
            t("accountMenu.sellOnIstoc"),
            t("accountMenu.sellOnIstocDesc")
          )}
        </div>

        <div class="h-2 bg-gray-50 dark:bg-gray-800 mt-2"></div>

        <!-- Tedarikçiler -->
        <div class="mt-3">
          <p class="px-3 min-[400px]:px-4 text-[10px] min-[400px]:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">${t("accountMenu.suppliers")}</p>
          ${renderAccountMenuItem(
            "/pages/manufacturers.html",
            "bg-teal-50 dark:bg-teal-900/30",
            "text-teal-500",
            "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21",
            t("accountMenu.findSuppliers"),
            t("accountMenu.findSuppliersDesc")
          )}
          ${renderAccountMenuItem(
            "/pages/seller/supplier-setup.html",
            "bg-teal-50 dark:bg-teal-900/30",
            "text-teal-500",
            "M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z",
            t("accountMenu.supplierApplication"),
            t("accountMenu.supplierApplicationDesc")
          )}
        </div>

        <div class="h-2 bg-gray-50 dark:bg-gray-800 mt-2"></div>

        <!-- Destek -->
        <div class="mt-3">
          <p class="px-3 min-[400px]:px-4 text-[10px] min-[400px]:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">${t("accountMenu.support")}</p>
          ${renderAccountMenuItem(
            "/pages/help/help-center.html",
            "bg-sky-50 dark:bg-sky-900/30",
            "text-sky-500",
            "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z",
            t("accountMenu.helpCenter"),
            t("accountMenu.helpCenterDesc")
          )}
        </div>

        <div class="h-2 bg-gray-50 dark:bg-gray-800 mt-2"></div>

        <!-- Ayarlar -->
        <div class="mt-3 pb-4">
          <p class="px-3 min-[400px]:px-4 text-[10px] min-[400px]:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">${t("accountMenu.settings")}</p>

          <!-- Teslimat Ülkesi -->
          <button type="button" id="account-country-btn" class="th-no-press flex items-center gap-3 w-full px-3 min-[400px]:px-4 py-2.5 min-[400px]:py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start">
            <div class="w-8 h-8 min-[400px]:w-9 min-[400px]:h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] min-[400px]:text-sm text-gray-900 dark:text-white">${t("accountMenu.deliveryCountry")}</p>
              <p id="account-country-value" class="text-[10px] min-[400px]:text-[11px] text-gray-400 mt-0.5">${t("accountMenu.deliveryCountryValue")}</p>
            </div>
            <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
            </svg>
          </button>

          <!-- Ülke seçici (gizli, tıklayınca açılır) -->
          <div id="account-country-picker" class="hidden mx-3 min-[400px]:mx-4 mt-2 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[200px] overflow-y-auto">
            <button type="button" data-country-switch="TR" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start border-b border-gray-100 dark:border-gray-700">
              <span>${t("commonNav.countryTurkey")}</span>
              <span class="country-check text-[var(--color-primary-500,#f5b800)] hidden" data-country-check="TR">✓</span>
            </button>
            <button type="button" data-country-switch="DE" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start border-b border-gray-100 dark:border-gray-700">
              <span>${t("commonNav.countryGermany")}</span>
              <span class="country-check text-[var(--color-primary-500,#f5b800)] hidden" data-country-check="DE">✓</span>
            </button>
            <button type="button" data-country-switch="US" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start border-b border-gray-100 dark:border-gray-700">
              <span>${t("commonNav.countryUsa")}</span>
              <span class="country-check text-[var(--color-primary-500,#f5b800)] hidden" data-country-check="US">✓</span>
            </button>
            <button type="button" data-country-switch="GB" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start border-b border-gray-100 dark:border-gray-700">
              <span>${t("commonNav.countryUk")}</span>
              <span class="country-check text-[var(--color-primary-500,#f5b800)] hidden" data-country-check="GB">✓</span>
            </button>
            <button type="button" data-country-switch="NL" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start">
              <span>${t("commonNav.countryNetherlands")}</span>
              <span class="country-check text-[var(--color-primary-500,#f5b800)] hidden" data-country-check="NL">✓</span>
            </button>
          </div>

          <!-- Dil ve Para Birimi -->
          <button type="button" id="account-lang-btn" class="th-no-press flex items-center gap-3 w-full px-3 min-[400px]:px-4 py-2.5 min-[400px]:py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start">
            <div class="w-8 h-8 min-[400px]:w-9 min-[400px]:h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] min-[400px]:text-sm text-gray-900 dark:text-white">${t("accountMenu.language")}</p>
              <p id="account-lang-value" class="text-[10px] min-[400px]:text-[11px] text-gray-400 mt-0.5">${t("accountMenu.languageValue")}</p>
            </div>
            <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
            </svg>
          </button>

          <!-- Dil seçici (gizli, tıklayınca açılır) -->
          <div id="account-lang-picker" class="hidden mx-3 min-[400px]:mx-4 mt-2 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button type="button" data-lang-switch="tr" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start border-b border-gray-100 dark:border-gray-700">
              <span>Türkçe — TRY (₺)</span>
              <span id="lang-check-tr" class="text-[var(--color-primary-500,#f5b800)] hidden">✓</span>
            </button>
            <button type="button" data-lang-switch="en" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start">
              <span>English — TRY (₺)</span>
              <span id="lang-check-en" class="text-[var(--color-primary-500,#f5b800)] hidden">✓</span>
            </button>
          </div>

          <!-- Para Birimi -->
          <button type="button" id="account-currency-btn" class="th-no-press flex items-center gap-3 w-full px-3 min-[400px]:px-4 py-2.5 min-[400px]:py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start">
            <div class="w-8 h-8 min-[400px]:w-9 min-[400px]:h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] min-[400px]:text-sm text-gray-900 dark:text-white">${t("accountMenu.currency")}</p>
              <p id="account-currency-value" class="text-[10px] min-[400px]:text-[11px] text-gray-400 mt-0.5"></p>
            </div>
            <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
            </svg>
          </button>

          <!-- Para Birimi seçici (gizli, init'te dinamik doldurulur) -->
          <div id="account-currency-picker" class="hidden mx-3 min-[400px]:mx-4 mt-2 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[200px] overflow-y-auto"></div>
        </div>
      </div>
    </div>
  `;
}

function initAccountFullscreen(): void {
  const overlay = document.getElementById("account-fullscreen-overlay");
  const backBtn = document.getElementById("account-fullscreen-back");
  const accountBtn = document.getElementById("bottom-nav-account");

  if (!overlay || !backBtn) return;

  function openOverlay(): void {
    overlay!.classList.remove("hidden");
    overlay!.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay(): void {
    overlay!.classList.add("hidden");
    overlay!.classList.remove("flex");
    document.body.style.overflow = "";
  }

  backBtn.addEventListener("click", closeOverlay);
  if (accountBtn) {
    accountBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openOverlay();
    });
  }

  // Populate auth area dynamically
  const authArea = document.getElementById("account-auth-area");
  if (authArea) {
    waitForAuth().then((user) => {
      if (user) {
        const initials = user.full_name
          ? user.full_name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : "";
        authArea.innerHTML = `
          <a href="/pages/dashboard/buyer-dashboard.html" class="mx-3 min-[400px]:mx-4 mt-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 min-[400px]:p-4 flex items-center gap-3 no-underline">
            <div class="w-10 h-10 min-[400px]:w-12 min-[400px]:h-12 rounded-full bg-[var(--color-primary-500,#f5b800)] flex items-center justify-center text-white font-bold text-sm min-[400px]:text-lg shrink-0">${escapeHtml(initials)}</div>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] min-[400px]:text-sm font-bold text-gray-900 dark:text-white">${escapeHtml(user.full_name || "")}</p>
              <p class="text-[10px] min-[400px]:text-xs text-gray-500 mt-0.5 truncate">${escapeHtml(user.email || "")}</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
          </a>
        `;
      } else {
        authArea.innerHTML = `
          <div class="mx-3 min-[400px]:mx-4 mt-4 rounded-md bg-[var(--color-primary-50,#fff8e1)] border border-[var(--color-primary-200,#ffe57a)] p-3 min-[400px]:p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 min-[400px]:w-12 min-[400px]:h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] min-[400px]:text-sm font-semibold text-gray-900">${t("accountMenu.loginTitle")}</p>
                <p class="text-[10px] min-[400px]:text-xs text-gray-500 mt-0.5">${t("accountMenu.loginSubtitle")}</p>
              </div>
            </div>
            <a href="/pages/auth/login.html" class="th-btn mt-3 w-full h-8 min-[400px]:h-9 rounded-full text-xs min-[400px]:text-sm font-semibold transition-colors flex items-center justify-center no-underline">${t("accountMenu.loginButton")}</a>
          </div>
        `;
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeOverlay();
  });

  // Dil seçici toggle
  const langBtn = document.getElementById("account-lang-btn");
  const langPicker = document.getElementById("account-lang-picker");
  if (langBtn && langPicker) {
    langBtn.addEventListener("click", () => {
      langPicker.classList.toggle("hidden");
    });

    const currentLang = localStorage.getItem("i18nextLng") || "tr";
    const checkTr = document.getElementById("lang-check-tr");
    const checkEn = document.getElementById("lang-check-en");
    if (currentLang === "tr" && checkTr) checkTr.classList.remove("hidden");
    if (currentLang === "en" && checkEn) checkEn.classList.remove("hidden");

    langPicker.querySelectorAll<HTMLButtonElement>("[data-lang-switch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.dataset.langSwitch || "tr";
        localStorage.setItem("i18nextLng", lang);
        window.location.reload();
      });
    });
  }

  // Teslimat ülkesi seçici
  const countryBtn = document.getElementById("account-country-btn");
  const countryPicker = document.getElementById("account-country-picker");
  if (countryBtn && countryPicker) {
    countryBtn.addEventListener("click", () => {
      countryPicker.classList.toggle("hidden");
    });

    const countryNames: Record<string, string> = {
      TR: `${t("commonNav.countryTurkey")} 🇹🇷`,
      DE: `${t("commonNav.countryGermany")} 🇩🇪`,
      US: `${t("commonNav.countryUsa")} 🇺🇸`,
      GB: `${t("commonNav.countryUk")} 🇬🇧`,
      NL: `${t("commonNav.countryNetherlands")} 🇳🇱`,
    };
    const currentCountry = localStorage.getItem("deliveryCountry") || "TR";
    const currentCheck = countryPicker.querySelector<HTMLElement>(
      `[data-country-check="${currentCountry}"]`
    );
    if (currentCheck) currentCheck.classList.remove("hidden");

    countryPicker.querySelectorAll<HTMLButtonElement>("[data-country-switch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.countrySwitch || "TR";
        localStorage.setItem("deliveryCountry", code);
        const valueEl = document.getElementById("account-country-value");
        if (valueEl) valueEl.textContent = countryNames[code] || code;
        countryPicker.querySelectorAll(".country-check").forEach((c) => c.classList.add("hidden"));
        const check = countryPicker.querySelector<HTMLElement>(`[data-country-check="${code}"]`);
        if (check) check.classList.remove("hidden");
        countryPicker.classList.add("hidden");
      });
    });
  }

  // Para birimi seçici — masaüstündeki setSelectedCurrency + reload akışını mobile taşır.
  const currencyBtn = document.getElementById("account-currency-btn");
  const currencyPicker = document.getElementById("account-currency-picker");
  const currencyValue = document.getElementById("account-currency-value");
  if (currencyBtn && currencyPicker) {
    currencyBtn.addEventListener("click", () => currencyPicker.classList.toggle("hidden"));

    // Currency listesi backend'den (initCurrency) async gelir; hazır olunca yeniden çiz.
    const renderCurrencyPicker = (): void => {
      const selected = getSelectedCurrency();
      const info = getSelectedCurrencyInfo();
      if (currencyValue) currencyValue.textContent = `${info.symbol} ${info.code}`;
      const list = getSupportedCurrencies();
      currencyPicker.innerHTML = list
        .map((c, i) => {
          const divider = i === list.length - 1 ? "" : " border-b border-gray-100 dark:border-gray-700";
          const checkHidden = c.code === selected ? "" : " hidden";
          return `<button type="button" data-currency-switch="${escapeHtml(c.code)}" class="th-no-press w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start${divider}">
              <span>${escapeHtml(c.symbol)} ${escapeHtml(c.nameTr || c.name)} — ${escapeHtml(c.code)}</span>
              <span class="text-[var(--color-primary-500,#f5b800)]${checkHidden}">✓</span>
            </button>`;
        })
        .join("");
      currencyPicker.querySelectorAll<HTMLButtonElement>("[data-currency-switch]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const code = btn.dataset.currencySwitch;
          if (!code || code === getSelectedCurrency()) {
            currencyPicker.classList.add("hidden");
            return;
          }
          setSelectedCurrency(code);
          window.location.reload();
        });
      });
    };
    renderCurrencyPicker();
    onCurrencyChange(() => renderCurrencyPicker());
  }
}

export function BottomNav(): string {
  return `
    <div id="bottom-nav" class="fixed bottom-0 start-0 z-30 w-full bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 xl:hidden safe-area-bottom">
      <div class="grid h-12 sm:h-14 grid-cols-5 mx-auto max-w-lg">
        <!-- Ana Sayfa -->
        <a href="/" class="th-no-press inline-flex flex-col items-center justify-center px-1 group" aria-label="${t("bottomNav.home")}">
          <svg class="w-5 h-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"/>
          </svg>
          <span class="text-[9px] sm:text-[10px] mt-0.5 text-primary-500 font-medium" data-i18n="bottomNav.home">${t("bottomNav.home")}</span>
        </a>

        <!-- Kategoriler -->
        <button type="button" id="bottom-nav-categories" class="th-no-press inline-flex flex-col items-center justify-center px-1 group" aria-label="${t("bottomNav.categories")}">
          <svg class="w-5 h-5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
          </svg>
          <span class="text-[9px] sm:text-[10px] mt-0.5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" data-i18n="bottomNav.categories">${t("bottomNav.categories")}</span>
        </button>

        <!-- Mesaj -->
        <a href="/pages/chat.html" class="th-no-press inline-flex flex-col items-center justify-center px-1 group" aria-label="${t("bottomNav.messages")}">
          <div class="relative">
            <svg class="w-5 h-5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
            </svg>
          </div>
          <span class="text-[9px] sm:text-[10px] mt-0.5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" data-i18n="bottomNav.messages">${t("bottomNav.messages")}</span>
        </a>

        <!-- Sepet -->
        <a href="/pages/cart.html" class="th-no-press inline-flex flex-col items-center justify-center px-1 group" aria-label="${t("bottomNav.cart")}">
          <div class="relative">
            <svg class="w-5 h-5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
            </svg>
            <span id="bottom-nav-cart-badge" class="hidden absolute -top-1.5 -end-2 min-w-4 h-4 px-0.5 bg-error-500 text-white text-[10px] font-bold rounded-full items-center justify-center"></span>
          </div>
          <span class="text-[9px] sm:text-[10px] mt-0.5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" data-i18n="bottomNav.cart">${t("bottomNav.cart")}</span>
        </a>

        <!-- Hesabım (hamburger) -->
        <button type="button" id="bottom-nav-account" class="th-no-press inline-flex flex-col items-center justify-center px-1 group" aria-label="${t("bottomNav.account")}">
          <svg class="w-5 h-5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
          </svg>
          <span class="text-[9px] sm:text-[10px] mt-0.5 text-gray-500 group-hover:text-primary-500 dark:text-gray-400" data-i18n="bottomNav.account">${t("bottomNav.account")}</span>
        </button>
      </div>
    </div>

    <!-- Full-screen category overlay -->
    ${renderCategoryOverlay()}

    <!-- Full-screen account overlay -->
    ${renderAccountOverlay()}
  `;
}

export function initBottomNav(): void {
  initCategoryFullscreen();
  initAccountFullscreen();
}
