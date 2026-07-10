/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Alpine.js modül tipleri tam değil; runtime davranış doğrulanmış
/**
 * QAModal — Mobile-first full-screen modal for Q&A section.
 *
 * Storefront'ta desktop için ProductReviews içindeki "Soru & Cevap" tab
 * yeterli, ama mobile layout'ta Q&A erişimi yok. Bu modal o boşluğu doldurur.
 *
 * Akış:
 *   - "qa-modal-show" event ile aç
 *   - İçinde ProductQA component'i mount edilir (Alpine.data="productQA")
 *   - ESC + overlay click + X butonu ile kapanır
 */

import Alpine from "alpinejs";
import { t } from "../../i18n";
import { ProductQA, registerProductQA } from "./ProductQA";

interface QAModalState {
  open: boolean;
  init(): void;
  show(): void;
  close(): void;
}

// ProductQA Alpine.data'sını kayıt et (eğer ekstra mount lazımsa)
let _qaRegistered = false;
function ensureProductQARegistered(): void {
  if (_qaRegistered) return;
  try {
    registerProductQA();
    _qaRegistered = true;
  } catch {
    // Zaten kayıtlıysa Alpine atar — sessizce yut
    _qaRegistered = true;
  }
}

export function registerQAModal(): void {
  ensureProductQARegistered();
  Alpine.data(
    "qaModal",
    (): QAModalState => ({
      open: false,
      init() {
        window.addEventListener("qa-modal-show", () => this.show());
        window.addEventListener("qa-modal-hide", () => this.close());
      },
      show() {
        this.open = true;
        document.body.style.overflow = "hidden";
      },
      close() {
        this.open = false;
        document.body.style.overflow = "";
      },
    })
  );
}

export function QAModal(): string {
  return `
    <div
      id="rv-qa-modal"
      x-data="qaModal"
      x-show="open"
      x-cloak
      x-transition.opacity
      @click.self="close()"
      @keydown.escape.window.capture="if (open) { $event.stopImmediatePropagation(); close() }"
      class="fixed inset-0 bg-black/50 z-[210] flex items-end sm:items-center justify-center"
    >
      <div
        x-show="open"
        x-transition:enter="transition ease-out duration-200 motion-reduce:transition-none"
        x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 motion-reduce:translate-y-0 motion-reduce:scale-100"
        x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
        x-transition:leave="transition ease-out duration-150 motion-reduce:transition-none"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 motion-reduce:translate-y-0 motion-reduce:scale-100"
        class="bg-surface w-full sm:max-w-2xl sm:rounded-md rounded-t-md max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-modal"
      >
        <!-- Header (sticky) -->
        <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-default shrink-0">
          <h2 class="text-[15px] sm:text-base font-semibold text-secondary-900">${t("product.reviewWrite.qaTab")}</h2>
          <button
            type="button"
            @click="close()"
            class="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-secondary-400 hover:text-secondary-900 transition-colors shrink-0"
            aria-label="${t("product.reviewWrite.close")}"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="w-4.5 h-4.5 sm:w-5 sm:h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body — ProductQA komponentini içinde render et -->
        <div class="overflow-y-auto px-4 pb-4 sm:pb-6 flex-1">
          ${ProductQA()}
        </div>
      </div>
    </div>
  `;
}

export function showQAModal(): void {
  window.dispatchEvent(new CustomEvent("qa-modal-show"));
}

export function hideQAModal(): void {
  window.dispatchEvent(new CustomEvent("qa-modal-hide"));
}
