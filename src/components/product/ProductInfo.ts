/**
 * ProductInfo Component
 * Right sticky card (iSTOC layout-stick style).
 * Contains: price tiers, variations, shipping, CTAs.
 */

import { getCurrentProduct } from '../../alpine/product';
import { t } from '../../i18n';
import { formatCurrency, getSelectedCurrency } from '../../services/currencyService';
import type { PriceTier, ProductVariant } from '../../types/product';
import { openShippingModal, openCartDrawer } from './CartDrawer';

function renderPriceTiers(tiers: PriceTier[]): string {
  // When a campaign is active the backend sets each tier's originalPrice
  // (pre-discount). We show it as a strikethrough next to the deal price.
  // The qty label is fully localised via product.moqSingle / product.moqRange
  // so each locale controls its own abbreviation + unit (TR: "MSA: 1 adet",
  // EN: "MSQ: 1 piece").
  return `
    <div id="pd-price-tiers">
      ${tiers.map((tier, i) => {
    const qtyLabel = tier.maxQty
      ? t('product.moqRange', { min: tier.minQty, max: tier.maxQty })
      : t('product.moqSingle', { count: tier.minQty });
    const hasDiscount = typeof tier.originalPrice === 'number' && tier.originalPrice > tier.price;
    const strikethrough = hasDiscount
      ? `<span class="pd-price-tier-original" style="text-decoration: line-through; color: var(--color-text-tertiary, #9ca3af); font-size: 12px; margin-right: 6px;">${formatCurrency(tier.originalPrice!, getSelectedCurrency())}</span>`
      : '';
    return `
          <div class="pd-price-tier ${i === 0 ? 'active' : ''}" data-tier-index="${i}">
            <span class="pd-price-tier-qty">${qtyLabel}</span>
            <span class="pd-price-tier-price shrink-0 flex items-baseline gap-1">${strikethrough}${formatCurrency(tier.price, getSelectedCurrency())}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderVariant(variant: ProductVariant): string {
  const selectedOpt = variant.options.find(o => o.available) || variant.options[0];

  if (variant.type === 'color') {
    return `
      <div class="variant-group" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
        <h4 class="pd-variant-label"><strong>${variant.label}:</strong> <span class="variant-selected-label">${selectedOpt.label}</span></h4>
        <div class="pd-color-thumbs">
          ${variant.options.map((opt, i) => `
            <button
              type="button"
              class="variant-option pd-color-thumb ${i === 0 && opt.available ? 'active' : ''} ${opt.available ? '' : 'pd-color-thumb-disabled'}"
              data-variant-id="${opt.id}"
              data-variant-label="${opt.label}"
              data-variant-image="${opt.thumbnail || ''}"
              data-variant-video="${(opt as any).videoUrl || ''}"
              data-variant-title="${encodeURIComponent((opt as any).title || '')}"
              data-variant-images="${encodeURIComponent(JSON.stringify((opt as any).images || []))}"
              data-variant-value="${opt.value}"
              ${opt.price ? `data-variant-price="${opt.price}"` : ''}
              ${opt.available ? '' : 'disabled'}
              aria-label="${opt.label}"
              title="${opt.label}"
            >
              <img src="${opt.thumbnail || ''}" alt="${opt.label}" style="background:${opt.value};">
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="variant-group" data-variant-type="${variant.type}" data-variant-label="${variant.label}">
      <h4 class="pd-variant-label"><strong>${variant.label}:</strong> <span class="variant-selected-label">${selectedOpt.label}</span></h4>
      <div class="flex flex-wrap gap-2 mt-2">
        ${variant.options.map((opt, i) => `
          <button
            type="button"
            class="variant-option pd-variant-btn ${i === 0 && opt.available ? 'active' : ''} ${opt.available ? '' : 'opacity-40 cursor-not-allowed'}"
            data-variant-id="${opt.id}"
            data-variant-label="${opt.label}"
            data-variant-video="${(opt as any).videoUrl || ''}"
            data-variant-title="${encodeURIComponent((opt as any).title || '')}"
            data-variant-images="${encodeURIComponent(JSON.stringify((opt as any).images || []))}"
            ${opt.price ? `data-variant-price="${opt.price}"` : ''}
            ${opt.available ? '' : 'disabled'}
          >
            ${opt.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

export function ProductInfo(): string {
  const mockProduct = getCurrentProduct();
  const p = mockProduct;

  return `
    <div id="product-info">
      <div id="pd-info-scrollable">
        <!-- Wholesale Tab -->
        <div id="pd-card-tabs">
          <button type="button" class="pd-card-tab active">${t('product.wholesaleSales')}</button>
        </div>

        <!-- Ready to Ship Badge -->
        <span id="pd-ready-badge" class="th-badge">${t('product.readyToShip')}</span>

        <!-- Price Tiers -->
        ${renderPriceTiers(p.priceTiers)}

        <!-- Sample Price -->
        ${p.samplePrice ? `
        <div id="pd-sample-price" class="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg mb-5" style="background: var(--color-surface-raised, #f5f5f5);">
          <div class="flex items-center gap-2 text-sm min-w-0" style="color: var(--color-text-primary);">
            <svg class="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            <span class="truncate">${t('product.samplePrice')}: <strong class="shrink-0">${formatCurrency(p.samplePrice, getSelectedCurrency())}</strong></span>
          </div>
          <button type="button" data-order-sample="${mockProduct.id}" class="pd-sample-btn shrink-0 cursor-pointer">${t('cart.orderSample')}</button>
        </div>
        ` : ''}

        <!-- Variations Header -->
        <div id="pd-variations-section" class="pb-4" style="border-bottom: 1px solid var(--color-border-light, #f0f0f0);">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold m-0" style="color: var(--pd-title-color, #111827);">${t('product.variants')}</h3>
            <a href="#" class="text-sm font-medium no-underline hover:underline" style="color: var(--pd-breadcrumb-link-color, #cc9900);">${t('product.makeSelection')}</a>
          </div>

          <!-- Variant Groups -->
          ${p.variants.map(v => renderVariant(v)).join('')}
        </div>

        <!-- Shipping -->
        <div class="py-5" style="border-bottom: 1px solid var(--color-border-light, #f0f0f0);">
          <h3 class="text-sm font-bold mb-3 flex items-center gap-1.5 m-0" style="color: var(--pd-title-color, #111827);">${t('product.shippingLabel')}</h3>
          <div class="flex items-center justify-between gap-3 mt-3 px-3.5 py-3 rounded-lg border min-w-0" id="pd-shipping-card" style="background: var(--pd-spec-header-bg, #f9fafb); border-color: var(--color-border-default, #e5e5e5);">
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="text-sm font-semibold truncate" id="pd-ship-card-method" style="color: var(--pd-title-color, #111827);">${p.shipping[0]?.method || t('product.shippingLabel')}</span>
              <span class="pd-shipping-card-detail text-xs truncate" style="color: var(--pd-rating-text-color, #6b7280);">${p.shipping[0] ? t('product.shippingCost', { cost: p.shipping[0].cost, days: p.shipping[0].estimatedDays }) : ''}</span>
            </div>
            <a href="javascript:void(0)" class="text-[13px] font-medium no-underline whitespace-nowrap cursor-pointer" id="pd-ship-card-change" style="color: var(--pd-price-color, #cc9900);">${t('product.changeLabel')} ›</a>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div id="pd-cta-buttons">
          <button type="button" id="pd-add-to-cart" data-add-to-cart="${mockProduct.id}" class="th-btn-dark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            ${t('product.addToCart')}
          </button>
          <button type="button" id="pd-chat-now" class="th-btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${t('product.startChat')}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initProductInfo(): void {
  // Card tab switching (Toptan Satış / Özelleştirme)
  const cardTabs = document.querySelectorAll<HTMLButtonElement>('.pd-card-tab');
  cardTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      cardTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  const getSelectedVariantLabels = (): { color: string; size: string } => {
    const activeColorBtn = document.querySelector<HTMLButtonElement>('.variant-group[data-variant-type="color"] .variant-option.active');
    const activeSizeBtn = document.querySelector<HTMLButtonElement>('.variant-group:not([data-variant-type="color"]) .variant-option.active');
    return {
      color: activeColorBtn?.getAttribute('data-variant-label') || '',
      size: activeSizeBtn?.getAttribute('data-variant-label') || '',
    };
  };

  // "Seçim yap" link → open cart drawer
  const makeSelectionLink = document.querySelector<HTMLAnchorElement>('#pd-variations-section a[href="#"]');
  if (makeSelectionLink) {
    makeSelectionLink.addEventListener('click', (e) => {
      e.preventDefault();
      const { color, size } = getSelectedVariantLabels();
      openCartDrawer(color, size);
    });
  }

  // Variant selection — updates active state, label, gallery image
  const variantGroups = document.querySelectorAll<HTMLElement>('.variant-group');
  variantGroups.forEach(group => {
    const buttons = group.querySelectorAll<HTMLButtonElement>('.variant-option:not([disabled])');
    const labelEl = group.querySelector<HTMLElement>('.variant-selected-label');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update label text (e.g., "Renk: Altın" → "Renk: Gümüş")
        const variantLabel = btn.getAttribute('data-variant-label');
        if (labelEl && variantLabel) {
          labelEl.textContent = variantLabel;
        }

        // Read all variant-specific data from the clicked button
        const variantId = btn.getAttribute('data-variant-id') || '';
        const variantVideo = btn.getAttribute('data-variant-video') || '';
        let variantImages: string[] = [];
        try {
          const raw = decodeURIComponent(btn.getAttribute('data-variant-images') || '[]');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) variantImages = parsed.filter(Boolean);
        } catch (_) { /* noop */ }
        const variantTitle = decodeURIComponent(btn.getAttribute('data-variant-title') || '');

        // Dispatch a single event that the gallery + video + title listeners consume
        document.dispatchEvent(new CustomEvent('product-variant-change', {
          detail: {
            variantId,
            videoUrl: variantVideo,
            images: variantImages,
            title: variantTitle,
          },
        }));

        // Update URL so the selected variant is shareable / persistent on reload
        if (variantId) {
          const url = new URL(window.location.href);
          url.searchParams.set('variant', variantId);
          window.history.replaceState(null, '', url.toString());
        }

        // Open drawer only for NON-photo variant groups (size, material, etc.).
        // Photo-based variants (color) just swap the gallery — no drawer popup.
        const hasVariantPhoto = !!btn.getAttribute('data-variant-image');
        if (!hasVariantPhoto) {
          const { color, size } = getSelectedVariantLabels();
          openCartDrawer(color, size);
        }
      });
    });
  });

  // Sticky card: add .pd-sticky once user scrolls past the card's bottom
  const heroInfo = document.getElementById('pd-hero-info');
  if (heroInfo && window.matchMedia('(min-width: 1024px)').matches) {
    const stickyTop = 130;
    const cardBottom = heroInfo.getBoundingClientRect().bottom + window.scrollY;

    const onScroll = () => {
      heroInfo.classList.toggle('pd-sticky', window.scrollY + stickyTop >= cardBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Shipping card change ──────────────────────────

  const pdShipChangeBtn = document.getElementById('pd-ship-card-change');
  if (pdShipChangeBtn) {
    pdShipChangeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openShippingModal();
    });
  }

  // Listen for shipping changes from shared modal
  document.addEventListener('shipping-change', ((e: CustomEvent) => {
    const { method, costStr, estimatedDays } = e.detail;
    const methodEl = document.getElementById('pd-ship-card-method');
    if (methodEl) methodEl.textContent = method;
    const detailEl = document.querySelector('#pd-shipping-card .pd-shipping-card-detail');
    if (detailEl) detailEl.textContent = `${t('product.shippingCost', { cost: costStr, days: estimatedDays })}`;
  }) as EventListener);
}
