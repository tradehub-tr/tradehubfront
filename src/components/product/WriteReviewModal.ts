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
import { MultiFileDropzoneController, type DropzoneConfig } from "../../lib/upload-ui";
import { submitReview, type SubmitReviewPayload } from "../../services/listingService";
import { fetchCsrfToken } from "../../utils/api";
import { showToast } from "../../utils/toast";

const REVIEW_DROPZONE_CONFIG: DropzoneConfig = {
  maxFiles: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  allowedFormatsDisplay: "JPG, PNG, GIF, WEBP",
};

const REVIEW_DROPZONE_TEXTS = {
  title: "Fotoğrafları sürükle",
  or: "veya",
  pickBtn: "Foto Ekle",
  dragRelease: "Bırakın",
};

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
  readonly rating: number;
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
  setAspect(key: keyof WriteReviewState["aspects"], n: number): void;
  starFillPercent(n: number): number;
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
      aspects: { product_quality: 5, service: 5, shipping: 5, spec_match: 5 },
      title: "",
      body: "",
      images: [],
      uploadingImage: false,
      dropzoneController: null as MultiFileDropzoneController | null,
      get rating(): number {
        const a = this.aspects;
        return (a.product_quality + a.service + a.shipping + a.spec_match) / 4;
      },
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
      async show(detail) {
        this.reset();
        this.listingId = detail.listingId;
        this.orderItems = detail.orderItems || [];
        this.selectedOrderItem = this.orderItems[0]?.name || "";
        this.open = true;

        // Modal görünür olduktan sonra dropzone'u mount et (DOM hazır olsun).
        await new Promise((r) => requestAnimationFrame(r));
        const wrap = document.getElementById("review-dropzone-wrap");
        if (!wrap) return;
        wrap.innerHTML = MultiFileDropzoneController.renderDropzoneHtml({
          dropzoneId: "review-dropzone",
          fileInputId: "review-file-input",
          config: REVIEW_DROPZONE_CONFIG,
          texts: REVIEW_DROPZONE_TEXTS,
        });
        const csrf = (await fetchCsrfToken()) ?? "None";
        const baseUrl = (window as unknown as { API_BASE?: string }).API_BASE || "/api";
        this.dropzoneController = new MultiFileDropzoneController({
          dropzoneId: "review-dropzone",
          fileInputId: "review-file-input",
          fileListId: "review-file-list",
          lightboxScope: "review-image",
          scopePrefix: "review",
          config: REVIEW_DROPZONE_CONFIG,
          texts: REVIEW_DROPZONE_TEXTS,
          autoUpload: true,
          autoUploadConfig: {
            endpoint: `${baseUrl}/method/upload_file`,
            formDataFields: { is_private: "0", folder: "Home/Attachments" },
            headers: { "X-Frappe-CSRF-Token": csrf },
            concurrency: 2,
          },
          onFileUploaded: (file, responseText) => {
            try {
              const data = JSON.parse(responseText) as { message?: { file_url?: string } };
              const fileUrl = data.message?.file_url;
              if (!fileUrl) return;
              this.images.push({
                image: fileUrl,
                previewUrl: fileUrl.startsWith("http")
                  ? fileUrl
                  : `${window.location.origin}${fileUrl}`,
              });
            } catch {
              showToast({ message: `${file.name} yüklendi ama yanıt okunamadı.`, type: "warning" });
            }
          },
          onUploadError: (file, error) => {
            showToast({ message: `${file.name}: ${error}`, type: "error" });
          },
          onValidationError: (kind, file) => {
            if (kind === "unsupported" && file)
              showToast({ message: `Desteklenmeyen format: ${file.name}`, type: "error" });
            else if (kind === "tooLarge" && file)
              showToast({ message: `${file.name} 5MB üzerinde, atlandı.`, type: "warning" });
            else if (kind === "maxFiles")
              showToast({ message: "En fazla 5 fotoğraf yükleyebilirsiniz.", type: "warning" });
          },
        });
        this.dropzoneController.mount();
      },
      close() {
        this.open = false;
        // Controller cleanup — files & DOM event'leri serbest
        this.dropzoneController?.destroy();
        this.dropzoneController = null;
        const wrap = document.getElementById("review-dropzone-wrap");
        if (wrap) wrap.innerHTML = "";
        const list = document.getElementById("review-file-list");
        if (list) list.innerHTML = "";
      },
      reset() {
        this.loading = false;
        this.errorMsg = "";
        this.aspects = { product_quality: 5, service: 5, shipping: 5, spec_match: 5 };
        this.title = "";
        this.body = "";
        this.images = [];
        this.uploadingImage = false;
      },
      setAspect(key, n) {
        this.aspects[key] = n;
      },
      starFillPercent(n: number): number {
        return Math.max(0, Math.min(1, this.rating - (n - 1))) * 100;
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
            rating: Math.round(this.rating),
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

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

function overallStarsHtml(size = 28): string {
  return Array.from({ length: 5 }, (_, i) => i + 1)
    .map(
      (n) => `
      <span
        class="relative inline-flex"
        :style="{ '--star-fill': (100 - starFillPercent(${n})) + '%' }"
        aria-hidden="true"
      >
        <svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="currentColor" class="text-secondary-300"><path d="${STAR_PATH}"/></svg>
        <svg
          width="${size}" height="${size}" viewBox="0 0 20 20" fill="currentColor"
          class="text-amber-400 absolute inset-0 pointer-events-none [clip-path:inset(0_var(--star-fill)_0_0)]"
        ><path d="${STAR_PATH}"/></svg>
      </span>`
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

          <!-- Overall rating (read-only: aşağıdaki detaylı puanların ortalaması) -->
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-2">Genel Puan</label>
            <div class="flex items-center gap-1" role="img" :aria-label="rating.toFixed(2) + ' / 5'">${overallStarsHtml()}</div>
            <span class="text-[11px] text-secondary-400 mt-1 block">
              <span x-text="rating.toFixed(rating % 1 === 0 ? 0 : 2) + ' / 5'"></span>
              <span class="ms-1">— detaylı puanların ortalaması</span>
            </span>
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

          <!-- Image upload (tradehub-upload-ui MultiFileDropzone — autoUpload mod) -->
          <div>
            <label class="block text-[12px] font-medium text-secondary-700 mb-1">Fotoğraflar <span class="text-secondary-400">(maks 5, her biri 5MB)</span></label>
            <div id="review-dropzone-wrap"></div>
            <div id="review-file-list"></div>
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
              class="h-10 px-5 rounded-lg bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-sm font-semibold border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-2"
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
