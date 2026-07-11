import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  extractConstructorBodies,
  findConstructorSideEffectViolations,
  findCrossPackageInternalImportViolations,
  findUnitTestImportViolations,
  matchesAnyPattern,
  runArchitectureCheck,
  validateControllerAlpineImports,
  validateControllerSurface,
  validateDependencyDirection,
  validateInternalBarrelExports,
  validateUnitTestImports,
} from "../scripts/architecture-check.mjs";
import { ARCHITECTURE_CHECK_POLICY } from "../scripts/architecture-check-policy.mjs";
import { findHeadlessCssViolations } from "../scripts/headless-css-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALUE_ALPINE_IMPORT_RE = /^import\s+(?!type\b)[\s\S]*?\sfrom\s+["']alpinejs["']/m;

describe("architecture:check", () => {
  it("passes on the current repository", () => {
    const result = runArchitectureCheck({ root });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.packageCount).toBeGreaterThanOrEqual(28);
  });

  it("flags internal barrel re-exports outside documented exceptions", () => {
    const fixturePolicy = {
      ...ARCHITECTURE_CHECK_POLICY,
      internalBarrelExceptions: [],
    };

    const errors = validateInternalBarrelExports(root, fixturePolicy);
    expect(errors.some((error) => error.includes("packages/env/src/index.ts"))).toBe(true);
    expect(errors.some((error) => error.includes("packages/scroll/src/index.ts"))).toBe(true);
    expect(errors.some((error) => error.includes("packages/sidebar/src/index.ts"))).toBe(true);
    expect(errors.some((error) => error.includes("packages/core/src/index.ts"))).toBe(false);
  });

  it("allows documented internal barrel exceptions", () => {
    const errors = validateInternalBarrelExports(root, ARCHITECTURE_CHECK_POLICY);
    expect(errors.some((error) => error.includes("packages/env/src/index.ts"))).toBe(false);
    expect(errors.some((error) => error.includes("packages/scroll/src/index.ts"))).toBe(false);
    expect(errors.some((error) => error.includes("packages/sidebar/src/index.ts"))).toBe(false);
  });

  it("flags cross-package internal imports", () => {
    const violations = findCrossPackageInternalImportViolations(
      'import { x } from "@ailuracode/alpine-theme/internal/foo.js";'
    );
    expect(violations).toEqual([
      expect.stringContaining(
        "cross-package import must not target another package's internal path"
      ),
    ]);
  });

  it("flags runtime alpinejs imports in controller modules", () => {
    const errors = validateControllerAlpineImports(root);
    expect(errors.some((error) => error.includes("packages/attention/src/controller.ts"))).toBe(
      false
    );

    const syntheticSource = 'import Alpine from "alpinejs";\nexport class DemoController {}';
    expect(VALUE_ALPINE_IMPORT_RE.test(syntheticSource)).toBe(true);
    expect(errors.every((error) => !error.includes("import type"))).toBe(true);
  });

  it("detects constructor browser globals and timers", () => {
    const bodies = extractConstructorBodies(`
      class Demo {
        constructor() {
          window.addEventListener("resize", () => undefined);
        }
      }
    `);

    expect(findConstructorSideEffectViolations(bodies[0] ?? "")).toContain("window-access");

    const safeBodies = extractConstructorBodies(`
      class Demo {
        constructor() {
          this.#supported = typeof navigator !== "undefined";
        }
      }
    `);

    expect(findConstructorSideEffectViolations(safeBodies[0] ?? "")).toEqual([]);
  });

  it("requires a controller surface unless explicitly exempted", () => {
    const errors = validateControllerSurface(root, ARCHITECTURE_CHECK_POLICY);
    expect(errors).toEqual([]);

    const strictPolicy = {
      ...ARCHITECTURE_CHECK_POLICY,
      controllerExceptions: [],
    };
    const strictErrors = validateControllerSurface(root, strictPolicy);
    expect(strictErrors.some((error) => error.includes("@ailuracode/alpine-query"))).toBe(true);
    expect(strictErrors.some((error) => error.includes("@ailuracode/alpine-attention"))).toBe(
      false
    );
  });

  it("requires controller tests to import implementation modules directly", () => {
    const errors = validateUnitTestImports(root, ARCHITECTURE_CHECK_POLICY);
    expect(errors).toEqual([]);

    const violation = findUnitTestImportViolations(
      "packages/demo/test/controller.spec.ts",
      'import { DemoController } from "../src/index.js";',
      ARCHITECTURE_CHECK_POLICY
    );
    expect(violation).toEqual([
      "packages/demo/test/controller.spec.ts: controller tests must import implementation modules directly, not src/index.ts (contract/integration tests may import the entrypoint)",
    ]);
  });

  it("keeps package dependency direction acyclic and core independent", () => {
    const errors = validateDependencyDirection(root);
    expect(errors).toEqual([]);
  });

  it("recognizes contract and integration test entrypoint import patterns", () => {
    expect(
      matchesAnyPattern("contract.spec.ts", ARCHITECTURE_CHECK_POLICY.entrypointTestPatterns)
    ).toBe(true);
    expect(
      matchesAnyPattern(
        "alpine.integration.test.ts",
        ARCHITECTURE_CHECK_POLICY.entrypointTestPatterns
      )
    ).toBe(true);
    expect(
      matchesAnyPattern("controller.spec.ts", ARCHITECTURE_CHECK_POLICY.controllerTestPatterns)
    ).toBe(true);
    expect(
      matchesAnyPattern("tooltip.test.ts", ARCHITECTURE_CHECK_POLICY.controllerTestPatterns)
    ).toBe(false);
  });

  it("flags prohibited headless styling markers", () => {
    const violations = findHeadlessCssViolations(":root.dark { color: red; }");
    expect(violations.map((rule) => rule.id)).toContain("host-dark-selector");
  });
});
