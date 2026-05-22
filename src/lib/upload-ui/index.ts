/**
 * tradehub-upload-ui — barrel export.
 *
 * Ortak upload UI kütüphanesi. RFQ pattern'inden promote edildi.
 * 4 facade + core (uploader, file-list, dropzone) + utils.
 */

export {
  uploadFiles,
  type UploadOptions,
  type UploadResult,
  type FileProgress,
  type UploadStatus,
} from "./uploader";

export {
  renderFileGrid,
  updateFileCardProgress,
  simulateStagingProgress,
  type FileListOptions,
} from "./file-list";

export {
  renderDropzone,
  bindDropzone,
  type DropzoneConfig,
  type DropzoneTexts,
  type DropzoneHandlers,
  type RenderDropzoneOpts,
  type BindDropzoneOpts,
} from "./dropzone";

export {
  getFileKind,
  getFileBadge,
  getFilePreviewUrl,
  revokeFilePreview,
  formatFileSize,
} from "./utils";

// Facades
export {
  MultiFileDropzoneController,
  type MultiFileDropzoneOptions,
} from "./facades/MultiFileDropzone";

export {
  SlotDropzoneController,
  type SlotDropzoneOptions,
  type SlotDef,
} from "./facades/SlotDropzone";

export {
  ImagePickerController,
  type ImagePickerOptions,
  type ImagePickerUploadConfig,
} from "./facades/ImagePicker";

export {
  AttachFieldController,
  type AttachFieldOptions,
  type AttachFieldUploadConfig,
} from "./facades/AttachField";
