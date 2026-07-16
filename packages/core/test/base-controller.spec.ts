import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { BaseController, ToolkitError } from "../src/index";

interface CounterEvents extends Record<string, unknown> {
  increment: { value: number };
  reset: undefined;
}

class CounterController extends BaseController<CounterEvents> {
  #value = 0;
  #externalTeardownCalls = 0;

  override mount(): void {
    super.mount();
  }

  increment(by = 1): void {
    if (this.isDestroyed) {
      throw new ToolkitError("Counter is destroyed", "CONTROLLER_DESTROYED");
    }
    this.#value += by;
    this.emit("increment", { value: this.#value });
  }

  registerSideEffect(): void {
    this.registerCleanup(() => {
      this.#externalTeardownCalls += 1;
    });
  }

  get externalTeardownCalls(): number {
    return this.#externalTeardownCalls;
  }

  get value(): number {
    return this.#value;
  }

  override destroy(): void {
    this.#value = 0;
    super.destroy();
  }
}

class TestCounter extends CounterController {
  emitForTest<Key extends keyof CounterEvents>(event: Key, detail: CounterEvents[Key]): void {
    this.emit(event, detail);
  }
}

describe("BaseController", () => {
  it("assigns a unique id when none is provided", () => {
    const a = new CounterController();
    const b = new CounterController();

    assert.ok(a.id.startsWith("controller-"));
    assert.notEqual(a.id, b.id);
  });

  it("honors an explicit id", () => {
    const controller = new CounterController("counter-1");
    assert.equal(controller.id, "counter-1");
  });

  it("mount() flips isMounted and is idempotent", () => {
    const controller = new CounterController();

    assert.equal(controller.isMounted, false);
    controller.mount();
    assert.equal(controller.isMounted, true);

    controller.mount();
    assert.equal(controller.isMounted, true);
  });

  it("destroy() runs registered cleanups and is idempotent", () => {
    const controller = new CounterController();
    controller.registerSideEffect();
    controller.registerSideEffect();
    controller.mount();

    controller.destroy();
    assert.equal(controller.isDestroyed, true);
    assert.equal(controller.externalTeardownCalls, 2);

    controller.destroy();
    assert.equal(controller.externalTeardownCalls, 2);
  });

  it("rejects mount() after destroy() with CONTROLLER_DESTROYED", () => {
    const controller = new CounterController();
    controller.destroy();

    assert.throws(
      () => controller.mount(),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "CONTROLLER_DESTROYED");
        return true;
      }
    );
  });

  it("emits typed events to on() listeners", () => {
    const controller = new CounterController();
    let received = 0;

    controller.on("increment", (detail) => {
      received = detail.value;
    });

    controller.mount();
    controller.increment(2);
    controller.increment(3);

    assert.equal(received, 5);
  });

  it("removes listeners when off() is called", () => {
    const controller = new CounterController();
    let calls = 0;
    const listener = (): void => {
      calls += 1;
    };

    controller.on("increment", listener);
    controller.mount();
    controller.increment();
    controller.off("increment", listener);
    controller.increment();

    assert.equal(calls, 1);
  });

  it("destroys all listeners on destroy()", () => {
    const controller = new TestCounter();
    let calls = 0;

    controller.on("increment", () => {
      calls += 1;
    });
    controller.destroy();
    controller.emitForTest("increment", { value: 1 });

    assert.equal(calls, 0);
  });

  it("once() fires a single time", () => {
    const controller = new TestCounter();
    let calls = 0;

    controller.once("reset", () => {
      calls += 1;
    });
    controller.emitForTest("reset", undefined);
    controller.emitForTest("reset", undefined);

    assert.equal(calls, 1);
  });

  it("throws CONTROLLER_DESTROYED when subclasses guard destroyed state", () => {
    const controller = new CounterController();
    controller.destroy();
    assert.throws(
      () => controller.increment(),
      (error: unknown) => error instanceof ToolkitError
    );
  });
});
