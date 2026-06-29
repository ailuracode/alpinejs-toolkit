import type AlpineType from "alpinejs";

export type ShareMagic = ((data: ShareData) => Promise<boolean>) & {
  readonly isSupported: boolean;
  canShare(data?: ShareData): boolean;
};

function isSecureContext(): boolean {
  return typeof globalThis !== "undefined" && globalThis.isSecureContext === true;
}

function hasShareApi(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Returns whether the Web Share API is available in this environment. */
export function isShareSupported(): boolean {
  return isSecureContext() && hasShareApi();
}

/** Returns whether the given payload can be shared, or whether sharing is available when omitted. */
export function canShareData(data?: ShareData): boolean {
  if (!isShareSupported()) {
    return false;
  }

  if (data === undefined) {
    return true;
  }

  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare(data);
    } catch {
      return false;
    }
  }

  if (data.files?.length) {
    return false;
  }

  return Boolean(data.title || data.text || data.url);
}

/** Invokes `navigator.share` and resolves to `true` on success. Never throws. */
export async function shareData(data: ShareData): Promise<boolean> {
  if (!canShareData(data)) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

/** Builds callable `$share` magic with `isSupported` and `canShare` helpers. */
export function createShareMagic(): ShareMagic {
  const share = ((data: ShareData) => shareData(data)) as ShareMagic;
  Object.defineProperty(share, "isSupported", { get: isShareSupported });
  share.canShare = canShareData;
  return share;
}

/** Registers callable `$share` magic on Alpine. */
export function registerShareMagic(Alpine: AlpineType.Alpine): void {
  Alpine.magic("share", () => createShareMagic());
}
