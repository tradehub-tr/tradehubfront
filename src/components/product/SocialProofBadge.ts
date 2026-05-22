/**
 * Social Proof Badge — rotating sosyal kanıt rozeti.
 *
 * Desktop: ProductInfo içinde fiyat/stok ile CTA arası
 * Mobile: MobileLayout'ta priceTiers ile sampleSection arası
 *
 * Alpine module: src/alpine/socialProofBadge.ts (G1)
 * Service: src/services/socialProofService.ts (F1)
 * Spec: docs/superpowers/specs/2026-05-20-product-social-proof-badges-design.md
 */

interface Props {
  listingId: string;
  supplierId: string;
  /** Outer wrapper Tailwind classes (e.g. "mx-4 mt-3" on mobile). */
  wrapperClass?: string;
}

export function SocialProofBadge(props: Props): string {
  const wrap = props.wrapperClass ?? "";
  // Single-quote'lar HTML attribute içinde sorun çıkarmasın diye escape ediyoruz.
  const initial = JSON.stringify({
    listingId: props.listingId,
    supplierId: props.supplierId,
  }).replace(/'/g, "&#39;");

  return /* html */ `
    <div class="${wrap}">
      <div
        id="pd-social-proof"
        x-data='socialProofBadge(${initial})'
        x-show="signals.length > 0"
        x-cloak
        class="relative flex items-center gap-2 py-2 px-2.5 bg-[var(--color-surface-raised,#f9fafb)]
               border-l-[3px] border-[var(--cta-primary,#d97706)] rounded-md
               text-xs font-medium text-[var(--color-text-body,#333333)] overflow-hidden h-[36px]"
        @mouseenter="pause()" @mouseleave="resume()"
        role="status" aria-live="polite"
      >
        <template x-for="(sig, idx) in signals" :key="sig.type">
          <div
            x-show="idx === currentIndex"
            x-transition:enter="transition-opacity duration-300"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition-opacity duration-200"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="absolute inset-0 px-2.5 py-2 flex items-center gap-2 w-full"
          >
            <span class="text-[var(--cta-primary,#d97706)] shrink-0 flex items-center" x-html="iconFor(sig.type)"></span>
            <span x-text="formatMessage(sig)"></span>
          </div>
        </template>
      </div>
    </div>
  `;
}
