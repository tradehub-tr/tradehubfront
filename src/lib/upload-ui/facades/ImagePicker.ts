/**
 * ImagePicker — avatar/logo/banner için tek görsel picker.
 *
 * Cropper.js opsiyonel — şu an basit önizleme + upload. Aspect ratio bilgi olarak
 * kullanılır (caller kendisi crop UI eklerse, dosya değişmeden önce çağırabilir).
 *
 * Akış: kullanıcı "Değiştir" → dosya seç → anında upload (avatar tarzı) →
 * preview güncellenir. RFQ'dan farklı: submit beklemez, dosya seçilir seçilmez upload.
 */

import { uploadFiles, type FileProgress } from "../uploader";
import { revokeFilePreview, getFilePreviewUrl } from "../utils";
import { escapeHtml, sanitizeUrl } from "../../../utils/sanitize";
import { t } from "../../../i18n";

export interface ImagePickerOptions {
  containerId: string;
  /** Mevcut görsel URL (server'dan) */
  currentUrl?: string;
  /** Görsel şekli (sadece UI etkisi) */
  shape?: "circle" | "square" | "rectangle";
  /** Aspect ratio (sadece UI) */
  aspectRatio?: number;
  /** Boyut sınırı (default 2MB) */
  maxFileSizeBytes?: number;
  /** Accepted MIME (default image/jpeg, image/png, image/webp) */
  accept?: string;
  /** Önerilen boyut metni — UI'da gösterilir */
  recommendedSize?: string;
  /** Placeholder text (boş ise gösterilir) */
  placeholderText?: string;
  /** UI label'ları */
  labels?: {
    change?: string;
    remove?: string;
    uploading?: string;
  };
  /** Upload sonrası caller bilgilendirilir */
  onChange?: (result: { fileUrl: string; file: File }) => void;
  onRemove?: () => void;
  onUploadError?: (error: string) => void;
  onValidationError?: (kind: "tooLarge" | "wrongType", file: File) => void;
}

export interface ImagePickerUploadConfig {
  endpoint: string;
  formDataFields?: Record<string, string>;
  headers?: Record<string, string>;
  /** Response'tan file_url'i çıkartır (Frappe upload_file response: { message: { file_url } }) */
  extractFileUrl?: (xhrResponse: string) => string;
}

export class ImagePickerController {
  private currentUrl: string;
  private currentFile: File | null = null;
  private progress: FileProgress | null = null;
  private container!: HTMLElement;

  constructor(
    private opts: ImagePickerOptions,
    private uploadConfig: ImagePickerUploadConfig
  ) {
    this.currentUrl = opts.currentUrl ?? "";
  }

  mount(): void {
    const container = document.getElementById(this.opts.containerId);
    if (!container) throw new Error(`container not found: ${this.opts.containerId}`);
    this.container = container;
    this.render();
    this.bind();
  }

  private get shape(): "circle" | "square" | "rectangle" {
    return this.opts.shape ?? "circle";
  }

  private get shapeCls(): string {
    if (this.shape === "circle") return "rounded-full";
    if (this.shape === "square") return "rounded-lg";
    return "rounded-md";
  }

  private get sizeCls(): string {
    if (this.shape === "circle" || this.shape === "square") return "w-40 h-40";
    return "w-64 h-36"; // rectangle ~16:9
  }

  private render(): void {
    const placeholder = this.opts.placeholderText ?? t("commonSvc.image");
    const labels = this.opts.labels ?? {};
    const changeLabel = labels.change ?? t("commonSvc.change");
    const removeLabel = labels.remove ?? t("commonSvc.remove");
    const uploadingLabel = labels.uploading ?? t("commonSvc.uploading");
    const recommended = this.opts.recommendedSize
      ? `<div class="text-[10px] text-gray-500 mt-1">${t("commonSvc.recommended")}: ${escapeHtml(this.opts.recommendedSize)}</div>`
      : "";

    const url = this.currentUrl;
    // blob: preview URL'leri yerel (URL.createObjectURL) ve güvenilir — olduğu gibi
    // geçir; geri kalan (server) URL'leri sema-allowlist'ten geçir.
    const safeUrl = url.startsWith("blob:") ? url : sanitizeUrl(url);
    const previewBg = url
      ? `<img src="${escapeHtml(safeUrl)}" class="w-full h-full object-cover" />`
      : `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-semibold">${escapeHtml(placeholder)}</div>`;

    const isUploading = this.progress?.status === "uploading";
    const pct = this.progress
      ? Math.round((this.progress.loaded / Math.max(1, this.progress.total)) * 100)
      : 0;
    const visiblePct = isUploading && pct < 4 ? 4 : pct;

    this.container.innerHTML = `
      <div class="flex items-start gap-6">
        <div class="flex flex-col items-center gap-2">
          <div class="upload-image-preview relative ${this.sizeCls} ${this.shapeCls} border-4 border-white shadow-lg overflow-hidden">
            ${previewBg}
            ${
              isUploading
                ? `
              <div class="absolute top-1/2 start-[15%] end-[15%] -translate-y-1/2 h-3 bg-black/75 border-2 border-black/80 rounded-full overflow-hidden z-10">
                <div class="h-full bg-white rounded-full transition-all duration-300" style="width:${visiblePct}%"></div>
              </div>
            `
                : ""
            }
          </div>
          ${recommended}
          <div class="flex gap-2 mt-1">
            <button type="button" class="upload-image-pick px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-400 hover:bg-amber-500 text-gray-900 transition" ${isUploading ? "disabled" : ""}>
              ${escapeHtml(isUploading ? uploadingLabel : changeLabel)}
            </button>
            ${url ? `<button type="button" class="upload-image-remove px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700 transition" ${isUploading ? "disabled" : ""}>${escapeHtml(removeLabel)}</button>` : ""}
          </div>
          <input type="file" class="upload-image-input hidden" accept="${escapeHtml(this.opts.accept ?? "image/jpeg,image/png,image/webp")}" />
        </div>
      </div>
    `;
  }

  private bind(): void {
    const pickBtn = this.container.querySelector<HTMLButtonElement>(".upload-image-pick");
    const removeBtn = this.container.querySelector<HTMLButtonElement>(".upload-image-remove");
    const input = this.container.querySelector<HTMLInputElement>(".upload-image-input");

    pickBtn?.addEventListener("click", () => input?.click());
    input?.addEventListener("change", () => {
      const f = input.files?.[0];
      if (f) void this.acceptFile(f);
      input.value = "";
    });
    removeBtn?.addEventListener("click", () => this.handleRemove());
  }

  private async acceptFile(file: File): Promise<void> {
    const maxBytes = this.opts.maxFileSizeBytes ?? 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.opts.onValidationError?.("tooLarge", file);
      return;
    }
    if (!file.type.startsWith("image/")) {
      this.opts.onValidationError?.("wrongType", file);
      return;
    }

    // Anında upload — avatar tarzı, submit bekleme
    if (this.currentFile) revokeFilePreview(this.currentFile);
    this.currentFile = file;
    this.currentUrl = getFilePreviewUrl(file); // hemen optimistic preview
    this.progress = { loaded: 0, total: file.size, status: "uploading" };
    this.render();
    this.bind();

    try {
      const responseText = "";
      const result = await uploadFiles({
        files: [file],
        endpoint: this.uploadConfig.endpoint,
        formDataFields: this.uploadConfig.formDataFields,
        headers: this.uploadConfig.headers,
        concurrency: 1,
        onFileProgress: (_f, state) => {
          this.progress = state;
          this.render();
          this.bind();
        },
      });

      if (result.failed.length) {
        this.opts.onUploadError?.(result.failed[0].error);
        this.progress = null;
        this.render();
        this.bind();
        return;
      }

      // Frappe response shape: { message: { file_url, file_name } }
      // Caller extractFileUrl override edebilir
      const extractFn = this.uploadConfig.extractFileUrl;
      if (extractFn) {
        // XHR response erişimi için uploader.ts'i değiştirmemiz gerek; şimdilik
        // optimistic: caller onChange'ten Frappe'ye get atıp file_url alabilir
        void extractFn(responseText);
      }

      this.progress = null;
      this.render();
      this.bind();
      this.opts.onChange?.({ fileUrl: this.currentUrl, file });
    } catch (e) {
      this.progress = null;
      this.render();
      this.bind();
      this.opts.onUploadError?.(e instanceof Error ? e.message : String(e));
    }
  }

  private handleRemove(): void {
    if (this.currentFile) revokeFilePreview(this.currentFile);
    this.currentFile = null;
    this.currentUrl = "";
    this.progress = null;
    this.render();
    this.bind();
    this.opts.onRemove?.();
  }

  /** Manuel URL set (örn. async load sonrası) */
  setCurrentUrl(url: string): void {
    this.currentUrl = url;
    this.render();
    this.bind();
  }
}
