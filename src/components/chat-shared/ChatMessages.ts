import { t } from "../../i18n";
import { ChatBubble } from "./ChatBubble";
import { OrderCard } from "./OrderCard";

export function ChatMessages(): string {
  return /* html */ `
    <div class="relative flex flex-1 min-h-0 flex-col">
      <!-- Error banner (sticky above scroll) -->
      <template x-if="$store.chatPopup.error">
        <div class="mx-4 mt-2 rounded-md bg-[var(--color-error-50,#fef2f2)] px-3 py-2 text-[12px] text-[var(--color-error-700,#b91c1c)]"
             x-text="$store.chatPopup.error"></div>
      </template>

      <!-- Scroll container -->
      <div class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5"
           x-ref="msgScroll">
        <template x-for="msg in $store.chatPopup.activeMessages" :key="msg.id">
          <div class="flex flex-col"
               :class="msg.body.type === 'order' ? 'items-end' : ''">
            <template x-if="msg.dateLabel">
              <div class="my-2 self-center w-fit rounded-full bg-black/5 px-2.5 py-[3px] text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]"
                   x-text="msg.dateLabel"></div>
            </template>

            <template x-if="msg.body.type === 'order'">
              <div>${OrderCard()}</div>
            </template>

            <template x-if="msg.body.type !== 'order'">
              <div>${ChatBubble()}</div>
            </template>
          </div>
        </template>

        <template x-if="!$store.chatPopup.loading && $store.chatPopup.activeMessages.length === 0 && !$store.chatPopup.error">
          <div class="grid flex-1 place-items-center text-[12px] text-[var(--color-text-tertiary,#a3a3a3)]">
            ${t("chat.emptyThread")}
          </div>
        </template>
      </div>
    </div>
  `;
}
