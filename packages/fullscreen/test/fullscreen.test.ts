import { afterEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import fullscreenPlugin, {
  createFullscreenMagic,
  enterFullscreen,
  exitFullscreen,
  type FullscreenMagic,
  getActiveFullscreenElement,
  isFullscreenActive,
  isFullscreenSupported,
  toggleFullscreen,
} from "../src/index.js";

interface FullscreenMock {
  getCurrentElement(): Element | null;
  setCurrentElement(element: Element | null): void;
  requestFullscreen: ReturnType<typeof vi.fn>;
  exitFullscreen: ReturnType<typeof vi.fn>;
}

function installFullscreenApi(
  options: { enabled?: boolean; requestFails?: boolean; exitFails?: boolean } = {}
): FullscreenMock {
  let currentElement: Element | null = null;

  const requestFullscreen = vi.fn(function requestFullscreen(this: HTMLElement) {
    if (options.requestFails) {
      return Promise.reject(new Error("request failed"));
    }

    currentElement = this;
    return Promise.resolve();
  });

  const exitFullscreen = vi.fn(() => {
    if (options.exitFails) {
      return Promise.reject(new Error("exit failed"));
    }

    currentElement = null;
    return Promise.resolve();
  });

  Object.defineProperty(document, "fullscreenEnabled", {
    configurable: true,
    value: options.enabled ?? true,
  });

  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get() {
      return currentElement;
    },
  });

  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    writable: true,
    value: exitFullscreen,
  });

  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
    configurable: true,
    writable: true,
    value: requestFullscreen,
  });

  return {
    getCurrentElement: () => currentElement,
    setCurrentElement: (element) => {
      currentElement = element;
    },
    requestFullscreen,
    exitFullscreen,
  };
}

function removeFullscreenApi(): void {
  Reflect.deleteProperty(document, "fullscreenEnabled");
  Reflect.deleteProperty(document, "fullscreenElement");
  Reflect.deleteProperty(document, "exitFullscreen");
  Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
}

function dispatchFullscreenChange(): void {
  document.dispatchEvent(new Event("fullscreenchange"));
}

function dispatchFullscreenError(): void {
  document.dispatchEvent(new Event("fullscreenerror"));
}

describe("@ailuracode/alpine-fullscreen", () => {
  afterEach(() => {
    removeFullscreenApi();
  });

  describe("supported browser", () => {
    it("reports support when fullscreenEnabled is true", () => {
      installFullscreenApi();

      expect(isFullscreenSupported()).toBe(true);
      expect(createFullscreenMagic().isSupported()).toBe(true);
    });

    it("reads the active fullscreen element", () => {
      const mock = installFullscreenApi();
      const target = document.createElement("div");
      document.body.appendChild(target);

      mock.setCurrentElement(target);

      expect(getActiveFullscreenElement()).toBe(target);
      expect(isFullscreenActive()).toBe(true);
      expect(createFullscreenMagic().isFullscreen()).toBe(true);
      expect(createFullscreenMagic().element()).toBe(target);
    });
  });

  describe("unsupported browser", () => {
    it("reports unsupported when the API is missing", () => {
      removeFullscreenApi();

      expect(isFullscreenSupported()).toBe(false);
      expect(getActiveFullscreenElement()).toBeNull();
      expect(isFullscreenActive()).toBe(false);
    });

    it("returns false for enter, exit, and toggle", async () => {
      removeFullscreenApi();
      const fullscreen = createFullscreenMagic();

      await expect(enterFullscreen()).resolves.toBe(false);
      await expect(exitFullscreen()).resolves.toBe(false);
      await expect(toggleFullscreen()).resolves.toBe(false);
      await expect(fullscreen.enter()).resolves.toBe(false);
      await expect(fullscreen.exit()).resolves.toBe(false);
      await expect(fullscreen.toggle()).resolves.toBe(false);
    });

    it("reports unsupported when fullscreen is disabled", () => {
      installFullscreenApi({ enabled: false });

      expect(isFullscreenSupported()).toBe(false);
    });
  });

  describe("enter fullscreen", () => {
    it("enters fullscreen on document.documentElement by default", async () => {
      const mock = installFullscreenApi();

      await expect(enterFullscreen()).resolves.toBe(true);

      expect(mock.requestFullscreen).toHaveBeenCalledWith();
      expect(mock.getCurrentElement()).toBe(document.documentElement);
    });

    it("enters fullscreen on a provided element", async () => {
      const mock = installFullscreenApi();
      const target = document.createElement("video");
      document.body.appendChild(target);

      await expect(enterFullscreen(target)).resolves.toBe(true);

      expect(mock.requestFullscreen).toHaveBeenCalledWith();
      expect(mock.getCurrentElement()).toBe(target);
    });

    it("returns false when requestFullscreen throws", async () => {
      installFullscreenApi({ requestFails: true });

      await expect(enterFullscreen()).resolves.toBe(false);
    });
  });

  describe("exit fullscreen", () => {
    it("exits fullscreen when active", async () => {
      const mock = installFullscreenApi();
      mock.setCurrentElement(document.documentElement);

      await expect(exitFullscreen()).resolves.toBe(true);

      expect(mock.exitFullscreen).toHaveBeenCalledOnce();
      expect(mock.getCurrentElement()).toBeNull();
    });

    it("returns false when not fullscreen", async () => {
      const mock = installFullscreenApi();

      await expect(exitFullscreen()).resolves.toBe(false);

      expect(mock.exitFullscreen).not.toHaveBeenCalled();
    });

    it("returns false when exitFullscreen throws", async () => {
      const mock = installFullscreenApi({ exitFails: true });
      mock.setCurrentElement(document.documentElement);

      await expect(exitFullscreen()).resolves.toBe(false);
    });
  });

  describe("toggle", () => {
    it("enters fullscreen when inactive", async () => {
      const mock = installFullscreenApi();
      const target = document.createElement("section");
      document.body.appendChild(target);

      await expect(toggleFullscreen(target)).resolves.toBe(true);

      expect(mock.requestFullscreen).toHaveBeenCalledOnce();
      expect(mock.getCurrentElement()).toBe(target);
    });

    it("exits fullscreen when active", async () => {
      const mock = installFullscreenApi();
      mock.setCurrentElement(document.documentElement);

      await expect(toggleFullscreen()).resolves.toBe(true);

      expect(mock.exitFullscreen).toHaveBeenCalledOnce();
      expect(mock.getCurrentElement()).toBeNull();
    });
  });

  describe("change event", () => {
    it("notifies listeners when fullscreen changes", () => {
      installFullscreenApi();
      const fullscreen = createFullscreenMagic();
      const target = document.createElement("div");
      document.body.appendChild(target);
      const onChange = vi.fn();

      fullscreen.onChange(onChange);
      target.requestFullscreen();
      dispatchFullscreenChange();

      expect(onChange).toHaveBeenCalledWith(true, target);

      document.exitFullscreen();
      dispatchFullscreenChange();

      expect(onChange).toHaveBeenCalledWith(false, null);
    });

    it("supports multiple change listeners", () => {
      installFullscreenApi();
      const fullscreen = createFullscreenMagic();
      const first = vi.fn();
      const second = vi.fn();

      fullscreen.onChange(first);
      fullscreen.onChange(second);

      document.documentElement.requestFullscreen();
      dispatchFullscreenChange();

      expect(first).toHaveBeenCalledOnce();
      expect(second).toHaveBeenCalledOnce();
    });
  });

  describe("error event", () => {
    it("notifies error listeners", () => {
      installFullscreenApi();
      const fullscreen = createFullscreenMagic();
      const onError = vi.fn();

      fullscreen.onError(onError);
      dispatchFullscreenError();

      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0]?.[0]?.type).toBe("fullscreenerror");
    });

    it("supports multiple error listeners", () => {
      installFullscreenApi();
      const fullscreen = createFullscreenMagic();
      const first = vi.fn();
      const second = vi.fn();

      fullscreen.onError(first);
      fullscreen.onError(second);

      dispatchFullscreenError();

      expect(first).toHaveBeenCalledOnce();
      expect(second).toHaveBeenCalledOnce();
      expect(first.mock.calls[0]?.[0]?.type).toBe("fullscreenerror");
      expect(second.mock.calls[0]?.[0]?.type).toBe("fullscreenerror");
    });
  });

  describe("listener cleanup", () => {
    it("stops calling change listeners after unsubscribe", () => {
      installFullscreenApi();
      const fullscreen = createFullscreenMagic();
      const onChange = vi.fn();

      const unsubscribe = fullscreen.onChange(onChange);
      unsubscribe();

      document.documentElement.requestFullscreen();
      dispatchFullscreenChange();

      expect(onChange).not.toHaveBeenCalled();
    });

    it("stops calling error listeners after unsubscribe", () => {
      installFullscreenApi();
      const fullscreen = createFullscreenMagic();
      const onError = vi.fn();

      const unsubscribe = fullscreen.onError(onError);
      unsubscribe();

      dispatchFullscreenError();

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("Alpine plugin", () => {
    it("registers $fullscreen magic", async () => {
      const mock = installFullscreenApi();

      const { fullscreen } = createMagicHarness(fullscreenPlugin) as {
        fullscreen: FullscreenMagic;
      };

      expect(fullscreen.isSupported()).toBe(true);
      await expect(fullscreen.enter()).resolves.toBe(true);
      expect(mock.getCurrentElement()).toBe(document.documentElement);
    });
  });
});
