/**
 * Generic dropzone — drag/drop + click + klavye trigger'ı.
 * Validation: extension + size + maxFiles + dedupe (name+size).
 * Toast/i18n caller'dan callback olarak gelir.
 */

export interface DropzoneConfig {
  maxFiles: number;
  maxFileSizeBytes: number;
  allowedExtensions: readonly string[]; // [".jpg", ".pdf"] gibi
  allowedFormatsDisplay: string; // "JPG, PNG, PDF" gibi
}

export interface DropzoneTexts {
  title: string;
  or: string;
  pickBtn: string;
  meta?: string; // override; yoksa allowedFormatsDisplay'den üretilir
  dragRelease: string;
}

const ICON_UPLOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;

export interface RenderDropzoneOpts {
  id: string;
  inputId: string;
  texts: DropzoneTexts;
  config: DropzoneConfig;
}

export function renderDropzone(opts: RenderDropzoneOpts): string {
  const meta =
    opts.texts.meta ??
    `${opts.config.allowedFormatsDisplay} · maks. ${opts.config.maxFiles} · ${Math.round(opts.config.maxFileSizeBytes / 1024 / 1024)}MB`;
  const accept = opts.config.allowedExtensions.join(",");
  return `
    <div id="${opts.id}" class="upload-dropzone group relative cursor-pointer border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50/40 rounded-xl px-6 py-8 flex flex-col items-center gap-3 transition-all duration-150 text-center" role="button" tabindex="0">
      <div class="upload-dz-icon w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center transition-all">
        ${ICON_UPLOAD}
      </div>
      <div class="upload-dz-title text-sm font-bold text-gray-800">${opts.texts.title}</div>
      <div class="text-xs text-gray-400">${opts.texts.or}</div>
      <button type="button" class="upload-dz-pick px-4 py-1.5 text-xs font-semibold rounded-md bg-amber-400 hover:bg-amber-500 text-gray-900 transition-colors">
        ${opts.texts.pickBtn}
      </button>
      <div class="upload-dz-meta text-[11px] text-gray-400 mt-1">${meta}</div>
      <input type="file" id="${opts.inputId}" class="hidden" multiple accept="${accept}" />
    </div>
  `;
}

export interface DropzoneHandlers {
  getCurrentFiles: () => File[];
  onAdd: (files: File[]) => void;
  onValidationError?: (
    kind: "unsupported" | "tooLarge" | "duplicate" | "maxFiles",
    file?: File
  ) => void;
}

export interface BindDropzoneOpts {
  id: string;
  inputId: string;
  config: DropzoneConfig;
  texts: DropzoneTexts;
}

export function bindDropzone(opts: BindDropzoneOpts, handlers: DropzoneHandlers): () => void {
  const root = document.getElementById(opts.id) as HTMLElement | null;
  const fileInput = document.getElementById(opts.inputId) as HTMLInputElement | null;
  if (!root || !fileInput) return () => {};

  const iconWrap = root.querySelector<HTMLElement>(".upload-dz-icon");
  const titleEl = root.querySelector<HTMLElement>(".upload-dz-title");
  const originalTitle = titleEl?.textContent || "";

  function setDragOver(on: boolean) {
    if (on) {
      root!.classList.add("border-amber-500", "bg-amber-50", "scale-[1.005]");
      root!.classList.remove("border-gray-300");
      iconWrap?.classList.add("bg-amber-500", "text-white");
      iconWrap?.classList.remove("bg-amber-100", "text-amber-600");
      if (titleEl) titleEl.textContent = opts.texts.dragRelease;
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
    if (!opts.config.allowedExtensions.includes(ext)) {
      handlers.onValidationError?.("unsupported", file);
      return false;
    }
    if (file.size > opts.config.maxFileSizeBytes) {
      handlers.onValidationError?.("tooLarge", file);
      return false;
    }
    return true;
  }

  function ingest(rawList: FileList | File[]) {
    const current = handlers.getCurrentFiles();
    const existingKeys = new Set(current.map(fileKey));
    const accepted: File[] = [];

    for (const f of Array.from(rawList)) {
      if (current.length + accepted.length >= opts.config.maxFiles) {
        handlers.onValidationError?.("maxFiles");
        break;
      }
      if (!isAllowed(f)) continue;
      const key = fileKey(f);
      if (existingKeys.has(key)) {
        handlers.onValidationError?.("duplicate", f);
        continue;
      }
      existingKeys.add(key);
      accepted.push(f);
    }

    if (accepted.length) handlers.onAdd(accepted);
  }

  root.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    fileInput.click();
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length) ingest(fileInput.files);
    fileInput.value = "";
  });

  root.addEventListener("dragenter", (e) => {
    e.preventDefault();
    setDragOver(true);
  });
  root.addEventListener("dragover", (e) => {
    e.preventDefault();
    setDragOver(true);
  });
  root.addEventListener("dragleave", (e) => {
    if (e.target === root) setDragOver(false);
  });
  root.addEventListener("drop", (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) ingest(e.dataTransfer.files);
  });

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
