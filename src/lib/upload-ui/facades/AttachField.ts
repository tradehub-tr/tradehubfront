/**
 * AttachField — Frappe DocType form field tarzı tek dosya.
 *
 * Compact tasarım. DocTypeFormView'ın dinamik render'ında her "Attach" field
 * için bu kullanılır. Anında upload (Frappe form save'inden önce dosya zaten
 * upload edilmiş olur).
 */

import { uploadFiles, type FileProgress } from "../uploader";
import { getFileBadge, formatFileSize } from "../utils";
import { t } from "../../../i18n";

export interface AttachFieldOptions {
  containerId: string;
  fieldname: string;
  label: string;
  required?: boolean;
  /** Mevcut file URL */
  currentValue?: string;
  /** Accept attribute (DocType.options'tan) */
  accept?: string;
  maxFileSizeBytes?: number;
  labels?: {
    pick?: string;
    empty?: string;
    uploaded?: string;
  };
  onChange?: (fileUrl: string, fileName: string) => void;
  onRemove?: () => void;
  onUploadError?: (error: string) => void;
}

export interface AttachFieldUploadConfig {
  endpoint: string;
  formDataFields?: Record<string, string>;
  headers?: Record<string, string>;
}

export class AttachFieldController {
  private currentFile: File | null = null;
  private currentValue: string;
  private currentName: string = "";
  private currentSize: number = 0;
  private progress: FileProgress | null = null;
  private container!: HTMLElement;

  constructor(
    private opts: AttachFieldOptions,
    private uploadConfig: AttachFieldUploadConfig
  ) {
    this.currentValue = opts.currentValue ?? "";
    if (this.currentValue) {
      this.currentName = this.currentValue.split("/").pop() ?? this.currentValue;
    }
  }

  mount(): void {
    const container = document.getElementById(this.opts.containerId);
    if (!container) throw new Error(`container not found: ${this.opts.containerId}`);
    this.container = container;
    this.render();
    this.bind();
  }

  private render(): void {
    const labels = this.opts.labels ?? {};
    const pickLabel = labels.pick ?? t("commonSvc.pickFile");
    const emptyLabel = labels.empty ?? t("commonSvc.noFileSelected");
    const uploadedLabel = labels.uploaded ?? t("commonSvc.uploaded");

    if (!this.currentValue && !this.currentFile) {
      this.container.innerHTML = `
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">${this.opts.label}${this.opts.required ? ' <span class="text-red-500">*</span>' : ""}</label>
        <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <button type="button" class="attach-pick px-3 py-1 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-gray-100">📎 ${pickLabel}</button>
          <span class="text-xs text-gray-500">${emptyLabel}</span>
          <input type="file" class="attach-input hidden" accept="${this.opts.accept ?? ""}" />
        </div>
      `;
      return;
    }

    const fileName = this.currentName || t("commonSvc.fileWord");
    const badge = getFileBadge(fileName);
    const isUploading = this.progress?.status === "uploading";
    const pct = this.progress
      ? Math.round((this.progress.loaded / Math.max(1, this.progress.total)) * 100)
      : 100;
    const visiblePct = isUploading && pct < 4 ? 4 : pct;
    const barColor =
      this.progress?.status === "error"
        ? "bg-red-500"
        : isUploading
          ? "bg-amber-500"
          : "bg-emerald-500";
    const statusText = isUploading
      ? t("commonSvc.uploadingPct", { pct })
      : this.progress?.status === "error"
        ? t("commonSvc.errorWord")
        : uploadedLabel;
    const sizeText = this.currentSize ? `${formatFileSize(this.currentSize)} · ` : "";

    this.container.innerHTML = `
      <label class="block text-xs font-semibold text-gray-700 mb-1.5">${this.opts.label}${this.opts.required ? ' <span class="text-red-500">*</span>' : ""}</label>
      <div class="flex items-center gap-2 bg-white border border-gray-200 rounded px-3 py-2">
        <span class="w-8 h-8 rounded ${badge.cls} text-white text-[10px] font-bold flex items-center justify-center">${badge.label}</span>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-800 truncate">${fileName}</div>
          <div class="text-[10px] text-gray-500">${sizeText}${statusText}</div>
        </div>
        <div class="relative h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full ${barColor} transition-all duration-300" style="width:${visiblePct}%"></div>
        </div>
        ${!isUploading ? `<button type="button" class="attach-remove text-red-500 hover:text-red-700 text-lg leading-none px-1">&times;</button>` : ""}
        <input type="file" class="attach-input hidden" accept="${this.opts.accept ?? ""}" />
      </div>
    `;
  }

  private bind(): void {
    const pickBtn = this.container.querySelector<HTMLButtonElement>(".attach-pick");
    const removeBtn = this.container.querySelector<HTMLButtonElement>(".attach-remove");
    const input = this.container.querySelector<HTMLInputElement>(".attach-input");

    pickBtn?.addEventListener("click", () => input?.click());
    input?.addEventListener("change", () => {
      const f = input.files?.[0];
      if (f) void this.acceptFile(f);
      input.value = "";
    });
    removeBtn?.addEventListener("click", () => this.handleRemove());
  }

  private async acceptFile(file: File): Promise<void> {
    const maxBytes = this.opts.maxFileSizeBytes ?? 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.opts.onUploadError?.(t("commonSvc.fileTooLarge", { mb: Math.round(maxBytes / 1024 / 1024) }));
      return;
    }

    this.currentFile = file;
    this.currentName = file.name;
    this.currentSize = file.size;
    this.progress = { loaded: 0, total: file.size, status: "uploading" };
    this.render();
    this.bind();

    try {
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
        this.progress = { loaded: 0, total: file.size, status: "error" };
        this.render();
        this.bind();
        this.opts.onUploadError?.(result.failed[0].error);
        return;
      }

      // Frappe response shape — caller'a notify
      this.progress = null;
      this.currentValue = file.name; // gerçek file_url caller'dan gelir
      this.render();
      this.bind();
      this.opts.onChange?.(file.name, file.name);
    } catch (e) {
      this.progress = { loaded: 0, total: file.size, status: "error" };
      this.render();
      this.bind();
      this.opts.onUploadError?.(e instanceof Error ? e.message : String(e));
    }
  }

  private handleRemove(): void {
    this.currentFile = null;
    this.currentValue = "";
    this.currentName = "";
    this.currentSize = 0;
    this.progress = null;
    this.render();
    this.bind();
    this.opts.onRemove?.();
  }

  /** Programatik set (örn. async load) */
  setValue(url: string, name?: string): void {
    this.currentValue = url;
    this.currentName = name ?? url.split("/").pop() ?? "";
    this.render();
    this.bind();
  }
}
