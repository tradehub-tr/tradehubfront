import {
  ChatHeader,
  ChatMessages,
  SecurityBanner,
  QuickActionChips,
  ChatComposer,
  ContextMenu,
} from "../chat-shared";
import { InboxPanel } from "./InboxPanel";
import { MobileTabs } from "./MobileTabs";

export function ChatPopup(): string {
  return /* html */ `
    <div x-data="chatPopupRoot"
         x-cloak
         x-show="$store.chatPopup.isOpen"
         x-transition.opacity
         class="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 md:items-center md:p-4"
         @click.self="$store.chatPopup.close()">

      <div class="relative flex w-full flex-col overflow-hidden bg-white md:rounded-xl md:shadow-2xl"
           :class="$store.chatPopup.isExpanded
             ? 'md:h-[90vh] md:w-[90vw] md:max-w-[1200px]'
             : 'md:h-[640px] md:max-h-[85vh] md:w-[960px] md:max-w-[92vw]'">

        ${MobileTabs()}

        <div class="relative flex flex-1 min-h-0 flex-col md:flex-row">

          <section class="flex flex-1 min-w-0 flex-col bg-[var(--color-surface-muted,#fafafa)]"
                   :class="$store.chatPopup.activeTab === 'inbox' ? 'hidden md:flex' : 'flex'">
            ${ChatHeader({ showBackButton: true })}
            ${ContextMenu()}
            ${SecurityBanner()}
            ${ChatMessages()}
            ${QuickActionChips()}
            ${ChatComposer()}
          </section>

          <div class="flex-1 md:flex-initial"
               :class="$store.chatPopup.activeTab === 'chat' ? 'hidden md:flex' : 'flex'">
            ${InboxPanel()}
          </div>
        </div>
      </div>
    </div>
  `;
}
