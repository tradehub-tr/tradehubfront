import { getLucideIcon } from "../../icons/lucideIcons";
import { t } from "../../../i18n";

export function BusinessCardForm(): string {
  // TODO(batch-8): swap to bottom-sheet variant on ≤md (mobile width)
  // TODO(batch-6+): wire name/email/country to current user profile (auth/me endpoint)
  // TODO(backend): wire Edit/Send to identity API (sendBusinessCard)
  const closeIcon = getLucideIcon("x", "w-3.5 h-3.5");
  const chevronIcon = getLucideIcon("chevron-right", "w-3.5 h-3.5");
  const userIcon = getLucideIcon("user", "w-3.5 h-3.5");
  const mailIcon = getLucideIcon("mail", "w-3.5 h-3.5");

  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'card'"
         x-transition.opacity
         x-cloak
         class="absolute bottom-[150px] left-20 z-30 w-[320px] overflow-hidden rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white shadow-lg">

      <div class="flex items-center justify-between border-b border-[var(--color-border-light,#f0f0f0)] px-3.5 py-2.5">
        <span class="text-[13px] font-semibold text-[var(--color-text-primary,#0a0a0a)]">${t("chat.subMenu.cardTitle")}</span>
        <div class="flex items-center gap-1 text-[var(--color-text-tertiary,#a3a3a3)]">
          <button type="button"
                  class="appearance-none border-0 bg-transparent p-1 cursor-pointer hover:text-[var(--color-text-primary,#0a0a0a)] focus:outline-none"
                  aria-label="${t("chat.aria.expand")}">${chevronIcon}</button>
          <button type="button" @click.stop="$store.chatPopup.closeSubMenu()"
                  class="appearance-none border-0 bg-transparent p-1 cursor-pointer hover:text-[var(--color-text-primary,#0a0a0a)] focus:outline-none"
                  aria-label="${t("chat.aria.close")}">${closeIcon}</button>
        </div>
      </div>

      <div class="relative px-3.5 py-3">
        <div class="relative space-y-1.5">
          <div class="text-[14px] font-semibold text-[var(--color-text-primary,#0a0a0a)]">${t("chat.businessCard.placeholderName")}</div>
          <div class="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-secondary,#525252)]">
            <span aria-hidden="true">🇹🇷</span>
            <span class="font-medium">TR</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-secondary,#525252)]">
            <span class="text-[var(--color-text-tertiary,#a3a3a3)]">${userIcon}</span>
            <span>${t("chat.businessCard.placeholderName")}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-secondary,#525252)]">
            <span class="text-[var(--color-text-tertiary,#a3a3a3)]">${mailIcon}</span>
            <span>${t("chat.businessCard.placeholderEmail")}</span>
          </div>

          <div class="pt-2 text-[10.5px] text-[var(--color-text-tertiary,#a3a3a3)]">${t("chat.businessCard.verifiedBy")}</div>
          <div>
            <span class="inline-flex items-center rounded-md border border-[var(--color-border-light,#f0f0f0)] bg-[var(--color-surface-muted,#fafafa)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--color-text-secondary,#525252)]">${t("chat.businessCard.emailLabel")}</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-[var(--color-border-light,#f0f0f0)] px-3.5 py-2.5">
        <button type="button"
                @click.stop="$store.chatPopup.closeSubMenu()"
                class="appearance-none rounded-full border border-[var(--color-orange-500,#ea580c)] bg-white px-4 py-1.5 text-[11.5px] font-semibold text-[var(--color-orange-500,#ea580c)] cursor-pointer hover:bg-[var(--color-orange-50,#fff7ed)] focus:outline-none transition-colors">${t("chat.subMenu.cardEdit")}</button>
        <button type="button"
                @click.stop="$store.chatPopup.closeSubMenu()"
                class="appearance-none rounded-full border-0 bg-[var(--color-orange-500,#ea580c)] px-4 py-1.5 text-[11.5px] font-semibold text-white cursor-pointer hover:bg-[var(--color-orange-600,#c2410c)] focus:outline-none transition-colors">${t("chat.subMenu.cardSend")}</button>
      </div>
    </div>
  `;
}
