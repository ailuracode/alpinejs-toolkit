import { guardMagic } from "@ailuracode/alpine-core/registration";
import type AlpineType from "alpinejs";
import { copyToClipboard, registerClipboardMagic } from "./clipboard.js";
import { createExportMagic, registerExportMagic } from "./export.js";
import { createShareMagic, registerShareMagic } from "./share.js";
import type { TransferPluginOptions } from "./types.js";
import {
  DEFAULT_TRANSFER_CLIPBOARD_KEY,
  DEFAULT_TRANSFER_EXPORT_KEY,
  DEFAULT_TRANSFER_SHARE_KEY,
} from "./types.js";

/** Registers outbound transfer magics: `$clipboard`, `$share`, `$export`. */
export function transferPlugin(options: TransferPluginOptions = {}): AlpineType.PluginCallback {
  const {
    clipboard: enableClipboard = true,
    share: enableShare = true,
    export: enableExport = true,
  } = options;

  return function registerTransfer(Alpine) {
    if (enableClipboard) {
      guardMagic(
        Alpine,
        options.clipboardKey ?? DEFAULT_TRANSFER_CLIPBOARD_KEY,
        () => copyToClipboard,
        "transfer"
      );
    }
    if (enableShare) {
      guardMagic(
        Alpine,
        options.shareKey ?? DEFAULT_TRANSFER_SHARE_KEY,
        () => createShareMagic(),
        "transfer"
      );
    }
    if (enableExport) {
      guardMagic(
        Alpine,
        options.exportKey ?? DEFAULT_TRANSFER_EXPORT_KEY,
        () => createExportMagic(),
        "transfer"
      );
    }
  };
}

/** Individual plugin factories for selective registration. */
export {
  registerClipboardMagic as clipboardPlugin,
  registerExportMagic as exportPlugin,
  registerShareMagic as sharePlugin,
};
