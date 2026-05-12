/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Alpine.js modül tipleri tam değil; runtime davranış doğrulanmış
/**
 * WriteReviewModal — Storefront yorum yazma akışı.
 *
 * Akış:
 *   1. `write-review-modal-show` event ile aç (detail: { listingId, orderItems })
 *   2. Order item seç (birden fazla satın alma varsa)
 *   3. 5 yıldız + 4 boyut (kalite, kargo, paketleme, iletişim)
 *   4. Başlık (opsiyonel) + body (min 20 karakter)
 *   5. Foto upload (max 5)
 *   6. Submit → backend `submit_review` → close + `review-submitted` event
 */

import Alpine from "alpinejs";
import {
  submitReview,
  uploadReviewImage,
  type SubmitReviewPayload,
} from "../../services/listingService";
import { showToast } from "../../utils/toast";

export interface OrderItemOption {
  name: string;
  order: string;
  order_date: string | null;
  quantity: number;
}

interface WriteReviewState {
  open: boolean;
  loading: boolean;
  errorMsg: string;
  listingId: string;
  orderItems: OrderItemOption[];
  selectedOrderItem: string;
  rating: number;
  hoverRating: number;
  aspects: {
    product_quality: number;
    service: number;
    shipping: number;
    spec_match: number;
  };
  title: string;
  body: string;
  images: Array<{ image: string; caption?: string; previewUrl: string }>;
  uploadingImage: boolean;
  init(): void;
  show(detail: { listingId: string; orderItems: OrderItemOption[] }): void;
  close(): void;
  reset(): void;
  setRating(n: number): void;
  setAspect(key: keyof WriteReviewState["aspects"], n: number): void;
  onFileChange(e: Event): Promise<void>;
  removeImage(idx: number): void;
  bodyValid(): boolean;
  submit(): Promise<void>;
}

const ASPECT_LABELS: Record<string, string> = {
  product_quality: "Ürün Kalitesi",
  service: "Satıcı İletişimi",
  shipping: "Kargo / Teslimat",
  spec_match: "Açıklamaya Uygunluk",
};

export function registerWriteReviewModal(): void {
  Alpine.data(
    "writeReviewModal",
    (): WriteReviewState => ({
      open: false,
      loading: false,
      errorMsg: "",
      listingId: "",
      orderItems: [],
      selectedOrderItem: "",
      rating: 5,
      hoverRating: 0,
      aspects: { product_quality: 5, service: 5, shipping: 5, spec_match: 5 },
      title: "",
      body: "",
      images: [],
      uploadingImage: false,
      init() {
        window.addEventListener("write-review-modal-show", (e: Event) => {
          const ce = e as CustomEvent<{
            listingId: string;
            orderItems: OrderItemOption[];
          }>;
          this.show(ce.detail);
        });
        window.addEventListener("write-review-modal-hide", () => this.close());
      },
      show(detail) {
        this.reset();
        this.listingId = detail.listingId;
        this.orderItems = detail.orderItems || [];
        this.selectedOrderItem = this.orderItems[0]?.name || "";
        this.open = true;
      },
      close() {
        this.open = false;
      },
      reset() {
        this.loading = false;
        this.errorMsg = "";
        this.rating = 5;
        this.hoverRating = 0;
        this.aspects = { product_quality: 5, service: 5, shipping: 5, spec_match: 5 };
        this.title = "";
        this.body = "";
        this.images = [];
        this.uploadingImage = false;
      },
      setRating(n: number) {
        this.rating = n;
      },
      setAspect(key, n) {
        this.aspects[key] = n;
      },
      async onFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const files = Array.from(input.files || []);
        if (!files.length) return;
        if (this.images.length + files.length > 5) {
          showToast({ message: "En fazla 5 fotoğraf yükleyebilirsiniz.", type: "warning" });
          return;
        }
        this.uploadingImage = true;
        try {
          for (const file of files) {
            if (!file.type.startsWith("image/")) continue;
            if (file.size > 5 * 1024 * 1024) {
              showToast({
                message: `${file.name} 5MB üzerinde, atlandı.`,
                type: "warning",
              });
              continue;
            }
            const result = await uploadReviewImage(file);
            this.images.push({
              image: result.file_url,
              previewUrl: result.file_url.startsWith("http")
                ? result.file_url
                : `${window.location.origin}${result.file_url}`,
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Yükleme hatası";
          showToast({ message: msg, type: "error" });
        } finally {
          this.uploadingImage = false;
          input.value = "";
        }
      },
      removeImage(idx: number) {
        this.images.splice(idx, 1);
      },
      bodyValid() {
        return this.body.trim().length >= 20;
      },
      async submit() {
        this.errorMsg = "";
        if (!this.selectedOrderItem) {
          this.errorMsg = "Yorum yapabilmek için onaylı bir sipariş seçin.";
          return;
        }
        if (this.rating < 1 || this.rating > 5) {
          this.errorMsg = "Lütfen 1-5 arası puan verin.";
          return;
        }
        if (!this.bodyValid()) {
          this.errorMsg = "Yorum metni en az 20 karakter olmalı.";
          return;
        }
        this.loading = true;
        try {
          const payload: SubmitReviewPayload = {
            order_item: this.selectedOrderItem,
            rating: this.rating,
            body: this.body.trim(),
            title: this.title.trim() || undefined,
            images: this.images.map((i) => ({ image: i.image })),
            aspects: { ...this.aspects },
          };
          const res = await submitReview(payload);
          showToast({
            message:
              res.status === "Approved"
                ? "Yorumunuz yayınlandı."
                : "Yorumunuz alındı, moderasyon sonrası yayınlanacaktır.",
            type: "success",
          });
          window.dispatchEvent(
            new CustomEvent("review-submitted", {
              detail: { name: res.name, listingId: this.listingId },
            })
          );
          this.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
          this.errorMsg = msg;
          showToast({ message: msg, type: "error" });
        } finally {
          this.loading = false;
        }
      },
    })
  );
}

function starButtonsHtml(
  bind = "rating",
  hoverBind = "hoverRating",
  setMethod = "setRating",
  size = 28
): string {
  return Array.from({ length: 5 }, (_, i) => i + 1)
    .map(
      (n) => `
      <button
        type="button"
        @click="${setMethod}(${n})"
        @mouseenter="${hoverBind} = ${n}"
        @mouseleave="${hoverBind} = 0"
        :class="(${hoverBind} || ${bind}) >= ${n} ? 'text-amber-400' : 'text-secondary-300'"
        class="transition-colors hover:scale-110 focus:outline-none"
      >
        <svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
      </button>`
    )
    .join("");
}

function aspectRowHtml(key: string, label: string): string {
  return `
    <div class="flex items-center justify-between gap-3 py-2 border-b border-border-default/50 last:border-0">
      <span class="text-[13px] text-secondary-700 flex-1">${label}</span>
      <div class="flex items-center gap-0.5" x-data="{ h: 0 }">
        ${Array.from({ length: 5 }, (_, i) => i + 1)
          .map(
            (n) => `
          <button
            type="button"
            @click="setAspect('${key}', ${n})"
            @mouseenter="h = ${n}"
            @mouseleave="h = 0"
            :class="(h || aspects.${key}) >= ${n} ? 'text-amber-400' : 'text-secondary-300'"
            class="transition-colors hover:scale-110 focus:outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </button>`
          )
          .join("")}
      </div>
    </div>
  `;
}

export function WriteReviewModal(): string {
  const aspectRows = Object.entries(ASPECT_LABELS)
    .map(([k, l]) => aspectRowHtml(k, l))
    .join("");
  return `
    <div
      id="rv-write-review-modal"
      x-data="writeReviewModal"
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
        class="bg-surface rounded-xl shadow-modal w-full max-w-2xl max-h-[92vh] overflow-y-auto relative max-sm:rounded-none max-sm:max-h-screen max-sm:max-w-full max-sm:h-screen"
      >
        <!-- Header -->
        <div class="sticky top-0 bg-surface border-b border-border-default px-5 py-3.5 flex items-center justify-between z-10">
          <div class="text-base font-semibold text-secondary-900">Ürünü Değerlendir</div>
          <button
            type="button"
            @click="close()"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-secondary-400 hover:text-secondary-900 transition-colors"
            aria-label="Kapat"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body -->
        <form @submit.prevent="submit()" class="px-5 py-4 space-y-5">
          <!-- Order item picker (sadece >1 ise göster) -->
          <div x-show="orderItems.length > 1">
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">Hangi Sipariş?</label>
            <select
              x-model="selectedOrderItem"
              class="w-full h-10 px-3 border border-border-default rounded-lg text-sm bg-surface focus:outline-none focus:border-primary-500"
            >
              <template x-for="oi in orderItems" :key="oi.name">
                <option :value="oi.name" x-text="(oi.order_date || '') + ' — ' + oi.order"></option>
              </template>
            </select>
          </div>

          <!-- Overall rating -->
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-2">Genel Puan</label>
            <div class="flex items-center gap-1">${starButtonsHtml()}</div>
            <span class="text-[11px] text-secondary-400 mt-1 block" x-text="rating + ' / 5'"></span>
          </div>

          <!-- Aspect ratings -->
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">Detaylı Puanlama</label>
            <div class="border border-border-default rounded-lg px-3">
              ${aspectRows}
            </div>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">Başlık <span class="text-secondary-400">(opsiyonel)</span></label>
            <input
              type="text"
              x-model="title"
              maxlength="120"
              placeholder="Kısa bir özet yazın"
              class="w-full h-10 px-3 border border-border-default rounded-lg text-sm bg-surface focus:outline-none focus:border-primary-500"
            />
          </div>

          <!-- Body -->
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">
              Yorum
              <span class="text-secondary-400">(en az 20 karakter)</span>
            </label>
            <textarea
              x-model="body"
              rows="5"
              maxlength="2000"
              placeholder="Ürün ve satıcı deneyiminizi paylaşın..."
              class="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-surface focus:outline-none focus:border-primary-500 resize-vertical"
            ></textarea>
            <div class="flex items-center justify-between text-[11px] mt-1">
              <span :class="bodyValid() ? 'text-emerald-600' : 'text-secondary-400'" x-text="body.length + ' karakter'"></span>
              <span class="text-secondary-400">Maks 2000</span>
            </div>
          </div>

          <!-- Image upload -->
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">Fotoğraflar <span class="text-secondary-400">(maks 5, her biri 5MB)</span></label>
            <div class="flex flex-wrap gap-2">
              <template x-for="(img, idx) in images" :key="idx">
                <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-border-default group">
                  <img :src="img.previewUrl" class="w-full h-full object-cover" alt="">
                  <button
                    type="button"
                    @click="removeImage(idx)"
                    class="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs leading-none flex items-center justify-center hover:bg-black/80"
                    aria-label="Sil"
                  >×</button>
                </div>
              </template>
              <label
                x-show="images.length < 5"
                class="w-20 h-20 rounded-lg border-2 border-dashed border-border-default flex flex-col items-center justify-center text-secondary-400 cursor-pointer hover:border-primary-500 hover:text-primary-500 transition-colors text-[10px]"
              >
                <svg x-show="!uploadingImage" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-7.5-9V15m0 0l-3-3m3 3l3-3M3 12V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75V12"/></svg>
                <svg x-show="uploadingImage" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span class="mt-1" x-text="uploadingImage ? 'Yükleniyor' : 'Foto Ekle'"></span>
                <input type="file" accept="image/*" multiple class="hidden" @change="onFileChange($event)">
              </label>
            </div>
          </div>

          <!-- Error -->
          <p x-show="errorMsg" x-text="errorMsg" class="text-sm text-red-600"></p>

          <!-- Submit -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              @click="close()"
              class="h-10 px-4 rounded-lg border border-border-default text-sm font-medium text-secondary-700 hover:bg-black/5 transition-colors"
            >İptal</button>
            <button
              type="submit"
              :disabled="loading || uploadingImage || !bodyValid()"
              class="h-10 px-5 rounded-lg bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg x-show="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span x-text="loading ? 'Gönderiliyor' : 'Yorumu Gönder'"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/** Modal trigger helper */
export function openWriteReviewModal(detail: {
  listingId: string;
  orderItems: OrderItemOption[];
}): void {
  window.dispatchEvent(new CustomEvent("write-review-modal-show", { detail }));
}
