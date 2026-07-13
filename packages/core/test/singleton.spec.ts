/**
 * Tests for the singleton helper.
 *
 * The helper is framework-agnostic, in-memory, and lives at the package
 * root (promoted from `internal/` per ALP-30 so the public surface
 * stays consistent with the architecture contract). These tests lock
 * its contract: scoped `getSingleton` / `setSingleton` / `clearSingleton` /
 * `clearAllSingletons` / `createSingleton`. They also exercise the
 * intended usage pattern — a factory that guarantees a single live
 * instance per key per scope — so a future refactor can't quietly
 * weaken the guarantee.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToolkitError } from "../src/index";
import {
  clearAllSingletons,
  clearSingleton,
  createSingleton,
  createSingletonScope,
  getSingleton,
  releaseSingleton,
  resolveSingletonScope,
  runWithSingletonScope,
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

describe("resolveSingletonScope", () => {
  it("uses an explicit scope object", () => {
    const scope = createSingletonScope();
    expect(resolveSingletonScope(scope)).toBe(scope);
  });

  it("uses the ambient scope from runWithSingletonScope", () => {
    const scope = createSingletonScope();
    runWithSingletonScope(scope, () => {
      expect(resolveSingletonScope()).toBe(scope);
    });
  });

  it("defaults to document in browser test environments", () => {
    expect(resolveSingletonScope()).toBe(document);
  });

  it("throws when no scope can be resolved", () => {
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: undefined,
    });
    try {
      expect(() => resolveSingletonScope()).toThrow(ToolkitError);
      expect(() => resolveSingletonScope()).toThrow(/No singleton scope is available/);
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument,
      });
    }
  });
});

describe("getSingleton", () => {
  it("returns undefined when no instance is registered", () => {
    expect(getSingleton<FakeController>("missing")).toBeUndefined();
  });

  it("returns the registered instance after setSingleton", () => {
    const scope = createSingletonScope();
    const instance = makeFake("a");
    setSingleton("k", instance, scope);
    expect(getSingleton<FakeController>("k", scope)).toBe(instance);
  });

  it("isolates instances by scope", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    const a = makeFake("a");
    const b = makeFake("b");
    setSingleton("k", a, scopeA);
    setSingleton("k", b, scopeB);
    expect(getSingleton<FakeController>("k", scopeA)).toBe(a);
    expect(getSingleton<FakeController>("k", scopeB)).toBe(b);
  });
});

describe("setSingleton", () => {
  it("registers the instance under the key in a scope", () => {
    const scope = createSingletonScope();
    const instance = makeFake("a");
    setSingleton("k", instance, scope);
    expect(getSingleton("k", scope)).toBe(instance);
  });

  it("throws ToolkitError when a live instance is already registered for the key in the same scope", () => {
    const scope = createSingletonScope();
    setSingleton("k", makeFake("a"), scope);
    expect(() => setSingleton("k", makeFake("b"), scope)).toThrow(ToolkitError);
    expect(() => setSingleton("k", makeFake("b"), scope)).toThrow(/already instantiated/);
  });

  it("allows the same key in different scopes", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    setSingleton("k", makeFake("a"), scopeA);
    expect(() => setSingleton("k", makeFake("b"), scopeB)).not.toThrow();
  });

  it("allows re-registration after clearSingleton", () => {
    const scope = createSingletonScope();
    setSingleton("k", makeFake("a"), scope);
    clearSingleton("k", scope);
    expect(() => setSingleton("k", makeFake("b"), scope)).not.toThrow();
    expect(getSingleton<FakeController>("k", scope)?.name).toBe("b");
  });
});

describe("clearSingleton", () => {
  it("removes the instance in one scope and returns true", () => {
    const scope = createSingletonScope();
    setSingleton("k", makeFake("a"), scope);
    expect(clearSingleton("k", scope)).toBe(true);
    expect(getSingleton("k", scope)).toBeUndefined();
  });

  it("is idempotent on missing keys", () => {
    const scope = createSingletonScope();
    expect(clearSingleton("never-set", scope)).toBe(false);
    expect(clearSingleton("never-set", scope)).toBe(false);
  });

  it("only clears the targeted key within a scope", () => {
    const scope = createSingletonScope();
    setSingleton("a", makeFake("a"), scope);
    setSingleton("b", makeFake("b"), scope);
    clearSingleton("a", scope);
    expect(getSingleton<FakeController>("a", scope)).toBeUndefined();
    expect(getSingleton<FakeController>("b", scope)?.name).toBe("b");
  });

  it("does not clear the same key in another scope", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    const a = makeFake("a");
    setSingleton("k", a, scopeA);
    setSingleton("k", makeFake("b"), scopeB);
    clearSingleton("k", scopeA);
    expect(getSingleton("k", scopeA)).toBeUndefined();
    expect(getSingleton<FakeController>("k", scopeB)?.name).toBe("b");
  });
});

describe("releaseSingleton", () => {
  it("clears the slot recorded on the instance", () => {
    const scope = createSingletonScope();
    const instance = createSingleton("k", () => makeFake("a"), { scope });
    expect(releaseSingleton("k", instance)).toBe(true);
    expect(getSingleton("k", scope)).toBeUndefined();
  });

  it("is a no-op for instances not created through createSingleton", () => {
    const scope = createSingletonScope();
    setSingleton("k", makeFake("a"), scope);
    expect(releaseSingleton("k", makeFake("orphan"))).toBe(false);
    expect(getSingleton<FakeController>("k", scope)?.name).toBe("a");
  });
});

describe("clearAllSingletons", () => {
  it("removes every registered singleton across scopes", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    setSingleton("a", makeFake("a"), scopeA);
    setSingleton("b", makeFake("b"), scopeB);
    clearAllSingletons();
    expect(getSingleton("a", scopeA)).toBeUndefined();
    expect(getSingleton("b", scopeB)).toBeUndefined();
  });

  it("clears only the requested scope when one is provided", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    setSingleton("k", makeFake("a"), scopeA);
    setSingleton("k", makeFake("b"), scopeB);
    clearAllSingletons(scopeA);
    expect(getSingleton("k", scopeA)).toBeUndefined();
    expect(getSingleton<FakeController>("k", scopeB)?.name).toBe("b");
  });
});

describe("createSingleton", () => {
  it("invokes the factory on the first call and registers the result", () => {
    const scope = createSingletonScope();
    let factoryCalls = 0;
    const instance = createSingleton<FakeController>(
      "k",
      () => {
        factoryCalls += 1;
        return makeFake("first");
      },
      { scope }
    );
    expect(factoryCalls).toBe(1);
    expect(instance.name).toBe("first");
    expect(getSingleton<FakeController>("k", scope)).toBe(instance);
  });

  it("reuses the registered instance and does not re-invoke the factory", () => {
    const scope = createSingletonScope();
    let factoryCalls = 0;
    const factory = () => {
      factoryCalls += 1;
      return makeFake(`v${factoryCalls}`);
    };
    const a = createSingleton("k", factory, { scope });
    const b = createSingleton("k", factory, { scope });
    const c = createSingleton("k", factory, { scope });
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(factoryCalls).toBe(1);
  });

  it("creates independent instances in different scopes", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    const a = createSingleton("k", () => makeFake("a"), { scope: scopeA });
    const b = createSingleton("k", () => makeFake("b"), { scope: scopeB });
    expect(a).not.toBe(b);
    expect(a.name).toBe("a");
    expect(b.name).toBe("b");
  });

  it("rebuilds after clearSingleton releases the slot", () => {
    const scope = createSingletonScope();
    let factoryCalls = 0;
    const factory = () => makeFake(`v${++factoryCalls}`);
    const a = createSingleton("k", factory, { scope });
    clearSingleton("k", scope);
    const b = createSingleton("k", factory, { scope });
    expect(a.name).toBe("v1");
    expect(b.name).toBe("v2");
    expect(factoryCalls).toBe(2);
  });

  it("does not invoke the factory if an instance is already registered", () => {
    const scope = createSingletonScope();
    setSingleton("k", makeFake("existing"), scope);
    let factoryCalls = 0;
    const result = createSingleton(
      "k",
      () => {
        factoryCalls += 1;
        return makeFake("new");
      },
      { scope }
    );
    expect(factoryCalls).toBe(0);
    expect(result.name).toBe("existing");
  });

  it("warns when later calls pass conflicting options", () => {
    const scope = createSingletonScope();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {
      // silence expected diagnostic
    });
    createSingleton("k", () => makeFake("first"), { scope, options: { theme: "dark" } });
    createSingleton("k", () => makeFake("second"), { scope, options: { theme: "light" } });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Singleton "k" already exists in this scope with different options')
    );
    warn.mockRestore();
  });
});
