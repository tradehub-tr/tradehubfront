/**
 * ProductInfo Component
 * Right sticky card (iSTOC layout-stick style).
 * Contains: shipping, CTAs. Başlık, puan satırı, fiyat kademeleri ve
 * varyant seçiciler orta sütuna (ProductBuyBox) taşındı.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import { openShippingModal } from "./CartDrawer";
import { SocialProofBadge } from "./SocialProofBadge";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

export function ProductInfo(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;

  return `
    <div id="product-info" class="bg-[var(--color-surface,#fff)] flex flex-col border border-[var(--color-border-default,#e5e5e5)] rounded-md overflow-hidden [.pd-sticky_&]:flex-1 [.pd-sticky_&]:min-h-0 [.pd-sticky_&]:max-h-full [.pd-sticky_&]:overflow-hidden">
      <div id="pd-info-scrollable" class="p-5 flex flex-col scrollbar-hide [.pd-sticky_&]:flex-1 [.pd-sticky_&]:overflow-y-auto [.pd-sticky_&]:min-h-0">
        <!-- Wholesale Tab -->
        <div id="pd-card-tabs" class="flex -mx-5 mt-[-20px] p-0 bg-[var(--color-surface-raised,#f5f5f5)] border-b border-[var(--color-border-default,#e5e5e5)]">
          <button type="button" class="pd-card-tab flex-1 px-4 py-3.5 text-[15px] font-semibold text-center bg-transparent border-0 border-t-[3px] border-t-transparent cursor-pointer text-[var(--color-text-muted,#666)] relative transition-[background,color] duration-150 [&:not(:first-child)]:border-s [&:not(:first-child)]:border-s-[var(--color-border-default,#e5e5e5)] [&.active]:text-[var(--color-text-primary)] [&.active]:font-bold [&.active]:bg-[var(--color-surface,#fff)] [&.active]:border-t-[var(--pd-tab-active-border,#cc9900)] active">${t("product.wholesaleSales")}</button>
        </div>

        <!-- Ready to Ship Badge -->
        <span id="pd-ready-badge" class="th-badge inline-flex items-center my-4 mb-3 px-2.5 py-[3px] text-[11px] font-semibold border-[1.5px] border-[#16a34a] rounded text-[#16a34a] bg-[#f0fdf4] [&.is-out-of-stock]:border-[#dc2626] [&.is-out-of-stock]:text-[#dc2626] [&.is-out-of-stock]:bg-[#fef2f2]">${t("product.readyToShip")}</span>

        <!-- Fiyat kademeleri, numune fiyatı ve varyant seçiciler orta sütunda
             (ProductBuyBox) render edilir; KYB kapısı da oraya taşındı. -->

        <!-- Shipping — yöntem belli değilse bölüm hiç render edilmez -->
        ${
          p.shipping[0]?.method
            ? `
        <div class="py-5" style="border-bottom: 1px solid var(--color-border-light, #f0f0f0);">
          <h2 class="text-sm font-bold mb-3 flex items-center gap-1.5 m-0" style="color: var(--pd-title-color, #111827);">${t("product.shippingLabel")}</h2>
          <div class="flex items-center justify-between gap-3 mt-3 px-3.5 py-3 rounded-md min-w-0" id="pd-shipping-card" style="background: var(--pd-spec-header-bg, #f9fafb);">
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="text-sm font-semibold truncate" id="pd-ship-card-method" style="color: var(--pd-title-color, #111827);">${escapeHtml(p.shipping[0].method)}</span>
              <span class="pd-shipping-card-detail text-xs truncate" style="color: var(--pd-rating-text-color, #6b7280);">${t("product.shippingCost", { cost: p.shipping[0].cost, days: p.shipping[0].estimatedDays })}</span>
            </div>
            <a href="javascript:void(0)" class="text-[13px] font-medium no-underline whitespace-nowrap cursor-pointer" id="pd-ship-card-change" style="color: var(--pd-price-color, #cc9900);">${t("product.changeLabel")} ›</a>
          </div>
        </div>
        `
            : ""
        }

        <!-- Social Proof Badge — fiyat/stok ile CTA arası -->
        ${SocialProofBadge({
          listingId: p.id,
          supplierId: p.supplier?.id ?? "",
        })}

        <!-- KYB uyarısı orta sütunda (ProductBuyBox'ın fiyat alanında) tek sefer
             gösterilir; CTA üstündeki duplicate banner kaldırıldı (2026-06-15). -->

        <!-- CTA Buttons (Sepete Ekle + Sohbet et — 50/50 grid) -->
        <div id="pd-cta-buttons" class="grid grid-cols-2 gap-3 px-5 py-4 border-t border-b border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)] [.pd-sticky_&]:sticky [.pd-sticky_&]:-bottom-[22px] [.pd-sticky_&]:z-[2] [.pd-sticky_&]:bg-[var(--color-surface,#fff)] [.pd-sticky_&]:border-b-0 [.pd-sticky_&]:mx-[-20px] [.pd-sticky_&]:-mb-[20px] [.pd-sticky_&]:px-5 [.pd-sticky_&]:py-4 [.pd-sticky_&]:pb-5 [.pd-sticky_&]:shadow-[0_-4px_14px_-8px_rgba(17,24,39,0.12)]">
          ${
            mockProduct.sellerKybVerified === false
              ? `
            <button type="button" id="pd-add-to-cart" disabled aria-disabled="true" class="th-btn-dark whitespace-nowrap px-3.5 opacity-50 !cursor-not-allowed pointer-events-none" title="${t("common.addToCartDisabledKyb")}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ${t("product.addToCart")}
            </button>
          `
              : `
            <button type="button" id="pd-add-to-cart" data-add-to-cart="${mockProduct.id}" class="th-btn-dark whitespace-nowrap px-3.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              ${t("product.addToCart")}
            </button>
          `
          }

          <button type="button" id="pd-chat-with-seller"
                  data-chat-trigger
                  data-product-id="${escapeHtml(mockProduct.id)}"
                  data-product-title="${escapeHtml(p.title || "")}"
                  data-product-price="${escapeHtml(p.priceTiers[0] ? formatCurrency(p.priceTiers[0].price, getSelectedCurrency()) : "")}"
                  data-product-thumb="${escapeHtml(sanitizeUrl(p.images?.[0]?.src || ""))}"
                  data-product-min-order="${p.moq ? String(p.moq) : "1"}"
                  data-seller-id="${escapeHtml(p.supplier?.id || "")}"
                  class="th-btn-outline whitespace-nowrap px-3.5 inline-flex items-center justify-center gap-2 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            ${t("chat.chatWithSeller")}
          </button>
        </div>
        ${
          mockProduct.sellerKybVerified === false
            ? `<p class="pd-kyb-hint flex items-start gap-1.5 mx-5 mt-2 text-[11px] leading-[1.5] text-[#6b7280]">
                 <svg class="pd-kyb-hint-icon shrink-0 mt-0.5 text-[#9ca3af]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
                 <span>${t("common.kybGateFavoriteHint")}</span>
               </p>`
            : ""
        }
      </div>
    </div>
  `;
}

export function initProductInfo(options: { signal?: AbortSignal } = {}): void {
  // Card tab switching (Toptan Satış / Özelleştirme)
  const cardTabs = document.querySelectorAll<HTMLButtonElement>(".pd-card-tab");
  cardTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      cardTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // Sticky card: add .pd-sticky once user scrolls past the card's bottom
  const heroInfo = document.getElementById("pd-hero-info");
  if (heroInfo && window.matchMedia("(min-width: 1024px)").matches) {
    const stickyTop = 130;
    const cardBottom = heroInfo.getBoundingClientRect().bottom + window.scrollY;

    const onScroll = () => {
      heroInfo.classList.toggle("pd-sticky", window.scrollY + stickyTop >= cardBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true, signal: options.signal });
    onScroll();
  }

  // ── Shipping card change ──────────────────────────

  const pdShipChangeBtn = document.getElementById("pd-ship-card-change");
  if (pdShipChangeBtn) {
    pdShipChangeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openShippingModal();
    });
  }

  // Listen for shipping changes from shared modal — update both desktop and mobile layouts
  document.addEventListener("shipping-change", ((e: CustomEvent) => {
    const { method, costStr, estimatedDays } = e.detail;
    const methodEl = document.getElementById("pd-ship-card-method");
    if (methodEl) methodEl.textContent = method;
    const detailEl = document.querySelector("#pd-shipping-card .pd-shipping-card-detail");
    if (detailEl)
      detailEl.textContent = `${t("product.shippingCost", { cost: costStr, days: estimatedDays })}`;

    const mobileMethodEl = document.querySelector("#pdm-ship-preview .pdm-ship-method");
    if (mobileMethodEl) mobileMethodEl.textContent = method;
    const mobileDetailEl = document.querySelector("#pdm-ship-preview .pdm-ship-detail");
    if (mobileDetailEl) {
      mobileDetailEl.innerHTML =
        `<span class="text-text-muted">${t("product.estimatedCost")}: <strong>${costStr}</strong></span>` +
        `<span class="text-text-muted">${t("product.duration")}: <strong>${estimatedDays}</strong></span>`;
    }
  }) as EventListener, options);
}
