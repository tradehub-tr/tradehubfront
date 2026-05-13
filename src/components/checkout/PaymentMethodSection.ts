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
        <div class="co-pay-sub text-[12px] text-[#8a877f] pb-3 uppercase tracking-[0.05em] font-semibold" data-i18n="checkout.paymentMethodFor" data-i18n-options='{"name":"${supplierNames}"}'>${t("checkout.paymentMethodFor", { name: supplierNames })}</div>
        <div class="co-pay-list flex flex-col gap-2">
          <!-- Option 1: Banka Havalesi / EFT (önerilen) -->
          <label class="co-pay-row relative flex items-start gap-3 px-4 py-[14px] border rounded-xl bg-white cursor-pointer transition-all"
            :class="selectedMethod === 'banka_havale' ? 'is-selected border-[#f5b800] bg-[#fff8e1] shadow-[0_0_0_3px_rgba(245,184,0,0.12)]' : 'border-[#e8e6e0] hover:border-[#d5d2c9]'">
            <input type="radio" name="payment_method" value="banka_havale" x-model="selectedMethod" class="absolute opacity-0 pointer-events-none">
            <span class="co-radio w-[18px] h-[18px] rounded-full shrink-0 border-[1.5px] bg-white inline-flex items-center justify-center mt-[1px] transition-all"
              :class="selectedMethod === 'banka_havale' ? 'border-[#d39c00]' : 'border-[#d5d2c9]'">
              <span class="w-2 h-2 rounded-full transition-all"
                :class="selectedMethod === 'banka_havale' ? 'bg-[#d39c00]' : 'bg-transparent'"></span>
            </span>
            <div class="co-pay-content flex-1 min-w-0">
              <div class="co-pay-title-row flex items-center gap-2 mb-[2px]">
                <span class="co-pay-title font-semibold text-[14px] text-[#1a1a1a]" data-i18n="checkout.bankTransfer">${t("checkout.bankTransfer")}</span>
                <span class="co-pill co-pill-amber inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11.5px] font-semibold bg-[#fff8e1] text-[#d39c00] border-transparent border whitespace-nowrap" data-i18n="common.recommended">${t("common.recommended")}</span>
              </div>
              <div class="co-pay-desc text-[12.5px] text-[#8a877f]" data-i18n="checkout.bankTransferDesc">${t("checkout.bankTransferDesc")}</div>
            </div>
          </label>

          <!-- Option 2: Çek / Senet -->
          <label class="co-pay-row relative flex items-start gap-3 px-4 py-[14px] border rounded-xl bg-white cursor-pointer transition-all"
            :class="selectedMethod === 'cek_senet' ? 'is-selected border-[#f5b800] bg-[#fff8e1] shadow-[0_0_0_3px_rgba(245,184,0,0.12)]' : 'border-[#e8e6e0] hover:border-[#d5d2c9]'">
            <input type="radio" name="payment_method" value="cek_senet" x-model="selectedMethod" class="absolute opacity-0 pointer-events-none">
            <span class="co-radio w-[18px] h-[18px] rounded-full shrink-0 border-[1.5px] bg-white inline-flex items-center justify-center mt-[1px] transition-all"
              :class="selectedMethod === 'cek_senet' ? 'border-[#d39c00]' : 'border-[#d5d2c9]'">
              <span class="w-2 h-2 rounded-full transition-all"
                :class="selectedMethod === 'cek_senet' ? 'bg-[#d39c00]' : 'bg-transparent'"></span>
            </span>
            <div class="co-pay-content flex-1 min-w-0">
              <div class="co-pay-title-row flex items-center gap-2 mb-[2px]">
                <span class="co-pay-title font-semibold text-[14px] text-[#1a1a1a]" data-i18n="checkout.checkDraft">${t("checkout.checkDraft")}</span>
              </div>
              <div class="co-pay-desc text-[12.5px] text-[#8a877f]" data-i18n="checkout.checkDraftDesc">${t("checkout.checkDraftDesc")}</div>
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
      class="checkout-section bg-white border border-[#e8e6e0] rounded-2xl shadow-[0_1px_2px_rgba(20,20,18,0.04)] overflow-hidden"
      x-data="Object.assign(checkoutAccordion({ initialExpanded: ${initialExpanded} }), { selectedMethod: 'banka_havale' })"
      :class="{ 'checkout-section--collapsed': !expanded }"
      ${!initialExpanded ? "x-cloak" : ""}
    >
      <button
        class="checkout-section__header checkout-section__header--toggle w-full flex items-center gap-3 px-[22px] py-[18px] cursor-pointer"
        :aria-expanded="expanded"
        aria-expanded="${initialExpanded ? "true" : "false"}"
        @click="toggle()"
        type="button"
      >
        <span class="checkout-section__icon inline-flex items-center justify-center w-8 h-8 min-w-[32px] rounded-[10px] bg-[#fafaf8] text-[#4a4a48] p-[7px]">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </span>
        <h2 class="checkout-section__title flex-1 text-left text-[15px] font-semibold text-[#1a1a1a] tracking-[-0.005em]" data-i18n="checkout.paymentMethod">${t("checkout.paymentMethod")}</h2>
        <!-- Kapalıyken seçili yöntem etiketi (gri pill). Açıkken gizle. -->
        <span
          class="co-section-summary text-[12.5px] font-medium text-[#4a4a48] bg-[#fafaf8] border border-[#e8e6e0] rounded-full px-[10px] py-[3px] whitespace-nowrap tracking-[0.005em]"
          x-show="!expanded"
          x-cloak
          x-text="${methodLabelMap}[selectedMethod] || ''"
        ></span>
        <svg class="checkout-section__chevron w-5 h-5 text-[#6b7280] transition-transform duration-300 ${chevronRotate}" :class="{ 'rotate-180': expanded }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="checkout-section__content px-[22px] pb-[22px] transition-[height] duration-300 ease-in-out overflow-hidden" :class="{ 'pt-0 pb-0': !expanded }" style="${contentStyle}" x-ref="content">
        ${renderPaymentMethods()}
      </div>
    </section>
  `.trim();
}

/** @deprecated Migrated to Alpine.js x-data="checkoutAccordion" — see alpine.ts */
export function initAccordionSections(): void {
  // No-op: accordion interactions now handled by Alpine.js checkoutAccordion component
}
