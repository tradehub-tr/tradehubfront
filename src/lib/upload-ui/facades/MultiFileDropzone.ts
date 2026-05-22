/**
 * MultiFileDropzone — RFQ tarzı çoklu dosya picker.
 *
 * UI: dropzone alanı + altta grid kart layout + Dropzone-style progress bar overlay.
 * Davranış:
 * - Dosya bırakılır bırakmaz fake staging animation (~0.8sn)
 * - Submit anında uploadFiles ile gerçek paralel upload + per-file/total progress
 *
 * Caller container'a hem dropzone hem file-list yerleştirir. Submit pipeline'ı
 * (örn. RFQ create → upload) caller'da kalır; bu facade sadece UI + uploader hook'u.
 */

import { renderDropzone, bindDropzone, type DropzoneConfig, type DropzoneTexts } from "../dropzone";
import { renderFileGrid, updateFileCardProgress, simulateStagingProgress } from "../file-list";
import { uploadFiles, type UploadResult, type FileProgress } from "../uploader";

export interface MultiFileDropzoneOptions {
  /** Dropzone wrapper element id */
  dropzoneId: string;
  /** Hidden file input id */
  fileInputId: string;
  /** Grid container id (caller render eder) */
  fileListId: string;
  /** Lightbox / preview scope */
  lightboxScope: string;
  /** Sayfa-bazlı unique prefix */
  scopePrefix?: string;
  config: DropzoneConfig;
  texts: DropzoneTexts;
  /** Dosya bırakılınca tetiklenir (örn. RFQ form'da staging) */
  onAdd?: (files: File[]) => void;
  /** Validation hatası — caller toast gösterir */
  onValidationError?: (
    kind: "unsupported" | "tooLarge" | "duplicate" | "maxFiles",
    file?: File
  ) => void;
  /** Resim önizleme tıklanırsa caller lightbox açar */
  onPreviewClick?: (file: File) => void;
  /** AutoUpload: dosya bırakılır bırakmaz upload tetiklensin (review/avatar tarzı).
   *  Default false — RFQ pattern'inde submit'te toplu upload. */
  autoUpload?: boolean;
  /** AutoUpload aktifse zorunlu */
  autoUploadConfig?: {
    endpoint: string;
    formDataFields?: Record<string, string>;
    headers?: Record<string, string>;
    concurrency?: number;
  };
  /** AutoUpload modda her dosya başarıyla yüklendiğinde — caller file_url'i state'ine ekler */
  onFileUploaded?: (file: File, responseText: string) => void;
  /** AutoUpload modda hata */
  onUploadError?: (file: File, error: string) => void;
}

export class MultiFileDropzoneController {
  readonly files: File[] = [];
  readonly progress = new Map<File, FileProgress>();
  isUploading = false;
  private teardown: () => void = () => {};
  private container!: HTMLElement;

  constructor(private opts: MultiFileDropzoneOptions) {}

  /** Init — dropzone'u bind eder. Caller renderDropzoneHtml'i kendi HTML'ine basmış olmalı. */
  mount(): void {
    const container = document.getElementById(this.opts.fileListId);
    if (!container) throw new Error(`fileList container not found: ${this.opts.fileListId}`);
    this.container = container;

    this.teardown = bindDropzone(
      {
        id: this.opts.dropzoneId,
        inputId: this.opts.fileInputId,
        config: this.opts.config,
        texts: this.opts.texts,
      },
      {
        getCurrentFiles: () => this.files,
        onAdd: (newFiles) => this.addFiles(newFiles),
        onValidationError: this.opts.onValidationError,
      }
    );
  }

  /** Caller'ın çağıracağı: HTML inject sırasında dropzone snippet'i */
  static renderDropzoneHtml(opts: {
    dropzoneId: string;
    fileInputId: string;
    config: DropzoneConfig;
    texts: DropzoneTexts;
  }): string {
    return renderDropzone({
      id: opts.dropzoneId,
      inputId: opts.fileInputId,
      config: opts.config,
      texts: opts.texts,
    });
  }

  private addFiles(newFiles: File[]): void {
    this.files.push(...newFiles);
    this.render();
    this.opts.onAdd?.(newFiles);

    // AutoUpload modu — staging animation atlanır, gerçek upload tetiklenir.
    if (this.opts.autoUpload && this.opts.autoUploadConfig) {
      void this.autoUploadFiles(newFiles);
      return;
    }

    newFiles.forEach((f) =>
      simulateStagingProgress(
        this.files,
        f,
        this.opts.lightboxScope,
        this.opts.scopePrefix,
        this.progress,
        () => this.render()
      )
    );
  }

  private async autoUploadFiles(files: File[]): Promise<void> {
    const cfg = this.opts.autoUploadConfig!;
    files.forEach((f) => {
      this.progress.set(f, { loaded: 0, total: f.size, status: "uploading" });
    });
    this.render();
    const result = await uploadFiles({
      files,
      endpoint: cfg.endpoint,
      formDataFields: cfg.formDataFields,
      headers: cfg.headers,
      concurrency: cfg.concurrency ?? 2,
      onFileProgress: (file, state) => {
        updateFileCardProgress(
          this.files,
          file,
          state,
          this.opts.lightboxScope,
          this.opts.scopePrefix,
          this.progress
        );
      },
      onFileUploaded: this.opts.onFileUploaded,
    });
    result.failed.forEach((f) => this.opts.onUploadError?.(f.file, f.error));
  }

  private render(): void {
    renderFileGrid(this.container, {
      files: this.files,
      progress: this.progress,
      isUploading: this.isUploading,
      lightboxScope: this.opts.lightboxScope,
      scopePrefix: this.opts.scopePrefix,
      onPreviewClick: this.opts.onPreviewClick,
    });
  }

  /** Submit pipeline — gerçek upload başlat */
  async upload(uploadOpts: {
    endpoint: string;
    formDataFields?: Record<string, string>;
    headers?: Record<string, string>;
    concurrency?: number;
  }): Promise<UploadResult> {
    if (!this.files.length) return { succeeded: [], failed: [] };

    this.isUploading = true;
    this.files.forEach((f) => {
      this.progress.set(f, { loaded: 0, total: f.size, status: "uploading" });
    });
    this.render();

    const result = await uploadFiles({
      files: this.files,
      endpoint: uploadOpts.endpoint,
      formDataFields: uploadOpts.formDataFields,
      headers: uploadOpts.headers,
      concurrency: uploadOpts.concurrency,
      onFileProgress: (file, state) => {
        updateFileCardProgress(
          this.files,
          file,
          state,
          this.opts.lightboxScope,
          this.opts.scopePrefix,
          this.progress
        );
      },
    });

    this.isUploading = false;
    return result;
  }

  /** beforeunload guard için */
  getIsUploading(): boolean {
    return this.isUploading;
  }

  destroy(): void {
    this.teardown();
  }
}
