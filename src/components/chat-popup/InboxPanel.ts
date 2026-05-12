import { getLucideIcon } from "../icons/lucideIcons";
import { t } from "../../i18n";

/**
 * Conversation list sidebar for the chat popup overlay.
 *
 * Note on tag rendering: the project's i18n setup (src/i18n/index.ts) does NOT
 * register `Alpine.magic('t', ...)`, so we cannot call `$t(...)` inside Alpine
 * expressions. Instead, we resolve the four tag labels at TS template-string
 * compile time and look them up via an inline object literal in x-text. The
 * tr/en values already include bracket wrapping (e.g. "[Okunmamış]"), so no
 * additional bracket concatenation is required.
 */
export function InboxPanel(): string {
  const searchIcon = getLucideIcon("search", "w-4 h-4");
  const messageIcon = getLucideIcon("message-circle", "w-4 h-4");

  const tagUnread = t("chat.tag.unread");
  const tagOrder = t("chat.tag.order");
  const tagQuote = t("chat.tag.quote");
  const tagRfq = t("chat.tag.rfq");

  return /* html */ `
    <aside class="flex w-full flex-col bg-[var(--color-surface-muted,#fafafa)] md:w-[300px] md:border-l md:border-[var(--color-border-light,#f0f0f0)]">
      <!-- Header -->
      <div class="flex items-center gap-2 border-b border-[var(--color-border-light,#f0f0f0)] bg-white px-4 py-3">
        <span class="text-[var(--color-text-secondary,#525252)]">${messageIcon}</span>
        <div class="text-[14px] font-semibold">${t("chat.popupTitle")}</div>
        <span class="ml-1 size-1.5 rounded-full bg-[var(--color-success-500,#22c55e)]"></span>
        <div class="ml-auto flex items-center gap-2 text-[var(--color-text-tertiary,#a3a3a3)]">
          <button type="button"
                  class="appearance-none border-0 bg-transparent p-1 cursor-pointer rounded hover:bg-[var(--color-surface-raised,#f5f5f5)] focus:outline-none"
                  aria-label="${t("chat.search")}">${searchIcon}</button>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        <template x-for="conv in $store.chatPopup.conversations" :key="conv.id">
          <button type="button"
                  @click="$store.chatPopup.setActiveConversation(conv.id)"
                  class="flex w-full items-start gap-2.5 border-0 border-b border-[var(--color-border-light,#f0f0f0)] bg-transparent px-3.5 py-3 text-left cursor-pointer transition-colors focus:outline-none"
                  :class="$store.chatPopup.activeConversationId === conv.id
                    ? 'bg-[var(--color-surface-raised,#f5f5f5)]'
                    : 'hover:bg-[var(--color-surface-muted,#fafafa)]'">
            <div class="size-9 shrink-0 rounded-full bg-[var(--color-primary-100,#ffefb3)] overflow-hidden">
              <template x-if="conv.avatar">
                <img :src="conv.avatar" alt="" class="size-full object-cover" />
              </template>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
                <span class="truncate text-[12.5px] font-semibold text-[var(--color-text-primary,#0a0a0a)]" x-text="conv.name"></span>
                <span class="shrink-0 text-[10.5px] text-[var(--color-text-tertiary,#a3a3a3)]" x-text="conv.lastTime"></span>
              </div>
              <div class="truncate text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]" x-text="conv.company"></div>
              <div class="mt-1 flex items-center gap-1 text-[11px]">
                <!--
                  Tag labels are resolved at TS-template compile time via the
                  lookup object below (i18n keys already include brackets).
                  See module-level comment above for rationale.
                -->
                <!-- TODO(future): show pin icon when conv.pinned is true -->
                <template x-for="tag in conv.tags" :key="tag">
                  <span class="font-semibold text-[var(--color-orange-500,#ea580c)]"
                        x-text="({ unread: '${tagUnread}', order: '${tagOrder}', quote: '${tagQuote}', rfq: '${tagRfq}' })[tag] || ''"></span>
                </template>
                <span class="truncate text-[var(--color-text-secondary,#525252)]" x-text="conv.lastMessage"></span>
                <template x-if="conv.unread > 0">
                  <span class="ml-auto rounded-full bg-[var(--color-error-500,#ef4444)] px-1.5 text-[9px] font-bold text-white"
                        x-text="conv.unread"></span>
                </template>
              </div>
            </div>
          </button>
        </template>

        <template x-if="$store.chatPopup.conversations.length === 0 && !$store.chatPopup.loading">
          <div class="grid place-items-center py-12 text-[12px] text-[var(--color-text-tertiary,#a3a3a3)]">
            ${t("chat.emptyInbox")}
          </div>
        </template>
      </div>
    </aside>
  `;
}
