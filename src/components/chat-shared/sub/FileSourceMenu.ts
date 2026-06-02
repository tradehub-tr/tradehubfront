import { getLucideIcon } from "../../icons/lucideIcons";
import { t } from "../../../i18n";

export function FileSourceMenu(): string {
  const paperclipIcon = getLucideIcon("paperclip", "w-4 h-4");
  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'file'"
         x-transition.opacity
         x-cloak
         class="absolute bottom-[150px] left-20 z-30 w-[260px] rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white shadow-lg overflow-hidden">
      <input type="file" x-ref="fileInput" class="hidden"
             @change="$store.chatPopup.handleFilePicked($event.target.files && $event.target.files[0]); $event.target.value=''" />
      <button type="button"
              @click="$refs.fileInput && $refs.fileInput.click(); $store.chatPopup.closeSubMenu()"
              :disabled="$store.chatPopup.sending"
              class="flex w-full items-center gap-2 border-0 bg-white px-3 py-2.5 text-left text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed">
        ${paperclipIcon}
        ${t("chat.subMenu.fileFromDevice")}
      </button>
    </div>
  `;
}
