import { describe, expect, it } from "vitest";
import {
  isScopedVitestCommand,
  usesAmbiguousTestFilter,
} from "../scripts/vitest-package-scripts.mjs";

describe("vitest package scripts", () => {
  it("detects the ambiguous positional test filter", () => {
    expect(usesAmbiguousTestFilter("vitest run --config ../../vitest.config.ts test")).toBe(true);
    expect(
      usesAmbiguousTestFilter("vitest run --config ../../vitest.config.ts packages/dialog")
    ).toBe(false);
    expect(usesAmbiguousTestFilter("vitest run")).toBe(false);
  });

  it("requires root-config packages to scope by packages/<folder>", () => {
    expect(
      isScopedVitestCommand(
        "vitest run --config ../../vitest.config.ts packages/dialog",
        "dialog",
        false
      )
    ).toBe(true);
    expect(
      isScopedVitestCommand("vitest run --config ../../vitest.config.ts test", "dialog", false)
    ).toBe(false);
  });

  it("requires local-config packages to scope through the root workspace", () => {
    expect(
      isScopedVitestCommand(
        "vitest run --config ../../vitest.config.ts packages/theme",
        "theme",
        true
      )
    ).toBe(true);
    expect(isScopedVitestCommand("vitest run", "theme", true)).toBe(false);
  });
});
