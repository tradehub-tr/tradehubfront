/**
 * RFQ dropzone shim — tradehub-upload-ui'a delege eder.
 * RFQ-spesifik config (FILE_UPLOAD_CONFIG) + i18n + toast bindings burada.
 */

import {
  renderDropzone as pkgRenderDropzone,
  bindDropzone as pkgBindDropzone,
} from "../../lib/upload-ui";
import { t } from "../../i18n";
import { FILE_UPLOAD_CONFIG } from "../../types/rfq";
import { showToast } from "../../utils/toast";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface DropzoneOptions {
  id: string;
  inputId: string;
  metaText?: string;
}

const rfqConfig = {
  maxFiles: FILE_UPLOAD_CONFIG.maxFiles,
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  allowedExtensions: FILE_UPLOAD_CONFIG.allowedExtensions,
  allowedFormatsDisplay: FILE_UPLOAD_CONFIG.allowedFormatsDisplay,
};

function rfqTexts(metaOverride?: string) {
  return {
    title: t("rfq.dropzoneTitle"),
    or: t("rfq.dropzoneOr"),
    pickBtn: t("rfq.dropzonePickBtn"),
    meta:
      metaOverride ??
      t("rfq.dropzoneMeta", {
        formats: FILE_UPLOAD_CONFIG.allowedFormatsDisplay,
        max: FILE_UPLOAD_CONFIG.maxFiles,
        size: 10,
      }),
    dragRelease: t("rfq.dropzoneDragRelease"),
  };
}

export function renderDropzone(opts: DropzoneOptions): string {
  return pkgRenderDropzone({
    id: opts.id,
    inputId: opts.inputId,
    config: rfqConfig,
    texts: rfqTexts(opts.metaText),
  });
}

export interface DropzoneHandlers {
  getCurrentFiles: () => File[];
  onAdd: (files: File[]) => void;
}

export function bindDropzone(opts: DropzoneOptions, handlers: DropzoneHandlers): () => void {
  return pkgBindDropzone(
    {
      id: opts.id,
      inputId: opts.inputId,
      config: rfqConfig,
      texts: rfqTexts(opts.metaText),
    },
    {
      getCurrentFiles: handlers.getCurrentFiles,
      onAdd: handlers.onAdd,
      onValidationError: (kind, file) => {
        if (kind === "unsupported" && file) {
          showToast({
            message: t("rfq.unsupportedFormat", { fileName: file.name }),
            type: "error",
          });
        } else if (kind === "tooLarge" && file) {
          showToast({
            message: t("rfq.fileTooLarge", { fileName: file.name }),
            type: "error",
          });
        } else if (kind === "duplicate" && file) {
          showToast({
            message: t("rfq.duplicateFile", { fileName: file.name }),
            type: "warning",
          });
        } else if (kind === "maxFiles") {
          showToast({ message: t("rfq.maxFilesAlert"), type: "warning" });
        }
      },
    }
  );
}
