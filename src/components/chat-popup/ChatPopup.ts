import {
  ChatHeader,
  ChatMessages,
  QuickActionChips,
  ChatComposer,
  ContextMenu,
} from "../chat-shared";
import { InboxPanel } from "./InboxPanel";
import { MobileTabs } from "./MobileTabs";

export function ChatPopup(): string {
  // TODO(batch-8): add role="dialog" aria-modal="true" aria-labelledby="chat-popup-title"
  //                 + focus management (move focus on open, restore on close).
  //                 Existing modals (cart drawer, etc.) also lack this; address holistically.
  return /* html */ `
    <div x-data="chatPopupRoot"
         x-cloak
         x-show="$store.chatPopup.isOpen"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 translate-y-4"
         x-transition:enter-end="opacity-100 translate-y-0"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100 translate-y-0"
         x-transition:leave-end="opacity-0 translate-y-4"
         class="fixed inset-0 z-[100] flex md:inset-auto md:bottom-0 md:right-4">

      <div class="relative flex h-full w-full flex-col overflow-hidden bg-white md:rounded-t-xl md:shadow-2xl"
           :class="$store.chatPopup.isExpanded
             ? 'md:h-[92vh] md:max-h-[calc(100vh-1rem)] md:w-[1200px] md:max-w-[calc(100vw-2rem)]'
             : 'md:h-[620px] md:max-h-[calc(100vh-1rem)] md:w-[920px] md:max-w-[calc(100vw-2rem)]'">

        ${MobileTabs()}

        <div class="relative flex flex-1 min-h-0 flex-col md:flex-row">

          <section class="relative flex flex-1 min-w-0 flex-col bg-[var(--color-surface-muted,#fafafa)]"
                   :class="$store.chatPopup.activeTab === 'inbox' ? 'hidden md:flex' : 'flex'">
            ${ChatHeader({ showBackButton: true })}
            ${ContextMenu()}
            ${ChatMessages()}
            ${QuickActionChips()}
            ${ChatComposer()}
          </section>

          <div class="flex min-h-0 flex-1 md:flex-initial"
               :class="$store.chatPopup.activeTab === 'chat' ? 'hidden md:flex' : 'flex'">
            ${InboxPanel()}
          </div>
        </div>
      </div>
    </div>
  `;
}
