/**
 * ProductOrderPanel — ürün detay SAĞ sütunu.
 * Kargo kartı, sosyal kanıt rozeti ve CTA'lar (Sepete Ekle / Sohbet et).
 * Fiyat, numune ve varyantlar orta sütundaki sekmeli kartta durur
 * (ProductBuyBox) — referans düzenin "Toptan satış" kartı orasıdır.
 *
 * 1280px altında sağ panel ortanın altına akar; sticky yalnız 1280px ve
 * üstünde devreye girer. Eşiğin tek hakemi CSS: hem dıştaki `#pd-hero-info`
 * hem içerideki `[.pd-sticky_&]:` grupları `min-[1280px]:` ile kapılıdır.
 * JS `.pd-sticky` class'ını her genişlikte toggle eder (bkz. init).
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import { openShippingModal } from "./CartDrawer";
import { SocialProofBadge } from "./SocialProofBadge";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

export function ProductOrderPanel(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;

  return `
    <div id="pd-order-panel" class="bg-[var(--color-surface,#fff)] flex flex-col border border-[var(--color-border-default,#e5e5e5)] rounded-md overflow-hidden min-[1280px]:[.pd-sticky_&]:flex-1 min-[1280px]:[.pd-sticky_&]:min-h-0 min-[1280px]:[.pd-sticky_&]:max-h-full min-[1280px]:[.pd-sticky_&]:overflow-hidden">
      <div id="pd-info-scrollable" class="p-5 flex flex-col scrollbar-hide min-[1280px]:[.pd-sticky_&]:flex-1 min-[1280px]:[.pd-sticky_&]:overflow-y-auto min-[1280px]:[.pd-sticky_&]:min-h-0">
        <!-- Sticky'de #pd-wholesale-blocks buraya taşınır; ayraç da yalnız o durumda basılır -->
        <div id="pd-panel-wholesale-slot" class="hidden min-[1280px]:[.pd-sticky_&]:block"></div>
        <hr class="hidden min-[1280px]:[.pd-sticky_&]:block my-4 border-0 border-t border-[var(--color-border-default,#e5e5e5)]" />
        <!-- Kargo — referans düzendeki iki durum:
             (a) yöntem tanımlıysa gri kart + yöntem adı (14/18/600) + detay (14/18/400)
             (b) tanımlı DEĞİLSE bölüm gizlenmez, "tedarikçiyle iletişime geçin" metni basılır -->
        <div>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-[16px] leading-[24px] font-semibold m-0 text-[#222]">${t("product.shippingLabel")}</h2>
            ${
              p.shipping[0]?.method
                ? `<a href="javascript:void(0)" class="text-[14px] leading-[20px] font-normal no-underline whitespace-nowrap cursor-pointer text-[#222] hover:opacity-70 transition-opacity duration-150" id="pd-ship-card-change">${t("product.changeLabel")} ›</a>`
                : ""
            }
          </div>
          ${
            p.shipping[0]?.method
              ? `
          <div class="flex flex-col gap-0.5 min-w-0 mt-3 px-4 py-3 rounded-md" id="pd-shipping-card" style="background: var(--color-surface-raised, #f5f5f5);">
            <span class="text-[14px] leading-[18px] font-semibold text-[#222] truncate" id="pd-ship-card-method">${escapeHtml(p.shipping[0].method)}</span>
            <span class="pd-shipping-card-detail text-[14px] leading-[18px] font-normal text-[#222] truncate">${t("product.shippingCost", { cost: p.shipping[0].cost, days: p.shipping[0].estimatedDays })}</span>
          </div>`
              : `
          <p class="mt-3 m-0 text-[14px] leading-[20px] font-normal text-[#222]">${t("product.shippingContactSeller")}</p>`
          }
        </div>

        <!-- Social Proof Badge — kargo ile CTA arası. Sinyal yokken iç kutu
             x-show ile gizlenir ama dış sarmalayıcı DOM'da kalır, yani bu
             margin o durumda da uygulanır (16px). Rozet için ayrı bir ayraç
             koymamamızın sebebi de bu: boşluk tek yerden gelsin. -->
        ${SocialProofBadge({
          listingId: p.id,
          supplierId: p.supplier?.id ?? "",
          wrapperClass: "mt-4",
        })}

        <!-- KYB uyarısı orta sütunda (ProductBuyBox'ın fiyat alanında) tek sefer
             gösterilir; CTA üstündeki duplicate banner kaldırıldı (2026-06-15). -->

        <!-- CTA Buttons (Sepete Ekle + Sohbet et — 50/50 grid) -->
        <!-- px-4 YOK: panelin kendi dolgusu var, buraya da eklemek butonları
             kargo bloğundan dar bırakıyordu. Sticky halinde -mx-4 ile kenara
             yayılırken px-4 ayrıca uygulanıyor. -->
        <div id="pd-cta-buttons" class="grid grid-cols-2 gap-3 mt-5 py-4 border-t border-b border-[var(--color-border-default,#e5e5e5)] bg-[var(--color-surface,#fff)] min-[1280px]:[.pd-sticky_&]:sticky min-[1280px]:[.pd-sticky_&]:-bottom-[22px] min-[1280px]:[.pd-sticky_&]:z-[2] min-[1280px]:[.pd-sticky_&]:bg-[var(--color-surface,#fff)] min-[1280px]:[.pd-sticky_&]:border-b-0 min-[1280px]:[.pd-sticky_&]:-mx-5 min-[1280px]:[.pd-sticky_&]:-mb-[20px] min-[1280px]:[.pd-sticky_&]:px-5 min-[1280px]:[.pd-sticky_&]:py-4 min-[1280px]:[.pd-sticky_&]:pb-5 min-[1280px]:[.pd-sticky_&]:shadow-[0_-4px_14px_-8px_rgba(17,24,39,0.12)]">
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

export function initProductOrderPanel(options: { signal?: AbortSignal } = {}): void {
  // Sticky card: add .pd-sticky once user scrolls past the card's bottom.
  // Class HER genişlikte toggle edilir; 1280px eşiğinin TEK hakemi CSS'tir
  // (hem `#pd-hero-info` hem buradaki `[.pd-sticky_&]:` grupları
  // `min-[1280px]:` ile kapılı). Düzen yalnızca 1024px geçilince yeniden
  // mount edildiği için matchMedia'yı mount anında ölçmek 1100↔1440 canlı
  // resize'ında ya sticky'yi hiç bağlamıyor ya da tek sütunda çalıştırıyordu.
  const heroInfo = document.getElementById("pd-hero-info");
  if (heroInfo) {
    const stickyTop = 130;
    const cardBottom = heroInfo.getBoundingClientRect().bottom + window.scrollY;
    const wideQuery = window.matchMedia("(min-width: 1280px)");

    // Sticky'ye girerken fiyat/numune/varyant bloğunu panele TAŞI, çıkarken
    // orta karttaki yuvasına geri koy. Kopya değil taşıma: listener'lar ve
    // seçim durumu node ile birlikte gider, senkron gerekmez. 1280 altında
    // panel akışta görünür olduğundan taşıma yapılmaz (slot zaten gizli).
    const placeWholesaleBlocks = (sticky: boolean) => {
      const blocks = document.getElementById("pd-wholesale-blocks");
      if (!blocks) return;
      const target = sticky && wideQuery.matches
        ? document.getElementById("pd-panel-wholesale-slot")
        : document.getElementById("pd-wholesale-home");
      if (target && blocks.parentElement !== target) target.appendChild(blocks);
    };

    const onScroll = () => {
      const sticky = window.scrollY + stickyTop >= cardBottom;
      heroInfo.classList.toggle("pd-sticky", sticky);
      placeWholesaleBlocks(sticky);
    };
    window.addEventListener("scroll", onScroll, { passive: true, signal: options.signal });
    // 1280 sınırı canlı resize'da geçilirse blok doğru tarafa dönmeli —
    // düzen 1024'te remount olur ama 1280 geçişi remount tetiklemez.
    wideQuery.addEventListener("change", onScroll, { signal: options.signal });
    onScroll();
  }

  // ── Shipping card change ──────────────────────────

  const pdShipChangeBtn = document.getElementById("pd-ship-card-change");
  if (pdShipChangeBtn) {
    pdShipChangeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openShippingModal();
    }, options);
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
