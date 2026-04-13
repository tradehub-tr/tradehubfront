/**
 * SettingsChangeEmail Component
 * Email change form — verifies password, validates duplicate, then updates email via backend API.
 * Uses Alpine.js x-data="settingsChangeEmail" for form state.
 * Calls tradehub_core.api.v1.identity.change_email endpoint.
 */

import { t } from '../../i18n';

const ICONS = {
  checkActive: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#22c55e"/><path d="M6 10l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export function SettingsChangeEmail(): string {
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:px-4 max-sm:py-4" x-data="settingsChangeEmail">
      <h2 class="text-xl max-sm:text-base font-bold mb-2 m-0" style="color:var(--color-text-primary)">${t('settings.changeEmailNav')}</h2>
      <p class="text-sm max-sm:text-[13px] mb-7 max-sm:mb-4 m-0" style="color:var(--color-text-secondary)">${t('settings.changeEmailDesc')}</p>

      <!-- Step 1: Email Form -->
      <div x-show="step === 1">
        <div class="max-w-[640px] mx-auto">
          <!-- Current email (read-only info) -->
          <div class="mb-4 max-sm:mb-3" x-show="currentEmail" x-cloak>
            <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">${t('settings.currentEmail')}</label>
            <div class="py-2.5 px-3.5 border border-gray-200 rounded-lg text-sm bg-gray-50" style="color:var(--color-text-primary)" x-text="currentEmail"></div>
          </div>

          <div class="mb-4 max-sm:mb-3">
            <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">${t('settings.newEmail')}</label>
            <input type="email" class="th-input th-input-md max-w-[360px] max-sm:max-w-full" x-ref="newEmail" autocomplete="off" placeholder="${t('settings.newEmailPlaceholder')}" />
          </div>

          <div class="mb-4 max-sm:mb-3">
            <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">${t('settings.currentPassword')}</label>
            <div class="relative max-w-[360px] max-sm:max-w-full">
              <input :type="showPassword ? 'text' : 'password'" class="th-input th-input-md pr-11" x-ref="emailPassword" autocomplete="off" placeholder="${t('settings.currentPassword')}" />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabindex="-1">
                <svg x-show="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                <svg x-show="showPassword" x-cloak class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
              </button>
            </div>
            <p class="text-xs mt-1.5 m-0" style="color:var(--color-text-tertiary)">${t('settings.passwordRequiredForSecurity')}</p>
          </div>

          <p class="text-[13px] text-red-500 mb-3" x-show="error" x-text="error" x-cloak></p>

          <button class="th-btn max-sm:w-full disabled:opacity-50" type="button" @click="saveEmail()" :disabled="loading">
            <span x-show="!loading">${t('settings.privacySave')}</span>
            <span x-show="loading" x-cloak class="inline-flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ${t('common.loading')}
            </span>
          </button>
        </div>
      </div>

      <!-- Step 2: Success -->
      <div x-show="step === 2" x-cloak>
        <div class="max-w-[640px] mx-auto text-center py-4 max-sm:py-2">
          <div class="mb-4">${ICONS.checkActive}</div>
          <h3 class="text-lg max-sm:text-base font-bold mb-2 m-0" style="color:var(--color-text-primary)">${t('settings.emailUpdated')}</h3>
          <p class="text-sm max-sm:text-[13px] mb-6 max-sm:mb-4 m-0" style="color:var(--color-text-secondary)">${t('settings.emailUpdatedLoginAgain')}</p>
          <a href="/pages/auth/login.html" class="th-btn no-underline inline-flex max-sm:w-full max-sm:justify-center">${t('settings.goToLogin')}</a>
        </div>
      </div>
    </div>
  `;
}

/** @deprecated No-op — Alpine handles all interactivity */
export function initSettingsChangeEmail(): void { /* no-op */ }
