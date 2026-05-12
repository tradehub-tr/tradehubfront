import { getLucideIcon } from "../icons/lucideIcons";
import { t } from "../../i18n";

export function PinnedProduct(): string {
  const closeIcon = getLucideIcon("x", "w-4 h-4");
  return /* html */ `
    <template x-if="$store.chatPopup.pinnedProduct">
      <div class="flex items-center gap-2.5 border-b border-[var(--color-border-light,#f0f0f0)] pb-2.5">
        <img :src="$store.chatPopup.pinnedProduct.thumbnail"
             alt=""
             class="size-9 shrink-0 rounded bg-[var(--color-surface-raised,#f5f5f5)] object-cover" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-[11px] text-[var(--color-text-primary,#0a0a0a)]">
            <span class="text-[var(--color-text-tertiary,#a3a3a3)] mr-1">${t("chat.product")}</span>
            <span x-text="$store.chatPopup.pinnedProduct.title"></span>
          </div>
          <div class="mt-0.5 flex items-baseline gap-2">
            <span class="text-[13px] font-bold text-[var(--color-text-primary,#0a0a0a)]" x-text="$store.chatPopup.pinnedProduct.price"></span>
            <span class="text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]">| ${t("chat.minOrder")}: <span x-text="$store.chatPopup.pinnedProduct.minOrder"></span></span>
          </div>
        </div>
        <button type="button"
                @click="$store.chatPopup.removePinnedProduct()"
                class="appearance-none border-0 bg-transparent p-1 cursor-pointer text-[var(--color-text-tertiary,#a3a3a3)] hover:text-[var(--color-text-primary,#0a0a0a)] focus:outline-none"
                aria-label="Kaldır">
          ${closeIcon}
        </button>
      </div>
    </template>
  `;
}
