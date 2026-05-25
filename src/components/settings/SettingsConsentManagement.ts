/**
 * SettingsConsentManagement Component
 * KVKK/GDPR — users can view and withdraw their consents.
 * Uses Alpine.js x-data="settingsConsentManagement" for state.
 * Calls tradehub_core.api.v1.compliance consent endpoints.
 */

import { t } from "../../i18n";

const CONSENT_LABELS: Record<string, () => string> = {
  privacy_policy: () => t("settings.consentPrivacyPolicy"),
  terms_of_service: () => t("settings.consentTerms"),
  marketing_email: () => t("settings.consentMarketingEmail"),
  marketing_sms: () => t("settings.consentMarketingSms"),
  cookie_analytics: () => t("settings.consentCookieAnalytics"),
  cookie_marketing: () => t("settings.consentCookieMarketing"),
  cookie_functional: () => t("settings.consentCookieFunctional"),
  kvkk_disclosure: () => t("settings.consentKvkk"),
  data_processing: () => t("settings.consentDataProcessing"),
};

export { CONSENT_LABELS };

export function SettingsConsentManagement(): string {
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:px-4 max-sm:py-4" x-data="settingsConsentManagement">
      <h2 class="text-xl max-sm:text-lg font-bold m-0 mb-2" style="color:var(--color-text-primary)">${t("settings.consentManagementTitle")}</h2>
      <p class="text-sm max-sm:text-[13px] mb-6 m-0" style="color:var(--color-text-secondary)">${t("settings.consentManagementDesc")}</p>

      <!-- Loading -->
      <div x-show="loading" class="py-8 text-center">
        <svg class="animate-spin h-6 w-6 mx-auto" style="color:var(--color-text-tertiary)" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      </div>

      <!-- Consent List -->
      <div x-show="!loading" x-cloak class="flex flex-col gap-3">
        <template x-for="item in consents" :key="item.consent_type">
          <div class="flex items-center justify-between py-3 px-4 rounded-lg border" :class="item.has_consent ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50/50'">
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="text-sm font-medium" style="color:var(--color-text-primary)" x-text="getLabel(item.consent_type)"></span>
              <span class="text-[11px]" :style="item.has_consent ? 'color:#16a34a' : 'color:#9ca3af'"
                x-text="item.has_consent ? '${t("settings.consentGranted")}' + (item.granted_at ? ' — ' + formatDate(item.granted_at) : '') : '${t("settings.consentWithdrawn")}'"></span>
            </div>
            <button type="button" class="text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer flex-shrink-0"
              :class="item.has_consent ? 'border-red-200 text-red-600 bg-white hover:bg-red-50' : 'border-emerald-200 text-emerald-600 bg-white hover:bg-emerald-50'"
              @click="item.has_consent ? withdrawItem(item.consent_type) : grantItem(item.consent_type)"
              :disabled="item.busy"
              x-text="item.has_consent ? '${t("settings.consentWithdrawBtn")}' : '${t("settings.consentGrantBtn")}'"></button>
          </div>
        </template>
      </div>

      <p class="text-[13px] text-red-500 mt-3" x-show="error" x-text="error" x-cloak></p>
    </div>
  `;
}

export function initSettingsConsentManagement(): void {
  /* no-op — Alpine handles all interactivity */
}
