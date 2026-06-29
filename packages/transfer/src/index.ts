import type AlpineType from "alpinejs";
import {
  CLIPBOARD_COPY_MODES,
  type ClipboardCopyMode,
  type ClipboardCopyOptions,
  type ClipboardCopyText,
  type ClipboardMagic,
  type CopyToClipboard,
  clipboardOptions,
  copyToClipboard,
  registerClipboardMagic,
} from "./clipboard.js";
import {
  createExportMagic,
  type ExportMagic,
  type ExportOptions,
  type ExportSource,
  exportData,
  isExportSupported,
  registerExportMagic,
} from "./export.js";
import {
  canShareData,
  createShareMagic,
  isShareSupported,
  registerShareMagic,
  type ShareMagic,
  shareData,
} from "./share.js";

export {
  CLIPBOARD_COPY_MODES,
  type ClipboardCopyMode,
  type ClipboardCopyOptions,
  type ClipboardCopyText,
  type ClipboardMagic,
  type CopyToClipboard,
  canShareData,
  clipboardOptions,
  copyToClipboard,
  createExportMagic,
  createShareMagic,
  type ExportMagic,
  type ExportOptions,
  type ExportSource,
  exportData,
  isExportSupported,
  isShareSupported,
  registerClipboardMagic,
  registerExportMagic,
  registerShareMagic,
  type ShareMagic,
  shareData,
};

export type TransferPluginOptions = {
  /** Register `$clipboard`. Default: `true`. */
  clipboard?: boolean;
  /** Register `$share`. Default: `true`. */
  share?: boolean;
  /** Register `$export`. Default: `true`. */
  export?: boolean;
};

/** Registers outbound transfer magics: `$clipboard`, `$share`, `$export`. */
export default function transferPlugin(
  options: TransferPluginOptions = {}
): AlpineType.PluginCallback {
  const {
    clipboard: enableClipboard = true,
    share: enableShare = true,
    export: enableExport = true,
  } = options;

  return function registerTransfer(Alpine) {
    if (enableClipboard) {
      registerClipboardMagic(Alpine);
    }
    if (enableShare) {
      registerShareMagic(Alpine);
    }
    if (enableExport) {
      registerExportMagic(Alpine);
    }
  };
}

export {
  registerClipboardMagic as clipboardPlugin,
  registerExportMagic as exportPlugin,
  registerShareMagic as sharePlugin,
};
