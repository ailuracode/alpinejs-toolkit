/**
 * Tests for the singleton helper.
 *
 * The helper is framework-agnostic, in-memory, and lives at the package
 * root (promoted from `internal/` per ALP-30 so the public surface
 * stays consistent with the architecture contract). These tests lock
 * its contract: `getSingleton` / `setSingleton` / `clearSingleton` /
 * `clearAllSingletons` / `createSingleton`. They also exercise the
 * intended usage pattern — a factory that guarantees a single live
 * instance per key — so a future refactor can't quietly weaken the
 * guarantee.
 */
import { afterEach, describe, expect, it } from "vitest";
import { ToolkitError } from "../src/index";
import {
  clearAllSingletons,
  clearSingleton,
  createSingleton,
  getSingleton,
  setSingleton,
} from "../src/singleton";

interface FakeController {
  readonly id: string;
  readonly name: string;
  isDestroyed: boolean;
}

function makeFake(name: string): FakeController {
  return { id: `fake-${name}`, name, isDestroyed: false };
}

afterEach(() => {
  clearAllSingletons();
});

describe("getSingleton", () => {
  it("returns undefined when no instance is registered", () => {
    expect(getSingleton<FakeController>("missing")).toBeUndefined();
  });

  it("returns the registered instance after setSingleton", () => {
    const instance = makeFake("a");
    setSingleton("k", instance);
    expect(getSingleton<FakeController>("k")).toBe(instance);
  });
});

describe("setSingleton", () => {
  it("registers the instance under the key", () => {
    const instance = makeFake("a");
    setSingleton("k", instance);
    expect(getSingleton("k")).toBe(instance);
  });

  it("throws ToolkitError when a live instance is already registered for the key", () => {
    setSingleton("k", makeFake("a"));
    expect(() => setSingleton("k", makeFake("b"))).toThrow(ToolkitError);
    expect(() => setSingleton("k", makeFake("b"))).toThrow(/already instantiated/);
  });

  it("allows re-registration after clearSingleton", () => {
    setSingleton("k", makeFake("a"));
    clearSingleton("k");
    expect(() => setSingleton("k", makeFake("b"))).not.toThrow();
    expect(getSingleton<FakeController>("k")?.name).toBe("b");
  });
});

describe("clearSingleton", () => {
  it("removes the instance and returns true", () => {
    setSingleton("k", makeFake("a"));
    expect(clearSingleton("k")).toBe(true);
    expect(getSingleton("k")).toBeUndefined();
  });

  it("is idempotent on missing keys", () => {
    expect(clearSingleton("never-set")).toBe(false);
    expect(clearSingleton("never-set")).toBe(false);
  });

  it("only clears the targeted key", () => {
    setSingleton("a", makeFake("a"));
    setSingleton("b", makeFake("b"));
    clearSingleton("a");
    expect(getSingleton<FakeController>("a")).toBeUndefined();
    expect(getSingleton<FakeController>("b")?.name).toBe("b");
  });
});

describe("clearAllSingletons", () => {
  it("removes every registered singleton", () => {
    setSingleton("a", makeFake("a"));
    setSingleton("b", makeFake("b"));
    clearAllSingletons();
    expect(getSingleton("a")).toBeUndefined();
    expect(getSingleton("b")).toBeUndefined();
  });
});

describe("createSingleton", () => {
  it("invokes the factory on the first call and registers the result", () => {
    let factoryCalls = 0;
    const instance = createSingleton<FakeController>("k", () => {
      factoryCalls += 1;
      return makeFake("first");
    });
    expect(factoryCalls).toBe(1);
    expect(instance.name).toBe("first");
    expect(getSingleton<FakeController>("k")).toBe(instance);
  });

  it("reuses the registered instance and does not re-invoke the factory", () => {
    let factoryCalls = 0;
    const factory = () => {
      factoryCalls += 1;
      return makeFake(`v${factoryCalls}`);
    };
    const a = createSingleton("k", factory);
    const b = createSingleton("k", factory);
    const c = createSingleton("k", factory);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(factoryCalls).toBe(1);
  });

  it("rebuilds after clearSingleton releases the slot", () => {
    let factoryCalls = 0;
    const factory = () => makeFake(`v${++factoryCalls}`);
    const a = createSingleton("k", factory);
    clearSingleton("k");
    const b = createSingleton("k", factory);
    expect(a.name).toBe("v1");
    expect(b.name).toBe("v2");
    expect(factoryCalls).toBe(2);
  });

  it("does not invoke the factory if an instance is already registered", () => {
    setSingleton("k", makeFake("existing"));
    let factoryCalls = 0;
    const result = createSingleton("k", () => {
      factoryCalls += 1;
      return makeFake("new");
    });
    expect(factoryCalls).toBe(0);
    expect(result.name).toBe("existing");
  });
});
