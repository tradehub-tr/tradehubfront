// Renders a single message bubble. Dispatches on msg.body.type for system/text/image/file.
// Caller must have an Alpine-scope variable `msg` (Message); parent should ensure
// msg.body.type !== 'order' before invoking (orders use OrderCard).
//
// Görsel dil: "Kurumsal Mürekkep" varyantı (kullanıcı onaylı mock, 2026-07-10) —
// kendi mesaj mürekkep-koyu, satıcı nötr gri, kenarlıksız; sarı yalnız okundu
// tiklerinde. Balon renkleri remote theme'e bağlanmaz (marka kararı, sabit).

import { t } from "../../i18n";
import { getLucideIcon } from "../icons/lucideIcons";

const CHECK_DOUBLE = /* html */ `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>`;
const CHECK_SINGLE = /* html */ `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

export function ChatBubble(): string {
  const fileIcon = getLucideIcon("file-text", "w-4 h-4 text-[var(--color-primary-700,#a87c00)]");
  const productIcon = getLucideIcon("package", "w-3.5 h-3.5");
  return /* html */ `
    <div :class="msg.direction === 'me' ? 'flex justify-end' : 'flex justify-start'">
      <!-- System note -->
      <template x-if="msg.body.type === 'system'">
        <div class="my-1 max-w-[80%] mx-auto text-center text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]" x-text="msg.body.text"></div>
      </template>

      <template x-if="msg.body.type !== 'system'">
        <div class="max-w-[82%] min-w-0">
          <div class="min-w-0" :class="msg.direction === 'me' ? 'text-end' : 'text-start'">
            <!-- Text -->
            <template x-if="msg.body.type === 'text'">
              <!-- pre-wrap YALNIZ metin span'ında — konteynerde olursa template
                   literal'in girinti/satır sonları da render edilir (dev boşluk bug'ı) -->
              <!-- rounded-[12px]: bu projede rounded-xl 32px'e map'li (--radius-xl),
                   onaylı mock 12px + 4px kuyruk köşesi -->
              <div class="inline-block max-w-full rounded-[12px] px-3 py-2 text-[13px] leading-snug break-words text-start"
                   :class="msg.direction === 'me'
                     ? 'rounded-ee-sm bg-[#22201c] text-[#f7f6f3]'
                     : 'rounded-es-sm bg-[#f2f2f0] text-[var(--color-text-primary,#0a0a0a)]'">
                <!-- max-w-60: çip balonun intrinsic genişliğini belirlemesin —
                     uzun etikette balon konteynerden taşıp kırpılıyordu -->
                <template x-if="msg.productRef">
                  <a :href="msg.productRef.url || null" target="_blank" rel="noopener noreferrer"
                     class="mb-1.5 flex max-w-60 items-center gap-2 border-b pb-1.5 text-[11px] leading-tight no-underline"
                     :class="msg.direction === 'me'
                       ? 'border-white/20 text-white/85 hover:text-white'
                       : 'border-black/10 text-[var(--color-text-secondary,#525252)] hover:text-[var(--color-text-primary,#0a0a0a)]'">
                    <span class="flex size-6 shrink-0 items-center justify-center rounded-md"
                          :class="msg.direction === 'me' ? 'bg-white/10 text-[#f5b800]' : 'bg-black/5 text-[#857216]'">
                      ${productIcon}
                    </span>
                    <span class="min-w-0 truncate" x-text="msg.productRef.label"></span>
                  </a>
                </template>
                <span class="whitespace-pre-wrap" x-text="msg.body.text"></span>
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
                 class="inline-block rounded-[12px] border border-[var(--color-border-default,#e5e5e5)] bg-white p-1 no-underline">
                <img :src="msg.body.url" :alt="msg.body.caption || ''"
                     class="block max-h-40 max-w-[180px] rounded-md object-cover" />
              </a>
            </template>

            <!-- File -->
            <template x-if="msg.body.type === 'file'">
              <a :href="msg.body.url" target="_blank" rel="noopener noreferrer" :download="msg.body.name"
                 class="inline-flex items-center gap-2.5 rounded-[12px] border border-[var(--color-border-default,#e5e5e5)] bg-white px-3 py-2.5 text-[12px] no-underline text-[var(--color-text-primary,#0a0a0a)] hover:bg-[var(--color-primary-50,#fff8e1)] transition-colors">
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

            <!-- Meta: saat + (me) iletildi/okundu tiki — mock'taki gibi balon dışında -->
            <div class="mt-1 flex items-center gap-1 px-0.5 text-[10.5px] leading-none tabular-nums text-[#6f6f6f]"
                 :class="msg.direction === 'me' ? 'justify-end' : 'justify-start'">
              <span x-text="msg.time"></span>
              <template x-if="msg.direction === 'me' && msg.read && !msg.pending">
                <span class="text-[#d39c00]" role="img" aria-label="${t("chat.read")}">${CHECK_DOUBLE}</span>
              </template>
              <template x-if="msg.direction === 'me' && (!msg.read || msg.pending)">
                <span class="text-[#9b9b95]" role="img" aria-label="${t("chat.pending")}">${CHECK_SINGLE}</span>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  `;
}
