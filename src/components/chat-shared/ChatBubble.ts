// Renders a single message bubble. Dispatches on `msg.body.type` via x-if.
// Caller must have an Alpine-scope variable `msg` (Message type).

export function ChatBubble(): string {
  return /* html */ `
    <div :class="msg.direction === 'me' ? 'flex justify-end' : 'flex justify-start'">
      <!-- System note -->
      <template x-if="msg.body.type === 'system'">
        <div class="my-1 max-w-[80%] self-center text-center text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]" x-text="msg.body.text"></div>
      </template>

      <template x-if="msg.body.type !== 'system'">
        <div class="flex max-w-[80%] items-end gap-2"
             :class="msg.direction === 'me' ? 'flex-row-reverse' : ''">
          <div class="size-6 shrink-0 rounded-full"
               :class="msg.direction === 'me' ? 'bg-[var(--color-secondary-200,#cccccc)]' : 'bg-[var(--color-primary-100,#ffefb3)]'"></div>

          <div :class="msg.direction === 'me' ? 'text-right' : 'text-left'">
            <!-- Text bubble -->
            <template x-if="msg.body.type === 'text'">
              <div class="inline-block rounded-xl border px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap break-words"
                   :class="msg.direction === 'me'
                     ? 'rounded-br-sm bg-[var(--color-primary-50,#fff8e1)] border-[var(--color-primary-200,#ffe57a)] text-[var(--color-text-primary,#0a0a0a)]'
                     : 'rounded-bl-sm bg-white border-[var(--color-border-default,#e5e5e5)] text-[var(--color-text-primary,#0a0a0a)]'"
                   x-text="msg.body.text"></div>
            </template>

            <!-- Image bubble -->
            <template x-if="msg.body.type === 'image'">
              <div class="inline-block rounded-xl border border-[var(--color-border-default,#e5e5e5)] bg-white p-1">
                <img :src="msg.body.url" :alt="msg.body.caption || ''"
                     class="block max-h-40 max-w-[180px] rounded-md object-cover" />
              </div>
            </template>

            <!-- File bubble -->
            <template x-if="msg.body.type === 'file'">
              <div class="inline-flex items-center gap-2.5 rounded-xl border border-[var(--color-border-default,#e5e5e5)] bg-white px-3 py-2.5 text-[12px]">
                <div class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--color-primary-50,#fff8e1)] text-[var(--color-primary-700,#a87c00)] text-[14px]">📄</div>
                <div class="min-w-0">
                  <div class="font-medium" x-text="msg.body.name"></div>
                  <div class="text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]"
                       x-text="(msg.body.size / 1024).toFixed(0) + ' KB · ' + (msg.body.mimeType || '')"></div>
                </div>
              </div>
            </template>

            <div class="mt-1 px-1 text-[10px] text-[var(--color-text-tertiary,#a3a3a3)]">
              <span x-text="msg.time"></span>
              <template x-if="msg.direction === 'me' && msg.read">
                <span> · Okundu</span>
              </template>
              <template x-if="msg.pending">
                <span> · ⏳</span>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  `;
}
