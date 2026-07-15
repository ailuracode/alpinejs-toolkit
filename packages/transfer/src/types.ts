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
  /**
   * `$clipboard` magic key the plugin registers under. Defaults to
   * {@link DEFAULT_TRANSFER_CLIPBOARD_KEY}. Set when the host already
   * owns a `clipboard` magic or another toolkit plugin would collide
   * on that name — the rename avoids the collision without touching
   * the underlying helper.
   */
  readonly clipboardKey?: string;
  /**
   * `$share` magic key the plugin registers under. Defaults to
   * {@link DEFAULT_TRANSFER_SHARE_KEY}.
   */
  readonly shareKey?: string;
  /**
   * `$export` magic key the plugin registers under. Defaults to
   * {@link DEFAULT_TRANSFER_EXPORT_KEY}.
   */
  readonly exportKey?: string;
};

/** Default `$clipboard` magic key registered by {@link transferPlugin}. */
export const DEFAULT_TRANSFER_CLIPBOARD_KEY = "clipboard";
/** Default `$share` magic key registered by {@link transferPlugin}. */
export const DEFAULT_TRANSFER_SHARE_KEY = "share";
/** Default `$export` magic key registered by {@link transferPlugin}. */
export const DEFAULT_TRANSFER_EXPORT_KEY = "export";
