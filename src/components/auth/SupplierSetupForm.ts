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
import { callMethod } from "../../utils/api";
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
    <div id="supplier-setup-form" class="w-full">
      <!-- Step indicator -->
      <div id="supplier-step-indicator" class="flex items-center justify-center gap-2 mb-6">
        ${[1, 2, 3, 4]
          .map(
            (n) => `
          <div class="supplier-step-dot flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${n === 1 ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}" data-step-dot="${n}">${n}</div>
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
                  class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-start text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all flex items-center justify-between"
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
                  class="absolute z-40 hidden w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg flex flex-col"
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

      <!-- Step 4: Identity & Agreements -->
      <div class="supplier-step hidden" data-supplier-step="4">
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

      <!-- Navigation Buttons -->
      <div class="flex items-center gap-3 mt-8">
        <button type="button" id="ss-back-btn" class="hidden flex-1 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          ${t("auth.supplierSetup.back")}
        </button>
        <button type="button" id="ss-next-btn" class="flex-1 th-btn py-3 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
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

/**
 * Form'a Draft Application değerlerini doldur. Form render edildikten SONRA
 * çağrılmalı (initSupplierSetupForm sonrası).
 * Dönüş: kullanıcının kaldığı tahmini step (dolu alanlara göre).
 */
export function applySupplierSetupPrefill(data: SupplierSetupPrefill): number {
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

  let currentStep = Math.min(Math.max(options.initialStep ?? 1, 1), 4);
  let uploadedFileUrl = "";
  let lastAutoFilledBank = "";
  let lastAutoFilledHolder = "";

  // DOM refs
  const steps = container.querySelectorAll<HTMLElement>(".supplier-step");
  const dots = container.querySelectorAll<HTMLElement>(".supplier-step-dot");
  const backBtn = document.getElementById("ss-back-btn") as HTMLButtonElement;
  const nextBtn = document.getElementById("ss-next-btn") as HTMLButtonElement;
  const errorEl = document.getElementById("ss-error");

  // Step 1 fields
  const sellerType = document.getElementById("ss-seller-type") as HTMLSelectElement;
  const businessName = document.getElementById("ss-business-name") as HTMLInputElement;
  const contactPhone = document.getElementById("ss-contact-phone") as HTMLInputElement;

  // Step 2 fields
  const taxIdType = document.getElementById("ss-tax-id-type") as HTMLInputElement;
  const taxId = document.getElementById("ss-tax-id") as HTMLInputElement;
  const taxOffice = document.getElementById("ss-tax-office") as HTMLInputElement;
  const address = document.getElementById("ss-address") as HTMLInputElement;
  const city = document.getElementById("ss-city") as HTMLInputElement;
  const countryCode = document.getElementById("ss-country-code") as HTMLInputElement;
  const isTR = countryCode.dataset.iso === "TR";

  // Validation error elements
  const phoneError = document.getElementById("ss-phone-error");
  const taxIdError = document.getElementById("ss-taxid-error");
  const ibanError = document.getElementById("ss-iban-error");
  const tcknError = document.getElementById("ss-tckn-error");

  // Step 3 fields
  const bankName = document.getElementById("ss-bank-name") as HTMLInputElement;
  const iban = document.getElementById("ss-iban") as HTMLInputElement;
  const accountHolder = document.getElementById("ss-account-holder") as HTMLInputElement;

  // Step 4 fields — TEMP-DISABLED: idType ve fileInput HTML yorumda olduğu
  // için null gelir. Geri açıldığında non-nullable cast'e dönülür.
  const idType = document.getElementById("ss-id-type") as HTMLSelectElement | null;
  const idNumber = document.getElementById("ss-id-number") as HTMLInputElement;
  const idExpiry = document.getElementById("ss-id-expiry") as HTMLInputElement;
  const fileInput = document.getElementById("ss-id-file") as HTMLInputElement | null;
  const fileNameEl = document.getElementById("ss-file-name");
  const termsCheck = document.getElementById("ss-terms") as HTMLInputElement;
  const privacyCheck = document.getElementById("ss-privacy") as HTMLInputElement;
  const kvkkCheck = document.getElementById("ss-kvkk") as HTMLInputElement;
  const commissionCheck = document.getElementById("ss-commission") as HTMLInputElement;
  const returnCheck = document.getElementById("ss-return") as HTMLInputElement;

  // ── Helpers ──

  function showStep(step: number) {
    steps.forEach((el, i) => {
      el.classList.toggle("hidden", i + 1 !== step);
    });
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
    if (step === 3 && accountHolder && businessName) {
      const current = accountHolder.value.trim();
      const bn = businessName.value.trim();
      if (bn && (!current || current === lastAutoFilledHolder)) {
        accountHolder.value = bn;
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

  function validateCurrentStep(): boolean {
    let valid = false;
    switch (currentStep) {
      case 1: {
        const phoneVal = contactPhone.value.replace(/[\s\-()]/g, "");
        const phoneOk = !phoneVal || validatePhone(phoneVal);
        showFieldError(
          phoneError,
          phoneVal && !phoneOk ? t("auth.supplierSetup.invalidPhone") : ""
        );
        valid = !!sellerType.value && !!businessName.value.trim() && !!phoneVal && phoneOk;
        break;
      }
      case 2: {
        // TR: Vergi Numarası 10-11 hane integer (regex). Non-TR: serbest metin,
        // sadece non-empty kontrolü. Vergi Dairesi her ülkede serbest metin.
        const taxIdRaw = taxId.value.trim();
        let taxIdOk: boolean;
        if (isTR) {
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
        valid =
          !!taxIdType.value &&
          taxIdOk &&
          !!taxOffice.value.trim() &&
          !!address.value.trim() &&
          !!city.value.trim() &&
          !!countryCode.value.trim();
        break;
      }
      case 3: {
        const ibanVal = iban.value.replace(/\s/g, "");
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
          if (bankName.value === lastAutoFilledBank) bankName.value = "";
          lastAutoFilledBank = "";
        }
        valid =
          !!bankName.value.trim() && !!ibanVal && ibanResult.valid && !!accountHolder.value.trim();
        break;
      }
      case 4: {
        const tcknVal = idNumber.value.replace(/\s/g, "");
        const tcknOk = !tcknVal || validateTCKN(tcknVal);
        showFieldError(tcknError, tcknVal && !tcknOk ? t("auth.supplierSetup.invalidTCKN") : "");
        // TEMP-DISABLED: idType.value && uploadedFileUrl koşulları geri
        // eklenecek. Geri açma: HTML bloklarını + bu koşulları + collectData'yı.
        valid =
          !!tcknVal &&
          tcknOk &&
          termsCheck.checked &&
          privacyCheck.checked &&
          kvkkCheck.checked &&
          commissionCheck.checked &&
          returnCheck.checked;
        break;
      }
    }
    nextBtn.disabled = !valid;
    return valid;
  }

  function collectData(): SupplierSetupFormData {
    return {
      seller_type: sellerType.value,
      business_name: businessName.value.trim(),
      contact_phone: contactPhone.value.trim(),
      tax_id_type: taxIdType.value,
      tax_id: taxId.value.trim(),
      tax_office: taxOffice.value.trim(),
      address_line_1: address.value.trim(),
      city: city.value.trim(),
      country: countryCode.value.trim(),
      bank_name: bankName.value.trim(),
      iban: iban.value.trim(),
      account_holder_name: accountHolder.value.trim(),
      // TEMP-DISABLED: identity_document_type ve identity_document boş gönderiliyor
      // (HTML yorum satırında). Geri açıldığında idType.value / uploadedFileUrl olur.
      identity_document_type: idType?.value || "",
      identity_document_number: idNumber.value.trim(),
      identity_document_expiry: idExpiry.value,
      identity_document: uploadedFileUrl,
      terms_accepted: termsCheck.checked,
      privacy_accepted: privacyCheck.checked,
      kvkk_accepted: kvkkCheck.checked,
      commission_accepted: commissionCheck.checked,
      return_policy_accepted: returnCheck.checked,
    };
  }

  // ── File upload (base64 JSON — same auth pattern as all other API calls) ──

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      if (fileNameEl) fileNameEl.textContent = `${t("common.loading")}...`;

      try {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        // Retry once if first attempt fails (session cookie may not be set yet)
        let result: { file_url: string } | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            result = await callMethod<{ file_url: string }>(
              "tradehub_core.api.v1.identity.upload_private_file",
              { filename: file.name, filedata: base64 },
              true
            );
            break;
          } catch {
            if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (result?.file_url) {
          uploadedFileUrl = result.file_url;
          if (fileNameEl) fileNameEl.textContent = file.name;
        } else {
          throw new Error("Upload failed");
        }
      } catch {
        uploadedFileUrl = "";
        if (fileNameEl)
          fileNameEl.textContent =
            t("auth.supplierSetup.uploadFailed") || "Yukleme basarisiz. Tekrar deneyin.";
      }

      validateCurrentStep();
    });
  }

  // ── Tax ID input filter: TR'de sadece rakam + max 11 hane; non-TR'de filtre yok ──
  if (isTR) {
    taxId.addEventListener("input", () => {
      const cleaned = taxId.value.replace(/\D/g, "").slice(0, 11);
      if (cleaned !== taxId.value) {
        taxId.value = cleaned;
      }
    });
  }

  // ── City: dropdown sadece subdivision listesi olan ülkelerde (TR/US/...) ──
  const cityOptionsList = getSubdivisionsForCountry(countryCode.dataset.iso || "");
  if (cityOptionsList && cityOptionsList.length > 0) {
    initCityDropdown(cityOptionsList);
  }

  function initCityDropdown(cityList: readonly string[]): void {
    const cityBtn = document.getElementById("ss-city-btn") as HTMLButtonElement | null;
    const cityDisplay = document.getElementById("ss-city-display");
    const cityIcon = document.getElementById("ss-city-icon");
    const cityDropdown = document.getElementById("ss-city-dropdown");
    const cityListEl = document.getElementById("ss-city-list");
    const citySearch = document.getElementById("ss-city-search") as HTMLInputElement | null;
    const cityNoResults = document.getElementById("ss-city-no-results");
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
          const isSelected = name === city.value;
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
      cityBtn!.setAttribute("aria-expanded", "true");
      cityIcon?.classList.add("rotate-180");
      citySearch!.value = "";
      applyFilter("");
      const idx = filtered.findIndex((c) => c === city.value);
      activeIndex = idx >= 0 ? idx : 0;
      renderList();
      window.setTimeout(() => {
        citySearch!.focus();
        scrollSelectedIntoView();
      }, 0);
    }

    function close(): void {
      cityDropdown!.classList.add("hidden");
      cityBtn!.setAttribute("aria-expanded", "false");
      cityIcon?.classList.remove("rotate-180");
    }

    function select(name: string): void {
      city.value = name;
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
    });

    cityListEl.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>("[data-city]");
      if (item) select(item.getAttribute("data-city") || "");
    });

    cityListEl.addEventListener("mousemove", (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
      if (item) {
        const idx = parseInt(item.getAttribute("data-index") || "-1", 10);
        if (idx >= 0 && idx !== activeIndex) {
          activeIndex = idx;
          renderList();
        }
      }
    });

    citySearch.addEventListener("input", () => applyFilter(citySearch.value));

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
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!cityBtn!.contains(target) && !cityDropdown!.contains(target)) {
        close();
      }
    });
  }

  // ── Event listeners ──

  // Handle IBAN paste: strip spaces and non-alphanumeric chars, then validate
  iban.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData("text") || "";
    const cleaned = pasted.replace(/\s/g, "").toUpperCase();
    iban.value = cleaned;
    validateCurrentStep();
  });

  // Validation on input for all steps
  const allInputs = container.querySelectorAll("input, select");
  allInputs.forEach((el) => {
    el.addEventListener("input", () => validateCurrentStep());
    el.addEventListener("change", () => validateCurrentStep());
  });

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
