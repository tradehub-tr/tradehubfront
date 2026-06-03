import { getLucideIcon } from "../../icons/lucideIcons";
import { t } from "../../../i18n";

export function PhotoSourceMenu(): string {
  // TODO(batch-8): swap to bottom-sheet variant on ≤md (mobile width)
  const imageIcon = getLucideIcon("image", "w-4 h-4");
  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'photo'"
         x-transition.opacity
         x-cloak
         class="absolute bottom-[150px] start-12 z-30 w-[260px] rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white shadow-lg overflow-hidden">
      <input type="file" accept="image/*" x-ref="photoInput" class="hidden"
             @change="$store.chatPopup.handleFilePicked($event.target.files && $event.target.files[0]); $event.target.value=''" />
      <button type="button"
              @click="$refs.photoInput && $refs.photoInput.click(); $store.chatPopup.closeSubMenu()"
              :disabled="$store.chatPopup.sending"
              class="flex w-full items-center gap-2 border-0 bg-white px-3 py-2.5 text-start text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed">
        ${imageIcon}
        ${t("chat.subMenu.photoFromDevice")}
      </button>
    </div>
  `;
}
