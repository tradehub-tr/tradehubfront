import { getLucideIcon } from "../../icons/lucideIcons";
import { t } from "../../../i18n";

export function ContextMenu(): string {
  const pinIcon = getLucideIcon("pin", "w-4 h-4");
  const banIcon = getLucideIcon("ban", "w-4 h-4");
  const trashIcon = getLucideIcon("trash-2", "w-4 h-4");
  const bellOffIcon = getLucideIcon("bell-off", "w-4 h-4");
  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'context'"
         x-transition.opacity
         x-cloak
         class="absolute right-3 top-12 z-40 w-[220px] rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white py-1.5 shadow-lg">
      <button type="button" @click.stop="$store.chatPopup.pinActive()"
              class="flex w-full items-center gap-2.5 border-0 bg-white px-3.5 py-2 text-left text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${pinIcon} ${t("chat.context.pin")}
      </button>
      <button type="button" @click.stop="$store.chatPopup.blockActive()"
              class="flex w-full items-center gap-2.5 border-0 bg-white px-3.5 py-2 text-left text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${banIcon} ${t("chat.context.block")}
      </button>
      <button type="button" @click.stop="$store.chatPopup.deleteActive()"
              class="flex w-full items-center gap-2.5 border-0 bg-white px-3.5 py-2 text-left text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${trashIcon} ${t("chat.context.delete")}
      </button>
      <button type="button" @click.stop="$store.chatPopup.muteActive()"
              class="flex w-full items-center gap-2.5 border-0 bg-white px-3.5 py-2 text-left text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${bellOffIcon} ${t("chat.context.mute")}
      </button>
    </div>
  `;
}
