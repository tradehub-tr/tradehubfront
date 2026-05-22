/**
 * Dosya işlem yardımcıları — saf utility'ler, hiç DOM/global state yok.
 */

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

/**
 * URL.createObjectURL wrap'i — caller revoke etmeli (memory leak engeli).
 * Aynı File'a tekrar çağrılırsa cache'den döner.
 */
const previewCache = new WeakMap<File, string>();

export function getFilePreviewUrl(file: File): string {
  const cached = previewCache.get(file);
  if (cached) return cached;
  const url = URL.createObjectURL(file);
  previewCache.set(file, url);
  return url;
}

export function revokeFilePreview(file: File): void {
  const url = previewCache.get(file);
  if (url) {
    URL.revokeObjectURL(url);
    previewCache.delete(file);
  }
}
