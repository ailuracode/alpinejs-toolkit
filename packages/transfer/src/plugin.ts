import type AlpineType from "alpinejs";
import { registerClipboardMagic } from "./clipboard.js";
import { registerExportMagic } from "./export.js";
import { registerShareMagic } from "./share.js";
import type { TransferPluginOptions } from "./types.js";

/** Registers outbound transfer magics: `$clipboard`, `$share`, `$export`. */
export function transferPlugin(options: TransferPluginOptions = {}): AlpineType.PluginCallback {
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

/** Individual plugin factories for selective registration. */
export {
  registerClipboardMagic as clipboardPlugin,
  registerExportMagic as exportPlugin,
  registerShareMagic as sharePlugin,
};
