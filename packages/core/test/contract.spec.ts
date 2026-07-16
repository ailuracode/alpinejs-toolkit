import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { BaseController, CleanupStack, isBrowser, safeDocument, safeWindow } from "../src/index";

describe("SSR-safe imports", () => {
  it("safeWindow() and safeDocument() return real handles under happy-dom", () => {
    assert.equal(isBrowser(), true);
    assert.ok(safeWindow());
    assert.ok(safeDocument());
  });
});

describe("cleanup contract", () => {
  it("BaseController.destroy() removes every registered listener", () => {
    let calls = 0;
    const listener = (): void => {
      calls += 1;
    };

    class Probe extends BaseController {
      override mount(): void {
        super.mount();
        this.on("tick" as never, listener);
      }
    }

    const probe = new Probe();
    probe.mount();
    (probe as unknown as { emit: (event: string, detail: unknown) => void }).emit(
      "tick",
      undefined
    );
    assert.equal(calls, 1);

    probe.destroy();
    (probe as unknown as { emit: (event: string, detail: unknown) => void }).emit(
      "tick",
      undefined
    );
    assert.equal(calls, 1);
  });

  it("CleanupStack.dispose() runs every pending cleanup", () => {
    const stack = new CleanupStack();
    let calls = 0;

    stack.push(() => {
      calls += 1;
    });
    stack.push(() => {
      calls += 1;
    });

    stack.dispose();
    assert.equal(calls, 2);
  });
});
