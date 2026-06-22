import type AlpineType from "alpinejs";

export type DownloadOptions = {
  filename?: string;
  mimeType?: string;
};

export type DownloadSource = string | Blob | File;

export type DownloadMagic = ((
  source: DownloadSource,
  options?: DownloadOptions | string
) => Promise<boolean>) & {
  isSupported(): boolean;
};

const URL_LIKE = /^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i;

function normalizeOptions(options?: DownloadOptions | string): DownloadOptions {
  if (typeof options === "string") {
    return { filename: options };
  }

  return options ?? {};
}

function isDownloadEnvironment(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.createElement === "function" &&
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function"
  );
}

/** Returns whether programmatic downloads are available in this environment. */
export function isDownloadSupported(): boolean {
  return isDownloadEnvironment();
}

function triggerAnchorDownload(href: string, filename?: string): void {
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

function downloadBlob(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);

  try {
    triggerAnchorDownload(url, filename);
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

/** Downloads a URL, blob, file, or text payload. Resolves to `true` on success. Never throws. */
export function downloadData(
  source: DownloadSource,
  options?: DownloadOptions | string
): Promise<boolean> {
  if (!isDownloadSupported()) {
    return Promise.resolve(false);
  }

  const { filename, mimeType } = normalizeOptions(options);

  try {
    if (source instanceof Blob) {
      const name = filename ?? (source instanceof File ? source.name : "download");
      return Promise.resolve(downloadBlob(source, name));
    }

    const value = String(source);

    if (isUrlLike(value)) {
      triggerAnchorDownload(value, filename);
      return Promise.resolve(true);
    }

    if (!filename) {
      return Promise.resolve(false);
    }

    const blob = new Blob([value], { type: mimeType ?? "text/plain;charset=utf-8" });
    return Promise.resolve(downloadBlob(blob, filename));
  } catch {
    return Promise.resolve(false);
  }
}

/** Builds callable `$download` magic with `isSupported` helper. */
export function createDownloadMagic(): DownloadMagic {
  const download = (source: DownloadSource, options?: DownloadOptions | string) =>
    downloadData(source, options);
  download.isSupported = isDownloadSupported;
  return download;
}

/** Alpine.js download plugin. Registers callable magic `$download`. */
export default function downloadPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.magic("download", () => createDownloadMagic());
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $download: DownloadMagic;
    }
  }
}
