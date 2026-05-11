/**
 * Storefront RFQ dropzone — shared between Step 1 (rfq.html) and Step 2
 * (rfq-form.html). Renders a prominent dashed area with upload icon,
 * "drag here" prompt, "Choose from Computer" button, and format/size meta.
 *
 * Handlers receive validated File[] arrays — extension + size + maxFiles
 * + duplicate dedupe are all enforced inside bindDropzone, so the consumer
 * just appends the files to its staging array.
 */

import { t } from "../../i18n";
import { FILE_UPLOAD_CONFIG } from "../../types/rfq";
import { showToast } from "../../utils/toast";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ICON_UPLOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;

export interface DropzoneOptions {
  /** Wrapper element id (must be unique across the page) */
  id: string;
  /** id of the underlying hidden <input type="file"> */
  inputId: string;
  /** Optional custom meta text (defaults to formats/size/max-file hint) */
  metaText?: string;
}

export function renderDropzone(opts: DropzoneOptions): string {
  const meta =
    opts.metaText ??
    t("rfq.dropzoneMeta", {
      formats: FILE_UPLOAD_CONFIG.allowedFormatsDisplay,
      max: FILE_UPLOAD_CONFIG.maxFiles,
      size: 10,
    });
  const accept = FILE_UPLOAD_CONFIG.allowedExtensions.join(",");
  return `
    <div id="${opts.id}" class="rfq-dropzone group relative cursor-pointer border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50/40 rounded-xl px-6 py-8 flex flex-col items-center gap-3 transition-all duration-150 text-center" role="button" tabindex="0">
      <div class="rfq-dropzone-icon w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center transition-all">
        ${ICON_UPLOAD}
      </div>
      <div class="rfq-dropzone-title text-sm font-bold text-gray-800">
        ${t("rfq.dropzoneTitle")}
      </div>
      <div class="text-xs text-gray-400">${t("rfq.dropzoneOr")}</div>
      <button type="button" class="rfq-dropzone-pick px-4 py-1.5 text-xs font-semibold rounded-md bg-amber-400 hover:bg-amber-500 text-gray-900 transition-colors">
        ${t("rfq.dropzonePickBtn")}
      </button>
      <div class="rfq-dropzone-meta text-[11px] text-gray-400 mt-1">${meta}</div>
      <input type="file" id="${opts.inputId}" class="hidden" multiple accept="${accept}" />
    </div>
  `;
}

export interface DropzoneHandlers {
  /** Current staged files — used for dedupe + max-files check */
  getCurrentFiles: () => File[];
  /** Called with validated, deduplicated new files only */
  onAdd: (files: File[]) => void;
}

/**
 * Wire up click / keyboard / drag-drop / file-input events for a rendered
 * dropzone. Validates: extension, size (10MB), duplicates (name+size),
 * and total count (FILE_UPLOAD_CONFIG.maxFiles).
 *
 * Returns a teardown function that removes the document-level dragend/drop
 * fallback listeners — call when the dropzone is unmounted.
 */
export function bindDropzone(opts: DropzoneOptions, handlers: DropzoneHandlers): () => void {
  const root = document.getElementById(opts.id) as HTMLElement | null;
  const fileInput = document.getElementById(opts.inputId) as HTMLInputElement | null;
  if (!root || !fileInput) return () => {};

  const iconWrap = root.querySelector<HTMLElement>(".rfq-dropzone-icon");
  const titleEl = root.querySelector<HTMLElement>(".rfq-dropzone-title");
  const originalTitle = titleEl?.textContent || "";

  function setDragOver(on: boolean) {
    if (on) {
      root!.classList.add("border-amber-500", "bg-amber-50", "scale-[1.005]");
      root!.classList.remove("border-gray-300");
      iconWrap?.classList.add("bg-amber-500", "text-white");
      iconWrap?.classList.remove("bg-amber-100", "text-amber-600");
      if (titleEl) titleEl.textContent = t("rfq.dropzoneDragRelease");
    } else {
      root!.classList.remove("border-amber-500", "bg-amber-50", "scale-[1.005]");
      root!.classList.add("border-gray-300");
      iconWrap?.classList.remove("bg-amber-500", "text-white");
      iconWrap?.classList.add("bg-amber-100", "text-amber-600");
      if (titleEl) titleEl.textContent = originalTitle;
    }
  }

  function fileKey(f: File): string {
    return `${f.name}__${f.size}`;
  }

  function isAllowed(file: File): boolean {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(ext as any)) {
      showToast({ message: t("rfq.unsupportedFormat", { fileName: file.name }), type: "error" });
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast({ message: t("rfq.fileTooLarge", { fileName: file.name }), type: "error" });
      return false;
    }
    return true;
  }

  function ingest(rawList: FileList | File[]) {
    const current = handlers.getCurrentFiles();
    const existingKeys = new Set(current.map(fileKey));
    const accepted: File[] = [];

    for (const f of Array.from(rawList)) {
      if (current.length + accepted.length >= FILE_UPLOAD_CONFIG.maxFiles) {
        showToast({ message: t("rfq.maxFilesAlert"), type: "warning" });
        break;
      }
      if (!isAllowed(f)) continue;
      const key = fileKey(f);
      if (existingKeys.has(key)) {
        showToast({ message: t("rfq.duplicateFile", { fileName: f.name }), type: "warning" });
        continue;
      }
      existingKeys.add(key);
      accepted.push(f);
    }

    if (accepted.length) handlers.onAdd(accepted);
  }

  // Click anywhere on the dropzone → open file picker
  root.addEventListener("click", (e) => {
    // The native "Choose from Computer" <button> already triggers this through
    // event propagation; we just need to make sure click on the surrounding
    // area also works.
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    fileInput.click();
  });

  // Keyboard accessibility (Enter / Space)
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length) ingest(fileInput.files);
    fileInput.value = "";
  });

  // Drag & drop on the dropzone
  root.addEventListener("dragenter", (e) => {
    e.preventDefault();
    setDragOver(true);
  });
  root.addEventListener("dragover", (e) => {
    e.preventDefault();
    setDragOver(true);
  });
  root.addEventListener("dragleave", (e) => {
    // Only flip back when leaving the dropzone itself (not entering a child)
    if (e.target === root) setDragOver(false);
  });
  root.addEventListener("drop", (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) ingest(e.dataTransfer.files);
  });

  // Prevent the browser from navigating to a dropped file outside the zone
  function preventNav(e: DragEvent) {
    if (e.target && root!.contains(e.target as Node)) return;
    e.preventDefault();
  }
  document.addEventListener("dragover", preventNav);
  document.addEventListener("drop", preventNav);

  return () => {
    document.removeEventListener("dragover", preventNav);
    document.removeEventListener("drop", preventNav);
  };
}
