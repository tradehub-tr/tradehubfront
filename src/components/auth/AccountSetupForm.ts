/**
 * AccountSetupForm Component
 * Registration form with country/region dropdown, first/last name inputs,
 * and password field with requirements display.
 * Used after email verification in the registration flow.
 */

import { t } from "../../i18n";
import {
  validatePassword,
  isPasswordValid,
  type PasswordValidation,
} from "../../utils/password-validation";
import {
  ALL_COUNTRIES,
  getFlagEmoji,
  getCountryByCode as getCountryRecord,
  type Country,
} from "../../data/countries";
import { validatePhoneForCountry, getPhonePlaceholderForCountry } from "../../utils/tr-validation";
import { openLegalConsentModal, type LegalConsentKind } from "./LegalConsentModal";

// Re-export for backward compatibility
export { validatePassword, isPasswordValid };
export type PasswordRequirements = PasswordValidation;

/* ── Types ──────────────────────────────────────────── */

export interface CountryOption {
  /** ISO country code */
  code: string;
  /** Country display name */
  name: string;
  /** Flag emoji */
  flag: string;
}

function toCountryOption(c: Country): CountryOption {
  return { code: c.code, name: c.nameTR, flag: getFlagEmoji(c.code) };
}

function findCountryOption(code: string): CountryOption | null {
  const c = getCountryRecord(code);
  return c ? toCountryOption(c) : null;
}

export interface AccountSetupFormOptions {
  /** Container element ID */
  containerId?: string;
  /** Pre-selected country code */
  defaultCountry?: string;
  /** Callback when form is submitted */
  onSubmit?: (data: AccountSetupFormData) => void;
  /** Callback when country changes */
  onCountryChange?: (country: CountryOption) => void;
}

export interface AccountSetupFormData {
  /** Selected country */
  country: CountryOption | null;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Phone number (optional) */
  phone: string;
  /** Password */
  password: string;
}

export interface AccountSetupFormState {
  /** Current form data */
  data: AccountSetupFormData;
  /** Password requirements validation state */
  passwordRequirements: PasswordRequirements;
  /** Whether form is valid */
  isValid: boolean;
}

/* ── Component HTML ─────────────────────────────────── */

/**
 * AccountSetupForm Component
 * Renders the account setup form with country, name, and password fields
 *
 * @param defaultCountry - Default selected country code (e.g., 'TR')
 * @returns HTML string for the account setup form
 */
export function AccountSetupForm(defaultCountry: string = "TR"): string {
  const selectedCountry = findCountryOption(defaultCountry) || toCountryOption(ALL_COUNTRIES[0]);

  return `
    <div id="account-setup-form" class="w-full">
      <!-- Header -->
      <div class="mb-6 text-center lg:text-left">
        <h1 class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ${t("auth.setupTitle")}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ${t("auth.setupSubtitle")}
        </p>
      </div>

      <form id="account-setup-form-element" class="space-y-5" novalidate>
        <!-- Country/Region Dropdown -->
        <div class="auth-form-field relative">
          <label for="country-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.countryRegion">
            ${t("auth.setup.countryRegion")}
          </label>
          <div class="relative">
            <button
              type="button"
              id="country-select-btn"
              class="th-btn-outline flex items-center justify-between w-full px-4 py-3 text-left dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400"
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-controls="country-dropdown"
            >
              <span id="country-selected-display" class="flex items-center gap-2">
                <span class="text-lg">${selectedCountry.flag}</span>
                <span>${selectedCountry.name}</span>
              </span>
              <svg class="w-5 h-5 text-gray-400 transition-transform" id="country-dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <input type="hidden" id="country-input" name="country" value="${selectedCountry.code}" />

            <!-- Dropdown Panel -->
            <div
              id="country-dropdown"
              class="absolute z-50 hidden w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg flex flex-col"
            >
              <!-- Search input (sticky) -->
              <div class="shrink-0 p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <input
                  type="text"
                  id="country-search"
                  class="th-input w-full px-3 py-2 text-sm"
                  placeholder="${t("auth.setup.searchCountry")}" data-i18n-placeholder="auth.setup.searchCountry"
                  autocomplete="off"
                  aria-controls="country-options-list"
                  aria-autocomplete="list"
                />
              </div>
              <!-- Options list -->
              <ul
                id="country-options-list"
                class="m-0 list-none max-h-60 overflow-y-auto py-1"
                role="listbox"
                aria-label="${t("auth.setup.selectCountry")}" data-i18n-aria-label="auth.setup.selectCountry"
              >
                ${renderCountryOptions(selectedCountry.code, -1)}
              </ul>
              <!-- No results message -->
              <p id="country-no-results" class="hidden p-3 text-sm text-gray-500 dark:text-gray-400 text-center" data-i18n="auth.setup.noCountryFound">
                ${t("auth.setup.noCountryFound")}
              </p>
            </div>
          </div>
        </div>

        <!-- Name Fields (stacked on small screens, side by side on sm+) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- First Name -->
          <div class="auth-form-field relative">
            <label for="first-name-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.firstName">
              ${t("auth.setup.firstName")}
            </label>
            <input
              type="text"
              id="first-name-input"
              name="firstName"
              placeholder="${t("auth.setup.firstNamePlaceholder")}" data-i18n-placeholder="auth.setup.firstNamePlaceholder"
              autocomplete="given-name"
              class="th-input th-input-lg"
              required
            />
          </div>

          <!-- Last Name -->
          <div class="auth-form-field relative">
            <label for="last-name-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.lastName">
              ${t("auth.setup.lastName")}
            </label>
            <input
              type="text"
              id="last-name-input"
              name="lastName"
              placeholder="${t("auth.setup.lastNamePlaceholder")}" data-i18n-placeholder="auth.setup.lastNamePlaceholder"
              autocomplete="family-name"
              class="th-input th-input-lg"
              required
            />
          </div>
        </div>

        <!-- Phone Field -->
        <div class="auth-form-field relative">
          <label for="phone-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            ${t("auth.setup.phone") || "Telefon"}
          </label>
          <input
            type="tel"
            id="phone-input"
            name="phone"
            placeholder="${getPhonePlaceholderForCountry(selectedCountry.code)}"
            autocomplete="tel"
            class="th-input th-input-lg"
          />
          <p id="phone-error" class="text-xs text-red-500 mt-1 hidden"></p>
        </div>

        <!-- Password Field -->
        <div class="auth-form-field relative">
          <label for="password-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.password">
            ${t("auth.setup.password")}
          </label>
          <div class="relative">
            <input
              type="password"
              id="password-input"
              name="password"
              placeholder="${t("auth.setup.passwordPlaceholder")}" data-i18n-placeholder="auth.setup.passwordPlaceholder"
              autocomplete="new-password"
              class="th-input th-input-lg pr-12"
              required
            />
            <button
              type="button"
              id="password-toggle-btn"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="${t("auth.forgot.showHidePassword")}" data-i18n-aria-label="auth.forgot.showHidePassword"
            >
              <!-- Eye icon (show) -->
              <svg id="password-eye-show" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <!-- Eye-off icon (hide) - hidden by default -->
              <svg id="password-eye-hide" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>

          <!-- Password Requirements -->
          <div id="password-requirements" class="auth-password-requirements flex flex-col gap-1.5 mt-3">
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors text-[var(--color-text-placeholder,#999)] [&.valid]:text-[#16a34a] [&.invalid]:text-[#dc2626] [&.valid_.auth-password-req-icon]:opacity-0 [&.valid_.auth-password-req-icon]:w-0 [&.valid_.auth-password-req-icon]:h-0 [&.valid_.auth-password-req-icon]:overflow-hidden [&.invalid_.auth-password-req-icon]:text-[#dc2626]" data-requirement="minLength">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.minChars">${t("auth.setup.minChars")}</span>
            </div>
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasUppercase">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.uppercase">${t("auth.setup.uppercase")}</span>
            </div>
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasLowercase">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.lowercase">${t("auth.setup.lowercase")}</span>
            </div>
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasNumber">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.number">${t("auth.setup.number")}</span>
            </div>
          </div>
        </div>

        <!-- Terms Agreement — Kullanım Koşulları -->
        <div class="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="terms-checkbox"
            name="terms"
            class="mt-1 w-4 h-4 flex-shrink-0"
            style="accent-color: var(--checkbox-checked-bg);"
            required
          />
          <label for="terms-checkbox" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer">
            ${t("auth.setup.agreeBefore")}<button type="button" data-legal-trigger="terms" class="appearance-none bg-transparent border-0 p-0 font-medium text-orange-600 dark:text-orange-400 hover:underline focus:outline-none focus-visible:underline cursor-pointer">${t("auth.setup.termsOfUse")}</button>${t("auth.setup.agreeAfter")}
          </label>
        </div>

        <!-- Terms Agreement — Gizlilik Politikası -->
        <div class="flex items-start gap-3">
          <input
            type="checkbox"
            id="privacy-checkbox"
            name="privacy"
            class="mt-1 w-4 h-4 flex-shrink-0"
            style="accent-color: var(--checkbox-checked-bg);"
            required
          />
          <label for="privacy-checkbox" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer">
            ${t("auth.setup.agreeBefore")}<button type="button" data-legal-trigger="privacy" class="appearance-none bg-transparent border-0 p-0 font-medium text-orange-600 dark:text-orange-400 hover:underline focus:outline-none focus-visible:underline cursor-pointer">${t("auth.setup.privacyPolicy")}</button>${t("auth.setup.agreeAfter")}
          </label>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          id="account-setup-submit-btn"
          class="th-btn w-full py-3 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          disabled
        >
          <span data-i18n="auth.setup.createAccount">${t("auth.setup.createAccount")}</span>
        </button>
      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <span data-i18n="auth.register.alreadyHave">${t("auth.register.alreadyHave")}</span>
        <a href="/pages/auth/login.html" class="ml-1 font-medium text-orange-600 dark:text-orange-400 hover:underline">
          <span data-i18n="auth.register.signIn">${t("auth.register.signIn")}</span>
        </a>
      </div>
    </div>
  `;
}

/**
 * Renders the country option list (li items inside the listbox).
 * `list` defaults to ALL_COUNTRIES; when search filters the set we pass the
 * filtered slice. `focusIndex` highlights the keyboard-active option.
 */
function renderCountryOptions(
  selectedCode: string,
  focusIndex: number,
  list: readonly Country[] = ALL_COUNTRIES
): string {
  return list
    .map((country, i) => {
      const isSelected = country.code === selectedCode;
      const isFocused = i === focusIndex;
      const flag = getFlagEmoji(country.code);
      const stateCls = [
        isFocused ? "bg-orange-50 dark:bg-orange-900/30" : "",
        !isFocused && isSelected ? "bg-orange-50/60 dark:bg-orange-900/20" : "",
        !isFocused ? "hover:bg-gray-50 dark:hover:bg-gray-700" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `
    <li
      role="option"
      id="country-opt-${country.code}"
      data-country-code="${country.code}"
      data-index="${i}"
      aria-selected="${isSelected ? "true" : "false"}"
      class="flex items-center gap-2 px-4 py-2.5 cursor-pointer text-gray-900 dark:text-white transition-colors ${stateCls}"
    >
      <span class="text-lg">${flag}</span>
      <span class="flex-1">${country.nameTR}</span>
      ${
        isSelected
          ? `<svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`
          : ""
      }
    </li>`;
    })
    .join("");
}

/* ── Helper Functions ────────────────────────────────── */

/**
 * Get a country by its code (returns CountryOption shape used by form data).
 */
export function getCountryByCode(code: string): CountryOption | undefined {
  return findCountryOption(code) || undefined;
}

/* ── Init Logic ──────────────────────────────────────── */

/**
 * Initialize AccountSetupForm interactivity
 * Sets up form validation, password requirements, and country dropdown
 */
export function initAccountSetupForm(options: AccountSetupFormOptions = {}): AccountSetupFormState {
  const { defaultCountry = "TR", onSubmit, onCountryChange } = options;

  // Initialize state
  const state: AccountSetupFormState = {
    data: {
      country: getCountryByCode(defaultCountry) || toCountryOption(ALL_COUNTRIES[0]),
      firstName: "",
      lastName: "",
      phone: "",
      password: "",
    },
    passwordRequirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
    },
    isValid: false,
  };

  const container = document.getElementById("account-setup-form");
  if (!container) return state;

  // Get form elements
  const form = document.getElementById("account-setup-form-element") as HTMLFormElement | null;
  const countryBtn = document.getElementById("country-select-btn");
  const countryDropdown = document.getElementById("country-dropdown");
  const countryInput = document.getElementById("country-input") as HTMLInputElement | null;
  const countryDisplay = document.getElementById("country-selected-display");
  const dropdownIcon = document.getElementById("country-dropdown-icon");
  const firstNameInput = document.getElementById("first-name-input") as HTMLInputElement | null;
  const lastNameInput = document.getElementById("last-name-input") as HTMLInputElement | null;
  const passwordInput = document.getElementById("password-input") as HTMLInputElement | null;
  const passwordToggleBtn = document.getElementById("password-toggle-btn");
  const passwordEyeShow = document.getElementById("password-eye-show");
  const passwordEyeHide = document.getElementById("password-eye-hide");
  const termsCheckbox = document.getElementById("terms-checkbox") as HTMLInputElement | null;
  const privacyCheckbox = document.getElementById("privacy-checkbox") as HTMLInputElement | null;
  const submitBtn = document.getElementById("account-setup-submit-btn") as HTMLButtonElement | null;
  const requirementsContainer = document.getElementById("password-requirements");

  // Country select2-style searchable dropdown
  const countrySearch = document.getElementById("country-search") as HTMLInputElement | null;
  const countryOptionsList = document.getElementById("country-options-list");
  const countryNoResults = document.getElementById("country-no-results");

  // Filter state — recreated each open
  let filteredCountries: readonly Country[] = ALL_COUNTRIES;
  let activeIndex: number = ALL_COUNTRIES.findIndex((c) => c.code === state.data.country!.code);
  if (activeIndex < 0) activeIndex = 0;

  function rerenderOptions(): void {
    if (!countryOptionsList || !countryNoResults) return;
    if (filteredCountries.length === 0) {
      countryOptionsList.classList.add("hidden");
      countryNoResults.classList.remove("hidden");
      return;
    }
    countryOptionsList.classList.remove("hidden");
    countryNoResults.classList.add("hidden");
    countryOptionsList.innerHTML = renderCountryOptions(
      state.data.country!.code,
      activeIndex,
      filteredCountries
    );
  }

  function applyFilter(query: string): void {
    const q = query.toLocaleLowerCase("tr").trim();
    if (!q) {
      filteredCountries = ALL_COUNTRIES;
    } else {
      filteredCountries = ALL_COUNTRIES.filter(
        (c) =>
          c.nameTR.toLocaleLowerCase("tr").includes(q) ||
          c.nameEN.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }
    activeIndex = filteredCountries.length > 0 ? 0 : -1;
    rerenderOptions();
  }

  function scrollActiveIntoView(): void {
    if (!countryOptionsList || activeIndex < 0) return;
    const el = countryOptionsList.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }

  function scrollSelectedIntoView(): void {
    if (!countryOptionsList) return;
    const el = countryOptionsList.querySelector<HTMLElement>('[aria-selected="true"]');
    el?.scrollIntoView({ block: "center" });
  }

  function openCountryDropdown(): void {
    if (!countryDropdown || !countryBtn || !dropdownIcon) return;
    countryDropdown.classList.remove("hidden");
    countryBtn.setAttribute("aria-expanded", "true");
    dropdownIcon.classList.add("rotate-180");
    if (countrySearch) {
      countrySearch.value = "";
      applyFilter("");
      // sync activeIndex to current selection inside the (unfiltered) list
      const idx = filteredCountries.findIndex((c) => c.code === state.data.country!.code);
      activeIndex = idx >= 0 ? idx : 0;
      rerenderOptions();
      window.setTimeout(() => {
        countrySearch.focus();
        scrollSelectedIntoView();
      }, 0);
    }
  }

  function closeCountryDropdown(): void {
    if (!countryDropdown || !countryBtn || !dropdownIcon) return;
    countryDropdown.classList.add("hidden");
    countryBtn.setAttribute("aria-expanded", "false");
    dropdownIcon.classList.remove("rotate-180");
  }

  function selectCountry(code: string): void {
    const c = getCountryRecord(code);
    if (!c) return;
    const opt = toCountryOption(c);
    state.data.country = opt;

    if (countryDisplay) {
      countryDisplay.innerHTML = `
        <span class="text-lg">${opt.flag}</span>
        <span>${opt.name}</span>
      `;
    }
    if (countryInput) {
      countryInput.value = opt.code;
    }

    // Telefon placeholder ve hata mesajını yeni ülkeye göre senkronla.
    if (phoneInput) {
      phoneInput.placeholder = getPhonePlaceholderForCountry(opt.code);
      // Mevcut girdi yeni ülke kuralına uymuyorsa hata mesajını yenile.
      if (state.data.phone && phoneError) {
        const isValid = validatePhoneForCountry(state.data.phone, opt.code);
        if (!isValid) {
          const isTR = opt.code.toUpperCase() === "TR";
          phoneError.textContent = isTR
            ? t("auth.supplierSetup.invalidPhone") ||
              "Geçerli bir telefon numarası girin (05XX XXX XX XX)"
            : t("auth.setup.invalidPhoneIntl") || "Geçerli bir telefon numarası girin";
          phoneError.classList.remove("hidden");
        } else {
          phoneError.classList.add("hidden");
        }
      }
    }

    closeCountryDropdown();

    if (onCountryChange) {
      onCountryChange(opt);
    }
    updateFormValidity();
  }

  if (countryBtn && countryDropdown) {
    // Toggle dropdown on trigger button
    countryBtn.addEventListener("click", () => {
      if (countryDropdown.classList.contains("hidden")) {
        openCountryDropdown();
      } else {
        closeCountryDropdown();
      }
    });

    // Click on an option selects it
    countryOptionsList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const item = target.closest("[data-country-code]") as HTMLElement | null;
      if (item) {
        selectCountry(item.getAttribute("data-country-code") || "");
      }
    });

    // Hover updates active index for visual continuity with keyboard nav
    countryOptionsList?.addEventListener("mousemove", (e) => {
      const target = e.target as HTMLElement;
      const item = target.closest<HTMLElement>("[data-index]");
      if (item) {
        const idx = parseInt(item.getAttribute("data-index") || "-1", 10);
        if (idx >= 0 && idx !== activeIndex) {
          activeIndex = idx;
          rerenderOptions();
        }
      }
    });

    // Search input filtering
    countrySearch?.addEventListener("input", () => {
      applyFilter(countrySearch.value);
    });

    // Keyboard navigation while search input has focus
    countrySearch?.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (filteredCountries.length > 0) {
            activeIndex = Math.min(activeIndex + 1, filteredCountries.length - 1);
            rerenderOptions();
            scrollActiveIntoView();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (filteredCountries.length > 0) {
            activeIndex = Math.max(activeIndex - 1, 0);
            rerenderOptions();
            scrollActiveIntoView();
          }
          break;
        case "Home":
          if (filteredCountries.length > 0) {
            e.preventDefault();
            activeIndex = 0;
            rerenderOptions();
            scrollActiveIntoView();
          }
          break;
        case "End":
          if (filteredCountries.length > 0) {
            e.preventDefault();
            activeIndex = filteredCountries.length - 1;
            rerenderOptions();
            scrollActiveIntoView();
          }
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && filteredCountries[activeIndex]) {
            selectCountry(filteredCountries[activeIndex].code);
          }
          break;
        case "Escape":
          e.preventDefault();
          closeCountryDropdown();
          countryBtn.focus();
          break;
        case "Tab":
          // Allow native focus shift, but close the panel behind us
          closeCountryDropdown();
          break;
      }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!countryBtn.contains(target) && !countryDropdown.contains(target)) {
        closeCountryDropdown();
      }
    });

    // Esc anywhere closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !countryDropdown.classList.contains("hidden")) {
        closeCountryDropdown();
        countryBtn.focus();
      }
    });
  }

  // Name input handlers
  if (firstNameInput) {
    firstNameInput.addEventListener("input", () => {
      state.data.firstName = firstNameInput.value.trim();
      updateFormValidity();
    });
  }

  if (lastNameInput) {
    lastNameInput.addEventListener("input", () => {
      state.data.lastName = lastNameInput.value.trim();
      updateFormValidity();
    });
  }

  // Phone input handler
  const phoneInput = document.getElementById("phone-input") as HTMLInputElement | null;
  const phoneError = document.getElementById("phone-error");

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      state.data.phone = phoneInput.value.trim();
      // Validate only if user has typed something
      if (state.data.phone) {
        const isValid = validatePhoneForCountry(state.data.phone, state.data.country?.code);
        if (phoneError) {
          if (!isValid) {
            const isTR = (state.data.country?.code || "TR").toUpperCase() === "TR";
            phoneError.textContent = isTR
              ? t("auth.supplierSetup.invalidPhone") ||
                "Geçerli bir telefon numarası girin (05XX XXX XX XX)"
              : t("auth.setup.invalidPhoneIntl") || "Geçerli bir telefon numarası girin";
            phoneError.classList.remove("hidden");
          } else {
            phoneError.classList.add("hidden");
          }
        }
      } else if (phoneError) {
        phoneError.classList.add("hidden");
      }
      updateFormValidity();
    });
  }

  // Password input handler
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      state.data.password = passwordInput.value;
      state.passwordRequirements = validatePassword(passwordInput.value);
      updatePasswordRequirementsUI();
      updateFormValidity();
    });
  }

  // Password toggle visibility
  if (passwordToggleBtn && passwordInput && passwordEyeShow && passwordEyeHide) {
    passwordToggleBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      passwordEyeShow.classList.toggle("hidden", !isPassword);
      passwordEyeHide.classList.toggle("hidden", isPassword);
    });
  }

  // Terms / Privacy checkbox handlers
  termsCheckbox?.addEventListener("change", updateFormValidity);
  privacyCheckbox?.addEventListener("change", updateFormValidity);

  // Turuncu metne tıklayınca popup aç; sonucu ilgili checkbox'a yansıt.
  container.addEventListener("click", async (e) => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>("[data-legal-trigger]");
    if (!trigger) return;
    e.preventDefault();
    const kind = trigger.dataset.legalTrigger as LegalConsentKind | undefined;
    if (kind !== "terms" && kind !== "privacy") return;
    const checkbox = kind === "terms" ? termsCheckbox : privacyCheckbox;
    const accepted = await openLegalConsentModal(kind);
    if (checkbox) {
      checkbox.checked = accepted;
      updateFormValidity();
    }
  });

  // Form submission
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (state.isValid && onSubmit) {
        onSubmit(state.data);
      }
    });
  }

  // Update password requirements UI
  function updatePasswordRequirementsUI(): void {
    if (!requirementsContainer) return;

    const requirements = state.passwordRequirements;

    Object.entries(requirements).forEach(([key, isValid]) => {
      const item = requirementsContainer.querySelector(`[data-requirement="${key}"]`);
      if (item) {
        item.classList.remove("valid", "invalid");
        if (state.data.password.length > 0) {
          item.classList.add(isValid ? "valid" : "invalid");
        }
      }
    });
  }

  // Update overall form validity
  function updateFormValidity(): void {
    const hasValidPassword = isPasswordValid(state.data.password);
    const hasFirstName = state.data.firstName.length > 0;
    const hasLastName = state.data.lastName.length > 0;
    const hasCountry = state.data.country !== null;
    const hasAcceptedTerms = termsCheckbox?.checked ?? false;
    const hasAcceptedPrivacy = privacyCheckbox?.checked ?? false;
    // Phone is optional but if entered must be valid (country-aware)
    const phoneOk =
      !state.data.phone || validatePhoneForCountry(state.data.phone, state.data.country?.code);

    state.isValid =
      hasValidPassword &&
      hasFirstName &&
      hasLastName &&
      hasCountry &&
      hasAcceptedTerms &&
      hasAcceptedPrivacy &&
      phoneOk;

    if (submitBtn) {
      submitBtn.disabled = !state.isValid;
    }
  }

  return state;
}

/**
 * Get current form data
 */
export function getAccountSetupFormData(): AccountSetupFormData | null {
  const container = document.getElementById("account-setup-form");
  if (!container) return null;

  const countryInput = document.getElementById("country-input") as HTMLInputElement | null;
  const firstNameInput = document.getElementById("first-name-input") as HTMLInputElement | null;
  const lastNameInput = document.getElementById("last-name-input") as HTMLInputElement | null;
  const phoneInput = document.getElementById("phone-input") as HTMLInputElement | null;
  const passwordInput = document.getElementById("password-input") as HTMLInputElement | null;

  const countryCode = countryInput?.value || "TR";
  const country = getCountryByCode(countryCode) || toCountryOption(ALL_COUNTRIES[0]);

  return {
    country,
    firstName: firstNameInput?.value.trim() || "",
    lastName: lastNameInput?.value.trim() || "",
    phone: phoneInput?.value.trim() || "",
    password: passwordInput?.value || "",
  };
}

/**
 * Reset the form to initial state
 */
export function resetAccountSetupForm(): void {
  const form = document.getElementById("account-setup-form-element") as HTMLFormElement | null;
  if (form) {
    form.reset();
  }

  // Reset password requirements UI
  const requirementsContainer = document.getElementById("password-requirements");
  if (requirementsContainer) {
    requirementsContainer.querySelectorAll(".auth-password-req-item").forEach((item) => {
      item.classList.remove("valid", "invalid");
    });
  }

  // Reset submit button
  const submitBtn = document.getElementById("account-setup-submit-btn") as HTMLButtonElement | null;
  if (submitBtn) {
    submitBtn.disabled = true;
  }
}

/**
 * Set form field error state
 */
export function setFieldError(fieldId: string, errorMessage?: string): void {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add("border-red-500", "focus:border-red-500");
  field.classList.remove("border-gray-200", "focus:border-orange-500");

  // Add error message if provided
  if (errorMessage) {
    const errorEl = document.createElement("p");
    errorEl.className = "mt-1 text-sm text-red-500";
    errorEl.id = `${fieldId}-error`;
    errorEl.textContent = errorMessage;

    const existingError = document.getElementById(`${fieldId}-error`);
    if (existingError) {
      existingError.remove();
    }

    field.parentElement?.appendChild(errorEl);
  }
}

/**
 * Clear form field error state
 */
export function clearFieldError(fieldId: string): void {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.remove("border-red-500", "focus:border-red-500");
  field.classList.add("border-gray-200", "focus:border-orange-500");

  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.remove();
  }
}
