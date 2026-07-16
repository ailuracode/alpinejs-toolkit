import assert from "node:assert/strict";
import type Base from "alpinejs";
import { afterEach, describe, it } from "vitest";
import {
  guardDirective,
  guardMagic,
  guardStore,
  RegistrationError,
  resetRegistrationTracking,
} from "../src/registration";
import type { Alpine } from "../src/type";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, (...args: never[]) => unknown>;
  directives: Record<string, Base.DirectiveCallback>;
  store(name: string, value?: unknown): unknown;
  magic(name: string, callback: (...args: never[]) => unknown): void;
  directive(name: string, callback: Base.DirectiveCallback): { before(directive: string): void };
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    directives: {},
    store(name, value?) {
      if (value === undefined) {
        return alpine.stores[name];
      }
      alpine.stores[name] = value;
      return undefined;
    },
    magic(name, callback) {
      alpine.magics[name] = callback;
    },
    directive(name, callback) {
      alpine.directives[name] = callback;
      return {
        before() {
          /* no-op */
        },
      };
    },
  };
  return alpine;
}

afterEach(() => {
  resetRegistrationTracking();
});

describe("guardStore", () => {
  it("registers a store and returns the reactive proxy", () => {
    const alpine = createMockAlpine();
    const store = { value: 1 };
    const result = guardStore(alpine as unknown as Alpine, "demo", store, "demo-pkg");
    assert.equal(result, alpine.stores.demo);
    assert.equal(alpine.stores.demo, store);
  });

  it("throws RegistrationError when the key is already registered", () => {
    const alpine = createMockAlpine();
    guardStore(alpine as unknown as Alpine, "demo", { value: 1 }, "demo-pkg");
    assert.throws(
      () => guardStore(alpine as unknown as Alpine, "demo", { value: 2 }, "demo-pkg"),
      (error: unknown) => {
        assert.ok(error instanceof RegistrationError);
        assert.equal(error.kind, "store");
        assert.equal(error.registrationName, "demo");
        assert.equal(error.packageName, "demo-pkg");
        assert.equal(error.code, "REGISTRATION_COLLISION");
        return true;
      }
    );
  });

  it("overwrites when override is set", () => {
    const alpine = createMockAlpine();
    const original = { value: 1 };
    const replacement = { value: 2 };

    guardStore(alpine as unknown as Alpine, "demo", original, "demo-pkg");
    guardStore(alpine as unknown as Alpine, "demo", replacement, "demo-pkg", { override: true });

    assert.equal(alpine.stores.demo, replacement);
  });

  it("does not throw when a different key is registered", () => {
    const alpine = createMockAlpine();
    guardStore(alpine as unknown as Alpine, "alpha", { value: 1 }, "demo-pkg");
    guardStore(alpine as unknown as Alpine, "beta", { value: 2 }, "demo-pkg");
    assert.equal((alpine.stores.alpha as { value: number }).value, 1);
    assert.equal((alpine.stores.beta as { value: number }).value, 2);
  });
});

describe("guardMagic", () => {
  it("registers a magic accessor", () => {
    const alpine = createMockAlpine();
    const accessor = () => "value";
    guardMagic(alpine as unknown as Alpine, "demo", accessor, "demo-pkg");
    assert.equal(alpine.magics.demo, accessor);
  });

  it("throws when the same magic is registered twice", () => {
    const alpine = createMockAlpine();
    guardMagic(alpine as unknown as Alpine, "demo", () => 1, "demo-pkg");
    assert.throws(
      () => guardMagic(alpine as unknown as Alpine, "demo", () => 2, "demo-pkg"),
      (error: unknown) => {
        assert.ok(error instanceof RegistrationError);
        assert.equal(error.kind, "magic");
        assert.equal(error.registrationName, "demo");
        assert.equal(error.code, "REGISTRATION_COLLISION");
        return true;
      }
    );
  });

  it("overwrites when override is set", () => {
    const alpine = createMockAlpine();
    guardMagic(alpine as unknown as Alpine, "demo", () => 1, "demo-pkg");
    guardMagic(alpine as unknown as Alpine, "demo", () => 2, "demo-pkg", { override: true });
    assert.equal(alpine.magics.demo(), 2);
  });

  it("does not collide when the host registered the magic outside the guard", () => {
    const alpine = createMockAlpine();
    alpine.magic("external", () => "host");
    guardMagic(alpine as unknown as Alpine, "external", () => "toolkit", "demo-pkg");
    assert.equal(alpine.magics.external(), "toolkit");
  });
});

describe("guardDirective", () => {
  it("registers a directive", () => {
    const alpine = createMockAlpine();
    const handler: Base.DirectiveCallback = () => undefined;
    guardDirective(alpine as unknown as Alpine, "demo", handler, "demo-pkg");
    assert.equal(alpine.directives.demo, handler);
  });

  it("throws when the same directive is registered twice", () => {
    const alpine = createMockAlpine();
    const noop: Base.DirectiveCallback = () => undefined;
    guardDirective(alpine as unknown as Alpine, "demo", noop, "demo-pkg");
    assert.throws(
      () => guardDirective(alpine as unknown as Alpine, "demo", noop, "demo-pkg"),
      (error: unknown) => {
        assert.ok(error instanceof RegistrationError);
        assert.equal(error.kind, "directive");
        assert.equal(error.registrationName, "demo");
        assert.equal(error.code, "REGISTRATION_COLLISION");
        return true;
      }
    );
  });

  it("overwrites when override is set", () => {
    const alpine = createMockAlpine();
    const noop: Base.DirectiveCallback = () => undefined;
    guardDirective(alpine as unknown as Alpine, "demo", noop, "demo-pkg");
    guardDirective(alpine as unknown as Alpine, "demo", noop, "demo-pkg", {
      override: true,
    });
    assert.equal(alpine.directives.demo, noop);
  });
});

describe("RegistrationError", () => {
  it("includes the kind, name and package name in its message", () => {
    const error = new RegistrationError("store", "theme", "theme");
    assert.match(
      error.message,
      /store "theme" already registered\. Use \{ override: true \} in themePlugin\(\) to replace/
    );
    assert.match(error.message, /themePlugin\(\)/);
    assert.match(error.message, /unique key/);
  });

  it("inherits from ToolkitError with the REGISTRATION_COLLISION code", () => {
    const error = new RegistrationError("magic", "demo", "demo-pkg");
    assert.equal(error.code, "REGISTRATION_COLLISION");
    assert.equal(error.kind, "magic");
    assert.equal(error.registrationName, "demo");
    assert.equal(error.packageName, "demo-pkg");
    assert.equal(error.name, "REGISTRATION_COLLISION");
  });
});
