import { afterEach, describe, expect, it } from "vitest";
import {
  clearAllSingletons,
  createSingleton,
  releaseSingleton,
  type SingletonInitOptions,
  type SingletonScope,
} from "../src/singleton";

interface FakeController {
  readonly id: string;
  readonly name: string;
}

function makeFake(name: string): FakeController {
  return { id: `fake-${name}`, name };
}

function makeFactory(): { factory: () => FakeController; calls: () => number } {
  let n = 0;
  return {
    factory: () => {
      n += 1;
      return makeFake(`v${n}`);
    },
    calls: () => n,
  };
}

function createInstance(
  key: string,
  options?: SingletonInitOptions
): { instance: FakeController; scope: SingletonScope } {
  const scope = options?.scope ?? {};
  const instance = createSingleton<FakeController>(key, () => makeFake("default"), options);
  return { instance, scope };
}

afterEach(() => {
  clearAllSingletons();
});

describe("createSingleton", () => {
  it("invokes the factory on the first call and returns the result", () => {
    const tracker = makeFactory();
    const scope: SingletonScope = {};
    const instance = createSingleton<FakeController>("k", tracker.factory, { scope });
    expect(tracker.calls()).toBe(1);
    expect(instance.name).toBe("v1");
  });

  it("reuses the previously registered instance instead of running the factory again", () => {
    const scope: SingletonScope = {};
    const a = createSingleton<FakeController>("k", () => makeFake("first"), { scope });
    const b = createSingleton<FakeController>("k", () => makeFake("second"), { scope });
    const c = createSingleton<FakeController>("k", () => makeFake("third"), { scope });
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a.name).toBe("first");
  });

  it("isolates instances by scope", () => {
    const scopeA: SingletonScope = {};
    const scopeB: SingletonScope = {};
    const a = createSingleton<FakeController>("k", () => makeFake("a"), { scope: scopeA });
    const b = createSingleton<FakeController>("k", () => makeFake("b"), { scope: scopeB });
    expect(a).not.toBe(b);
    expect(a.name).toBe("a");
    expect(b.name).toBe("b");
  });

  it("returns the existing instance even when later calls omit options", () => {
    const scope: SingletonScope = {};
    const first = createSingleton<FakeController>("k", () => makeFake("first"), { scope });
    const second = createSingleton<FakeController>("k", () => makeFake("second"), { scope });
    expect(first).toBe(second);
    expect(first.name).toBe("first");
  });
});

describe("releaseSingleton", () => {
  it("clears the slot when the instance matches the record", () => {
    const { instance } = createInstance("k", { scope: {} });
    expect(releaseSingleton("k", instance)).toBe(true);
  });

  it("is a no-op when the instance is not the registered one", () => {
    const scope: SingletonScope = {};
    createSingleton<FakeController>("k", () => makeFake("live"), { scope });
    const orphan = makeFake("orphan");
    expect(releaseSingleton("k", orphan)).toBe(false);
  });

  it("allows a fresh factory call after release", () => {
    const tracker = makeFactory();
    const scope: SingletonScope = {};
    const first = createSingleton<FakeController>("k", tracker.factory, { scope });
    releaseSingleton("k", first);
    const second = createSingleton<FakeController>("k", tracker.factory, { scope });
    expect(first).not.toBe(second);
    expect(tracker.calls()).toBe(2);
  });
});

describe("clearAllSingletons", () => {
  it("removes every registered singleton so factories re-run next time", () => {
    const tracker = makeFactory();
    const scope: SingletonScope = {};
    createSingleton<FakeController>("k", tracker.factory, { scope });
    clearAllSingletons();
    const after = createSingleton<FakeController>("k", tracker.factory, { scope });
    expect(after.name).toBe("v2");
    expect(tracker.calls()).toBe(2);
  });
});
