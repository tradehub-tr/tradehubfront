// Renders an embedded order summary inside the chat thread.
// Caller must have Alpine-scope variable `msg` whose `body.type === 'order'`.

export function OrderCard(): string {
  return /* html */ `
    <template x-if="msg.body.type === 'order'">
      <div class="self-end max-w-[80%] rounded-xl border border-[var(--color-border-default,#e5e5e5)] bg-white p-3 text-[12px]">
        <div class="mb-2 flex items-center justify-between font-semibold text-[13px] text-[var(--color-text-primary,#0a0a0a)]">
          <span>Sipariş Ver</span>
          <span class="text-[var(--color-text-tertiary,#a3a3a3)]">›</span>
        </div>

        <div class="mb-2.5 flex items-start gap-2.5 leading-snug">
          <img :src="msg.body.product.thumbnail" :alt="msg.body.product.title"
               class="size-11 shrink-0 rounded-md object-cover bg-[var(--color-surface-raised,#f5f5f5)]" />
          <div class="line-clamp-2" x-text="msg.body.product.title"></div>
        </div>

        <dl class="space-y-2 rounded-md bg-[var(--color-surface-muted,#fafafa)] px-3 py-2.5">
          <div>
            <dt class="text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]">Siparişi durumu</dt>
            <dd class="mt-0.5 font-medium text-[var(--color-text-primary,#0a0a0a)]" x-text="msg.body.status"></dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]">Toplam</dt>
            <dd class="mt-0.5 font-medium text-[var(--color-text-primary,#0a0a0a)]" x-text="msg.body.total"></dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]">Anlaşılan gönderim tarihi</dt>
            <dd class="mt-0.5 font-medium text-[var(--color-text-primary,#0a0a0a)]" x-text="msg.body.shippingDate"></dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-tertiary,#a3a3a3)]">Gönderim adresi</dt>
            <dd class="mt-0.5 font-medium text-[var(--color-text-primary,#0a0a0a)]" x-text="msg.body.address"></dd>
          </div>
        </dl>
      </div>
    </template>
  `;
}
