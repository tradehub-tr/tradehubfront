/**
 * BillingInfoSection Component
 * Fatura bilgileri bölümü — referans tasarım (checkout/app.jsx:BillingSection) baz alındı.
 * Açıkken: tip toggle (Bireysel/Şirket) + form alanları + "teslimat adresi ile aynı" + adres pill.
 * Kapalıyken: tek satır summary metni.
 * Interactivity Alpine.js x-data="billingForm" ile sağlanır (alpine/checkout.ts).
 */

import { t } from "../../i18n";

export interface BillingInfoSectionProps {
  initialExpanded?: boolean;
}

export function BillingInfoSection({
  initialExpanded = false,
}: BillingInfoSectionProps = {}): string {
  return `
    <section
      id="checkout-billing"
      class="checkout-section checkout-section--billing bg-white border border-[#e8e6e0] rounded-2xl shadow-[0_1px_2px_rgba(20,20,18,0.04)] overflow-hidden"
      x-data="billingForm"
      x-init="init(${initialExpanded ? "true" : "false"})"
    >
      <!-- Card head -->
      <div class="checkout-section__header flex items-center gap-3 px-[22px] py-[18px]">
        <span class="checkout-section__icon inline-flex items-center justify-center w-8 h-8 min-w-[32px] rounded-[10px] bg-[#fafaf8] text-[#4a4a48] p-[7px]">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6"/>
          </svg>
        </span>

        <h2 class="checkout-section__title flex-1 truncate text-[15px] font-semibold text-[#1a1a1a] tracking-[-0.005em]" data-i18n="checkout.billingInfo">${t("checkout.billingInfo")}</h2>

        <!-- Tip rozeti (kapalı durumdayken bile görünür) -->
        <span
          x-show="type"
          x-cloak
          class="co-pill co-pill-ghost inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11.5px] font-medium bg-transparent text-[#4a4a48] border border-[#e8e6e0] whitespace-nowrap"
          x-text="type === 'Bireysel' ? '${t("checkout.billingIndividual")}' : '${t("checkout.billingCompany")}'"
        ></span>

        <!-- Eksik rozeti -->
        <span
          x-show="!isComplete && !expanded"
          x-cloak
          class="co-pill co-pill-warn inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11.5px] font-medium bg-[#fff4e5] text-[#b54708] border-transparent border whitespace-nowrap"
        >
          <span class="co-pill-dot w-[5px] h-[5px] rounded-full bg-[#b54708] inline-block"></span>
          <span data-i18n="checkout.billingMissing">${t("checkout.billingMissing")}</span>
        </span>

        <button
          type="button"
          @click="toggle()"
          class="co-link-btn appearance-none bg-transparent border-0 px-2 py-1 text-[#4a4a48] inline-flex items-center gap-1 text-[13px] font-medium rounded-md cursor-pointer no-underline hover:text-[#1a1a1a] hover:bg-[#fafaf8] focus:outline-none"
        >
          <span x-show="!expanded" data-i18n="checkout.edit">${t("checkout.edit")}</span>
          <span x-show="expanded" x-cloak data-i18n="checkout.close">${t("checkout.close")}</span>
        </button>
      </div>

      <!-- Kapalı durum: summary -->
      <div x-show="!expanded" class="checkout-section__content px-[22px] pb-[22px] -mt-2">
        <p class="text-[13px] text-[#6b7280]" x-text="summaryText"></p>
      </div>

      <!-- Açık durum: edit -->
      <div x-show="expanded" x-cloak class="checkout-section__content px-[22px] pb-[22px] flex flex-col gap-3.5">

        <!-- Tip toggle: Bireysel / Şirket -->
        <div class="co-billing-toggle grid grid-cols-2 max-[720px]:grid-cols-1 gap-[10px]" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="type === 'Bireysel'"
            @click="setType('Bireysel')"
            class="co-billing-toggle-card bg-white border border-[#e8e6e0] rounded-xl p-[14px_16px] text-left flex flex-col gap-1 transition-all cursor-pointer hover:border-[#d5d2c9]"
            :class="type === 'Bireysel' ? 'is-active bg-[#fff8e1] border-[#f5b800] shadow-[0_0_0_3px_rgba(245,184,0,0.12)]' : ''"
          >
            <div class="co-bt-title font-semibold text-[13.5px] text-[#1a1a1a]" data-i18n="checkout.billingIndividual">${t("checkout.billingIndividual")}</div>
            <div class="co-bt-sub text-[12px] text-[#8a877f]" data-i18n="checkout.billingIndividualDesc">${t("checkout.billingIndividualDesc")}</div>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="type === 'Şirket'"
            @click="setType('Şirket')"
            class="co-billing-toggle-card bg-white border border-[#e8e6e0] rounded-xl p-[14px_16px] text-left flex flex-col gap-1 transition-all cursor-pointer hover:border-[#d5d2c9]"
            :class="type === 'Şirket' ? 'is-active bg-[#fff8e1] border-[#f5b800] shadow-[0_0_0_3px_rgba(245,184,0,0.12)]' : ''"
          >
            <div class="co-bt-title font-semibold text-[13.5px] text-[#1a1a1a]" data-i18n="checkout.billingCompany">${t("checkout.billingCompany")}</div>
            <div class="co-bt-sub text-[12px] text-[#8a877f]" data-i18n="checkout.billingCompanyDesc">${t("checkout.billingCompanyDesc")}</div>
          </button>
        </div>

        <!-- Bireysel -->
        <div x-show="type === 'Bireysel'" x-cloak class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          ${field("billing-tcn", "tcn", t("checkout.billingTcn"), "11", "11", "tel", "12345678901")}
          <div class="hidden sm:block"></div>
        </div>

        <!-- Şirket -->
        <div x-show="type === 'Şirket'" x-cloak class="flex flex-col gap-3 mt-1">
          ${field("billing-company-name", "companyName", t("checkout.billingCompanyName"), undefined, undefined, "text", "Acme Tic. Ltd. Şti.")}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${field("billing-tax-office", "taxOffice", t("checkout.billingTaxOffice"), undefined, undefined, "text", "Kadıköy")}
            ${field("billing-tax-number", "taxNumber", t("checkout.billingTaxNumber"), "10", "10", "tel", "1234567890")}
          </div>
          <label class="flex items-center gap-2.5 cursor-pointer text-[13px] text-[#4a4a48] select-none">
            <span class="relative flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border transition-colors"
              :class="eInvoice ? 'bg-[var(--btn-bg,#ff6600)] border-[var(--btn-bg,#ff6600)]' : 'bg-white border-[#d5d2c9]'">
              <input type="checkbox" x-model="eInvoice" class="absolute inset-0 opacity-0 cursor-pointer">
              <svg x-show="eInvoice" x-cloak class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </span>
            <span class="font-medium" data-i18n="checkout.billingEInvoice">${t("checkout.billingEInvoice")}</span>
            <span class="text-[12px] text-[#8a877f]" data-i18n="checkout.billingEInvoiceHint">${t("checkout.billingEInvoiceHint")}</span>
          </label>
        </div>

        <!-- Adres -->
        <div x-show="type" x-cloak class="border-t border-dashed border-[#e8e6e0] pt-3 flex flex-col gap-3">

          <label class="flex items-center gap-2.5 cursor-pointer text-[13px] text-[#1a1a1a] select-none">
            <span class="relative flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border transition-colors"
              :class="sameAsShipping ? 'bg-[var(--btn-bg,#ff6600)] border-[var(--btn-bg,#ff6600)]' : 'bg-white border-[#d5d2c9]'">
              <input type="checkbox" x-model="sameAsShipping" class="absolute inset-0 opacity-0 cursor-pointer">
              <svg x-show="sameAsShipping" x-cloak class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </span>
            <span class="font-medium" data-i18n="checkout.billingSameAsShipping">${t("checkout.billingSameAsShipping")}</span>
          </label>

          <!-- sameAsShipping: pill -->
          <div x-show="sameAsShipping" x-cloak class="co-billing-addr-pill flex items-center gap-2 p-[12px_14px] bg-[#fafaf8] border border-[#e8e6e0] rounded-xl text-[13px] text-[#4a4a48]">
            <svg class="w-4 h-4 text-[#8a877f] shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <circle cx="12" cy="11" r="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span data-i18n="checkout.billingUseShippingAddress">${t("checkout.billingUseShippingAddress")}</span>
          </div>

          <!-- !sameAsShipping: form -->
          <div x-show="!sameAsShipping" x-cloak class="flex flex-col gap-3">
            ${field("billing-address", "address", t("checkout.billingAddress"), undefined, undefined, "text", "Mahalle, cadde, no")}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${field("billing-city", "city", t("checkout.billingCity"), undefined, undefined, "text", "İstanbul")}
              ${field("billing-district", "district", t("checkout.billingDistrict"), undefined, undefined, "text", "Kadıköy")}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${field("billing-postal-code", "postalCode", t("checkout.billingPostalCode"), "10", undefined, "tel", "34000")}
              <div class="hidden sm:block"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `.trim();
}

function field(
  id: string,
  modelKey: string,
  label: string,
  maxlength?: string,
  minlength?: string,
  type = "text",
  placeholder = ""
): string {
  const ml = maxlength ? ` maxlength="${maxlength}"` : "";
  const minl = minlength ? ` minlength="${minlength}"` : "";
  return `
    <div class="flex flex-col gap-1" :data-error="errors.${modelKey} ? 'true' : 'false'">
      <label for="${id}" class="text-[12.5px] font-medium text-[#4a4a48]">
        ${label} <span class="text-[#b42318]">*</span>
      </label>
      <input
        type="${type}"
        id="${id}"
        x-model="${modelKey}"
        @input="clearError('${modelKey}')"
        @blur="validateField('${modelKey}')"
        autocomplete="off"
        placeholder="${placeholder}"
        ${ml}${minl}
        class="w-full h-[44px] px-3 text-[14px] text-[#1a1a1a] bg-white border rounded-[10px] outline-none transition-colors placeholder:text-[#bdbab2] focus:border-[var(--btn-bg,#ff6600)] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.10)]"
        :class="errors.${modelKey} ? 'border-[#b42318]' : 'border-[#e8e6e0]'"
      />
      <span x-show="errors.${modelKey}" x-cloak class="text-[12px] text-[#b42318]" x-text="errors.${modelKey}"></span>
    </div>
  `;
}
