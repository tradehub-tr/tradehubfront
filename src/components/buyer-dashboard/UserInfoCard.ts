/**
 * UserInfoCard Component
 * Avatar (48px round), username (bold, #333), profile link (blue #2563EB),
 * '24H Çevrimiçi destek' badge (top-right), 3-column stats grid with vertical dividers.
 */

import type { UserProfile } from "../../types/buyerDashboard";
import { t } from "../../i18n";

export interface UserInfoCardProps {
  user: UserProfile;
}

export function UserInfoCard(props: UserInfoCardProps): string {
  const { user } = props;

  return `
    <div class="relative p-[clamp(0.75rem,0.5rem+1vw,1.25rem)]" x-data="buyerUserInfo">
      <!-- 24H Online Support Badge -->
      <div class="absolute top-3 right-3 inline-flex items-center gap-1 text-[clamp(0.625rem,0.6rem+0.1vw,0.75rem)] font-medium text-blue-600 bg-blue-50 rounded-md px-2 py-1 max-sm:px-1.5" aria-label="${t("dashboard.ariaOnlineSupport")}">
        <svg class="w-4 h-4 flex-shrink-0 max-sm:w-3 max-sm:h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="max-xs:hidden">${t("dashboard.onlineSupport")}</span>
        <span class="hidden max-xs:inline">24H</span>
      </div>

      <!-- User Profile Row -->
      <div class="flex items-center gap-3 mb-4 max-sm:gap-2.5 max-sm:mb-3">
        <div class="w-12 h-12 max-sm:w-10 max-sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style="background:var(--color-surface-raised, #f5f5f5)" aria-hidden="true">
          <span class="text-xl font-bold text-gray-500 uppercase" x-text="userInitial || '?'"></span>
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <span class="text-base font-bold whitespace-nowrap overflow-hidden text-ellipsis" style="color:var(--color-text-primary)" x-text="userName || '${user.username}'">${user.username}</span>
          <a href="/pages/dashboard/settings.html#profilim" class="text-[13px] text-blue-600 no-underline inline-flex items-center transition-colors hover:text-blue-700 hover:underline">
            ${t("dashboard.viewProfile")}
            <svg class="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="flex items-stretch border-t pt-4" style="border-color:var(--color-border-light, #f0f0f0)" role="list" aria-label="${t("dashboard.ariaUserStats")}">
        <a href="/messages" class="flex-1 min-w-0 flex flex-col items-center gap-1 no-underline transition-opacity hover:opacity-80">
          <span class="text-[clamp(1rem,0.9rem+0.4vw,1.25rem)] font-bold leading-none" style="color:var(--color-text-primary)" x-text="statsMessages">0</span>
          <span class="text-[clamp(0.625rem,0.6rem+0.1vw,0.75rem)] text-center leading-[1.3] line-clamp-2" style="color:var(--color-text-secondary)">${t("dashboard.statsMessages")}</span>
        </a>
        <div class="w-px bg-gray-200 self-stretch"></div>
        <a href="/quotations" class="flex-1 min-w-0 flex flex-col items-center gap-1 no-underline transition-opacity hover:opacity-80">
          <span class="text-[clamp(1rem,0.9rem+0.4vw,1.25rem)] font-bold leading-none" style="color:var(--color-text-primary)" x-text="statsQuotations">0</span>
          <span class="text-[clamp(0.625rem,0.6rem+0.1vw,0.75rem)] text-center leading-[1.3] line-clamp-2" style="color:var(--color-text-secondary)">${t("dashboard.statsQuotations")}</span>
        </a>
        <div class="w-px bg-gray-200 self-stretch"></div>
        <a href="/coupons" class="flex-1 min-w-0 flex flex-col items-center gap-1 no-underline transition-opacity hover:opacity-80">
          <span class="text-[clamp(1rem,0.9rem+0.4vw,1.25rem)] font-bold leading-none" style="color:var(--color-text-primary)" x-text="statsCoupons">0</span>
          <span class="text-[clamp(0.625rem,0.6rem+0.1vw,0.75rem)] text-center leading-[1.3] line-clamp-2" style="color:var(--color-text-secondary)">${t("dashboard.statsCoupons")}</span>
        </a>
      </div>
    </div>
  `;
}
