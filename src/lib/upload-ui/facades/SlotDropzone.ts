/**
 * SlotDropzone — KYC/KYB tarzı sabit etiketli slot'lar.
 *
 * Her slot tek dosya alır (replace mode). Drag/drop + click trigger her slot için
 * ayrı. Submit anında her slot ayrı upload edilir (paralel mümkün).
 */

import { uploadFiles, type FileProgress } from "../uploader";
import { getFileBadge, getFilePreviewUrl, revokeFilePreview } from "../utils";
import { t } from "../../../i18n";

export interface SlotDef {
  id: string;
  label: string;
  required?: boolean;
  accept: string; // ".pdf,.jpg,.png" gibi
  maxFileSizeBytes?: number;
  hint?: string;
}

export interface SlotDropzoneOptions {
  containerId: string;
  slots: SlotDef[];
  /** Bir slot dolduğunda (autoUpload kapalıyken file seçimi sonrası) */
  onSlotFilled?: (slotId: string, file: File) => void;
  /** Bir slot temizlendiğinde */
  onSlotCleared?: (slotId: string) => void;
  /** Validation hatası */
  onValidationError?: (slotId: string, kind: "tooLarge", file: File) => void;
  /** AutoUpload: dosya seçilir seçilmez upload tetiklensin (KYB/KYC tarzı).
   *  Default false — caller submit'te controller.upload() çağırır. */
  autoUpload?: boolean;
  /** AutoUpload için default uploader (multipart) config'i */
  autoUploadConfig?: {
    endpoint: string;
    formDataPerSlot?: (slotId: string) => Record<string, string>;
    headers?: Record<string, string>;
  };
  /** AutoUpload için custom uploader (base64 JSON gibi non-multipart akışlar).
   *  Verilirse autoUploadConfig yerine bu çağrılır. */
  autoCustomUploader?: (
    slotId: string,
    file: File
  ) => Promise<{ success: boolean; fileUrl?: string; error?: string }>;
  /** AutoUpload başarısı — caller fileUrl'i kendi state'ine yazar */
  onSlotUploaded?: (slotId: string, fileUrl: string) => void;
  /** AutoUpload hatası */
  onSlotUploadError?: (slotId: string, error: string) => void;
}

const ICON_UPLOAD = `<svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

export class SlotDropzoneController {
  /** slotId → File */
  readonly files = new Map<string, File>();
  /** slotId → FileProgress */
  readonly progress = new Map<string, FileProgress>();
  isUploading = false;
  private container!: HTMLElement;

  constructor(private opts: SlotDropzoneOptions) {}

  mount(): void {
    const container = document.getElementById(this.opts.containerId);
    if (!container) throw new Error(`container not found: ${this.opts.containerId}`);
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
    this.container.style.gap = "1.5rem";
    this.container.innerHTML = this.opts.slots.map((slot) => this.renderSlot(slot)).join("");
    this.opts.slots.forEach((slot) => this.bindSlot(slot));
  }

  private renderSlot(slot: SlotDef): string {
    const file = this.files.get(slot.id);
    const formats = slot.accept
      .split(",")
      .map((e) => e.trim().replace(".", "").toUpperCase())
      .join(", ");
    const maxMB = Math.round((slot.maxFileSizeBytes ?? 5 * 1024 * 1024) / 1024 / 1024);
    const hint = slot.hint ?? `${formats} · ${t("commonSvc.maxAbbr")} ${maxMB}MB`;

    if (!file) {
      return `
        <div data-slot-id="${slot.id}" class="slot-card flex flex-col">
          <div class="text-xs font-semibold text-gray-700 mb-2">${slot.label}${slot.required ? ' <span class="text-red-500">*</span>' : ""}</div>
          <div class="slot-zone cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg h-40 flex items-center justify-center text-center p-3 transition-all">
            <div class="text-xs text-gray-500">
              ${ICON_UPLOAD}
              ${t("commonSvc.clickOrDrag")}<br><span class="text-[10px] text-gray-400">${hint}</span>
            </div>
          </div>
          <input type="file" class="hidden" accept="${slot.accept}" />
        </div>`;
    }

    const isImage = file.type?.startsWith("image/");
    const badge = getFileBadge(file.name);
    const url = isImage ? getFilePreviewUrl(file) : "";
    const thumb = isImage
      ? `<img src="${url}" class="w-full h-full object-cover rounded" />`
      : `<div class="w-full h-full ${badge.cls} text-white flex items-center justify-center text-sm font-bold rounded">${badge.label}</div>`;

    const p = this.progress.get(slot.id);
    const showBar = p?.status === "uploading";
    const showSuccess = p?.status === "success";
    const showError = p?.status === "error";

    return `
      <div data-slot-id="${slot.id}" class="slot-card flex flex-col">
        <div class="text-xs font-semibold text-gray-700 mb-2">${slot.label}${slot.required ? ' <span class="text-red-500">*</span>' : ""}</div>
        <div class="slot-zone border-2 border-emerald-400 rounded-lg h-40 p-1 relative">
          <div class="relative w-full h-full">
            <button class="slot-remove absolute -top-2 -end-2 z-30 w-6 h-6 rounded-full bg-white hover:bg-red-500 hover:text-white text-red-500 shadow text-sm flex items-center justify-center" ${this.isUploading ? "disabled" : ""}>&times;</button>
            ${thumb}
            ${showBar ? `<div class="slot-bar-wrap absolute top-1/2 start-[15%] end-[15%] -translate-y-1/2 h-3 bg-black/75 border-2 border-black/80 rounded-full overflow-hidden z-10"><div class="slot-bar h-full bg-white rounded-full transition-all duration-300" style="width:${Math.max(4, Math.round((p!.loaded / Math.max(1, p!.total)) * 100))}%"></div></div>` : ""}
            ${showSuccess ? `<div class="absolute top-1 start-1 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">✓</div>` : ""}
            ${showError ? `<div class="absolute top-1 start-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">✕</div>` : ""}
            <div class="absolute bottom-0 start-0 end-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate rounded-b">${file.name}</div>
          </div>
        </div>
        <input type="file" class="hidden" accept="${slot.accept}" />
      </div>`;
  }

  private bindSlot(slot: SlotDef): void {
    const slotEl = this.container.querySelector<HTMLElement>(`[data-slot-id="${slot.id}"]`);
    if (!slotEl) return;
    const input = slotEl.querySelector<HTMLInputElement>('input[type="file"]')!;
    const zone = slotEl.querySelector<HTMLElement>(".slot-zone")!;

    const removeBtn = slotEl.querySelector<HTMLButtonElement>(".slot-remove");
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.isUploading) return;
        const f = this.files.get(slot.id);
        if (f) revokeFilePreview(f);
        this.files.delete(slot.id);
        this.progress.delete(slot.id);
        this.render();
        this.opts.onSlotCleared?.(slot.id);
      });
    }

    zone.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".slot-remove")) return;
      input.click();
    });
    input.addEventListener("change", () => {
      const f = input.files?.[0];
      if (f) this.acceptFile(slot, f);
      input.value = "";
    });

    ["dragenter", "dragover"].forEach((ev) => {
      zone.addEventListener(ev, (e) => {
        e.preventDefault();
        zone.classList.add("border-amber-500", "bg-amber-50/40");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      zone.addEventListener(ev, (e) => {
        if (ev === "drop") {
          e.preventDefault();
          const f = (e as DragEvent).dataTransfer?.files?.[0];
          if (f) this.acceptFile(slot, f);
        }
        zone.classList.remove("border-amber-500", "bg-amber-50/40");
      });
    });
  }

  private acceptFile(slot: SlotDef, file: File): void {
    const maxBytes = slot.maxFileSizeBytes ?? 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.opts.onValidationError?.(slot.id, "tooLarge", file);
      return;
    }
    const existing = this.files.get(slot.id);
    if (existing) revokeFilePreview(existing);
    this.files.set(slot.id, file);
    this.progress.delete(slot.id);
    this.render();
    this.opts.onSlotFilled?.(slot.id, file);

    if (this.opts.autoUpload) {
      void this.autoUploadSlot(slot, file);
    }
  }

  /** Success geçişinde bar'ı %100'de tutup mark'a geçmeden bekletecek süre.
   *  Hızlı upload'larda kullanıcının bar dolma akışını görmesini garanti eder. */
  private static readonly SUCCESS_HOLD_MS = 350;

  private async autoUploadSlot(slot: SlotDef, file: File): Promise<void> {
    this.progress.set(slot.id, { loaded: 0, total: file.size, status: "uploading" });
    this.render();

    try {
      if (this.opts.autoCustomUploader) {
        // Custom pipeline (örn. base64 JSON) — kendi progress emit etmez.
        this.simulateProgressUntilDone(slot.id, file);
        const result = await this.opts.autoCustomUploader(slot.id, file);
        if (result.success) {
          await this.transitionToSuccess(slot.id, file);
          if (result.fileUrl) this.opts.onSlotUploaded?.(slot.id, result.fileUrl);
        } else {
          this.progress.set(slot.id, { loaded: 0, total: file.size, status: "error" });
          this.render();
          this.opts.onSlotUploadError?.(slot.id, result.error ?? t("commonSvc.unknownError"));
        }
        return;
      }

      const cfg = this.opts.autoUploadConfig;
      if (!cfg) {
        this.progress.set(slot.id, { loaded: 0, total: file.size, status: "error" });
        this.render();
        this.opts.onSlotUploadError?.(slot.id, "Upload config missing");
        return;
      }

      let capturedFileUrl: string | undefined;
      const result = await uploadFiles({
        files: [file],
        endpoint: cfg.endpoint,
        formDataFields: cfg.formDataPerSlot?.(slot.id),
        headers: cfg.headers,
        concurrency: 1,
        // uploader.ts kendi successHoldMs (default 350ms) ile bar'ı %100'de tutar
        onFileProgress: (_f, state) => {
          this.progress.set(slot.id, state);
          this.render();
        },
        onFileUploaded: (_f, responseText) => {
          try {
            const data = JSON.parse(responseText) as { message?: { file_url?: string } };
            capturedFileUrl = data.message?.file_url;
          } catch {
            // Response parse edilemedi — fileUrl boş kalır
          }
        },
      });

      if (result.failed.length) {
        this.progress.set(slot.id, { loaded: 0, total: file.size, status: "error" });
        this.render();
        this.opts.onSlotUploadError?.(slot.id, result.failed[0].error);
      } else if (capturedFileUrl) {
        this.opts.onSlotUploaded?.(slot.id, capturedFileUrl);
      }
    } catch (e) {
      this.progress.set(slot.id, { loaded: 0, total: file.size, status: "error" });
      this.render();
      this.opts.onSlotUploadError?.(slot.id, e instanceof Error ? e.message : String(e));
    }
  }

  /** Bar'ı önce %100'de göster (SUCCESS_HOLD_MS), sonra mark'a geç.
   *  Lokal docker upload'lar <50ms olduğunda bile bar görünür kalır. */
  private async transitionToSuccess(slotId: string, file: File): Promise<void> {
    this.progress.set(slotId, { loaded: file.size, total: file.size, status: "uploading" });
    this.render();
    await new Promise((r) => window.setTimeout(r, SlotDropzoneController.SUCCESS_HOLD_MS));
    this.progress.set(slotId, { loaded: file.size, total: file.size, status: "success" });
    this.render();
  }

  /** Custom uploader progress emit etmediğinde sahte ilerleme göster.
   *  İlk tick immediate — setInterval'in 100ms beklemesini engeller. */
  private simulateProgressUntilDone(slotId: string, file: File): void {
    let pct = 0;
    const tick = (): boolean => {
      const p = this.progress.get(slotId);
      if (!p || p.status !== "uploading") return false;
      pct = Math.min(pct + 12 + Math.random() * 8, 85);
      this.progress.set(slotId, {
        loaded: (file.size * pct) / 100,
        total: file.size,
        status: "uploading",
      });
      this.render();
      return true;
    };
    tick(); // immediate ilk tick — bar hemen %12-20 arasında belirsin
    const interval = window.setInterval(() => {
      if (!tick()) window.clearInterval(interval);
    }, 100);
  }

  /** Submit pipeline — tüm slot'ları paralel upload */
  async upload(uploadOpts: {
    endpoint: string;
    /** slotId → ek formData (örn. {document_type: 'identity'}) */
    formDataPerSlot?: (slotId: string) => Record<string, string>;
    headers?: Record<string, string>;
    concurrency?: number;
  }): Promise<{ succeeded: string[]; failed: Array<{ slotId: string; error: string }> }> {
    this.isUploading = true;
    const slotIds = Array.from(this.files.keys());
    const succeeded: string[] = [];
    const failed: Array<{ slotId: string; error: string }> = [];

    for (const slotId of slotIds) {
      this.progress.set(slotId, {
        loaded: 0,
        total: this.files.get(slotId)!.size,
        status: "uploading",
      });
    }
    this.render();

    // Her slot ayrı upload (concurrency uploader içinde)
    const tasks = slotIds.map(async (slotId) => {
      const file = this.files.get(slotId)!;
      const result = await uploadFiles({
        files: [file],
        endpoint: uploadOpts.endpoint,
        formDataFields: uploadOpts.formDataPerSlot?.(slotId),
        headers: uploadOpts.headers,
        concurrency: 1,
        onFileProgress: (_f, state) => {
          this.progress.set(slotId, state);
          // Incremental update: sadece o slot'u re-render etmek için full render
          // (slot sayısı az olduğu için kabul edilebilir)
          this.render();
        },
      });
      if (result.failed.length) {
        failed.push({ slotId, error: result.failed[0].error });
      } else {
        succeeded.push(slotId);
      }
    });

    // Concurrency control — uploader içinde dosya başına concurrency=1, dış katmanda paralel slot
    const slotConcurrency = uploadOpts.concurrency ?? 2;
    for (let i = 0; i < tasks.length; i += slotConcurrency) {
      await Promise.all(tasks.slice(i, i + slotConcurrency));
    }

    this.isUploading = false;
    return { succeeded, failed };
  }

  /** Required slot'lar dolu mu? */
  isValid(): boolean {
    return this.opts.slots.filter((s) => s.required).every((s) => this.files.has(s.id));
  }
}
