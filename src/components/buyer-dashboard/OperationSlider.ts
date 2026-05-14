/**
 * OperationSlider Component
 * Dynamic Swiper-based banner slider. Fetches banners from API via Alpine.
 * Prepends a synthetic "email-verify" slide if the user's email is unverified.
 * If no banners exist (and email verified), the entire slider area is hidden.
 */

import { t } from "../../i18n";

export interface OperationSliderProps {
  emailVerified: boolean;
  userEmail: string;
}

function escapeAttr(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function OperationSlider(props: OperationSliderProps): string {
  const verifiedAttr = String(props.emailVerified);
  const emailAttr = escapeAttr(props.userEmail);

  return `
    <div x-data="dashboardBanners"
         data-email-verified="${verifiedAttr}"
         data-user-email="${emailAttr}"
         x-show="banners.length > 0" x-cloak
         class="operation-slider group/opslider px-3 pb-3" aria-label="${t("dashboard.notifications")}">
      <div class="relative overflow-hidden bg-(--color-surface-raised,#f5f5f5) rounded-lg">
        <div class="swiper operation-slider__swiper overflow-hidden">
          <div class="swiper-wrapper">
            <template x-for="banner in banners"
                      :key="banner.type === 'email-verify' ? 'email-verify' : 'remote-' + banner.title">
              <div class="swiper-slide">

                <!-- Email-verify slide -->
                <template x-if="banner.type === 'email-verify'">
                  <div class="flex items-center justify-between gap-2 sm:gap-4 px-[clamp(0.75rem,0.5rem+1vw,1.25rem)] py-3 min-h-[44px]">
                    <!-- Sol: başlık + disabled email + Değiştir linki -->
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                      <!-- Default title -->
                      <template x-if="!verificationSent">
                        <span class="text-xs sm:text-sm font-normal text-(--color-text-heading,#111827) shrink-0 whitespace-nowrap">
                          ${t("dashboard.notifVerifyEmailTitle")}
                        </span>
                      </template>
                      <!-- Sent label -->
                      <template x-if="verificationSent">
                        <span class="text-xs sm:text-sm text-green-600 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          ${t("dashboard.notifVerifyEmailSentLabel")}
                        </span>
                      </template>

                      <!-- Disabled email "input" görünümü -->
                      <input
                        type="text"
                        :value="userEmail"
                        disabled
                        readonly
                        aria-readonly="true"
                        class="bg-(--color-surface,#fff) border border-(--color-border,#e5e7eb) text-(--color-text-muted,#6b7280) text-xs sm:text-sm px-2 py-0.5 rounded cursor-not-allowed min-w-0 max-w-[14ch] sm:max-w-[24ch] truncate appearance-none focus:outline-none"
                      />

                      <!-- Değiştir linki -->
                      <a href="/pages/dashboard/settings.html#eposta-degistir"
                         class="text-xs sm:text-sm text-(--color-cta-primary,#333333) underline underline-offset-2 hover:opacity-80 shrink-0 whitespace-nowrap">
                        ${t("dashboard.notifVerifyEmailChangeLink")}
                      </a>
                    </div>

                    <!-- Sağ: error / CTA -->
                    <div class="flex items-center gap-2 shrink-0">
                      <!-- Error inline -->
                      <template x-if="errorMessage">
                        <span class="text-xs text-red-600 whitespace-nowrap" x-text="errorMessage"></span>
                      </template>
                      <!-- Send CTA -->
                      <template x-if="!verificationSent">
                        <button
                          type="button"
                          @click="sendVerification()"
                          :disabled="sending"
                          class="text-xs sm:text-sm text-(--color-text-heading,#111827) inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:text-(--color-cta-primary,#333333) transition-colors duration-150 appearance-none border-none bg-transparent cursor-pointer focus:outline-none whitespace-nowrap">
                          ${t("dashboard.notifVerifyEmailCta")}
                          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </template>
                      <!-- Resend CTA -->
                      <template x-if="verificationSent">
                        <button
                          type="button"
                          @click="sendVerification()"
                          :disabled="sending"
                          class="text-xs sm:text-sm text-(--color-text-heading,#111827) inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:text-(--color-cta-primary,#333333) transition-colors duration-150 appearance-none border-none bg-transparent cursor-pointer focus:outline-none whitespace-nowrap">
                          ${t("dashboard.notifVerifyEmailResend")}
                          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </template>
                    </div>
                  </div>
                </template>

                <!-- Remote banner (mevcut) -->
                <template x-if="banner.type === 'remote'">
                  <div class="flex items-center justify-between px-[clamp(0.75rem,0.5rem+1vw,1.25rem)] py-3 min-h-[44px] gap-2 sm:gap-4">
                    <span class="text-[clamp(0.75rem,0.7rem+0.2vw,0.875rem)] font-normal text-(--color-text-heading,#111827) whitespace-nowrap overflow-hidden text-ellipsis min-w-0" x-text="banner.title"></span>
                    <a :href="banner.link_href" class="text-[clamp(0.75rem,0.7rem+0.2vw,0.875rem)] text-(--color-text-heading,#111827) no-underline inline-flex items-center whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-(--color-cta-primary,#333333)">
                      <span x-text="banner.link_text"></span>
                      <svg class="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </a>
                  </div>
                </template>

              </div>
            </template>
          </div>
        </div>

        <!-- Navigation Arrows (multi-slide) -->
        <template x-if="banners.length > 1">
          <div>
            <button
              type="button"
              aria-label="${t("dashboard.prevNotification")}"
              class="operation-slider__prev absolute top-1/2 -translate-y-1/2 left-1 z-10 w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm border-none text-(--color-text-muted,#666666) cursor-pointer opacity-0 pointer-events-none transition-all duration-200 group-hover/opslider:opacity-100 group-hover/opslider:pointer-events-auto hover:text-(--color-text-heading,#111827)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              type="button"
              aria-label="${t("dashboard.nextNotification")}"
              class="operation-slider__next absolute top-1/2 -translate-y-1/2 right-1 z-10 w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm border-none text-(--color-text-muted,#666666) cursor-pointer opacity-0 pointer-events-none transition-all duration-200 group-hover/opslider:opacity-100 group-hover/opslider:pointer-events-auto hover:text-(--color-text-heading,#111827)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </template>
      </div>

      <!-- Pagination (multi-slide) -->
      <template x-if="banners.length > 1">
        <div class="operation-slider__pagination flex justify-center gap-1.5 pt-2 pb-1"></div>
      </template>
    </div>
  `;
}
