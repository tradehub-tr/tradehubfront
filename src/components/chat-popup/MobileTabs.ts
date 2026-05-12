import { t } from "../../i18n";

export function MobileTabs(): string {
  return /* html */ `
    <div class="flex border-b border-[var(--color-border-light,#f0f0f0)] bg-white md:hidden">
      <button type="button"
              @click="$store.chatPopup.setActiveTab('chat')"
              class="flex-1 appearance-none border-0 border-b-2 bg-transparent py-2.5 text-[13px] font-medium cursor-pointer focus:outline-none transition-colors"
              :class="$store.chatPopup.activeTab === 'chat'
                ? 'border-[var(--color-primary-500,#f5b800)] text-[var(--color-text-primary,#0a0a0a)]'
                : 'border-transparent text-[var(--color-text-tertiary,#a3a3a3)]'">
        ${t("chat.tabs.chat")}
      </button>
      <button type="button"
              @click="$store.chatPopup.setActiveTab('inbox')"
              class="flex-1 appearance-none border-0 border-b-2 bg-transparent py-2.5 text-[13px] font-medium cursor-pointer focus:outline-none transition-colors"
              :class="$store.chatPopup.activeTab === 'inbox'
                ? 'border-[var(--color-primary-500,#f5b800)] text-[var(--color-text-primary,#0a0a0a)]'
                : 'border-transparent text-[var(--color-text-tertiary,#a3a3a3)]'">
        ${t("chat.tabs.inbox")}
        <template x-if="$store.chatPopup.totalUnread > 0">
          <span class="ml-1 inline-block rounded-full bg-[var(--color-error-500,#ef4444)] px-1.5 text-[9px] font-bold text-white"
                x-text="$store.chatPopup.totalUnread"></span>
        </template>
      </button>
    </div>
  `;
}
