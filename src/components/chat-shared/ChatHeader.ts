import { getLucideIcon } from "../icons/lucideIcons";
import { t } from "../../i18n";

export interface ChatHeaderOptions {
  showExpand?: boolean;
  showClose?: boolean;
  showBackButton?: boolean;
}

export function ChatHeader(opts: ChatHeaderOptions = {}): string {
  const moreIcon = getLucideIcon("more-horizontal", "w-4 h-4");
  const expandIcon = getLucideIcon("maximize-2", "w-4 h-4");
  const closeIcon = getLucideIcon("x", "w-4 h-4");
  const backIcon = getLucideIcon("chevron-left", "w-5 h-5");

  const showExpand = opts.showExpand !== false;
  const showClose = opts.showClose !== false;
  const showBack = opts.showBackButton === true;

  return /* html */ `
    <div class="flex items-center gap-2.5 border-b border-[var(--color-border-light,#f0f0f0)] bg-white px-4 py-3 flex-shrink-0 relative">
      ${
        showBack
          ? `<button type="button" @click="$store.chatPopup.setActiveTab('inbox')" class="appearance-none border-0 bg-transparent p-1 cursor-pointer text-[var(--color-text-secondary,#525252)] hover:text-[var(--color-text-primary,#0a0a0a)] md:hidden focus:outline-none" aria-label="Geri">${backIcon}</button>`
          : ""
      }

      <template x-if="$store.chatPopup.activeConversation">
        <div class="size-8 shrink-0 rounded-full bg-[var(--color-primary-100,#ffefb3)] overflow-hidden">
          <template x-if="$store.chatPopup.activeConversation.avatar">
            <img :src="$store.chatPopup.activeConversation.avatar" class="size-full object-cover" alt="" />
          </template>
        </div>
      </template>

      <div class="flex min-w-0 flex-col">
        <div class="truncate text-[14px] font-semibold text-[var(--color-text-primary,#0a0a0a)]"
             x-text="$store.chatPopup.activeConversation?.name || ''"></div>
        <div class="truncate text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]">
          <template x-if="$store.chatPopup.activeConversation">
            <span>${t("chat.headerLocalTime")}: <span x-text="$store.chatPopup.activeConversation.localTimeHHMM"></span></span>
          </template>
          <template x-if="$store.chatPopup.activeConversation?.online">
            <span> · ${t("chat.online")}</span>
          </template>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-2 text-[var(--color-text-tertiary,#a3a3a3)]">
        <button type="button"
                data-submenu-trigger
                @click.stop="$store.chatPopup.toggleSubMenu('context')"
                class="appearance-none border-0 bg-transparent p-1.5 rounded cursor-pointer hover:text-[var(--color-text-primary,#0a0a0a)] hover:bg-[var(--color-surface-raised,#f5f5f5)] focus:outline-none"
                aria-label="Daha fazla">${moreIcon}</button>
        ${showExpand ? `<button type="button" @click="$store.chatPopup.toggleExpanded()" class="appearance-none border-0 bg-transparent p-1.5 rounded cursor-pointer hover:text-[var(--color-text-primary,#0a0a0a)] hover:bg-[var(--color-surface-raised,#f5f5f5)] focus:outline-none" aria-label="Büyüt">${expandIcon}</button>` : ""}
        ${showClose ? `<button type="button" @click="$store.chatPopup.close()" class="appearance-none border-0 bg-transparent p-1.5 rounded cursor-pointer hover:text-[var(--color-text-primary,#0a0a0a)] hover:bg-[var(--color-surface-raised,#f5f5f5)] focus:outline-none" aria-label="Kapat">${closeIcon}</button>` : ""}
      </div>
    </div>
  `;
}
