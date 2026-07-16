import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type { Unsubscribe } from "../src/event.js";
import { CleanupStack, EventEmitter, ToolkitError } from "../src/index";

describe("ToolkitError", () => {
  it("exposes a stable code and inherits from Error", () => {
    const error = new ToolkitError('plugin "x" is already registered', "REGISTRATION_COLLISION");

    assert.ok(error instanceof Error);
    assert.ok(error instanceof ToolkitError);
    assert.equal(error.name, "REGISTRATION_COLLISION");
    assert.equal(error.code, "REGISTRATION_COLLISION");
    assert.equal(error.message, 'plugin "x" is already registered');
  });

  it("preserves the original error as cause when provided", () => {
    const original = new Error("boom");
    const wrapped = new ToolkitError("loader failed", "TOOLKIT_INVALID_STATE", original);

    assert.equal(wrapped.cause, original);
  });

  it("keeps `instanceof ToolkitError` working after throw", () => {
    try {
      throw new ToolkitError("gone", "CONTROLLER_DESTROYED");
    } catch (caught) {
      assert.ok(caught instanceof ToolkitError);
      assert.equal((caught as ToolkitError).code, "CONTROLLER_DESTROYED");
    }
  });
});

describe("EventEmitter", () => {
  it("dispatches events to on() listeners with full type narrowing", () => {
    const events = new EventEmitter<{ change: number; close: string }>();
    let received = 0;

    events.on("change", (value) => {
      received = value;
    });

    events.emit("change", 42);
    assert.equal(received, 42);
  });

  it("off() removes a previously registered listener", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    let calls = 0;
    const listener = (): void => {
      calls += 1;
    };

    events.on("ping", listener);
    events.emit("ping", undefined);
    events.off("ping", listener);
    events.emit("ping", undefined);

    assert.equal(calls, 1);
  });

  it("once() fires exactly one time per registration", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    let calls = 0;

    events.once("ping", () => {
      calls += 1;
    });
    events.emit("ping", undefined);
    events.emit("ping", undefined);

    assert.equal(calls, 1);
  });

  it("removeAllListeners() empties every registration", () => {
    const events = new EventEmitter<{ a: undefined; b: undefined }>();
    let a = 0;
    let b = 0;

    events.on("a", () => {
      a += 1;
    });
    events.on("b", () => {
      b += 1;
    });

    events.removeAllListeners();
    events.emit("a", undefined);
    events.emit("b", undefined);

    assert.equal(a, 0);
    assert.equal(b, 0);
  });

  it("snapshot iteration keeps `off()` calls inside listeners deterministic", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    let calls = 0;
    const self = events.on("ping", () => {
      calls += 1;
      self();
    });

    events.emit("ping", undefined);
    events.emit("ping", undefined);

    assert.equal(calls, 1);
  });

  it("self-unsubscribe during emit does not skip subsequent listeners", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    const order: string[] = [];

    const unsubscribeFirst = events.on("ping", () => {
      order.push("first");
      unsubscribeFirst();
    });
    events.on("ping", () => {
      order.push("second");
    });
    events.on("ping", () => {
      order.push("third");
    });

    events.emit("ping", undefined);

    assert.deepEqual(order, ["first", "second", "third"]);
  });

  it("unsubscribing another listener during emit still invokes listeners in the snapshot", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    const order: string[] = [];
    let second: Unsubscribe = () => undefined;

    events.on("ping", () => {
      order.push("first");
      second();
    });
    second = events.on("ping", () => {
      order.push("second");
    });
    events.on("ping", () => {
      order.push("third");
    });

    events.emit("ping", undefined);

    assert.deepEqual(order, ["first", "second", "third"]);
  });

  it("listeners added during emit do not run in the current pass", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    const order: string[] = [];

    events.on("ping", () => {
      order.push("first");
      events.on("ping", () => {
        order.push("late");
      });
    });
    events.on("ping", () => {
      order.push("second");
    });

    events.emit("ping", undefined);

    assert.deepEqual(order, ["first", "second"]);

    events.emit("ping", undefined);

    assert.deepEqual(order, ["first", "second", "first", "second", "late"]);
  });

  it("once() remains exactly-once under re-entrant emit", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    let calls = 0;

    events.once("ping", () => {
      calls += 1;
      events.emit("ping", undefined);
    });

    events.emit("ping", undefined);
    events.emit("ping", undefined);

    assert.equal(calls, 1);
  });

  it("off() inside a listener does not skip later listeners in the snapshot", () => {
    const events = new EventEmitter<{ ping: undefined }>();
    let calls = 0;
    const second = (): void => {
      calls += 1;
    };

    events.on("ping", () => {
      events.off("ping", second);
    });
    events.on("ping", second);

    events.emit("ping", undefined);

    assert.equal(calls, 1);
  });
});

describe("CleanupStack", () => {
  it("runs cleanups in LIFO order on dispose()", () => {
    const stack = new CleanupStack();
    const order: number[] = [];

    stack.push(() => {
      order.push(1);
    });
    stack.push(() => {
      order.push(2);
    });
    stack.push(() => {
      order.push(3);
    });

    stack.dispose();
    assert.deepEqual(order, [3, 2, 1]);
    assert.equal(stack.disposed, true);
    assert.equal(stack.size, 0);
  });

  it("dispose() is idempotent", () => {
    const stack = new CleanupStack();
    let calls = 0;

    stack.push(() => {
      calls += 1;
    });
    stack.dispose();
    stack.dispose();

    assert.equal(calls, 1);
  });

  it("runs cleanups eagerly when pushed after dispose()", () => {
    const stack = new CleanupStack();
    let calls = 0;

    stack.dispose();
    stack.push(() => {
      calls += 1;
    });

    assert.equal(calls, 1);
    assert.equal(stack.disposed, true);
  });

  it("wraps a single cleanup error in a ToolkitError and runs the rest", () => {
    const stack = new CleanupStack();
    const order: string[] = [];

    stack.push(() => {
      order.push("first");
    });
    stack.push(() => {
      order.push("throws");
      throw new Error("boom");
    });
    stack.push(() => {
      order.push("third");
    });

    assert.throws(
      () => stack.dispose(),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "TOOLKIT_INVALID_STATE");
        assert.ok((error as ToolkitError).cause instanceof Error);
        return true;
      }
    );

    assert.deepEqual(order, ["third", "throws", "first"]);
  });

  it("aggregates multiple cleanup errors via AggregateError", () => {
    const stack = new CleanupStack();

    stack.push(() => {
      throw new Error("first");
    });
    stack.push(() => {
      throw new Error("second");
    });

    assert.throws(
      () => stack.dispose(),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        const cause = (error as ToolkitError).cause;
        assert.ok(cause instanceof AggregateError);
        assert.equal((cause as AggregateError).errors.length, 2);
        return true;
      }
    );
  });
});
