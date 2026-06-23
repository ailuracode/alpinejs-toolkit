import type AlpineType from "alpinejs";

export type ExportOptions = {
  filename?: string;
  mimeType?: string;
};

export type ExportSource = string | Blob | File;

export type ExportMagic = ((
  source: ExportSource,
  options?: ExportOptions | string
) => Promise<boolean>) & {
  isSupported(): boolean;
};

const URL_LIKE = /^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i;

function normalizeOptions(options?: ExportOptions | string): ExportOptions {
  if (typeof options === "string") {
    return { filename: options };
  }

  return options ?? {};
}

function isExportEnvironment(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.createElement === "function" &&
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function"
  );
}

/** Returns whether programmatic file exports are available in this environment. */
export function isExportSupported(): boolean {
  return isExportEnvironment();
}

function triggerAnchorExport(href: string, filename?: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.rel = "noopener";

  if (filename) {
    anchor.download = filename;
  }

  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function revokeObjectUrlLater(url: string): void {
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function exportBlob(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);

  try {
    triggerAnchorExport(url, filename);
    return true;
  } catch {
    return false;
  } finally {
    revokeObjectUrlLater(url);
  }
}

function isUrlLike(value: string): boolean {
  return URL_LIKE.test(value);
}

/** Exports a URL, blob, file, or text payload as a download. Resolves to `true` on success. Never throws. */
export function exportData(
  source: ExportSource,
  options?: ExportOptions | string
): Promise<boolean> {
  if (!isExportSupported()) {
    return Promise.resolve(false);
  }

  const { filename, mimeType } = normalizeOptions(options);

  try {
    if (source instanceof Blob) {
      const name = filename ?? (source instanceof File ? source.name : "export");
      return Promise.resolve(exportBlob(source, name));
    }

    const value = String(source);

    if (isUrlLike(value)) {
      triggerAnchorExport(value, filename);
      return Promise.resolve(true);
    }

    if (!filename) {
      return Promise.resolve(false);
    }

    const blob = new Blob([value], { type: mimeType ?? "text/plain;charset=utf-8" });
    return Promise.resolve(exportBlob(blob, filename));
  } catch {
    return Promise.resolve(false);
  }
}

/** Builds callable `$export` magic with `isSupported` helper. */
export function createExportMagic(): ExportMagic {
  const exportFile = (source: ExportSource, options?: ExportOptions | string) =>
    exportData(source, options);
  exportFile.isSupported = isExportSupported;
  return exportFile;
}

/** Alpine.js export plugin. Registers callable magic `$export`. */
export default function exportPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.magic("export", () => createExportMagic());
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $export: ExportMagic;
    }
  }
}
