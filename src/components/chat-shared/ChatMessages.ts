import { ChatBubble } from "./ChatBubble";
import { OrderCard } from "./OrderCard";

export function ChatMessages(): string {
  return /* html */ `
    <div class="relative flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5"
         x-ref="msgScroll">
      <template x-for="msg in $store.chatPopup.activeMessages" :key="msg.id">
        <div>
          <template x-if="msg.dateLabel">
            <div class="my-2 self-center mx-auto w-fit rounded-full bg-black/5 px-2.5 py-[3px] text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]"
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

      <template x-if="!$store.chatPopup.loading && $store.chatPopup.activeMessages.length === 0">
        <div class="grid flex-1 place-items-center text-[12px] text-[var(--color-text-tertiary,#a3a3a3)]">
          Henüz mesaj yok. Selamlaşmakla başlayın 👋
        </div>
      </template>

      <template x-if="$store.chatPopup.error">
        <div class="self-center text-[12px] text-[var(--color-error-700,#b91c1c)]" x-text="$store.chatPopup.error"></div>
      </template>
    </div>
  `;
}
