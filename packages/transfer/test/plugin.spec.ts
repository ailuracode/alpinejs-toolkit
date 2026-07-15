/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 *
 * Mirrors the spec pattern from `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-scroll`: minimal mock Alpine that records
 * magic registrations so the contract can be asserted without
 * booting the real runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import transferPlugin from "../src/index";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  magic(name: string, factory: () => unknown): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    magics: {},
    plugin(cb) {
      cb(alpine);
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
  };
  return alpine;
}

/**
 * Collision-avoidance: hosts that already own one of the transfer
 * magics (`clipboard`, `share`, `export`) can rename any combination
 * of them through dedicated `*Key` options without touching the
 * individual helpers.
 */
describe("transferPlugin — collision-avoidance keys", () => {
  it("registers under custom clipboard/share/export keys", () => {
    const Alpine = createMockAlpine();
    transferPlugin({
      clipboardKey: "copy",
      shareKey: "shareOut",
      exportKey: "download",
    })(Alpine as unknown as AlpineBase);

    expect(Alpine.magics.copy).toBeDefined();
    expect(Alpine.magics.shareOut).toBeDefined();
    expect(Alpine.magics.download).toBeDefined();
    expect(Alpine.magics.clipboard).toBeUndefined();
    expect(Alpine.magics.share).toBeUndefined();
    expect(Alpine.magics.export).toBeUndefined();
  });

  it("leaves default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    transferPlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.clipboard).toBeDefined();
    expect(Alpine.magics.share).toBeDefined();
    expect(Alpine.magics.export).toBeDefined();
  });

  it("only registers the keys the caller enabled", () => {
    const Alpine = createMockAlpine();
    transferPlugin({ share: false })(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.clipboard).toBeDefined();
    expect(Alpine.magics.export).toBeDefined();
    expect(Alpine.magics.share).toBeUndefined();
  });
});
