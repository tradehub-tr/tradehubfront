// @ts-nocheck
/**
 * ProductQA — Soru/Cevap bölümü.
 *
 * Akış:
 *   1. Sayfa yüklendiğinde getProductQA(listing) çekilir
 *   2. Soru kartları listelenir (cevaplar nested)
 *   3. Login'li kullanıcı yeni soru sorabilir
 *   4. Submit → submitProductQuestion → liste yenilenir
 */

import Alpine from "alpinejs";
import {
  getProductQA,
  submitProductQuestion,
  voteQAHelpful,
  type ProductQuestion,
} from "../../services/listingService";
import { showToast } from "../../utils/toast";
import { openLoginModal } from "./LoginModal";
import { getCurrentProduct } from "../../alpine/product";

interface QAState {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  listingId: string;
  questions: ProductQuestion[];
  total: number;
  question: string;
  errorMsg: string;
  isLoggedIn: boolean;
  init(): void;
  load(listingId: string): Promise<void>;
  submitQuestion(): Promise<void>;
  voteQuestion(q: ProductQuestion): Promise<void>;
  voteAnswer(a: ProductQuestion["answers"][number]): Promise<void>;
  formatDate(s: string): string;
}

export function registerProductQA(): void {
  Alpine.data("productQA", (): QAState => ({
    open: false,
    loading: false,
    submitting: false,
    listingId: "",
    questions: [],
    total: 0,
    question: "",
    errorMsg: "",
    isLoggedIn: false,
    init() {
      // Component mount sırasında product zaten yüklü olduğu için doğrudan al.
      // (Q&A tab tıklanınca mount olur — `product-loaded` event'i o anda çoktan
      // dispatch edilmiş olur, listener boşa kalır. State'ten okumak güvenli.)
      const current = getCurrentProduct();
      if (current?.id) {
        void this.load(current.id);
      } else {
        // Edge case: product henüz yüklenmediyse event'le yakala
        const onLoaded = (e: Event) => {
          const ce = e as CustomEvent<{ id: string }>;
          if (ce.detail?.id) {
            this.load(ce.detail.id);
            window.removeEventListener("product-loaded", onLoaded);
            document.removeEventListener("product-loaded", onLoaded);
          }
        };
        window.addEventListener("product-loaded", onLoaded);
        document.addEventListener("product-loaded", onLoaded);
      }

      // Login state — auth cache async olabilir; cookie sniff yetersiz olduğu için
      // /api/method/.auth.get_session_user üzerinden gelmiş user_id cookie'sini ara.
      this.isLoggedIn = !!document.cookie.split("; ").find(
        (c) => c.startsWith("user_id=") && c !== "user_id=Guest"
      );

      // Yeni soru gönderildiğinde liste yenile
      window.addEventListener("qa-submitted", () => {
        if (this.listingId) void this.load(this.listingId);
      });

      // Login sonrası kendi Pending sorularımız listede görünsün
      window.addEventListener("login-success", () => {
        this.isLoggedIn = true;
        if (this.listingId) void this.load(this.listingId);
      });
    },
    async load(listingId: string) {
      this.listingId = listingId;
      this.loading = true;
      try {
        const data = await getProductQA(listingId, 1);
        this.questions = data.questions || [];
        this.total = data.total || 0;
      } catch (err: unknown) {
        console.warn("QA load failed:", err);
        this.questions = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },
    async submitQuestion() {
      this.errorMsg = "";
      if (!this.isLoggedIn) {
        openLoginModal();
        return;
      }
      const q = this.question.trim();
      if (q.length < 10) {
        this.errorMsg = "Sorunuz en az 10 karakter olmalı.";
        return;
      }
      if (!this.listingId) {
        // Fallback: state'ten tekrar dene
        const current = getCurrentProduct();
        if (current?.id) {
          this.listingId = current.id;
        } else {
          this.errorMsg = "Ürün bilgisi yüklenmedi, sayfayı yenileyin.";
          return;
        }
      }
      this.submitting = true;
      try {
        await submitProductQuestion(this.listingId, q);
        showToast({
          message: "Sorunuz alındı, satıcı en kısa sürede yanıtlayacak.",
          type: "success",
        });
        this.question = "";
        window.dispatchEvent(new CustomEvent("qa-submitted"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Hata";
        this.errorMsg = msg;
        showToast({ message: msg, type: "error" });
      } finally {
        this.submitting = false;
      }
    },
    async voteQuestion(q: ProductQuestion) {
      if (!this.isLoggedIn) {
        openLoginModal();
        return;
      }
      try {
        const res = await voteQAHelpful("question", q.name);
        if (res.changed) {
          q.helpful_count = (q.helpful_count || 0) + 1;
          showToast({ message: "Oyunuz alındı.", type: "success" });
        } else {
          showToast({ message: "Bu soruya zaten oy verdiniz.", type: "info" });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Oy verilemedi";
        showToast({ message: msg, type: "error" });
      }
    },
    async voteAnswer(a: ProductQuestion["answers"][number]) {
      if (!this.isLoggedIn) {
        openLoginModal();
        return;
      }
      try {
        const res = await voteQAHelpful("answer", a.name);
        if (res.changed) {
          a.helpful_count = (a.helpful_count || 0) + 1;
          showToast({ message: "Oyunuz alındı.", type: "success" });
        } else {
          showToast({ message: "Bu cevaba zaten oy verdiniz.", type: "info" });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Oy verilemedi";
        showToast({ message: msg, type: "error" });
      }
    },
    formatDate(s: string) {
      if (!s) return "";
      return s.slice(0, 10);
    },
  }));
}

export function ProductQA(): string {
  return `
    <div
      x-data="productQA"
      class="rv-qa-section py-6 border-t border-border-default"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-secondary-900">
          Soru &amp; Cevap
          <span class="text-secondary-400 font-normal" x-text="'(' + total + ')'"></span>
        </h3>
      </div>

      <!-- Soru sor formu -->
      <div class="bg-secondary-50/40 border border-border-default rounded-lg p-3 mb-5">
        <label class="block text-[12px] font-medium text-secondary-700 mb-1.5">
          Bir sorunuz mu var?
          <span class="text-secondary-400">Satıcı veya diğer alıcılar yanıtlayabilir.</span>
        </label>
        <textarea
          x-model="question"
          rows="2"
          maxlength="500"
          placeholder="Örn: Bu ürünün stok adedi ne kadar? Toptan fiyat aralığı nedir?"
          class="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-surface focus:outline-none focus:border-primary-500 resize-vertical"
        ></textarea>
        <p x-show="errorMsg" x-text="errorMsg" class="text-xs text-red-600 mt-1"></p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-[11px] text-secondary-400" x-text="question.length + ' / 500'"></span>
          <button
            type="button"
            @click="submitQuestion()"
            :disabled="submitting || question.trim().length < 10"
            class="h-8 px-4 rounded-lg bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg x-show="submitting" class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span x-text="submitting ? 'Gönderiliyor' : 'Soruyu Gönder'"></span>
          </button>
        </div>
      </div>

      <!-- Loader -->
      <div x-show="loading" class="text-center py-6 text-sm text-secondary-400">Yükleniyor...</div>

      <!-- Boş durum -->
      <div
        x-show="!loading && questions.length === 0"
        class="text-center py-8 text-sm text-secondary-400"
      >
        Henüz soru sorulmamış. İlk soruyu siz sorun.
      </div>

      <!-- Soru listesi -->
      <div class="space-y-4" x-show="!loading && questions.length > 0">
        <template x-for="q in questions" :key="q.name">
          <div class="border border-border-default rounded-lg p-3.5 bg-surface"
            :class="q.is_own_pending ? 'border-amber-300 bg-amber-50/30' : ''">
            <!-- Soru -->
            <div class="flex items-start gap-2 mb-2">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-[11px] font-bold shrink-0">S</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-0.5">
                  <span
                    x-show="q.is_own_pending"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-700"
                  >⏳ Onay bekliyor</span>
                </div>
                <div class="text-sm text-secondary-900 font-medium" x-text="q.question"></div>
                <div class="text-[11px] text-secondary-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span x-text="q.asker_display_name"></span>
                  <span x-show="q.is_kyb_verified" class="text-emerald-600">✓ Doğrulanmış</span>
                  <span>· <span x-text="formatDate(q.submitted_at)"></span></span>
                  <button
                    type="button"
                    class="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-secondary-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    title="Bu soru faydalı"
                    @click.stop="voteQuestion(q)"
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                    <span x-text="'Faydalı (' + (q.helpful_count || 0) + ')'"></span>
                  </button>
                </div>
              </div>
            </div>
            <!-- Cevaplar -->
            <template x-if="q.answers && q.answers.length > 0">
              <div class="pl-8 space-y-2 mt-2 pt-2 border-t border-border-default/50">
                <template x-for="a in q.answers" :key="a.name">
                  <div class="flex items-start gap-2">
                    <span
                      :class="a.is_seller_answer ? 'bg-emerald-50 text-emerald-600' : 'bg-secondary-100 text-secondary-600'"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0"
                    >C</span>
                    <div class="flex-1 min-w-0">
                      <div class="text-[13px] text-secondary-800" x-text="a.answer"></div>
                      <div class="text-[11px] text-secondary-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span x-text="a.is_seller_answer ? 'Satıcı Cevabı' : 'Alıcı Cevabı'"></span>
                        <span>· <span x-text="formatDate(a.submitted_at)"></span></span>
                        <button
                          type="button"
                          class="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-secondary-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          title="Bu cevap faydalı"
                          @click.stop="voteAnswer(a)"
                        >
                          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                          <span x-text="'(' + (a.helpful_count || 0) + ')'"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </template>
            <template x-if="!q.answers || q.answers.length === 0">
              <div class="pl-8 mt-1 text-[12px] text-secondary-400 italic">Henüz cevap yok.</div>
            </template>
          </div>
        </template>
      </div>
    </div>
  `;
}
