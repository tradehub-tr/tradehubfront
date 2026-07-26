/**
 * SupplierSetupForm Component
 * 4-step multi-step form for supplier registration application.
 * Used after AccountSetupForm when account_type is 'supplier'.
 *
 * Steps:
 *  1. Business Information (seller_type, business_name, contact_phone)
 *  2. Tax & Address (tax_id_type, tax_id, tax_office, address_line_1, city, country)
 *  3. Bank Information (bank_name, iban, account_holder_name)
 *  4. Identity & Agreements (identity_document_*, checkboxes)
 */

import { t } from "../../i18n";
import { validatePhone, validateIBAN, validateTCKN } from "../../utils/tr-validation";
import { resolveCountry, getFlagEmoji } from "../../data/countries";
import { getSubdivisionsForCountry } from "../../data/country-subdivisions";

/* ── Types ──────────────────────────────────────────── */

export interface SupplierSetupFormData {
  seller_type: string;
  business_name: string;
  contact_phone: string;
  tax_id_type: string;
  tax_id: string;
  tax_office: string;
  address_line_1: string;
  city: string;
  country: string;
  bank_name: string;
  iban: string;
  account_holder_name: string;
  identity_document_type: string;
  identity_document_number: string;
  identity_document_expiry: string;
  identity_document: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  kvkk_accepted: boolean;
  commission_accepted: boolean;
  return_policy_accepted: boolean;
}

export type SupplierSetupFieldState = SupplierSetupFormData;

export function collectSupplierSetupData(fields: SupplierSetupFieldState): SupplierSetupFormData {
  return { ...fields };
}

export function validateSupplierSetupStep(step: number, fields: SupplierSetupFieldState): boolean {
  if (step === 1) {
    const phone = fields.contact_phone.replace(/[\s\-()]/g, "");
    return !!fields.seller_type && !!fields.business_name.trim() && !!phone && validatePhone(phone);
  }
  if (step === 2) {
    const taxId = fields.tax_id.trim();
    const isTR = fields.country === "Turkey";
    return !!fields.tax_id_type && (isTR ? /^\d{10,11}$/.test(taxId.replace(/\D/g, "")) : !!taxId) &&
      !!fields.tax_office.trim() && !!fields.address_line_1.trim() && !!fields.city.trim() && !!fields.country.trim();
  }
  if (step === 3) {
    const iban = fields.iban.replace(/\s/g, "");
    const result = iban.length >= 26 ? validateIBAN(iban) : { valid: false };
    return !!result.valid && !!fields.bank_name.trim() && !!fields.account_holder_name.trim();
  }
  if (step === 4) {
    return !!fields.identity_document_number.trim() && validateTCKN(fields.identity_document_number.replace(/\s/g, "")) &&
      fields.terms_accepted && fields.privacy_accepted && fields.kvkk_accepted && fields.commission_accepted && fields.return_policy_accepted;
  }
  return false;
}

export interface SupplierSetupFormOptions {
  onSubmit?: (data: SupplierSetupFormData) => void;
  /** Sprint 2.6: Prefill ile başlangıçta hangi step açılsın (kullanıcının
   *  kaldığı yer). Default 1. */
  initialStep?: number;
}

/* ── Component HTML ─────────────────────────────────── */

/**
 * @param defaultCountry - Önceki adımda seçilen ülke (ISO-2 kod, İngilizce ya
 *   da Türkçe ad — `resolveCountry` her formatı kabul eder). Step 2'deki Ülke
 *   alanı bu değere göre flag + Türkçe ad gösterir; hidden input backend için
 *   İngilizce adı taşır.
 */
export function SupplierSetupForm(defaultCountry: string = "TR"): string {
  const country = resolveCountry(defaultCountry);
  const countryFlag = getFlagEmoji(country.code);
  const isTR = country.code === "TR";
  const cityOptions = getSubdivisionsForCountry(country.code);
  const hasCityDropdown = !!(cityOptions && cityOptions.length > 0);
  return `
    <div id="supplier-setup-form" class="w-full" data-supplier-country="${country.nameEN}" data-supplier-country-iso="${country.code}">
      <!-- Step indicator -->
      <div id="supplier-step-indicator" class="flex items-center justify-center gap-2 mb-6">
        ${[1, 2, 3, 4]
          .map(
            (n) => `
          <div class="supplier-step-dot flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-[background-color,color] duration-150 motion-reduce:transition-none ${n === 1 ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}" data-step-dot="${n}">${n}</div>
          ${n < 4 ? '<div class="w-6 h-0.5 bg-gray-200 dark:bg-gray-700"></div>' : ""}
        `
          )
          .join("")}
      </div>

      <!-- Step 1: Business Information -->
      <div class="supplier-step" data-supplier-step="1">
        <div class="mb-6 text-center lg:text-start">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">${t("auth.supplierSetup.step1Title")}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">${t("auth.supplierSetup.step1Desc")}</p>
        </div>
        <div class="space-y-4">
          <!-- Seller Type (hidden — default Business) -->
          <input type="hidden" id="ss-seller-type" value="Business" />
          <!-- Business Name -->
          <div>
            <label for="ss-business-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.businessName")}</label>
            <input type="text" id="ss-business-name" class="th-input th-input-lg" placeholder="${t("auth.supplierSetup.businessNamePh")}" required />
          </div>
          <!-- Contact Phone -->
          <div>
            <label for="ss-contact-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.contactPhone")}</label>
            <input type="tel" id="ss-contact-phone" class="th-input th-input-lg" placeholder="05XX XXX XX XX" required />
            <p id="ss-phone-error" class="text-xs text-red-500 mt-1 hidden"></p>
          </div>
        </div>
      </div>

      <!-- Steps 2/3 start inert and are mounted only while active. -->
      <div data-supplier-step-host="2"></div>
      <template id="supplier-step-template-2">
      <!-- Step 2: Tax & Address -->
      <div class="supplier-step hidden" data-supplier-step="2">
        <div class="mb-6 text-center lg:text-start">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">${t("auth.supplierSetup.step2Title")}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">${t("auth.supplierSetup.step2Desc")}</p>
        </div>
        <div class="space-y-4">
          <!-- Tax ID Type (hidden — backend default "TCKN") -->
          <input type="hidden" id="ss-tax-id-type" value="TCKN" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Vergi Numarası — TR: 10-11 hane integer; non-TR: free text -->
            <div>
              <label for="ss-tax-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.taxId")}</label>
              <input
                type="text"
                id="ss-tax-id"
                ${isTR ? `maxlength="11" inputmode="numeric" pattern="\\d{10,11}"` : `maxlength="30"`}
                class="th-input th-input-lg"
                placeholder="${t("auth.supplierSetup.taxIdPh")}"
                required
              />
              <p id="ss-taxid-error" class="text-xs text-red-500 mt-1 hidden"></p>
            </div>
            <!-- Vergi Dairesi — her ülkede serbest metin -->
            <div>
              <label for="ss-tax-office" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.taxOffice")}</label>
              <input type="text" id="ss-tax-office" class="th-input th-input-lg" placeholder="${t("auth.supplierSetup.taxOfficePh")}" required />
            </div>
          </div>
          <!-- İşletme Adresi -->
          <div>
            <label for="ss-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.address")}</label>
            <input type="text" id="ss-address" class="th-input th-input-lg" placeholder="${t("auth.supplierSetup.addressPh")}" required />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- City (TR/US: searchable dropdown; diğerleri: free text input) -->
            <div>
              <label for="${hasCityDropdown ? "ss-city-btn" : "ss-city"}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.city")}</label>
              ${
                hasCityDropdown
                  ? `<div class="relative">
                <button
                  type="button"
                  id="ss-city-btn"
                  class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-start text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none flex items-center justify-between"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="ss-city-dropdown"
                >
                  <span id="ss-city-display" class="text-gray-400 dark:text-gray-500">${t("auth.supplierSetup.selectOption")}</span>
                  <svg id="ss-city-icon" class="w-5 h-5 text-gray-400 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <input type="hidden" id="ss-city" name="city" value="" />
                <div
                  id="ss-city-dropdown"
                  class="absolute z-40 hidden w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg flex flex-col origin-top opacity-0 scale-95 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=open]:opacity-100 data-[state=open]:scale-100 motion-reduce:transition-none"
                >
                  <div class="shrink-0 p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <input
                      type="text"
                      id="ss-city-search"
                      class="th-input w-full px-3 py-2 text-sm"
                      placeholder="${t("auth.supplierSetup.searchCity")}"
                      autocomplete="off"
                      aria-controls="ss-city-list"
                      aria-autocomplete="list"
                    />
                  </div>
                  <ul
                    id="ss-city-list"
                    class="m-0 list-none max-h-60 overflow-y-auto py-1"
                    role="listbox"
                    aria-label="${t("auth.supplierSetup.city")}"
                  ></ul>
                  <p id="ss-city-no-results" class="hidden p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    ${t("auth.supplierSetup.noCityFound")}
                  </p>
                </div>
              </div>`
                  : `<input type="text" id="ss-city" name="city" class="th-input th-input-lg" placeholder="${t("auth.supplierSetup.cityPh")}" required />`
              }
            </div>
            <!-- Country (read-only display, hidden form value) -->
            <div>
              <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.country")}</span>
              <div
                id="ss-country"
                class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 cursor-not-allowed font-medium select-none flex items-center gap-2"
                aria-disabled="true"
                aria-label="${t("auth.supplierSetup.country")}"
              >
                <span class="text-lg" aria-hidden="true">${countryFlag}</span>
                <span>${country.nameTR}</span>
              </div>
              <input type="hidden" id="ss-country-code" name="country" value="${country.nameEN}" data-iso="${country.code}" />
            </div>
          </div>
        </div>
      </div>
      </template>

      <div data-supplier-step-host="3"></div>
      <template id="supplier-step-template-3">
      <!-- Step 3: Bank Information -->
      <div class="supplier-step hidden" data-supplier-step="3">
        <div class="mb-6 text-center lg:text-start">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">${t("auth.supplierSetup.step3Title")}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">${t("auth.supplierSetup.step3Desc")}</p>
        </div>
        <div class="space-y-4">
          <!-- IBAN (üstte — kullanıcı girer) -->
          <div>
            <label for="ss-iban" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.iban")}</label>
            <input type="text" id="ss-iban" maxlength="32" class="th-input th-input-lg" placeholder="TR..." required />
            <p id="ss-iban-error" class="text-xs text-red-500 mt-1 hidden"></p>
          </div>
          <!-- Banka Adı (IBAN'dan otomatik dolar — read-only) -->
          <div>
            <label for="ss-bank-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.bankName")}</label>
            <input
              type="text"
              id="ss-bank-name"
              readonly
              aria-disabled="true"
              tabindex="-1"
              class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 cursor-not-allowed font-medium select-none focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal"
              placeholder="${t("auth.supplierSetup.bankNamePh")}"
              required
            />
          </div>
          <!-- Hesap Sahibi (Step 1 İşletme Ünvanı'ndan otomatik dolar, kullanıcı düzenleyebilir) -->
          <div>
            <label for="ss-account-holder" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.accountHolder")}</label>
            <input type="text" id="ss-account-holder" class="th-input th-input-lg" placeholder="${t("auth.supplierSetup.accountHolderPh")}" required />
          </div>
        </div>
      </div>
      </template>

      <!-- Step 4 stays inert until the user reaches the agreement stage. -->
      <div data-supplier-step-host="4"></div>
      <template id="supplier-step-template-4">
      <div class="supplier-step" data-supplier-step="4">
        <div class="mb-6 text-center lg:text-start">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">${t("auth.supplierSetup.step4Title")}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">${t("auth.supplierSetup.step4Desc")}</p>
        </div>
        <div class="space-y-4">
          <!-- TEMP-DISABLED: Belge Türü (geri açmak için aşağıdaki bloğun yorumunu kaldır) -->
          <!--
          <div>
            <label for="ss-id-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.idType")}</label>
            <select id="ss-id-type" class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" required>
              <option value="">${t("auth.supplierSetup.selectOption")}</option>
              <option value="National ID Card">${t("auth.supplierSetup.nationalId")}</option>
            </select>
          </div>
          -->
          <!-- Identity Document Number (TCKN) -->
          <div>
            <label for="ss-id-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.idNumber")}</label>
            <input type="text" id="ss-id-number" maxlength="11" inputmode="numeric" class="th-input th-input-lg" placeholder="${t("auth.supplierSetup.idNumberPh")}" required />
            <p id="ss-tckn-error" class="text-xs text-red-500 mt-1 hidden"></p>
          </div>
          <!-- Hidden expiry field -->
          <input type="hidden" id="ss-id-expiry" value="" />
          <!-- TEMP-DISABLED: Kimlik Belgesi yükleme (geri açmak için aşağıdaki bloğun yorumunu kaldır) -->
          <!--
          <div>
            <label for="ss-id-file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">${t("auth.supplierSetup.idDocument")}</label>
            <div id="ss-file-drop" class="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
              <input type="file" id="ss-id-file" accept=".pdf,.jpg,.jpeg,.png" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <svg class="mx-auto w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
              <p id="ss-file-name" class="text-sm text-gray-500 dark:text-gray-400">${t("auth.supplierSetup.uploadHint")}</p>
            </div>
          </div>
          -->

          <!-- Agreements -->
          <div class="space-y-3 pt-2">
            <label class="flex items-start gap-3">
              <input type="checkbox" id="ss-terms" class="mt-1 w-4 h-4 flex-shrink-0" style="accent-color: var(--checkbox-checked-bg);" required />
              <span class="text-sm text-gray-600 dark:text-gray-400">${t("auth.supplierSetup.termsAccept")}</span>
            </label>
            <label class="flex items-start gap-3">
              <input type="checkbox" id="ss-privacy" class="mt-1 w-4 h-4 flex-shrink-0" style="accent-color: var(--checkbox-checked-bg);" required />
              <span class="text-sm text-gray-600 dark:text-gray-400">${t("auth.supplierSetup.privacyAccept")}</span>
            </label>
            <label class="flex items-start gap-3">
              <input type="checkbox" id="ss-kvkk" class="mt-1 w-4 h-4 flex-shrink-0" style="accent-color: var(--checkbox-checked-bg);" required />
              <span class="text-sm text-gray-600 dark:text-gray-400">${t("auth.supplierSetup.kvkkAccept")}</span>
            </label>
            <label class="flex items-start gap-3">
              <input type="checkbox" id="ss-commission" class="mt-1 w-4 h-4 flex-shrink-0" style="accent-color: var(--checkbox-checked-bg);" required />
              <span class="text-sm text-gray-600 dark:text-gray-400">${t("auth.supplierSetup.commissionAccept")}</span>
            </label>
            <label class="flex items-start gap-3">
              <input type="checkbox" id="ss-return" class="mt-1 w-4 h-4 flex-shrink-0" style="accent-color: var(--checkbox-checked-bg);" required />
              <span class="text-sm text-gray-600 dark:text-gray-400">${t("auth.supplierSetup.returnAccept")}</span>
            </label>
          </div>
        </div>
      </div>
      </template>

      <!-- Navigation Buttons -->
      <div class="flex items-center gap-3 mt-8">
        <button type="button" id="ss-back-btn" class="hidden flex-1 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          ${t("auth.supplierSetup.back")}
        </button>
        <button type="button" id="ss-next-btn" class="flex-1 th-btn py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          ${t("auth.supplierSetup.next")}
        </button>
      </div>

      <!-- Error message -->
      <p id="ss-error" class="text-sm text-red-600 mt-3 hidden"></p>
    </div>
  `;
}

/* ── Prefill Logic ─────────────────────────────────────
 *
 * Sprint 2.6: Mevcut Draft Seller Application varsa form değerleri prefill
 * edilir. become_seller endpoint response.data'sından çağrılır.
 */

export interface SupplierSetupPrefill {
  seller_type?: string;
  business_name?: string;
  contact_phone?: string;
  tax_id_type?: string;
  tax_id?: string;
  tax_office?: string;
  address_line_1?: string;
  city?: string;
  country?: string;
  bank_name?: string;
  iban?: string;
  account_holder_name?: string;
  identity_document_type?: string;
  identity_document_number?: string;
  identity_document_expiry?: string;
  identity_document?: string;
}

const PREFILL_FIELD_MAP: Array<[keyof SupplierSetupPrefill, string]> = [
  ["seller_type", "ss-seller-type"],
  ["business_name", "ss-business-name"],
  ["contact_phone", "ss-contact-phone"],
  ["tax_id_type", "ss-tax-id-type"],
  ["tax_id", "ss-tax-id"],
  ["tax_office", "ss-tax-office"],
  ["address_line_1", "ss-address"],
  ["city", "ss-city"],
  ["bank_name", "ss-bank-name"],
  ["iban", "ss-iban"],
  ["account_holder_name", "ss-account-holder"],
  ["identity_document_type", "ss-id-type"],
  ["identity_document_number", "ss-id-number"],
  ["identity_document_expiry", "ss-id-expiry"],
];

const pendingSupplierPrefill = new WeakMap<HTMLElement, SupplierSetupPrefill>();

/**
 * Form'a Draft Application değerlerini doldur. Form render edildikten SONRA
 * çağrılmalı (initSupplierSetupForm sonrası).
 * Dönüş: kullanıcının kaldığı tahmini step (dolu alanlara göre).
 */
export function applySupplierSetupPrefill(data: SupplierSetupPrefill): number {
  const form = document.getElementById("supplier-setup-form");
  if (form) pendingSupplierPrefill.set(form, data);
  for (const [key, inputId] of PREFILL_FIELD_MAP) {
    const value = data[key];
    if (!value) continue;
    const el = document.getElementById(inputId) as HTMLInputElement | HTMLSelectElement | null;
    if (el) el.value = String(value);
  }
  // City display update (custom dropdown için)
  if (data.city) {
    const cityDisplay = document.getElementById("ss-city-display");
    if (cityDisplay) {
      cityDisplay.textContent = data.city;
      cityDisplay.classList.remove("text-gray-400", "dark:text-gray-500");
      cityDisplay.classList.add("text-gray-900", "dark:text-white");
    }
  }
  // Identity document dosya yüklenmiş ise file-uploaded UI'ı güncelle
  // (DOM state'i SupplierSetupForm'un kendi pattern'i ile, supplier-setup.ts
  // ek logic ekleyebilir)
  // Tahmini step: en son dolu alanın step'inden bir sonraki (kullanıcı
  // kaldığı yerden devam etsin).
  if (data.identity_document) return 4;
  if (data.iban || data.bank_name) return 3;
  if (data.tax_id || data.address_line_1) return 2;
  if (data.business_name) return 2;
  return 1;
}

/* ── Init Logic ──────────────────────────────────────── */

export function initSupplierSetupForm(options: SupplierSetupFormOptions = {}): void {
  const container = document.getElementById("supplier-setup-form");
  if (!container) return;
  const form = container;
  let currentStep = Math.min(Math.max(options.initialStep ?? 1, 1), 4);
  let lastAutoFilledBank = "";
  let lastAutoFilledHolder = "";
  let cityListeners: AbortController | null = null;
  const prefill = pendingSupplierPrefill.get(form) ?? {};
  const fields: SupplierSetupFieldState = {
    seller_type: "Business", business_name: "", contact_phone: "", tax_id_type: "TCKN",
    tax_id: "", tax_office: "", address_line_1: "", city: "",
    country: form.dataset.supplierCountry ?? "Turkey", bank_name: "", iban: "", account_holder_name: "",
    identity_document_type: "", identity_document_number: "", identity_document_expiry: "", identity_document: "",
    terms_accepted: false, privacy_accepted: false, kvkk_accepted: false,
    commission_accepted: false, return_policy_accepted: false,
    ...prefill,
  };

  const dots = form.querySelectorAll<HTMLElement>(".supplier-step-dot");
  const backBtn = form.querySelector<HTMLButtonElement>("#ss-back-btn")!;
  const nextBtn = form.querySelector<HTMLButtonElement>("#ss-next-btn")!;
  const errorEl = form.querySelector<HTMLElement>("#ss-error");
  const sellerType = form.querySelector<HTMLInputElement>("#ss-seller-type")!;
  const businessName = form.querySelector<HTMLInputElement>("#ss-business-name")!;
  const contactPhone = form.querySelector<HTMLInputElement>("#ss-contact-phone")!;
  const phoneError = form.querySelector<HTMLElement>("#ss-phone-error");
  let taxId: HTMLInputElement | null = null;
  let taxIdError: HTMLElement | null = null;
  let iban: HTMLInputElement | null = null;
  let bankName: HTMLInputElement | null = null;
  let accountHolder: HTMLInputElement | null = null;
  let ibanError: HTMLElement | null = null;
  let idNumber: HTMLInputElement | null = null;
  let tcknError: HTMLElement | null = null;
  let termsCheck: HTMLInputElement | null = null;
  let privacyCheck: HTMLInputElement | null = null;
  let kvkkCheck: HTMLInputElement | null = null;
  let commissionCheck: HTMLInputElement | null = null;
  let returnCheck: HTMLInputElement | null = null;

  // ── Helpers ──

  function hydrateInput(id: string, value: string | boolean): void {
    const el = form.querySelector<HTMLInputElement>(`#${id}`);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(value);
    else el.value = String(value);
  }

  function syncMountedStep(step: number): void {
    if (step === 1) {
      fields.seller_type = sellerType.value;
      fields.business_name = businessName.value.trim();
      fields.contact_phone = contactPhone.value.trim();
    } else if (step === 2) {
      fields.tax_id_type = form.querySelector<HTMLInputElement>("#ss-tax-id-type")?.value ?? fields.tax_id_type;
      fields.tax_id = taxId?.value.trim() ?? fields.tax_id;
      fields.tax_office = form.querySelector<HTMLInputElement>("#ss-tax-office")?.value.trim() ?? fields.tax_office;
      fields.address_line_1 = form.querySelector<HTMLInputElement>("#ss-address")?.value.trim() ?? fields.address_line_1;
      fields.city = form.querySelector<HTMLInputElement>("#ss-city")?.value.trim() ?? fields.city;
    } else if (step === 3) {
      fields.iban = iban?.value.trim() ?? fields.iban;
      fields.bank_name = bankName?.value.trim() ?? fields.bank_name;
      fields.account_holder_name = accountHolder?.value.trim() ?? fields.account_holder_name;
    } else if (step === 4) {
      fields.identity_document_number = idNumber?.value.trim() ?? fields.identity_document_number;
      fields.terms_accepted = !!termsCheck?.checked;
      fields.privacy_accepted = !!privacyCheck?.checked;
      fields.kvkk_accepted = !!kvkkCheck?.checked;
      fields.commission_accepted = !!commissionCheck?.checked;
      fields.return_policy_accepted = !!returnCheck?.checked;
    }
  }

  function bindCurrentStepInputs(step: number): void {
    const root = form.querySelector<HTMLElement>(`[data-supplier-step="${step}"]`);
    if (!root) return;
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select").forEach((el) => {
      el.addEventListener("input", () => { syncMountedStep(step); validateCurrentStep(); });
      el.addEventListener("change", () => { syncMountedStep(step); validateCurrentStep(); });
    });
  }

  function mountStep(step: 2 | 3): void {
    if (form.querySelector(`[data-supplier-step="${step}"]`)) return;
    const host = form.querySelector<HTMLElement>(`[data-supplier-step-host="${step}"]`);
    const template = form.querySelector<HTMLTemplateElement>(`#supplier-step-template-${step}`);
    if (!host || !template) return;
    host.append(template.content.cloneNode(true));
    if (step === 2) {
      taxId = form.querySelector<HTMLInputElement>("#ss-tax-id");
      taxIdError = form.querySelector<HTMLElement>("#ss-taxid-error");
      hydrateInput("ss-tax-id-type", fields.tax_id_type);
      hydrateInput("ss-tax-id", fields.tax_id);
      hydrateInput("ss-tax-office", fields.tax_office);
      hydrateInput("ss-address", fields.address_line_1);
      hydrateInput("ss-city", fields.city);
      if (form.dataset.supplierCountryIso === "TR") {
        taxId?.addEventListener("input", () => {
          const cleaned = taxId!.value.replace(/\D/g, "").slice(0, 11);
          if (cleaned !== taxId!.value) taxId!.value = cleaned;
          syncMountedStep(2);
          validateCurrentStep();
        });
      }
      const display = form.querySelector<HTMLElement>("#ss-city-display");
      if (display && fields.city) display.textContent = fields.city;
      bindCurrentStepInputs(2);
      if (form.dataset.supplierCountryIso && getSubdivisionsForCountry(form.dataset.supplierCountryIso)) initCityDropdown(getSubdivisionsForCountry(form.dataset.supplierCountryIso)!);
    } else {
      iban = form.querySelector<HTMLInputElement>("#ss-iban");
      bankName = form.querySelector<HTMLInputElement>("#ss-bank-name");
      accountHolder = form.querySelector<HTMLInputElement>("#ss-account-holder");
      ibanError = form.querySelector<HTMLElement>("#ss-iban-error");
      hydrateInput("ss-iban", fields.iban);
      hydrateInput("ss-bank-name", fields.bank_name);
      hydrateInput("ss-account-holder", fields.account_holder_name);
      iban?.addEventListener("paste", (event) => {
        event.preventDefault();
        iban!.value = (event.clipboardData?.getData("text") || "").replace(/\s/g, "").toUpperCase();
        syncMountedStep(3); validateCurrentStep();
      });
      bindCurrentStepInputs(3);
    }
  }

  function mountStep4() {
    if (idNumber) return;
    const host = form.querySelector<HTMLElement>('[data-supplier-step-host="4"]');
    const template = form.querySelector<HTMLTemplateElement>("#supplier-step-template-4");
    if (!host || !template) return;
    host.append(template.content.cloneNode(true));
    idNumber = form.querySelector<HTMLInputElement>("#ss-id-number");
    tcknError = form.querySelector<HTMLElement>("#ss-tckn-error");
    termsCheck = form.querySelector<HTMLInputElement>("#ss-terms");
    privacyCheck = form.querySelector<HTMLInputElement>("#ss-privacy");
    kvkkCheck = form.querySelector<HTMLInputElement>("#ss-kvkk");
    commissionCheck = form.querySelector<HTMLInputElement>("#ss-commission");
    returnCheck = form.querySelector<HTMLInputElement>("#ss-return");
    hydrateInput("ss-id-number", fields.identity_document_number);
    hydrateInput("ss-terms", fields.terms_accepted); hydrateInput("ss-privacy", fields.privacy_accepted);
    hydrateInput("ss-kvkk", fields.kvkk_accepted); hydrateInput("ss-commission", fields.commission_accepted);
    hydrateInput("ss-return", fields.return_policy_accepted);
    bindCurrentStepInputs(4);
  }

  function showStep(step: number) {
    syncMountedStep(currentStep);
    if (step === 2 || step === 3) mountStep(step);
    if (step === 4) mountStep4();
    const steps = form.querySelectorAll<HTMLElement>(".supplier-step");
    steps.forEach((el) => el.classList.toggle("hidden", Number(el.dataset.supplierStep) !== step));
    dots.forEach((dot, i) => {
      const s = i + 1;
      dot.classList.toggle("bg-orange-500", s <= step);
      dot.classList.toggle("text-white", s <= step);
      dot.classList.toggle("bg-gray-200", s > step);
      dot.classList.toggle("dark:bg-gray-700", s > step);
      dot.classList.toggle("text-gray-500", s > step);
      dot.classList.toggle("dark:text-gray-400", s > step);
    });
    backBtn.classList.toggle("hidden", step === 1);
    nextBtn.textContent =
      step === 4 ? t("auth.supplierSetup.submit") : t("auth.supplierSetup.next");
    if (errorEl) errorEl.classList.add("hidden");
    // Step 3'e girişte: Hesap Sahibi'ni Step 1'deki İşletme Ünvanı'ndan
    // otomatik doldur. Kullanıcı manuel düzenlediyse (lastAutoFilledHolder
    // ile uyuşmuyorsa) override etme.
    if (step === 3 && accountHolder) {
      const current = fields.account_holder_name.trim();
      const bn = fields.business_name.trim();
      if (bn && (!current || current === lastAutoFilledHolder)) {
        accountHolder.value = bn;
        fields.account_holder_name = bn;
        lastAutoFilledHolder = bn;
      }
    }
    validateCurrentStep();
  }

  function showFieldError(el: HTMLElement | null, msg: string) {
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("hidden", !msg);
  }

  function getCurrentFieldState(): SupplierSetupFieldState { return { ...fields }; }

  function validateCurrentStep(): boolean {
    switch (currentStep) {
      case 1: {
        const phoneVal = contactPhone.value.replace(/[\s\-()]/g, "");
        const phoneOk = !phoneVal || validatePhone(phoneVal);
        showFieldError(
          phoneError,
          phoneVal && !phoneOk ? t("auth.supplierSetup.invalidPhone") : ""
        );
        break;
      }
      case 2: {
        // TR: Vergi Numarası 10-11 hane integer (regex). Non-TR: serbest metin,
        // sadece non-empty kontrolü. Vergi Dairesi her ülkede serbest metin.
        const taxIdRaw = fields.tax_id.trim();
        let taxIdOk: boolean;
        if (form.dataset.supplierCountryIso === "TR") {
          const digits = taxIdRaw.replace(/\D/g, "");
          taxIdOk = /^\d{10,11}$/.test(digits);
          showFieldError(
            taxIdError,
            digits && !taxIdOk ? t("auth.supplierSetup.invalidTaxId") : ""
          );
        } else {
          taxIdOk = taxIdRaw.length > 0;
          showFieldError(taxIdError, "");
        }
        break;
      }
      case 3: {
        const ibanVal = fields.iban.replace(/\s/g, "");
        const ibanResult = ibanVal.length >= 26 ? validateIBAN(ibanVal) : { valid: false };
        showFieldError(
          ibanError,
          ibanVal.length >= 5 && !ibanResult.valid ? t("auth.supplierSetup.invalidIBAN") : ""
        );
        // Auto-fill bank name from IBAN; banka değişirse güncelle
        if (
          ibanResult.valid &&
          ibanResult.bankName &&
          bankName &&
          ibanResult.bankName !== lastAutoFilledBank
        ) {
          bankName.value = ibanResult.bankName;
          lastAutoFilledBank = ibanResult.bankName;
        }
        if (!ibanResult.valid || !ibanResult.bankName) {
          if (bankName?.value === lastAutoFilledBank) bankName.value = "";
          if (fields.bank_name === lastAutoFilledBank) fields.bank_name = "";
          lastAutoFilledBank = "";
        }
        if (ibanResult.valid && ibanResult.bankName) fields.bank_name = ibanResult.bankName;
        break;
      }
      case 4: {
        if (!idNumber || !termsCheck || !privacyCheck || !kvkkCheck || !commissionCheck || !returnCheck) break;
        const tcknVal = idNumber.value.replace(/\s/g, "");
        const tcknOk = !tcknVal || validateTCKN(tcknVal);
        showFieldError(tcknError, tcknVal && !tcknOk ? t("auth.supplierSetup.invalidTCKN") : "");
        // TEMP-DISABLED: idType.value && uploadedFileUrl koşulları geri
        // eklenecek. Geri açma: HTML bloklarını + bu koşulları + collectData'yı.
        break;
      }
    }
    const valid = validateSupplierSetupStep(currentStep, getCurrentFieldState());
    nextBtn.disabled = !valid;
    return valid;
  }

  function collectData(): SupplierSetupFormData {
    return collectSupplierSetupData(getCurrentFieldState());
  }

  function initCityDropdown(cityList: readonly string[]): void {
    cityListeners?.abort();
    cityListeners = new AbortController();
    const { signal } = cityListeners;
    const cityBtn = form.querySelector<HTMLButtonElement>("#ss-city-btn");
    const cityDisplay = form.querySelector<HTMLElement>("#ss-city-display");
    const cityIcon = form.querySelector<HTMLElement>("#ss-city-icon");
    const cityDropdown = form.querySelector<HTMLElement>("#ss-city-dropdown");
    const cityListEl = form.querySelector<HTMLElement>("#ss-city-list");
    const citySearch = form.querySelector<HTMLInputElement>("#ss-city-search");
    const cityNoResults = form.querySelector<HTMLElement>("#ss-city-no-results");
    if (!cityBtn || !cityDropdown || !cityListEl || !citySearch) return;

    let filtered: readonly string[] = cityList;
    let activeIndex = -1;

    function renderList(): void {
      if (filtered.length === 0) {
        cityListEl!.classList.add("hidden");
        cityNoResults?.classList.remove("hidden");
        return;
      }
      cityListEl!.classList.remove("hidden");
      cityNoResults?.classList.add("hidden");
      cityListEl!.innerHTML = filtered
        .map((name, i) => {
          const isSelected = name === fields.city;
          const isFocused = i === activeIndex;
          const stateCls = [
            isFocused ? "bg-orange-50 dark:bg-orange-900/30" : "",
            !isFocused && isSelected ? "bg-orange-50/60 dark:bg-orange-900/20" : "",
            !isFocused ? "hover:bg-gray-50 dark:hover:bg-gray-700" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `<li role="option" id="ss-city-opt-${i}" data-city="${name}" data-index="${i}" aria-selected="${isSelected ? "true" : "false"}" class="flex items-center gap-2 px-4 py-2.5 cursor-pointer text-gray-900 dark:text-white transition-colors ${stateCls}"><span class="flex-1">${name}</span>${isSelected ? `<svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : ""}</li>`;
        })
        .join("");
    }

    function applyFilter(query: string): void {
      const q = query.toLocaleLowerCase("tr").trim();
      filtered = q ? cityList.filter((c) => c.toLocaleLowerCase("tr").includes(q)) : cityList;
      activeIndex = filtered.length > 0 ? 0 : -1;
      renderList();
    }

    function scrollActiveIntoView(): void {
      if (activeIndex < 0) return;
      cityListEl!.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({
        block: "nearest",
      });
    }

    function scrollSelectedIntoView(): void {
      cityListEl!.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({
        block: "center",
      });
    }

    function open(): void {
      cityDropdown!.classList.remove("hidden");
      // Reflow so the enter transition runs from the closed (scale-95/opacity-0) state.
      void cityDropdown!.offsetHeight;
      cityDropdown!.dataset.state = "open";
      cityBtn!.setAttribute("aria-expanded", "true");
      cityIcon?.classList.add("rotate-180");
      citySearch!.value = "";
      applyFilter("");
      const idx = filtered.findIndex((c) => c === fields.city);
      activeIndex = idx >= 0 ? idx : 0;
      renderList();
      window.setTimeout(() => {
        if (signal.aborted) return;
        citySearch!.focus();
        scrollSelectedIntoView();
      }, 0);
    }

    function close(): void {
      cityDropdown!.dataset.state = "closed";
      cityDropdown!.classList.add("hidden");
      cityBtn!.setAttribute("aria-expanded", "false");
      cityIcon?.classList.remove("rotate-180");
    }

    function select(name: string): void {
      const cityInput = form.querySelector<HTMLInputElement>("#ss-city");
      if (cityInput) cityInput.value = name;
      fields.city = name;
      if (cityDisplay) {
        cityDisplay.textContent = name;
        cityDisplay.classList.remove("text-gray-400", "dark:text-gray-500");
        cityDisplay.classList.add("text-gray-900", "dark:text-white");
      }
      close();
      validateCurrentStep();
    }

    cityBtn.addEventListener("click", () => {
      if (cityDropdown.classList.contains("hidden")) open();
      else close();
    }, { signal });

    cityListEl.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>("[data-city]");
      if (item) select(item.getAttribute("data-city") || "");
    }, { signal });

    cityListEl.addEventListener("mousemove", (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
      if (item) {
        const idx = parseInt(item.getAttribute("data-index") || "-1", 10);
        if (idx >= 0 && idx !== activeIndex) {
          activeIndex = idx;
          renderList();
        }
      }
    }, { signal });

    citySearch.addEventListener("input", () => applyFilter(citySearch.value), { signal });

    citySearch.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (filtered.length > 0) {
            activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
            renderList();
            scrollActiveIntoView();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (filtered.length > 0) {
            activeIndex = Math.max(activeIndex - 1, 0);
            renderList();
            scrollActiveIntoView();
          }
          break;
        case "Home":
          if (filtered.length > 0) {
            e.preventDefault();
            activeIndex = 0;
            renderList();
            scrollActiveIntoView();
          }
          break;
        case "End":
          if (filtered.length > 0) {
            e.preventDefault();
            activeIndex = filtered.length - 1;
            renderList();
            scrollActiveIntoView();
          }
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && filtered[activeIndex]) {
            select(filtered[activeIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          close();
          cityBtn!.focus();
          break;
        case "Tab":
          close();
          break;
      }
    }, { signal });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!cityBtn!.contains(target) && !cityDropdown!.contains(target)) {
        close();
      }
    }, { signal });
  }

  // ── Event listeners ──
  bindCurrentStepInputs(1);

  // Back button
  backBtn.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  });

  // Next / Submit button
  nextBtn.addEventListener("click", () => {
    if (!validateCurrentStep()) return;

    if (currentStep < 4) {
      currentStep++;
      showStep(currentStep);
    } else {
      // Submit
      if (options.onSubmit) {
        nextBtn.disabled = true;
        nextBtn.textContent = t("common.loading");
        options.onSubmit(collectData());
      }
    }
  });

  // Initial state — Sprint 2.6: prefill ile gelen step (default 1)
  showStep(currentStep);
}
