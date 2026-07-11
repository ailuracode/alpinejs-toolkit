import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VisibilityState } from "../src/internal/visibility.js";
import { VisibilityController } from "../src/visibility-controller.js";

function setDocumentVisibility(hidden: boolean, visibilityState: VisibilityState): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  });
}

describe("@ailuracode/alpine-env VisibilityController", () => {
  afterEach(() => {
    clearAllSingletons();
    vi.restoreAllMocks();
  });

  it("constructs without touching browser globals", () => {
    setDocumentVisibility(true, "hidden");

    const controller = new VisibilityController();

    expect(controller.isVisible).toBe(true);
    expect(controller.isHidden).toBe(false);
    expect(controller.state).toBe("visible");
  });

  it("mounts listener and removes it on destroy", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const controller = new VisibilityController();

    controller.mount();

    expect(addSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    controller.destroy();

    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });

  it("updates state on visibilitychange", () => {
    setDocumentVisibility(false, "visible");
    const controller = new VisibilityController();

    controller.mount();
    expect(controller.isVisible).toBe(true);
    expect(controller.state).toBe("visible");

    setDocumentVisibility(true, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(controller.isVisible).toBe(false);
    expect(controller.isHidden).toBe(true);
    expect(controller.state).toBe("hidden");
    expect(controller.is("hidden")).toBe(true);
  });

  it("destroy is idempotent", () => {
    const controller = new VisibilityController();

    controller.mount();
    controller.destroy();

    expect(() => controller.destroy()).not.toThrow();
  });
});
