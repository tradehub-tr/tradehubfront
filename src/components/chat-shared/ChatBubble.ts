// Renders a single message bubble. Dispatches on msg.body.type for system/text/image/file.
// Caller must have an Alpine-scope variable `msg` (Message); parent should ensure
// msg.body.type !== 'order' before invoking (orders use OrderCard).

import { t } from "../../i18n";
import { getLucideIcon } from "../icons/lucideIcons";

export function ChatBubble(): string {
  const fileIcon = getLucideIcon("file-text", "w-4 h-4 text-[var(--color-primary-700,#a87c00)]");
  return /* html */ `
    <div :class="msg.direction === 'me' ? 'flex justify-end' : 'flex justify-start'">
      <!-- System note -->
      <template x-if="msg.body.type === 'system'">
        <div class="my-1 max-w-[80%] mx-auto text-center text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]" x-text="msg.body.text"></div>
      </template>

      <template x-if="msg.body.type !== 'system'">
        <div class="flex max-w-[80%] items-end gap-2"
             :class="msg.direction === 'me' ? 'flex-row-reverse' : ''">
          <div class="size-6 shrink-0 rounded-full"
               :class="msg.direction === 'me' ? 'bg-[var(--color-secondary-200,#cccccc)]' : 'bg-[var(--color-primary-100,#ffefb3)]'"></div>

          <div :class="msg.direction === 'me' ? 'text-end' : 'text-start'">
            <!-- Text -->
            <template x-if="msg.body.type === 'text'">
              <div class="inline-block rounded-xl border px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap break-words"
                   :class="msg.direction === 'me'
                     ? 'rounded-ee-sm bg-[var(--color-primary-50,#fff8e1)] border-[var(--color-primary-200,#ffe57a)] text-[var(--color-text-primary,#0a0a0a)]'
                     : 'rounded-es-sm bg-white border-[var(--color-border-default,#e5e5e5)] text-[var(--color-text-primary,#0a0a0a)]'">
                <span x-text="msg.body.text"></span>
                <template x-if="msg.videoCallUrl">
                  <a :href="msg.videoCallUrl" target="_blank" rel="noopener noreferrer"
                     class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-[12px] font-medium text-white no-underline hover:bg-green-600 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/></svg>
                    Görüşmeye Katıl
                  </a>
                </template>
              </div>
            </template>

            <!-- Image -->
            <template x-if="msg.body.type === 'image'">
              <a :href="msg.body.url" target="_blank" rel="noopener noreferrer"
                 class="inline-block rounded-xl border border-[var(--color-border-default,#e5e5e5)] bg-white p-1 no-underline">
                <img :src="msg.body.url" :alt="msg.body.caption || ''"
                     class="block max-h-40 max-w-[180px] rounded-md object-cover" />
              </a>
            </template>

            <!-- File -->
            <template x-if="msg.body.type === 'file'">
              <a :href="msg.body.url" target="_blank" rel="noopener noreferrer" :download="msg.body.name"
                 class="inline-flex items-center gap-2.5 rounded-xl border border-[var(--color-border-default,#e5e5e5)] bg-white px-3 py-2.5 text-[12px] no-underline text-[var(--color-text-primary,#0a0a0a)] hover:bg-[var(--color-primary-50,#fff8e1)] transition-colors">
                <div class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--color-primary-50,#fff8e1)]">
                  ${fileIcon}
                </div>
                <div class="min-w-0">
                  <div class="font-medium" x-text="msg.body.name"></div>
                  <div class="text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]"
                       x-text="(msg.body.size / 1024).toFixed(0) + ' KB · ' + (msg.body.mimeType || '')"></div>
                </div>
              </a>
            </template>

            <div class="mt-1 px-1 text-[10px] text-[var(--color-text-tertiary,#a3a3a3)]">
              <span x-text="msg.time"></span>
              <template x-if="msg.direction === 'me' && msg.read">
                <span> · ${t("chat.read")}</span>
              </template>
              <template x-if="msg.pending">
                <span> · ${t("chat.pending")}</span>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  `;
}
