import { PinnedProduct } from "./PinnedProduct";
import { AttachmentToolbar } from "./AttachmentToolbar";
import { EmojiPicker } from "./sub/EmojiPicker";
import { PhotoSourceMenu } from "./sub/PhotoSourceMenu";
import { CallMenu } from "./sub/CallMenu";
import { BusinessCardForm } from "./sub/BusinessCardForm";
import { getLucideIcon } from "../icons/lucideIcons";
import { t } from "../../i18n";

export function ChatComposer(): string {
  const expandIcon = getLucideIcon("maximize-2", "w-4 h-4");
  return /* html */ `
    <div class="relative flex flex-col gap-2.5 border-t border-[var(--color-border-light,#f0f0f0)] bg-white px-4 pt-3 pb-3.5 flex-shrink-0">
      ${PinnedProduct()}
      ${AttachmentToolbar()}

      ${EmojiPicker()}
      ${PhotoSourceMenu()}
      ${CallMenu()}
      ${BusinessCardForm()}

      <div class="relative flex min-h-[88px] flex-col rounded-lg border border-[var(--color-border-light,#f0f0f0)] bg-[var(--color-surface-muted,#fafafa)] px-3.5 py-3">
        <button type="button"
                class="absolute right-2 top-2 appearance-none border-0 bg-transparent p-1 cursor-pointer text-[var(--color-text-tertiary,#a3a3a3)] hover:text-[var(--color-text-primary,#0a0a0a)] focus:outline-none"
                @click="$store.chatPopup.toggleExpanded()"
                aria-label="${t("chat.aria.expand")}">${expandIcon}</button>

        <textarea
          x-model="$store.chatPopup.draft"
          @keydown.enter="if (!$event.shiftKey) { $event.preventDefault(); $store.chatPopup.sendMessage(); }"
          rows="2"
          placeholder="${t("chat.placeholderInput")}"
          class="flex-1 resize-none border-0 bg-transparent text-[13px] leading-snug text-[var(--color-text-primary,#0a0a0a)] placeholder:text-[var(--color-text-tertiary,#a3a3a3)] focus:outline-none pr-8"></textarea>

        <button type="button"
                @click="$store.chatPopup.sendMessage()"
                :disabled="!$store.chatPopup.draft.trim() || $store.chatPopup.sending"
                class="ml-auto mt-2 appearance-none rounded-full px-5 py-1.5 text-[12px] font-semibold cursor-pointer focus:outline-none transition-colors"
                :class="$store.chatPopup.draft.trim() && !$store.chatPopup.sending
                  ? 'bg-[var(--color-orange-500,#ea580c)] text-white hover:bg-[var(--color-orange-600,#c2410c)]'
                  : 'bg-[var(--color-surface-raised,#f5f5f5)] text-[var(--color-text-tertiary,#a3a3a3)] cursor-not-allowed'">
          ${t("chat.send")}
        </button>
      </div>
    </div>
  `;
}
