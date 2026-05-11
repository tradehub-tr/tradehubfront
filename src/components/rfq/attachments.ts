/**
 * Storefront RFQ attachment UI — shared between buyer detail page
 * (rfq-quotes.html) and seller "Submit Quote" modal (inquiries.html).
 *
 * Backend contract (api/rfq.py::get_rfq_attachments + get_rfq_detail.attachments):
 *   { name, file_name, file_url, file_size, creation }
 *
 * Files are served from /private/files/... — Frappe gates the download
 * through RFQ.has_permission, so unauthorized callers get 403 even with
 * the direct URL.
 */

import { t } from "../../i18n";

export interface RfqAttachment {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  creation: string;
}

export function getFileKind(fileName: string): "image" | "pdf" | "other" {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

export function getFileBadge(fileName: string): { label: string; cls: string } {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return { label: ext.toUpperCase(), cls: "bg-indigo-500" };
  if (ext === "pdf") return { label: "PDF", cls: "bg-red-500" };
  if (["xls", "xlsx"].includes(ext)) return { label: "XLS", cls: "bg-green-600" };
  if (["doc", "docx"].includes(ext)) return { label: "DOC", cls: "bg-blue-600" };
  return { label: "FILE", cls: "bg-gray-500" };
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// SVG icons (no emoji per project convention)
export const ICON_PAPERCLIP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m21 12-9.5 9.5a4 4 0 0 1-5.66 0 4 4 0 0 1 0-5.66l9.19-9.19a3 3 0 0 1 4.24 4.24L10.6 19.86a2 2 0 1 1-2.83-2.83l8.49-8.49"/></svg>`;
export const ICON_LOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

export function renderAttachmentCard(att: RfqAttachment, idx: number, scope: string = ""): string {
  const kind = getFileKind(att.file_name);
  const badge = getFileBadge(att.file_name);
  const isPreviewable = kind === "image" || kind === "pdf";
  const thumb =
    kind === "image"
      ? `<img src="${att.file_url}" alt="" class="w-full h-32 object-cover" loading="lazy" />`
      : `<div class="w-full h-32 flex flex-col items-center justify-center bg-gray-50">
         <div class="w-12 h-12 rounded-md ${badge.cls} text-white text-xs font-bold flex items-center justify-center">${badge.label}</div>
         <span class="mt-2 text-xs text-gray-400">${kind === "pdf" ? t("rfq.previewable") : t("rfq.notPreviewable")}</span>
       </div>`;

  return `
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <div class="rfq-attach-thumb ${isPreviewable ? "cursor-pointer hover:opacity-90" : ""}" data-attach-scope="${scope}" data-attach-idx="${idx}">
        ${thumb}
      </div>
      <div class="p-2.5 flex flex-col gap-1.5">
        <div class="text-xs font-semibold text-gray-800 truncate" title="${att.file_name}">${att.file_name}</div>
        <div class="text-[11px] text-gray-400">${formatFileSize(att.file_size)}</div>
        <div class="flex gap-1.5 mt-1">
          ${
            isPreviewable
              ? `
            <button type="button" class="rfq-attach-newtab flex-1 px-2 py-1 text-[11px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors" data-attach-scope="${scope}" data-attach-idx="${idx}">
              ${t("rfq.openInNewTab")}
            </button>
          `
              : ""
          }
          <a href="${att.file_url}" download="${att.file_name}" class="${isPreviewable ? "flex-1" : "w-full"} px-2 py-1 text-[11px] font-semibold rounded bg-emerald-500 text-white text-center hover:bg-emerald-600 transition-colors">
            ${t("rfq.downloadFile")}
          </a>
        </div>
      </div>
    </div>
  `;
}

export function renderAttachmentsSection(attachments: RfqAttachment[], scope: string = ""): string {
  if (!attachments?.length) return "";
  return `
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 class="text-base font-bold text-gray-800 flex items-center gap-2">
          <span class="text-amber-500">${ICON_PAPERCLIP}</span>
          ${t("rfq.attachmentsTitle")}
          <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">${attachments.length} ${t("rfq.attachmentsCountSuffix")}</span>
        </h2>
        <span class="text-xs text-gray-500 inline-flex items-center gap-1">${ICON_LOCK} ${t("rfq.attachmentsPrivateHint")}</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        ${attachments.map((a, i) => renderAttachmentCard(a, i, scope)).join("")}
      </div>
    </div>
  `;
}

/**
 * Renders a compact attachment grid (used in modal contexts, e.g. seller's
 * Submit Quote modal). Smaller header, denser grid.
 */
export function renderAttachmentsCompact(attachments: RfqAttachment[], scope: string = ""): string {
  if (!attachments?.length) return "";
  return `
    <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2.5">
        <span class="text-sm font-semibold text-gray-700 inline-flex items-center gap-1.5">
          <span class="text-amber-500">${ICON_PAPERCLIP}</span>
          ${t("rfq.attachmentsTitle")}
          <span class="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">${attachments.length}</span>
        </span>
        <span class="text-[10px] text-gray-500 inline-flex items-center gap-1">${ICON_LOCK} ${t("rfq.attachmentsPrivateHint")}</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        ${attachments.map((a, i) => renderAttachmentCard(a, i, scope)).join("")}
      </div>
    </div>
  `;
}

/**
 * Returns the HTML for the lightbox modal. Append once to <body> (or any
 * container); `setupAttachmentInteractions` wires up open/close.
 *
 * Distinct IDs per scope let multiple parent contexts (buyer detail page,
 * seller quote modal) coexist without z-index/id conflicts.
 */
const ICON_EXTERNAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline-block -mt-0.5 mr-1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
const ICON_DOWNLOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline-block -mt-0.5 mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

export function renderAttachmentModal(scope: string = "default"): string {
  return `
    <div id="rfq-attach-modal-${scope}" class="fixed inset-0 z-[1200] hidden items-center justify-center bg-black/60 p-4">
      <div class="absolute inset-0" data-attach-modal-backdrop="${scope}"></div>
      <div class="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-lg overflow-hidden bg-white shadow-2xl">
        <div class="bg-gray-900 text-white px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <h3 data-attach-modal-title="${scope}" class="text-base font-semibold truncate"></h3>
          <div class="flex items-center gap-2 shrink-0">
            <a data-attach-modal-newtab="${scope}" href="#" target="_blank" rel="noopener" class="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md bg-indigo-500/90 hover:bg-indigo-500 transition-colors">${ICON_EXTERNAL}${t("rfq.openInNewTab")}</a>
            <a data-attach-modal-dl="${scope}" href="#" download class="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md bg-emerald-500 hover:bg-emerald-600 transition-colors">${ICON_DOWNLOAD}${t("rfq.downloadFile")}</a>
            <button type="button" data-attach-modal-close="${scope}" class="ml-1 w-9 h-9 inline-flex items-center justify-center text-xl hover:bg-white/10 rounded transition-colors" aria-label="${t("rfq.previewClose")}">×</button>
          </div>
        </div>
        <div data-attach-modal-body="${scope}" class="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4"></div>
      </div>
    </div>
  `;
}

/**
 * Wires up click handlers for attachment cards + lightbox modal.
 * Call after rendering attachments + modal HTML into the DOM.
 *
 * @param root  element that contains the attachment cards (page or modal body)
 * @param attachments  current list (kept in scope for index lookup)
 * @param scope  identifier matching renderAttachmentModal(scope)
 */
export function setupAttachmentInteractions(
  root: ParentNode,
  attachments: RfqAttachment[],
  scope: string = "default"
): () => void {
  if (!attachments?.length) return () => {};

  const modal = document.getElementById(`rfq-attach-modal-${scope}`) as HTMLDivElement | null;
  if (!modal) return () => {};

  const titleEl = document.querySelector<HTMLElement>(`[data-attach-modal-title="${scope}"]`);
  const bodyEl = document.querySelector<HTMLElement>(`[data-attach-modal-body="${scope}"]`);
  const newTabEl = document.querySelector<HTMLAnchorElement>(
    `[data-attach-modal-newtab="${scope}"]`
  );
  const dlEl = document.querySelector<HTMLAnchorElement>(`[data-attach-modal-dl="${scope}"]`);
  const closeBtn = document.querySelector<HTMLButtonElement>(
    `[data-attach-modal-close="${scope}"]`
  );
  const backdrop = document.querySelector<HTMLElement>(`[data-attach-modal-backdrop="${scope}"]`);

  function openLightbox(att: RfqAttachment) {
    if (!titleEl || !bodyEl || !newTabEl || !dlEl) return;
    const kind = getFileKind(att.file_name);
    titleEl.textContent = att.file_name;
    newTabEl.href = att.file_url;
    dlEl.href = att.file_url;
    dlEl.setAttribute("download", att.file_name);
    if (kind === "image") {
      bodyEl.innerHTML = `<img src="${att.file_url}" alt="${att.file_name}" class="max-w-full max-h-full object-contain" />`;
    } else if (kind === "pdf") {
      bodyEl.innerHTML = `<iframe src="${att.file_url}" class="w-full h-full bg-white" title="${att.file_name}"></iframe>`;
    } else {
      bodyEl.innerHTML = `<div class="text-gray-300 text-sm">${t("rfq.notPreviewable")}</div>`;
    }
    modal!.classList.remove("hidden");
    modal!.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    modal!.classList.add("hidden");
    modal!.classList.remove("flex");
    if (bodyEl) bodyEl.innerHTML = "";
    document.body.style.overflow = "";
  }

  closeBtn?.addEventListener("click", closeLightbox);
  backdrop?.addEventListener("click", closeLightbox);

  // ESC closes the lightbox only when it's open — leaves outer modals
  // (e.g. seller's Submit Quote) untouched.
  function onEsc(e: KeyboardEvent) {
    if (e.key === "Escape" && !modal!.classList.contains("hidden")) {
      e.stopPropagation();
      closeLightbox();
    }
  }
  document.addEventListener("keydown", onEsc, true);

  // Cards inside the root
  root.querySelectorAll<HTMLElement>(`[data-attach-scope="${scope}"]`).forEach((el) => {
    el.addEventListener("click", (e) => {
      // Let the <a download> work natively
      if ((e.target as HTMLElement).closest("a[download]")) return;
      const idx = Number(el.getAttribute("data-attach-idx"));
      const att = attachments[idx];
      if (!att) return;
      const kind = getFileKind(att.file_name);
      if (kind === "other") return; // not previewable — no binding
      openLightbox(att);
    });
  });

  // Returns a teardown — useful when the parent modal closes and we want
  // to remove the global ESC listener.
  return () => {
    document.removeEventListener("keydown", onEsc, true);
  };
}

/**
 * Programmatically open the lightbox for an arbitrary RfqAttachment-shaped
 * object. Idempotent — appends modal HTML to <body> on first use, reuses it
 * on subsequent opens. Useful for one-off previews (e.g. clicking a local
 * file thumbnail before submit, where there's no card-grid bound).
 */
export function openAttachmentLightbox(att: RfqAttachment, scope: string = "file-preview"): void {
  let modal = document.getElementById(`rfq-attach-modal-${scope}`);
  if (!modal) {
    const host = document.createElement("div");
    host.innerHTML = renderAttachmentModal(scope);
    document.body.appendChild(host.firstElementChild as HTMLElement);
    modal = document.getElementById(`rfq-attach-modal-${scope}`);
  }
  if (!modal) return;

  const titleEl = document.querySelector<HTMLElement>(`[data-attach-modal-title="${scope}"]`);
  const bodyEl = document.querySelector<HTMLElement>(`[data-attach-modal-body="${scope}"]`);
  const newTabEl = document.querySelector<HTMLAnchorElement>(
    `[data-attach-modal-newtab="${scope}"]`
  );
  const dlEl = document.querySelector<HTMLAnchorElement>(`[data-attach-modal-dl="${scope}"]`);
  const closeBtn = document.querySelector<HTMLButtonElement>(
    `[data-attach-modal-close="${scope}"]`
  );
  const backdrop = document.querySelector<HTMLElement>(`[data-attach-modal-backdrop="${scope}"]`);
  if (!titleEl || !bodyEl || !newTabEl || !dlEl || !closeBtn || !backdrop) return;

  const kind = getFileKind(att.file_name);
  titleEl.textContent = att.file_name;
  newTabEl.href = att.file_url;
  dlEl.href = att.file_url;
  dlEl.setAttribute("download", att.file_name);

  if (kind === "image") {
    bodyEl.innerHTML = `<img src="${att.file_url}" alt="${att.file_name}" class="max-w-full max-h-full object-contain" />`;
  } else if (kind === "pdf") {
    bodyEl.innerHTML = `<iframe src="${att.file_url}" class="w-full h-full bg-white" title="${att.file_name}"></iframe>`;
  } else {
    bodyEl.innerHTML = `<div class="text-gray-500 text-sm p-8">${t("rfq.notPreviewable")}</div>`;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";

  function close() {
    modal!.classList.add("hidden");
    modal!.classList.remove("flex");
    if (bodyEl) bodyEl.innerHTML = "";
    document.body.style.overflow = "";
  }

  // Re-bind: replace any previous handlers so repeated opens don't stack.
  closeBtn.onclick = close;
  backdrop.onclick = close;

  function onEsc(e: KeyboardEvent) {
    if (e.key === "Escape" && !modal!.classList.contains("hidden")) {
      e.stopPropagation();
      close();
      document.removeEventListener("keydown", onEsc, true);
    }
  }
  document.addEventListener("keydown", onEsc, true);
}

/**
 * Convenience wrapper: open the lightbox for a local File object (pre-submit).
 * Images use the cached blob URL from getFilePreviewUrl; PDFs get a one-shot
 * blob URL; other types fall back to direct download via temp anchor.
 */
export function openFilePreviewLightbox(file: File, scope: string = "file-preview"): void {
  const kind = getFileKind(file.name);
  if (kind === "other") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return;
  }

  const fileUrl = kind === "image" ? getFilePreviewUrl(file) : URL.createObjectURL(file);
  openAttachmentLightbox(
    {
      name: file.name,
      file_name: file.name,
      file_url: fileUrl,
      file_size: file.size,
      creation: "",
    },
    scope
  );
}

// ── Local File previews (pre-submit) ───────────────────────────────────────
// Generates blob URLs for File objects so the user sees thumbnails of what
// they just picked, before anything is uploaded. Reuses the same URL across
// re-renders to avoid leaks; callers must invoke revokeFilePreview() when
// removing a file from the staging list.
const _filePreviewUrls = new WeakMap<File, string>();

export function getFilePreviewUrl(file: File): string {
  if (!file.type?.startsWith("image/")) return "";
  let url = _filePreviewUrls.get(file);
  if (!url) {
    url = URL.createObjectURL(file);
    _filePreviewUrls.set(file, url);
  }
  return url;
}

export function revokeFilePreview(file: File): void {
  const url = _filePreviewUrls.get(file);
  if (url) {
    URL.revokeObjectURL(url);
    _filePreviewUrls.delete(file);
  }
}

/**
 * Fetches RFQ attachments. Permission-gated — returns [] on 403.
 */
export async function fetchRfqAttachments(rfqId: string): Promise<RfqAttachment[]> {
  try {
    const res = await fetch(
      `${(window as any).API_BASE || "/api"}/method/tradehub_core.api.rfq.get_rfq_attachments?rfq_id=${encodeURIComponent(rfqId)}`,
      { credentials: "include" }
    );
    const d = await res.json();
    return (d.message || []) as RfqAttachment[];
  } catch {
    return [];
  }
}
