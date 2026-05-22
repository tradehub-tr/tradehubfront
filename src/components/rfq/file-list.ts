/**
 * RFQ file-list shim — tradehub-upload-ui'a delege eder.
 * Eski signature (scope string, scopePrefix yok) korunur.
 */

import {
  renderFileGrid as pkgRenderFileGrid,
  updateFileCardProgress as pkgUpdateFileCardProgress,
  simulateStagingProgress as pkgSimulateStagingProgress,
  type FileListOptions as PkgFileListOptions,
  type FileProgress,
} from "../../lib/upload-ui";
import { openFilePreviewLightbox } from "./attachments";

export type FileListOptions = Omit<PkgFileListOptions, "scopePrefix" | "onPreviewClick">;

export function renderFileGrid(container: HTMLElement, opts: FileListOptions): void {
  pkgRenderFileGrid(container, {
    ...opts,
    scopePrefix: "rfq",
    onPreviewClick: (file) => openFilePreviewLightbox(file, opts.lightboxScope),
  });
}

export function updateFileCardProgress(
  files: File[],
  file: File,
  state: FileProgress,
  lightboxScope: string,
  progressMap: Map<File, FileProgress>
): void {
  pkgUpdateFileCardProgress(files, file, state, lightboxScope, "rfq", progressMap);
}

export function simulateStagingProgress(
  files: File[],
  file: File,
  scope: string,
  progressMap: Map<File, FileProgress>,
  rerender: () => void
): void {
  pkgSimulateStagingProgress(files, file, scope, "rfq", progressMap, rerender);
}
