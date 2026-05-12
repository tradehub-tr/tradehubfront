import { getLucideIcon } from "../../icons/lucideIcons";
import { t } from "../../../i18n";

export function PhotoSourceMenu(): string {
  // TODO(batch-8): swap to bottom-sheet variant on ≤md (mobile width)
  const imageIcon = getLucideIcon("image", "w-4 h-4");
  const cloudIcon = getLucideIcon("cloud", "w-4 h-4");
  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'photo'"
         x-transition.opacity
         x-cloak
         class="absolute bottom-[150px] left-12 z-30 w-[260px] rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white shadow-lg overflow-hidden">
      <button type="button"
              class="flex w-full items-center gap-2 border-0 bg-white px-3 py-2.5 text-left text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${imageIcon}
        ${t("chat.subMenu.photoFromDevice")}
      </button>
      <button type="button"
              class="flex w-full items-center gap-2 border-t border-[var(--color-border-light,#f0f0f0)] bg-white px-3 py-2.5 text-left text-[12px] cursor-pointer hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${cloudIcon}
        ${t("chat.subMenu.photoFromCloud")}
      </button>
    </div>
  `;
}
