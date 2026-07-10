/**
 * Public type contracts for `@ailuracode/alpine-transfer`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation.
 */

export type {
  ClipboardCopyMode,
  ClipboardCopyOptions,
  ClipboardCopyText,
  ClipboardMagic,
  CopyToClipboard,
} from "./clipboard.js";
export type { ExportMagic, ExportOptions, ExportSource } from "./export.js";
export type { ShareMagic } from "./share.js";

/** Options accepted by the transfer plugin factory. */
export type TransferPluginOptions = {
  /** Register `$clipboard`. Default: `true`. */
  clipboard?: boolean;
  /** Register `$share`. Default: `true`. */
  share?: boolean;
  /** Register `$export`. Default: `true`. */
  export?: boolean;
};
