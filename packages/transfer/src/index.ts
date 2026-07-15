/**
 * Public entrypoint for `@ailuracode/alpine-transfer`.
 *
 * Re-exports only. Implementation lives in `./plugin.ts` and
 * transfer modules under `./clipboard.ts`, `./share.ts`, and
 * `./export.ts`.
 */

// --- Clipboard -----------------------------------------------------------
export {
  CLIPBOARD_COPY_MODES,
  clipboardOptions,
  copyToClipboard,
  registerClipboardMagic,
} from "./clipboard.js";
// --- Event surface -------------------------------------------------------
export type { TransferEvents } from "./events.js";
// --- Export --------------------------------------------------------------
export { createExportMagic, exportData, isExportSupported, registerExportMagic } from "./export.js";
// --- Alpine integration --------------------------------------------------
export {
  clipboardPlugin,
  exportPlugin,
  sharePlugin,
  transferPlugin as default,
  transferPlugin,
} from "./plugin.js";
// --- Share ---------------------------------------------------------------
export {
  canShareData,
  createShareMagic,
  isShareSupported,
  registerShareMagic,
  shareData,
} from "./share.js";
// --- Public types ---------------------------------------------------------
export type {
  ClipboardCopyMode,
  ClipboardCopyOptions,
  ClipboardCopyText,
  ClipboardMagic,
  CopyToClipboard,
  ExportMagic,
  ExportOptions,
  ExportSource,
  ShareMagic,
  TransferPluginOptions,
} from "./types.js";
// --- Public constants ---------------------------------------------------
export {
  DEFAULT_TRANSFER_CLIPBOARD_KEY,
  DEFAULT_TRANSFER_EXPORT_KEY,
  DEFAULT_TRANSFER_SHARE_KEY,
} from "./types.js";
