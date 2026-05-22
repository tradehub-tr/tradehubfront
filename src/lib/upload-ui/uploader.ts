/**
 * Generic uploader — paralel concurrency-limited XHR pipeline.
 *
 * RFQ pattern'inden promote edildi. Caller her şeyi parametre olarak geçer:
 * endpoint, ek FormData alanları, CSRF token. Böylece Frappe upload_file dışında
 * başka endpoint'lerle de (örn. tradehub_core.api.v1.identity.upload_private_file)
 * kullanılabilir.
 *
 * - concurrency=2 default: aynı anda en fazla 2 dosya yüklenir
 * - Bir dosyanın hatası diğerlerini durdurmaz (Promise.allSettled davranışı)
 * - Per-file ve toplam progress callback'leri bytes-based
 * - Hybrid simulated progress: lokal/küçük dosyalarda xhr.upload.progress event'i
 *   hiç firm'amayabilir; setInterval ile %90'a kadar suni ilerleme yayınlanır
 */

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface FileProgress {
  loaded: number;
  total: number;
  status: UploadStatus;
}

export interface UploadResult {
  succeeded: File[];
  failed: Array<{ file: File; error: string }>;
}

export interface UploadOptions {
  files: File[];
  /** Endpoint URL (Frappe için: /api/method/upload_file) */
  endpoint: string;
  /** Her isteğe eklenecek ek FormData alanları (örn. doctype, docname, is_private) */
  formDataFields?: Record<string, string>;
  /** XHR'a eklenecek header'lar (örn. X-Frappe-CSRF-Token) */
  headers?: Record<string, string>;
  /** Aynı anda yüklenecek max dosya sayısı (default 2) */
  concurrency?: number;
  /** withCredentials (cookie tabanlı auth için, default true) */
  withCredentials?: boolean;
  /** Tek bir dosyanın progress'i değiştiğinde tetiklenir */
  onFileProgress?: (file: File, state: FileProgress) => void;
  /** Toplam bytes-based progress */
  onTotalProgress?: (loadedBytes: number, totalBytes: number) => void;
  /** Bir dosya başarıyla yüklendiğinde, XHR response body ile birlikte */
  onFileUploaded?: (file: File, responseText: string) => void;
  /** Load event'inden sonra bar'ı %100'de tut + success emit et arasındaki gecikme.
   *  Lokal/hızlı upload'larda bar'ın görsel olarak akışını garanti eder.
   *  Default 350ms — Material Design success state guideline'ı. */
  successHoldMs?: number;
}

export async function uploadFiles(opts: UploadOptions): Promise<UploadResult> {
  const concurrency = opts.concurrency ?? 2;
  const withCredentials = opts.withCredentials ?? true;
  const successHoldMs = opts.successHoldMs ?? 350;
  const totalBytes = opts.files.reduce((s, f) => s + f.size, 0);
  const loadedPerFile = new Map<File, number>();
  opts.files.forEach((f) => loadedPerFile.set(f, 0));

  function emitTotal(): void {
    if (!opts.onTotalProgress) return;
    let loaded = 0;
    for (const v of loadedPerFile.values()) loaded += v;
    opts.onTotalProgress(loaded, totalBytes);
  }

  function uploadOne(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", opts.endpoint);
      xhr.withCredentials = withCredentials;
      if (opts.headers) {
        for (const [k, v] of Object.entries(opts.headers)) {
          xhr.setRequestHeader(k, v);
        }
      }

      // Hybrid simulated progress — lokal/küçük dosyalarda xhr.upload.progress
      // hiç firm'amayabilir → bar görünmez kalır. İlk tick immediate (setInterval
      // beklemesini engeller), sonra her 100ms; gerçek progress devraldığında durur.
      let usingRealProgress = false;
      let simulated = 0;
      const simTick = (): boolean => {
        if (usingRealProgress) return false;
        simulated = Math.min(simulated + 10 + Math.random() * 8, 85);
        const loaded = (file.size * simulated) / 100;
        loadedPerFile.set(file, loaded);
        opts.onFileProgress?.(file, {
          loaded,
          total: file.size,
          status: "uploading",
        });
        emitTotal();
        return true;
      };
      const simInterval = window.setInterval(() => {
        if (!simTick()) window.clearInterval(simInterval);
      }, 100);

      xhr.upload.addEventListener("progress", (e) => {
        if (!e.lengthComputable) return;
        usingRealProgress = true;
        window.clearInterval(simInterval);
        loadedPerFile.set(file, e.loaded);
        opts.onFileProgress?.(file, {
          loaded: e.loaded,
          total: e.total,
          status: "uploading",
        });
        emitTotal();
      });

      xhr.addEventListener("load", () => {
        window.clearInterval(simInterval);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Önce bar'ı %100'de tut (uploading status), successHoldMs sonra success emit et.
          // Lokal docker <50ms upload'larda kullanıcının "bar dolma + tamamlandı"
          // akışını görmesini garanti eder.
          loadedPerFile.set(file, file.size);
          opts.onFileProgress?.(file, {
            loaded: file.size,
            total: file.size,
            status: "uploading",
          });
          emitTotal();
          window.setTimeout(() => {
            opts.onFileProgress?.(file, {
              loaded: file.size,
              total: file.size,
              status: "success",
            });
            opts.onFileUploaded?.(file, xhr.responseText);
            resolve();
          }, successHoldMs);
        } else {
          opts.onFileProgress?.(file, {
            loaded: 0,
            total: file.size,
            status: "error",
          });
          reject(new Error(`HTTP ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        window.clearInterval(simInterval);
        opts.onFileProgress?.(file, {
          loaded: 0,
          total: file.size,
          status: "error",
        });
        reject(new Error("Network error"));
      });

      const fd = new FormData();
      fd.append("file", file);
      if (opts.formDataFields) {
        for (const [k, v] of Object.entries(opts.formDataFields)) {
          fd.append(k, v);
        }
      }

      // Başlangıç state'i: bar hemen görünsün (0% optimistic)
      opts.onFileProgress?.(file, { loaded: 0, total: file.size, status: "uploading" });
      xhr.send(fd);
      // Send sonrası immediate simulate tick — bar %10-18 arası belirsin.
      // Lokal docker'da load 50ms'de gelse bile bar'ın "dolarken" akışı görünür.
      simTick();
    });
  }

  // Worker pool — concurrency adet worker queue'dan paralel çeker
  const queue = [...opts.files];
  const succeeded: File[] = [];
  const failed: Array<{ file: File; error: string }> = [];

  async function worker(): Promise<void> {
    while (queue.length) {
      const f = queue.shift()!;
      try {
        await uploadOne(f);
        succeeded.push(f);
      } catch (e) {
        failed.push({ file: f, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return { succeeded, failed };
}
