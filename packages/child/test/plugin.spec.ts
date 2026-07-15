/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { childPlugin } from "../src/index";

interface MockAlpine {
  directives: Record<string, unknown>;
  interceptInit: (cb: (...args: never[]) => unknown) => void;
  interceptInits: Array<(...args: never[]) => unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  directive(
    name: string,
    handler: (...args: never[]) => unknown
  ): { before: (modifier: string) => unknown };
  addInitSelector(cb: () => string): void;
  initSelectors: Array<() => string>;
  prefixed(key: string): string;
}

function createMockAlpine(): MockAlpine {
  let alpineRef!: MockAlpine;
  const alpine: MockAlpine = {
    directives: {},
    interceptInits: [],
    initSelectors: [],
    interceptInit(cb) {
      alpine.interceptInits.push(cb as never);
    },
    plugin(cb) {
      cb(alpineRef);
    },
    directive(name, handler) {
      alpine.directives[name] = handler;
      return {
        before(modifier) {
          // Track modifier so the spec can confirm `.before("ignore")`
          // was applied without booting Alpine's directive chain.
          alpine.directives[`${name}:before:${modifier}`] = handler;
          return { before: () => undefined };
        },
      };
    },
    addInitSelector(cb) {
      alpine.initSelectors.push(cb);
    },
    prefixed(key) {
      return `x-${key}`;
    },
  };
  alpineRef = alpine;
  return alpine;
}

type ChildRegister = (alpine: AlpineBase) => void;

/**
 * Collision-avoidance: hosts that already own a `child` directive
 * can rename the integration without touching the unwrap pass.
 */
describe("childPlugin — collision-avoidance keys", () => {
  it("registers under a custom directiveKey", () => {
    const Alpine = createMockAlpine();
    (childPlugin({ directiveKey: "unwrap" }) as ChildRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.directives.unwrap).toBeDefined();
    expect(Alpine.directives.child).toBeUndefined();
    // `addInitSelector` should track the renamed prefix.
    expect(Alpine.initSelectors.length).toBe(1);
  });

  it("leaves the default directiveKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (childPlugin({}) as ChildRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.directives.child).toBeDefined();
    expect(Alpine.directives["child:before:ignore"]).toBeDefined();
  });
});
