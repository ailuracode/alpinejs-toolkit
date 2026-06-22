import type AlpineType from "alpinejs";

export type FullscreenChangeCallback = (fullscreen: boolean, element: Element | null) => void;

export type FullscreenErrorCallback = (event: Event) => void;

export interface FullscreenMagic {
  /** Returns whether the Fullscreen API is available and enabled in this browser. */
  isSupported(): boolean;
  /** Returns whether the document is currently in fullscreen mode. */
  isFullscreen(): boolean;
  /** Returns the element currently in fullscreen, or `null` when not fullscreen. */
  element(): Element | null;
  /** Requests fullscreen for `element`, or `document.documentElement` when omitted. */
  enter(element?: HTMLElement): Promise<boolean>;
  /** Exits fullscreen when active. */
  exit(): Promise<boolean>;
  /** Enters fullscreen when inactive, otherwise exits. */
  toggle(element?: HTMLElement): Promise<boolean>;
  /** Subscribes to fullscreen changes. Returns an unsubscribe function. */
  onChange(callback: FullscreenChangeCallback): () => void;
  /** Subscribes to fullscreen errors. Returns an unsubscribe function. */
  onError(callback: FullscreenErrorCallback): () => void;
}

interface FullscreenVendor {
  enabledKey: string;
  elementKey: string;
  requestKey: string;
  exitKey: string;
  changeEvent: string;
  errorEvent: string;
}

const VENDORS: FullscreenVendor[] = [
  {
    enabledKey: "fullscreenEnabled",
    elementKey: "fullscreenElement",
    requestKey: "requestFullscreen",
    exitKey: "exitFullscreen",
    changeEvent: "fullscreenchange",
    errorEvent: "fullscreenerror",
  },
  {
    enabledKey: "webkitFullscreenEnabled",
    elementKey: "webkitFullscreenElement",
    requestKey: "webkitRequestFullscreen",
    exitKey: "webkitExitFullscreen",
    changeEvent: "webkitfullscreenchange",
    errorEvent: "webkitfullscreenerror",
  },
  {
    enabledKey: "mozFullScreenEnabled",
    elementKey: "mozFullScreenElement",
    requestKey: "mozRequestFullScreen",
    exitKey: "mozCancelFullScreen",
    changeEvent: "mozfullscreenchange",
    errorEvent: "mozfullscreenerror",
  },
  {
    enabledKey: "msFullscreenEnabled",
    elementKey: "msFullscreenElement",
    requestKey: "msRequestFullscreen",
    exitKey: "msExitFullscreen",
    changeEvent: "MSFullscreenChange",
    errorEvent: "MSFullscreenError",
  },
];

const changeListeners = new Set<FullscreenChangeCallback>();
const errorListeners = new Set<FullscreenErrorCallback>();
let eventsBound = false;

function detectVendor(): FullscreenVendor | null {
  for (const vendor of VENDORS) {
    if (vendor.enabledKey in document) {
      return vendor;
    }
  }

  return null;
}

function getVendor(): FullscreenVendor | null {
  try {
    return detectVendor();
  } catch {
    return null;
  }
}

function bindDocumentEvents(vendor: FullscreenVendor): void {
  if (eventsBound) {
    return;
  }

  eventsBound = true;

  document.addEventListener(vendor.changeEvent, handleFullscreenChange);
  document.addEventListener(vendor.errorEvent, handleFullscreenError);
}

function handleFullscreenChange(): void {
  const fullscreen = isFullscreenActive();
  const element = getActiveFullscreenElement();

  for (const callback of changeListeners) {
    try {
      callback(fullscreen, element);
    } catch {
      // Listener errors must not break other subscribers.
    }
  }
}

function handleFullscreenError(event: Event): void {
  for (const callback of errorListeners) {
    try {
      callback(event);
    } catch {
      // Listener errors must not break other subscribers.
    }
  }
}

function readDocumentFlag(vendor: FullscreenVendor, key: keyof FullscreenVendor): boolean {
  const value = Reflect.get(document, vendor[key]);
  return Boolean(value);
}

/** Returns whether the Fullscreen API is available and enabled. */
export function isFullscreenSupported(): boolean {
  const vendor = getVendor();
  if (!vendor) {
    return false;
  }

  try {
    return readDocumentFlag(vendor, "enabledKey");
  } catch {
    return false;
  }
}

/** Returns the element currently in fullscreen, or `null`. */
export function getActiveFullscreenElement(): Element | null {
  const vendor = getVendor();
  if (!vendor) {
    return null;
  }

  try {
    const element = Reflect.get(document, vendor.elementKey);
    return element instanceof Element ? element : null;
  } catch {
    return null;
  }
}

/** Returns whether the document is currently in fullscreen mode. */
export function isFullscreenActive(): boolean {
  return getActiveFullscreenElement() !== null;
}

async function requestElementFullscreen(element: HTMLElement): Promise<boolean> {
  const vendor = getVendor();
  if (!vendor) {
    return false;
  }

  const request = Reflect.get(element, vendor.requestKey);
  if (typeof request !== "function") {
    return false;
  }

  try {
    await request.call(element);
    return true;
  } catch {
    return false;
  }
}

async function exitDocumentFullscreen(): Promise<boolean> {
  const vendor = getVendor();
  if (!vendor) {
    return false;
  }

  const exit = Reflect.get(document, vendor.exitKey);
  if (typeof exit !== "function") {
    return false;
  }

  try {
    await exit.call(document);
    return true;
  } catch {
    return false;
  }
}

/** Requests fullscreen for the given element, or `document.documentElement` by default. */
export async function enterFullscreen(element?: HTMLElement): Promise<boolean> {
  if (!isFullscreenSupported()) {
    return false;
  }

  const target = element ?? document.documentElement;
  const requested = await requestElementFullscreen(target);
  if (!requested) {
    return false;
  }

  return isFullscreenActive();
}

/** Exits fullscreen when active. */
export async function exitFullscreen(): Promise<boolean> {
  if (!isFullscreenActive()) {
    return false;
  }

  if (!isFullscreenSupported()) {
    return false;
  }

  const exited = await exitDocumentFullscreen();
  if (!exited) {
    return false;
  }

  return !isFullscreenActive();
}

/** Toggles fullscreen for the given element, or `document.documentElement` by default. */
export async function toggleFullscreen(element?: HTMLElement): Promise<boolean> {
  if (isFullscreenActive()) {
    return await exitFullscreen();
  }

  return await enterFullscreen(element);
}

/** Builds the `$fullscreen` magic API object. */
export function createFullscreenMagic(): FullscreenMagic {
  const vendor = getVendor();
  if (vendor) {
    bindDocumentEvents(vendor);
  }

  return {
    isSupported: isFullscreenSupported,
    isFullscreen: isFullscreenActive,
    element: getActiveFullscreenElement,
    enter: enterFullscreen,
    exit: exitFullscreen,
    toggle: toggleFullscreen,
    onChange(callback) {
      changeListeners.add(callback);
      return () => {
        changeListeners.delete(callback);
      };
    },
    onError(callback) {
      errorListeners.add(callback);
      return () => {
        errorListeners.delete(callback);
      };
    },
  };
}

let magicInstance: FullscreenMagic | null = null;

/** Alpine.js fullscreen plugin. Registers magic `$fullscreen`. */
export default function fullscreenPlugin(Alpine: AlpineType.Alpine): void {
  const vendor = getVendor();
  if (vendor) {
    bindDocumentEvents(vendor);
  }

  Alpine.magic("fullscreen", () => {
    magicInstance ??= createFullscreenMagic();
    return magicInstance;
  });
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $fullscreen: FullscreenMagic;
    }
  }
}
