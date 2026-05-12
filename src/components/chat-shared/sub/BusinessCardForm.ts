import { getLucideIcon } from "../../icons/lucideIcons";
import { t } from "../../../i18n";

export function BusinessCardForm(): string {
  const closeIcon = getLucideIcon("x", "w-3.5 h-3.5");
  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'card'"
         x-transition.opacity
         x-cloak
         class="absolute bottom-[150px] left-20 z-30 w-[280px] rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white p-3 shadow-lg">
      <div class="flex items-center justify-between text-[13px] font-semibold mb-2">
        <span>${t("chat.subMenu.cardTitle")}</span>
        <button type="button" @click.stop="$store.chatPopup.closeSubMenu()"
                class="appearance-none border-0 bg-transparent p-1 cursor-pointer text-[var(--color-text-tertiary,#a3a3a3)] hover:text-[var(--color-text-primary,#0a0a0a)] focus:outline-none"
                aria-label="${t("chat.aria.close")}">${closeIcon}</button>
      </div>
      <div class="space-y-1.5 text-[11px] text-[var(--color-text-secondary,#525252)]">
        <div class="text-[13px] font-medium text-[var(--color-text-primary,#0a0a0a)]">ahmet seker</div>
        <div>🇹🇷 TR</div>
        <div>✉ ahmet.seker@turksab.com</div>
        <div class="mt-2 text-[10px] text-[var(--color-text-tertiary,#a3a3a3)]">iSTOC · Email</div>
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <button type="button" class="appearance-none rounded-full border border-[var(--color-border-default,#e5e5e5)] bg-white px-3 py-1.5 text-[11px] cursor-pointer hover:border-[var(--color-text-secondary,#525252)] focus:outline-none">${t("chat.subMenu.cardEdit")}</button>
        <button type="button" class="appearance-none rounded-full border-0 bg-[var(--color-orange-500,#ea580c)] px-3 py-1.5 text-[11px] font-semibold text-white cursor-pointer hover:bg-[var(--color-orange-600,#c2410c)] focus:outline-none">${t("chat.subMenu.cardSend")}</button>
      </div>
    </div>
  `;
}
