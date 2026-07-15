/**
 * ALP-30 regression gate — audited packages must not re-export from
 * `src/internal/`. ALP-45 extended the check to cover `src/alpine/`,
 * `src/adapter/`, and `src/bindings/`. Broader architecture enforcement
 * lives in `scripts/architecture-check.mjs` and
 * `test/architecture-check.test.ts`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateInternalBarrelExports } from "../scripts/architecture-check.mjs";
import { ARCHITECTURE_CHECK_POLICY } from "../scripts/architecture-check-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDITED_PACKAGES = ["core", "lang", "media", "theme", "gesture"] as const;

describe("architecture: no internal/ or alpine/ re-exports from barrel (ALP-30 + ALP-45)", () => {
  it("keeps env, scroll, sidebar, command, and overlay on the documented exception list until migrated", () => {
    expect(ARCHITECTURE_CHECK_POLICY.internalBarrelExceptions).toEqual(
      expect.arrayContaining(["env", "scroll", "sidebar", "command", "overlay"])
    );
  });

  for (const packageName of AUDITED_PACKAGES) {
    it(`${packageName}/src/index.ts has no './internal/' or './alpine/' import`, () => {
      const errors = validateInternalBarrelExports(root, {
        ...ARCHITECTURE_CHECK_POLICY,
        internalBarrelExceptions: [],
      });
      const packageErrors = errors.filter((error) => error.startsWith(`packages/${packageName}/`));
      expect(packageErrors).toEqual([]);
    });
  }
});
