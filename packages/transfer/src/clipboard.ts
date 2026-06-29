import type AlpineType from "alpinejs";

export const CLIPBOARD_COPY_MODES = ["auto", "clipboard", "legacy"] as const;

export type ClipboardCopyMode = (typeof CLIPBOARD_COPY_MODES)[number];

/** Values coerced with `String()` before copying. */
export type ClipboardCopyText = string | number | boolean | bigint;

export type ClipboardCopyOptions<TMode extends ClipboardCopyMode = "auto"> = {
  mode?: TMode;
};

export type CopyToClipboard = {
  (text: ClipboardCopyText): Promise<void>;
  <const TMode extends ClipboardCopyMode>(text: ClipboardCopyText, mode: TMode): Promise<void>;
  <const TMode extends ClipboardCopyMode>(
    text: ClipboardCopyText,
    options: ClipboardCopyOptions<TMode>
  ): Promise<void>;
};

export type ClipboardMagic = CopyToClipboard;

function normalizeOptions(options?: ClipboardCopyOptions<ClipboardCopyMode> | ClipboardCopyMode): {
  mode: ClipboardCopyMode;
} {
  if (options === undefined) {
    return { mode: "auto" };
  }

  if (typeof options === "string") {
    return { mode: options };
  }

  return { mode: options.mode ?? "auto" };
}

function hasClipboardApi(): boolean {
  return typeof navigator.clipboard?.writeText === "function";
}

function copyViaLegacyCommand(doc: Document): boolean {
  const run = Reflect.get(doc, "execCommand");
  return typeof run === "function" && run.call(doc, "copy", false);
}

async function copyViaClipboardApi(value: string): Promise<void> {
  if (!hasClipboardApi()) {
    throw new Error("Clipboard API is not available");
  }

  await navigator.clipboard.writeText(value);
}

function copyViaLegacy(value: string): boolean {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();

  if (!copyViaLegacyCommand(document)) {
    document.body.removeChild(area);
    return false;
  }

  document.body.removeChild(area);
  return true;
}

/** Builds a typed clipboard options object with inferred mode literals. */
export function clipboardOptions<const TOptions extends ClipboardCopyOptions<ClipboardCopyMode>>(
  options: TOptions
): TOptions {
  return options;
}

/** Copies text using the Clipboard API, legacy execCommand, or auto-detected fallback. */
export const copyToClipboard: CopyToClipboard = async (
  text: ClipboardCopyText,
  options?: ClipboardCopyOptions | ClipboardCopyMode
): Promise<void> => {
  const value = String(text);
  const { mode } = normalizeOptions(options);

  if (mode === "clipboard") {
    await copyViaClipboardApi(value);
    return;
  }

  if (mode === "legacy") {
    if (!copyViaLegacy(value)) {
      throw new Error("Failed to copy to clipboard");
    }
    return;
  }

  if (hasClipboardApi()) {
    await copyViaClipboardApi(value);
    return;
  }

  copyViaLegacy(value);
};

/** Registers callable `$clipboard` magic on Alpine. */
export function registerClipboardMagic(Alpine: AlpineType.Alpine): void {
  Alpine.magic("clipboard", () => copyToClipboard);
}
