/**
 * RFQ uploader shim — tradehub-upload-ui package'ına delege eder.
 *
 * Eski `uploadRfqAttachments({files, rfqId, ...})` API uyumlu kalır; içeride
 * generic `uploadFiles` çağırır, RFQ-spesifik formData (doctype=RFQ, docname,
 * is_private=1) + CSRF header'ı otomatik ekler.
 */

import { uploadFiles, type FileProgress as PkgFileProgress } from "../../lib/upload-ui";
import { getCsrfToken } from "../../utils/api";

export type FileProgress = PkgFileProgress;

export interface UploadRfqAttachmentsOptions {
  files: File[];
  rfqId: string;
  concurrency?: number;
  onFileProgress?: (file: File, state: FileProgress) => void;
  onTotalProgress?: (loadedBytes: number, totalBytes: number) => void;
}

export interface UploadRfqAttachmentsResult {
  succeeded: File[];
  failed: File[];
}

export async function uploadRfqAttachments(
  opts: UploadRfqAttachmentsOptions
): Promise<UploadRfqAttachmentsResult> {
  const result = await uploadFiles({
    files: opts.files,
    endpoint: (window.API_BASE || "/api") + "/method/upload_file",
    formDataFields: {
      doctype: "RFQ",
      docname: opts.rfqId,
      is_private: "1",
    },
    headers: {
      "X-Frappe-CSRF-Token": getCsrfToken(),
    },
    concurrency: opts.concurrency ?? 2,
    onFileProgress: opts.onFileProgress,
    onTotalProgress: opts.onTotalProgress,
  });
  return {
    succeeded: result.succeeded,
    failed: result.failed.map((f) => f.file),
  };
}
