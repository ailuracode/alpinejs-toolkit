/**
 * Plugin DOM event dispatch contract — covers {@link dispatchPluginEvent},
 * bubbling/composition defaults, cancelable lifecycle events, detail typing,
 * and validation of namespace/event segments.
 */
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { dispatchPluginEvent, ToolkitError } from "../src/index";

interface ToggleChangeDetail {
  previous: boolean;
  current: boolean;
  source: "toggle";
}

describe("dispatchPluginEvent", () => {
  it("dispatches a CustomEvent with the package:event type and detail", () => {
    const target = document.createElement("div");
    let received: ToggleChangeDetail | undefined;

    target.addEventListener("toggle:change", (event) => {
      received = (event as CustomEvent<ToggleChangeDetail>).detail;
    });

    const detail: ToggleChangeDetail = {
      previous: false,
      current: true,
      source: "toggle",
    };

    const dispatched = dispatchPluginEvent(target, "toggle", "change", detail);

    assert.equal(dispatched.type, "toggle:change");
    assert.deepEqual(dispatched.detail, detail);
    assert.deepEqual(received, detail);
  });

  it("defaults to bubbling and composed, not cancelable", () => {
    const parent = document.createElement("div");
    const child = document.createElement("div");
    parent.append(child);

    let parentReceived = false;
    parent.addEventListener("toggle:change", () => {
      parentReceived = true;
    });

    const event = dispatchPluginEvent(child, "toggle", "change", { value: true });

    assert.equal(event.bubbles, true);
    assert.equal(event.composed, true);
    assert.equal(event.cancelable, false);
    assert.equal(parentReceived, true);
  });

  it("supports cancelable before-* lifecycle events", () => {
    const target = document.createElement("div");
    let prevented = false;

    target.addEventListener("dialog:before-close", (event) => {
      event.preventDefault();
    });

    const event = dispatchPluginEvent(
      target,
      "dialog",
      "before-close",
      { reason: "escape" },
      { cancelable: true }
    );

    prevented = event.defaultPrevented;
    assert.equal(event.cancelable, true);
    assert.equal(prevented, true);
  });

  it("allows overriding bubbles and composed", () => {
    const parent = document.createElement("div");
    const child = document.createElement("div");
    parent.append(child);

    let parentReceived = false;
    parent.addEventListener("toggle:change", () => {
      parentReceived = true;
    });

    const event = dispatchPluginEvent(
      child,
      "toggle",
      "change",
      { value: true },
      { bubbles: false, composed: false }
    );

    assert.equal(event.bubbles, false);
    assert.equal(event.composed, false);
    assert.equal(parentReceived, false);
  });

  it("does not mutate the supplied detail object", () => {
    const target = document.createElement("div");
    const detail = { previous: false, current: true, nested: { count: 1 } };
    let received: typeof detail | undefined;

    target.addEventListener("toggle:change", (event) => {
      received = (event as CustomEvent<typeof detail>).detail;
    });

    dispatchPluginEvent(target, "toggle", "change", detail);
    detail.current = false;
    detail.nested.count = 99;

    assert.deepEqual(received, { previous: false, current: true, nested: { count: 1 } });
  });

  it("dispatches from window for global store listeners", () => {
    let received: { current: string } | undefined;

    const listener = (event: Event): void => {
      received = (event as CustomEvent<{ current: string }>).detail;
    };

    window.addEventListener("theme:change", listener);
    dispatchPluginEvent(window, "theme", "change", { current: "dark" });
    window.removeEventListener("theme:change", listener);

    assert.deepEqual(received, { current: "dark" });
  });

  it("throws ToolkitError for invalid namespace or event segments", () => {
    const target = document.createElement("div");

    assert.throws(
      () => dispatchPluginEvent(target, "Toggle", "change", {}),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "TOOLKIT_INVALID_ARGUMENT");
        return true;
      }
    );

    assert.throws(
      () => dispatchPluginEvent(target, "toggle", "beforeClose", {}),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "TOOLKIT_INVALID_ARGUMENT");
        return true;
      }
    );
  });

  it("can be called repeatedly without retaining state between dispatches", () => {
    const target = document.createElement("div");
    const received: number[] = [];

    target.addEventListener("toggle:change", (event) => {
      received.push((event as CustomEvent<{ value: number }>).detail.value);
    });

    dispatchPluginEvent(target, "toggle", "change", { value: 1 });
    dispatchPluginEvent(target, "toggle", "change", { value: 2 });

    assert.deepEqual(received, [1, 2]);
  });
});

describe("dispatchPluginEvent SSR-safe import", () => {
  it("imports without throwing in a non-browser context", async () => {
    const module = await import("../src/core/plugin-event.js");
    assert.equal(typeof module.dispatchPluginEvent, "function");
  });
});

describe("dispatchPluginEvent type inference", () => {
  it("returns a CustomEvent typed to the supplied detail", () => {
    const target = document.createElement("div");

    const event = dispatchPluginEvent(target, "toggle", "change", {
      previous: false,
      current: true,
      source: "toggle" as const,
    });

    const _typeCheck: CustomEvent<ToggleChangeDetail> = event;
    assert.equal(_typeCheck.type, "toggle:change");
  });
});
