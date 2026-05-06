/**
 * PaymentMethodSection Component (C3)
 * Açılır/kapanır ödeme yöntemi bölümü.
 * Referans: /checkout/components.jsx -> PaymentSection (co-pay-row).
 * Davranış Alpine.js x-data="checkoutAccordion" üzerinde.
 */

import type { CartSupplier } from "../../types/cart";
import { t } from "../../i18n";
import "../payment/state/PaymentCardStore";

export interface PaymentMethodSectionProps {
  initialExpanded?: boolean;
  suppliers: CartSupplier[];
  isSupplierCheckout?: boolean;
}

export function PaymentMethodSection({
  initialExpanded = false,
  suppliers,
  isSupplierCheckout = false,
}: PaymentMethodSectionProps): string {
  const chevronRotate = initialExpanded ? "rotate-180" : "";
  const contentStyle = initialExpanded ? "" : "height: 0; overflow: hidden;";

  const renderPaymentMethods = () => {
    if (!suppliers || suppliers.length === 0) {
      return `<p class="text-[#6b7280] text-base p-4 sm:p-6" data-i18n="checkout.paymentMethodsAfterAddress">${t("checkout.paymentMethodsAfterAddress")}</p>`;
    }

    const supplierNames =
      suppliers.length > 1
        ? isSupplierCheckout
          ? suppliers.map((s) => s.name).join(", ")
          : "iSTOC"
        : isSupplierCheckout
          ? suppliers[0].name
          : "iSTOC";

    return `
      <div class="pt-1">
        <div class="co-pay-sub" data-i18n="checkout.paymentMethodFor" data-i18n-options='{"name":"${supplierNames}"}'>${t("checkout.paymentMethodFor", { name: supplierNames })}</div>
        <div class="co-pay-list">
          <!-- Option 1: Banka Havalesi / EFT (önerilen) -->
          <label class="co-pay-row" :class="selectedMethod === 'banka_havale' ? 'is-selected' : ''">
            <input type="radio" name="payment_method" value="banka_havale" x-model="selectedMethod">
            <span class="co-radio"><span></span></span>
            <div class="co-pay-content">
              <div class="co-pay-title-row">
                <span class="co-pay-title" data-i18n="checkout.bankTransfer">${t("checkout.bankTransfer")}</span>
                <span class="co-pill co-pill-amber" data-i18n="common.recommended">${t("common.recommended")}</span>
              </div>
              <div class="co-pay-desc" data-i18n="checkout.bankTransferDesc">${t("checkout.bankTransferDesc")}</div>
            </div>
          </label>

          <!-- Option 2: Çek / Senet -->
          <label class="co-pay-row" :class="selectedMethod === 'cek_senet' ? 'is-selected' : ''">
            <input type="radio" name="payment_method" value="cek_senet" x-model="selectedMethod">
            <span class="co-radio"><span></span></span>
            <div class="co-pay-content">
              <div class="co-pay-title-row">
                <span class="co-pay-title" data-i18n="checkout.checkDraft">${t("checkout.checkDraft")}</span>
              </div>
              <div class="co-pay-desc" data-i18n="checkout.checkDraftDesc">${t("checkout.checkDraftDesc")}</div>
            </div>
          </label>
        </div>
      </div>
    `;
  };

  // Header'da kapalıyken seçili yöntem adını göstermek için selectedMethod
  // Alpine state'ini section seviyesine taşıdık (header + content paylaşır).
  const methodLabelMap = `({ banka_havale: '${t("checkout.bankTransfer")}', cek_senet: '${t("checkout.checkDraft")}' })`;

  return `
    <section
      id="checkout-payment"
      class="checkout-section"
      x-data="Object.assign(checkoutAccordion({ initialExpanded: ${initialExpanded} }), { selectedMethod: 'banka_havale' })"
      :class="{ 'checkout-section--collapsed': !expanded }"
      ${!initialExpanded ? "x-cloak" : ""}
    >
      <button
        class="checkout-section__header checkout-section__header--toggle w-full flex items-center gap-3 cursor-pointer"
        :aria-expanded="expanded"
        aria-expanded="${initialExpanded ? "true" : "false"}"
        @click="toggle()"
        type="button"
      >
        <span class="checkout-section__icon inline-flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </span>
        <h2 class="checkout-section__title flex-1 text-left" data-i18n="checkout.paymentMethod">${t("checkout.paymentMethod")}</h2>
        <!-- Kapalıyken seçili yöntem etiketi (gri pill). Açıkken gizle. -->
        <span
          class="co-section-summary"
          x-show="!expanded"
          x-cloak
          x-text="${methodLabelMap}[selectedMethod] || ''"
        ></span>
        <svg class="checkout-section__chevron w-5 h-5 text-[#6b7280] transition-transform duration-300 ${chevronRotate}" :class="{ 'rotate-180': expanded }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="checkout-section__content transition-[height] duration-300 ease-in-out overflow-hidden" style="${contentStyle}" x-ref="content">
        ${renderPaymentMethods()}
      </div>
    </section>
  `.trim();
}

/** @deprecated Migrated to Alpine.js x-data="checkoutAccordion" — see alpine.ts */
export function initAccordionSections(): void {
  // No-op: accordion interactions now handled by Alpine.js checkoutAccordion component
}
