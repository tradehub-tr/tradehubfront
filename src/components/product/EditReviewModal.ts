/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Alpine.js modül tipleri tam değil; runtime davranış doğrulanmış
/**
 * EditReviewModal — Storefront kendi yorumunu düzenleme akışı.
 *
 * Akış:
 *   1. `edit-review-modal-show` event ile aç (detail: { reviewId, body })
 *   2. Yorum metnini düzenle (min 20 karakter)
 *   3. Submit → backend `update_review` → düzenlenen yorum tekrar moderasyona
 *      döner (status="Pending") → close + `review-submitted` event
 *
 * Not: Eski `window.prompt` tabanlı akışın yerini alır (tutarlı modal UI).
 */

import Alpine from "alpinejs";
import { t } from "../../i18n";
import { updateOwnReview } from "../../services/listingService";
import { showToast } from "../../utils/toast";

interface EditReviewState {
  open: boolean;
  loading: boolean;
  errorMsg: string;
  reviewId: string;
  body: string;
  init(): void;
  show(detail: { reviewId: string; body: string }): void;
  close(): void;
  bodyValid(): boolean;
  submit(): Promise<void>;
}

export function registerEditReviewModal(): void {
  Alpine.data(
    "editReviewModal",
    (): EditReviewState => ({
      open: false,
      loading: false,
      errorMsg: "",
      reviewId: "",
      body: "",
      init() {
        window.addEventListener("edit-review-modal-show", (e: Event) => {
          const ce = e as CustomEvent<{ reviewId: string; body: string }>;
          this.show(ce.detail);
        });
      },
      show(detail) {
        this.reviewId = detail.reviewId || "";
        this.body = detail.body || "";
        this.errorMsg = "";
        this.loading = false;
        this.open = true;
      },
      close() {
        this.open = false;
      },
      bodyValid() {
        return this.body.trim().length >= 20;
      },
      async submit() {
        if (!this.reviewId) return;
        this.errorMsg = "";
        if (!this.bodyValid()) {
          this.errorMsg = t("prodUi.reviewMinChars");
          return;
        }
        this.loading = true;
        try {
          await updateOwnReview({ name: this.reviewId, body: this.body.trim() });
          showToast({ message: t("prodUi.reviewUpdated"), type: "success" });
          // Listeyi yenile (reload event listener tetikler)
          window.dispatchEvent(
            new CustomEvent("review-submitted", { detail: { name: this.reviewId } })
          );
          this.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : t("prodUi.editFailed");
          this.errorMsg = msg;
          showToast({ message: msg, type: "error" });
        } finally {
          this.loading = false;
        }
      },
    })
  );
}

export function EditReviewModal(): string {
  return `
    <div
      id="rv-edit-review-modal"
      x-data="editReviewModal"
      x-show="open"
      x-cloak
      x-transition.opacity
      @click.self="close()"
      @keydown.escape.window.capture="if (open) { $event.stopImmediatePropagation(); close() }"
      class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
    >
      <div
        x-show="open"
        x-transition:enter="transition ease-out duration-200 origin-center motion-reduce:transition-none"
        x-transition:enter-start="opacity-0 scale-95 motion-reduce:scale-100"
        x-transition:enter-end="opacity-100 scale-100"
        x-transition:leave="transition ease-out duration-150 origin-center motion-reduce:transition-none"
        x-transition:leave-start="opacity-100 scale-100"
        x-transition:leave-end="opacity-0 scale-95 motion-reduce:scale-100"
        class="bg-surface rounded-xl shadow-modal w-full max-w-md relative max-sm:rounded-none max-sm:max-w-full max-sm:h-screen max-sm:flex max-sm:flex-col"
      >
        <!-- Header -->
        <div class="border-b border-border-default px-5 py-3.5 flex items-center justify-between">
          <div class="text-base font-semibold text-secondary-900">${t("prodUi.editReviewModalTitle")}</div>
          <button
            type="button"
            @click="close()"
            class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 text-secondary-400 hover:text-secondary-900 transition-colors"
            aria-label="${t("prodUi.close")}"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body -->
        <form @submit.prevent="submit()" class="px-5 py-4 space-y-3 max-sm:flex-1 max-sm:overflow-y-auto">
          <!-- Re-moderation bilgi notu -->
          <div class="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div class="text-[12px] leading-snug text-amber-800">
              <span class="block">${t("prodUi.editReviewRemoderationNote")}</span>
              <span class="block text-amber-700/80">${t("prodUi.editReviewWindowNote")}</span>
            </div>
          </div>

          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">${t("prodUi.editReviewBodyLabel")}</label>
            <textarea
              x-model="body"
              rows="5"
              maxlength="2000"
              placeholder="${t("product.reviewWrite.commentPlaceholder")}"
              class="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-surface focus:outline-none focus:border-primary-500 resize-vertical"
            ></textarea>
            <div class="flex items-center justify-between text-[11px] mt-1">
              <span :class="bodyValid() ? 'text-emerald-600' : 'text-secondary-400'" x-text="body.length + ' ${t("product.reviewWrite.charSuffix")}'"></span>
              <span class="text-secondary-400">${t("product.reviewWrite.maxChars")}</span>
            </div>
          </div>

          <p x-show="errorMsg" x-text="errorMsg" class="text-sm text-red-600"></p>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              @click="close()"
              class="h-9 px-4 rounded-lg border border-border-default text-sm font-medium text-secondary-700 hover:bg-black/5 transition-colors"
            >${t("prodUi.cancel")}</button>
            <button
              type="submit"
              :disabled="loading || !bodyValid()"
              class="h-9 px-5 rounded-lg bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-sm font-semibold border border-(--btn-border-color,#d39c00) disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-2"
            >
              <svg x-show="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span x-text="loading ? '${t("prodUi.submitting")}' : '${t("prodUi.editReviewSave")}'"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/** Modal trigger helper */
export function openEditReviewModal(detail: { reviewId: string; body: string }): void {
  window.dispatchEvent(new CustomEvent("edit-review-modal-show", { detail }));
}
