/**
 * SettingsDataExport Component
 * GDPR Art.20 / KVKK — users can request a copy of their personal data.
 * Uses Alpine.js x-data="settingsDataExport" for form state.
 * Calls tradehub_core.api.v1.compliance.request_data_export endpoint.
 */

import { t } from "../../i18n";

export function SettingsDataExport(): string {
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:px-4 max-sm:py-4" x-data="settingsDataExport">

      <!-- Request Form -->
      <div x-show="step === 'form'">
        <h2 class="text-xl max-sm:text-lg font-bold m-0 mb-2" style="color:var(--color-text-primary)">${t("settings.downloadMyDataTitle")}</h2>
        <p class="text-sm max-sm:text-[13px] mb-6 m-0" style="color:var(--color-text-secondary)">${t("settings.downloadMyDataDesc")}</p>

        <div class="mb-5 max-w-[360px]">
          <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.downloadMyDataPasswordLabel")}</label>
          <input type="password" class="th-input th-input-md" x-model="password" placeholder="${t("settings.downloadMyDataPasswordPlaceholder")}" />
        </div>

        <p class="text-[13px] text-red-500 mb-3" x-show="error" x-text="error" x-cloak></p>

        <button class="th-btn-dark disabled:opacity-50 max-sm:w-full" type="button" @click="requestExport()" :disabled="loading || !password">
          <span x-show="!loading">${t("settings.downloadMyDataBtn")}</span>
          <span x-show="loading" x-cloak class="inline-flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ${t("common.loading")}
          </span>
        </button>
      </div>

      <!-- Success -->
      <div x-show="step === 'success'" x-cloak
        x-transition:enter="transition ease-out duration-200 motion-reduce:transition-none"
        x-transition:enter-start="opacity-0 scale-[0.97] motion-reduce:scale-100"
        x-transition:enter-end="opacity-100 scale-100">
        <div class="max-w-[640px] mx-auto text-center py-4">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="text-lg font-bold mb-2 m-0" style="color:var(--color-text-primary)">${t("settings.downloadMyDataSuccess")}</h3>
        </div>
      </div>

    </div>
  `;
}

export function initSettingsDataExport(): void {
  /* no-op — Alpine handles all interactivity */
}
