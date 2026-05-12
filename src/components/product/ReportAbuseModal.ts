// @ts-nocheck
/**
 * ReportAbuseModal — yorumu şikayet et.
 *
 * Akış:
 *   1. `report-abuse-modal-show` event ile aç (detail: { reviewId })
 *   2. Sebep seçimi (spam, hakaret, fake, alakasız, diğer)
 *   3. Opsiyonel not
 *   4. Submit → backend `report_abuse` → `abuse-reported` event
 */

import Alpine from "alpinejs";
import { reportReviewAbuse } from "../../services/listingService";
import { showToast } from "../../utils/toast";

interface ReportAbuseState {
  open: boolean;
  loading: boolean;
  reviewId: string;
  reason: string;
  note: string;
  errorMsg: string;
  init(): void;
  show(detail: { reviewId: string }): void;
  close(): void;
  submit(): Promise<void>;
}

// Backend valid_reasons = {"Off-topic", "Spam", "Hate Speech", "Personal Info", "Fake", "Other"}
const REASONS = [
  { value: "Spam", label: "Spam / Reklam" },
  { value: "Hate Speech", label: "Hakaret / Nefret İçeriği" },
  { value: "Fake", label: "Sahte / Yanıltıcı" },
  { value: "Off-topic", label: "Ürünle Alakasız" },
  { value: "Personal Info", label: "Kişisel Bilgi İçeriyor" },
  { value: "Other", label: "Diğer" },
];

export function registerReportAbuseModal(): void {
  Alpine.data("reportAbuseModal", (): ReportAbuseState => ({
    open: false,
    loading: false,
    reviewId: "",
    reason: "Spam",
    note: "",
    errorMsg: "",
    init() {
      window.addEventListener("report-abuse-modal-show", (e: Event) => {
        const ce = e as CustomEvent<{ reviewId: string }>;
        this.reviewId = ce.detail.reviewId;
        this.reason = "Spam";
        this.note = "";
        this.errorMsg = "";
        this.open = true;
      });
    },
    show(detail) {
      this.reviewId = detail.reviewId;
      this.reason = "Spam";
      this.note = "";
      this.errorMsg = "";
      this.open = true;
    },
    close() {
      this.open = false;
    },
    async submit() {
      if (!this.reviewId) return;
      this.loading = true;
      this.errorMsg = "";
      try {
        await reportReviewAbuse(this.reviewId, this.reason, this.note.trim());
        showToast({
          message: "Şikayetiniz alındı, moderatörler inceleyecek.",
          type: "success",
        });
        window.dispatchEvent(
          new CustomEvent("abuse-reported", { detail: { reviewId: this.reviewId } })
        );
        this.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Hata";
        this.errorMsg = msg;
        showToast({ message: msg, type: "error" });
      } finally {
        this.loading = false;
      }
    },
  }));
}

export function ReportAbuseModal(): string {
  const reasonOptions = REASONS.map(
    (r) =>
      `<label class="flex items-center gap-2 py-2 cursor-pointer">
        <input type="radio" name="abuse-reason" :value="'${r.value}'" x-model="reason" class="w-4 h-4 text-primary-500 focus:ring-primary-500">
        <span class="text-sm text-secondary-700">${r.label}</span>
      </label>`
  ).join("");
  return `
    <div
      id="rv-report-abuse-modal"
      x-data="reportAbuseModal"
      x-show="open"
      x-cloak
      x-transition.opacity
      @click.self="close()"
      @keydown.escape.window.capture="if (open) { $event.stopImmediatePropagation(); close() }"
      class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
    >
      <div
        x-show="open"
        x-transition.scale.origin.center
        class="bg-surface rounded-xl shadow-modal w-full max-w-md relative"
      >
        <div class="border-b border-border-default px-5 py-3.5 flex items-center justify-between">
          <div class="text-base font-semibold text-secondary-900">Yorumu Şikayet Et</div>
          <button
            type="button"
            @click="close()"
            class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 text-secondary-400 hover:text-secondary-900"
            aria-label="Kapat"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="submit()" class="px-5 py-4 space-y-3">
          <div>
            <p class="text-[12px] text-secondary-500 mb-2">Bu yorumu neden şikayet ediyorsunuz?</p>
            <div class="space-y-0.5">${reasonOptions}</div>
          </div>
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">Açıklama <span class="text-secondary-400">(opsiyonel)</span></label>
            <textarea
              x-model="note"
              rows="3"
              maxlength="500"
              placeholder="Detaylı açıklama..."
              class="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:border-primary-500"
            ></textarea>
          </div>
          <p x-show="errorMsg" x-text="errorMsg" class="text-sm text-red-600"></p>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              @click="close()"
              class="h-9 px-4 rounded-lg border border-border-default text-sm text-secondary-700 hover:bg-black/5"
            >İptal</button>
            <button
              type="submit"
              :disabled="loading"
              class="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <svg x-show="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span x-text="loading ? 'Gönderiliyor' : 'Şikayet Et'"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function openReportAbuseModal(reviewId: string): void {
  window.dispatchEvent(
    new CustomEvent("report-abuse-modal-show", { detail: { reviewId } })
  );
}
