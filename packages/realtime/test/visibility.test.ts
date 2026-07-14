import { describe, expect, it, vi } from "vitest";
import {
  type VisibilityDocument,
  VisibilityManager,
  type VisibilityResolution,
} from "../src/utils/visibility";

class FakeVisibilityDocument implements VisibilityDocument {
  visibilityState: "visible" | "hidden" | "prerender" | "unloaded" = "visible";
  private listeners = new Set<() => void>();

  addEventListener(_type: "visibilitychange", listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "visibilitychange", listener: () => void): void {
    this.listeners.delete(listener);
  }

  fire(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  setVisibility(state: "visible" | "hidden"): void {
    this.visibilityState = state;
    this.fire();
  }
}

describe("VisibilityManager", () => {
  it("starts visible when document reports visible", () => {
    const doc = new FakeVisibilityDocument();
    const manager = new VisibilityManager({ getDocument: () => doc });
    const onHidden = () => undefined;
    const onVisible = () => undefined;

    manager.start(onHidden, onVisible);

    expect(manager.isVisible).toBe(true);
    expect(manager.visibilityState).toBe("visible");

    manager.stop();
  });

  it("treats prerender as visible (per HTML spec)", () => {
    const doc = new FakeVisibilityDocument();
    doc.visibilityState = "prerender";
    const manager = new VisibilityManager({ getDocument: () => doc });

    manager.start(
      () => undefined,
      () => undefined
    );

    expect(manager.isVisible).toBe(true);
    expect(manager.visibilityState).toBe("prerender");

    manager.stop();
  });

  it("invokes onHidden when document becomes hidden", () => {
    const doc = new FakeVisibilityDocument();
    let hiddenCalls = 0;
    let visibleCalls = 0;

    const manager = new VisibilityManager({ getDocument: () => doc });
    manager.start(
      () => {
        hiddenCalls += 1;
      },
      () => {
        visibleCalls += 1;
      }
    );

    doc.setVisibility("hidden");
    expect(hiddenCalls).toBe(1);
    expect(visibleCalls).toBe(0);
    expect(manager.isVisible).toBe(false);

    manager.stop();
  });

  it("invokes onVisible when document becomes visible again", () => {
    const doc = new FakeVisibilityDocument();
    doc.visibilityState = "hidden";
    let visibleCalls = 0;

    const manager = new VisibilityManager({ getDocument: () => doc });
    manager.start(
      () => undefined,
      () => {
        visibleCalls += 1;
      }
    );

    // Manager reads the document's current visibility at start.
    expect(manager.isVisible).toBe(false);

    doc.setVisibility("visible");
    expect(visibleCalls).toBe(1);
    expect(manager.isVisible).toBe(true);

    manager.stop();
  });

  it("does not fire callbacks when the visibility does not change", () => {
    const doc = new FakeVisibilityDocument();
    let visibleCalls = 0;
    let hiddenCalls = 0;

    const manager = new VisibilityManager({ getDocument: () => doc });
    manager.start(
      () => {
        hiddenCalls += 1;
      },
      () => {
        visibleCalls += 1;
      }
    );

    doc.setVisibility("visible"); // already visible
    expect(visibleCalls).toBe(0);
    expect(hiddenCalls).toBe(0);

    manager.stop();
  });

  it("stop() removes the listener and is idempotent", () => {
    const doc = new FakeVisibilityDocument();
    const addSpy = vi.spyOn(doc, "addEventListener");
    const removeSpy = vi.spyOn(doc, "removeEventListener");

    const manager = new VisibilityManager({ getDocument: () => doc });
    manager.start(
      () => undefined,
      () => undefined
    );
    manager.stop();

    expect(addSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    expect(() => manager.stop()).not.toThrow();
    expect(manager.isVisible).toBe(true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("start() is idempotent and does not double-register listeners", () => {
    const doc = new FakeVisibilityDocument();
    const addSpy = vi.spyOn(doc, "addEventListener");

    const manager = new VisibilityManager({ getDocument: () => doc });
    manager.start(
      () => undefined,
      () => undefined
    );
    manager.start(
      () => undefined,
      () => undefined
    );

    expect(addSpy).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    manager.stop();
  });

  it("is a no-op when the document is unavailable (SSR)", () => {
    let hiddenCalls = 0;
    let visibleCalls = 0;

    const manager = new VisibilityManager({
      getDocument: () => null,
    } satisfies VisibilityResolution);

    expect(() =>
      manager.start(
        () => {
          hiddenCalls += 1;
        },
        () => {
          visibleCalls += 1;
        }
      )
    ).not.toThrow();

    expect(manager.isVisible).toBe(true);
    expect(manager.visibilityState).toBe("unknown");

    expect(() => manager.stop()).not.toThrow();
    expect(hiddenCalls).toBe(0);
    expect(visibleCalls).toBe(0);
  });

  it("exposes visibilityState through the manager", () => {
    const doc = new FakeVisibilityDocument();
    const manager = new VisibilityManager({ getDocument: () => doc });
    manager.start(
      () => undefined,
      () => undefined
    );

    expect(manager.visibilityState).toBe("visible");

    doc.setVisibility("hidden");
    expect(manager.visibilityState).toBe("hidden");

    manager.stop();
  });
});
