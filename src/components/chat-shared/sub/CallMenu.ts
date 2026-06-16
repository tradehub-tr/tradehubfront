import { getLucideIcon } from "../../icons/lucideIcons";
import { t } from "../../../i18n";

export function CallMenu(): string {
  // TODO(batch-8): swap to bottom-sheet variant on ≤md (mobile width)
  const videoIcon = getLucideIcon("video", "w-4 h-4");
  const phoneIcon = getLucideIcon("phone", "w-4 h-4");
  const calendarIcon = getLucideIcon("calendar", "w-4 h-4");
  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'call'"
         x-transition:enter="transition ease-[cubic-bezier(0.23,1,0.32,1)] duration-150 motion-reduce:transition-none"
         x-transition:enter-start="opacity-0 scale-95 motion-reduce:scale-100"
         x-transition:enter-end="opacity-100 scale-100"
         x-transition:leave="transition ease-out duration-100 motion-reduce:transition-none"
         x-transition:leave-start="opacity-100 scale-100"
         x-transition:leave-end="opacity-0 scale-95 motion-reduce:scale-100"
         x-cloak
         class="absolute bottom-[150px] start-32 z-30 w-[240px] origin-bottom-left rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white shadow-lg overflow-hidden">
      <div class="flex items-center gap-2 border-b border-[var(--color-border-light,#f0f0f0)] px-3 py-2.5">
        <div class="size-8 shrink-0 rounded-full bg-[var(--color-primary-100,#ffefb3)] overflow-hidden">
          <template x-if="$store.chatPopup.activeConversation?.avatar">
            <img :src="$store.chatPopup.activeConversation.avatar"
                 :alt="$store.chatPopup.activeConversation.name"
                 class="size-full object-cover" />
          </template>
        </div>
        <div>
          <div class="text-[12px] font-semibold" x-text="$store.chatPopup.activeConversation?.name || ''"></div>
          <div class="text-[10px] text-[var(--color-text-tertiary,#a3a3a3)]"
               x-text="$store.chatPopup.activeConversation?.company || ''"></div>
        </div>
      </div>
      <button type="button" class="flex w-full items-center gap-2.5 border-0 bg-white px-3 py-2.5 text-start text-[12px] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${videoIcon} ${t("chat.subMenu.callVideo")}
      </button>
      <button type="button" class="flex w-full items-center gap-2.5 border-0 bg-white px-3 py-2.5 text-start text-[12px] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${phoneIcon} ${t("chat.subMenu.callVoice")}
      </button>
      <button type="button" class="flex w-full items-center gap-2.5 border-0 bg-white px-3 py-2.5 text-start text-[12px] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-surface-muted,#fafafa)] focus:outline-none">
        ${calendarIcon} ${t("chat.subMenu.callSchedule")}
      </button>
    </div>
  `;
}
