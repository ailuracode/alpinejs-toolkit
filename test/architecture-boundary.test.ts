/**
 * ALP-30 regression gate — audited packages must not re-export from
 * `src/internal/`. Broader architecture enforcement lives in
 * `scripts/architecture-check.mjs` and `test/architecture-check.test.ts`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateInternalBarrelExports } from "../scripts/architecture-check.mjs";
import { ARCHITECTURE_CHECK_POLICY } from "../scripts/architecture-check-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDITED_PACKAGES = ["core", "lang", "media", "theme"] as const;

describe("architecture: no internal/ re-exports from barrel (ALP-30 audited packages)", () => {
  it("keeps env, scroll, and sidebar on the documented exception list until migrated", () => {
    expect(ARCHITECTURE_CHECK_POLICY.internalBarrelExceptions).toEqual(
      expect.arrayContaining(["env", "scroll", "sidebar"])
    );
  });

  for (const packageName of AUDITED_PACKAGES) {
    it(`${packageName}/src/index.ts has no './internal/' import`, () => {
      const errors = validateInternalBarrelExports(root, {
        ...ARCHITECTURE_CHECK_POLICY,
        internalBarrelExceptions: [],
      });
      const packageErrors = errors.filter((error) => error.startsWith(`packages/${packageName}/`));
      expect(packageErrors).toEqual([]);
    });
  }
});
