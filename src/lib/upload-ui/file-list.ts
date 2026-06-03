/**
 * Grid kart layout + Dropzone-style progress bar overlay + ✓/✗ mark.
 *
 * Pure DOM render — Vue/React'tan da çağrılabilir (caller container element verir).
 * progress map opsiyonel — yoksa sadece kart, bar yok (Step 1 staging gibi).
 */

import { getFileBadge, getFilePreviewUrl, revokeFilePreview, formatFileSize } from "./utils";
import type { FileProgress } from "./uploader";

export interface FileListOptions {
  files: File[];
  progress?: Map<File, FileProgress>;
  isUploading?: boolean;
  /** Lightbox / preview popup için scope id */
  lightboxScope: string;
  /** Sayfa-bazlı unique id prefix (rfq-step1, ticket-form, vb.) */
  scopePrefix?: string;
  /** Caller değişiklik üzerine kendi state'ini günceller */
  onChange?: () => void;
  /** Thumbnail tıklanırsa caller lightbox açar (RFQ pattern) */
  onPreviewClick?: (file: File) => void;
}

function fileCardId(scope: string, prefix: string, idx: number): string {
  return `upload-card-${prefix}-${scope}-${idx}`;
}

export function renderFileGrid(container: HTMLElement, opts: FileListOptions): void {
  const { files, progress, isUploading, lightboxScope } = opts;
  const prefix = opts.scopePrefix ?? "default";

  container.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mt-6";
  container.style.gap = "2rem";
  container.style.marginTop = "1.5rem";
  container.innerHTML = files
    .map((f, i) => {
      const isImage = f.type?.startsWith("image/");
      const badge = getFileBadge(f.name);
      const previewUrl = isImage ? getFilePreviewUrl(f) : "";
      const thumb = isImage
        ? `<img src="${previewUrl}" alt="" class="upload-thumb-preview w-full h-full object-cover cursor-zoom-in" data-file-idx="${i}" />`
        : `<div class="w-full h-full ${badge.cls} text-white flex items-center justify-center text-sm font-bold">${badge.label}</div>`;

      const p = progress?.get(f);
      const pct = p ? Math.round((p.loaded / Math.max(1, p.total)) * 100) : 0;
      const visiblePct = p && p.status === "uploading" && pct < 4 ? 4 : pct;
      const isUploadingState = p?.status === "uploading";
      const isSuccess = p?.status === "success";
      const isError = p?.status === "error";

      const removeDisabled = isUploading ? "disabled" : "";
      const removeClass = isUploading
        ? "bg-gray-300 cursor-not-allowed text-gray-500"
        : "bg-white/95 hover:bg-red-500 hover:text-white text-red-500";

      const barWrapHidden = isUploadingState ? "" : "hidden";
      const markHidden = isSuccess || isError ? "" : "hidden";
      const markBg = isSuccess ? "bg-emerald-500/90" : isError ? "bg-red-500/90" : "bg-black/75";
      const markIcon = isSuccess ? "✓" : isError ? "✕" : "";

      return `
        <div id="${fileCardId(lightboxScope, prefix, i)}" class="relative bg-white border-2 border-gray-200 rounded-lg flex flex-col shadow-md p-2">
          <button type="button" data-remove="${i}" ${removeDisabled}
            class="upload-remove-file absolute -top-2 -end-2 z-30 w-7 h-7 rounded-full ${removeClass} shadow-md text-sm leading-none flex items-center justify-center transition"
            aria-label="Sil">&times;</button>

          <div class="relative w-full h-20 rounded overflow-hidden bg-gray-100">
            ${thumb}

            <div class="upload-bar-wrap absolute top-1/2 start-[15%] end-[15%] -translate-y-1/2 h-3 bg-black/75 border-2 border-black/80 rounded-full overflow-hidden z-10 ${barWrapHidden}">
              <div class="upload-bar h-full bg-white rounded-full transition-all duration-300" style="width:${visiblePct}%"></div>
            </div>

            <div class="upload-mark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full ${markBg} z-20 flex items-center justify-center text-white text-base font-bold ${markHidden}">${markIcon}</div>
          </div>

          <div class="pt-2">
            <div class="text-[11px] font-semibold text-gray-800 truncate" title="${f.name}">${f.name}</div>
            <div class="text-[10px] text-gray-500">${formatFileSize(f.size)}</div>
          </div>
        </div>`;
    })
    .join("");

  container.querySelectorAll<HTMLImageElement>(".upload-thumb-preview").forEach((img) => {
    img.addEventListener("click", () => {
      const idx = Number(img.dataset.fileIdx);
      const file = files[idx];
      if (file && opts.onPreviewClick) opts.onPreviewClick(file);
    });
  });

  container.querySelectorAll(".upload-remove-file").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (isUploading) return;
      const idx = Number((btn as HTMLElement).dataset.remove);
      const file = files[idx];
      if (file) {
        revokeFilePreview(file);
        progress?.delete(file);
      }
      files.splice(idx, 1);
      renderFileGrid(container, opts);
      opts.onChange?.();
    });
  });
}

/** Tek bir dosyanın kartını full re-render olmadan günceller. */
export function updateFileCardProgress(
  files: File[],
  file: File,
  state: FileProgress,
  lightboxScope: string,
  scopePrefix: string | undefined,
  progressMap: Map<File, FileProgress>
): void {
  progressMap.set(file, state);
  const idx = files.indexOf(file);
  if (idx === -1) return;
  const card = document.getElementById(fileCardId(lightboxScope, scopePrefix ?? "default", idx));
  if (!card) return;
  const wrap = card.querySelector<HTMLElement>(".upload-bar-wrap");
  const bar = card.querySelector<HTMLElement>(".upload-bar");
  const mark = card.querySelector<HTMLElement>(".upload-mark");
  if (!wrap || !bar || !mark) return;

  if (state.status === "uploading") {
    wrap.classList.remove("hidden");
    mark.classList.add("hidden");
    const pct = Math.round((state.loaded / Math.max(1, state.total)) * 100);
    const visiblePct = pct < 4 ? 4 : pct;
    bar.style.width = visiblePct + "%";
  } else if (state.status === "success") {
    bar.style.width = "100%";
    wrap.classList.add("hidden");
    mark.classList.remove("hidden");
    mark.className =
      "upload-mark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-emerald-500/90 z-20 flex items-center justify-center text-white text-base font-bold";
    mark.textContent = "✓";
  } else if (state.status === "error") {
    wrap.classList.add("hidden");
    mark.classList.remove("hidden");
    mark.className =
      "upload-mark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-red-500/90 z-20 flex items-center justify-center text-white text-base font-bold";
    mark.textContent = "✕";
  }
}

/**
 * Staging animation — dosya bırakılır bırakmaz ~0.8 saniyelik fake progress.
 * Upload gerçekleşmez; sadece görsel feedback.
 */
export function simulateStagingProgress(
  files: File[],
  file: File,
  scope: string,
  scopePrefix: string | undefined,
  progressMap: Map<File, FileProgress>,
  rerender: () => void
): void {
  progressMap.set(file, { loaded: 0, total: file.size, status: "uploading" });
  rerender();
  let pct = 0;
  const interval = window.setInterval(() => {
    pct += 14 + Math.random() * 10;
    if (pct >= 100) {
      window.clearInterval(interval);
      progressMap.delete(file);
      rerender();
    } else {
      updateFileCardProgress(
        files,
        file,
        { loaded: (file.size * pct) / 100, total: file.size, status: "uploading" },
        scope,
        scopePrefix,
        progressMap
      );
    }
  }, 90);
}
