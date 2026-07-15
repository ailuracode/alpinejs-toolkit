import { describe, expect, it } from "vitest";
import { matchesAnyPattern } from "../scripts/architecture-check.mjs";
import {
  exportsControllerClass,
  extractConstructorBodies,
  findConstructorSideEffectsInSource,
  findConstructorSideEffectViolations,
  findCrossPackageInternalImportViolations,
  findForbiddenBarrelReExports,
  hasRuntimeAlpineImport,
  importsPackageEntrypoint,
} from "../scripts/architecture-check-ast.mjs";
import { ARCHITECTURE_CHECK_POLICY } from "../scripts/architecture-check-policy.mjs";

describe("architecture:check", () => {
  it("flags alpine/, adapter/, and bindings/ adapter imports in public barrels", () => {
    const syntheticSource = [
      'export { x } from "./alpine/store.js";',
      'export { y } from "./adapter/bridge.js";',
      'export { z } from "./bindings/dom.js";',
      'export { w } from "./internal/foo.js";',
    ].join("\n");

    const violations = findForbiddenBarrelReExports(syntheticSource);
    expect(violations.map((violation) => violation.specifier)).toEqual([
      "./alpine/store.js",
      "./adapter/bridge.js",
      "./bindings/dom.js",
      "./internal/foo.js",
    ]);
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

  it("detects runtime alpinejs imports in controller source", () => {
    expect(
      hasRuntimeAlpineImport('import Alpine from "alpinejs";\nexport class DemoController {}')
    ).toBe(true);
    expect(
      hasRuntimeAlpineImport('import type Alpine from "alpinejs";\nexport class DemoController {}')
    ).toBe(false);
    expect(
      hasRuntimeAlpineImport(
        'import { type AlpineType } from "alpinejs";\nexport class DemoController {}'
      )
    ).toBe(false);
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

  it("requires a controller surface in synthetic barrels", () => {
    expect(exportsControllerClass("export class ThemeController {}")).toBe(true);
    expect(exportsControllerClass('export { ThemeController } from "./controller.js";')).toBe(true);
    expect(exportsControllerClass("export const helper = 1;")).toBe(false);
  });

  it("detects index entrypoint imports in controller tests", () => {
    expect(
      importsPackageEntrypoint(
        'import { DemoController } from "../src/index.js";',
        "packages/demo/test/controller.spec.ts"
      )
    ).toBe(true);
    expect(
      importsPackageEntrypoint(
        'import { DemoController } from "../src/controller.js";',
        "packages/demo/test/controller.spec.ts"
      )
    ).toBe(false);
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
});

describe("architecture:check AST fixtures", () => {
  it("ignores constructor side effects inside comments, strings, and templates", () => {
    const source = `
      class Demo {
        constructor() {
          // window.addEventListener("resize", () => undefined);
          const message = "window.setTimeout(() => undefined)";
          const template = \`document.body && localStorage.getItem("x")\`;
        }
      }
    `;

    expect(findConstructorSideEffectsInSource(source)).toEqual([]);
  });

  it("flags nested constructor side effects but allows typeof guards with optional chaining", () => {
    const source = `
      class Demo {
        constructor() {
          if (typeof navigator !== "undefined" && typeof navigator.geolocation?.getCurrentPosition === "function") {
            this.ready = true;
          }
        }
      }
    `;

    expect(findConstructorSideEffectsInSource(source)).toEqual([]);

    const violatingSource = `
      class Demo {
        constructor() {
          if (typeof navigator !== "undefined") {
            navigator.geolocation.getCurrentPosition(() => undefined);
          }
        }
      }
    `;

    expect(findConstructorSideEffectsInSource(violatingSource)).toContain("navigator-access");
  });

  it("distinguishes type-only and value alpine imports across import forms", () => {
    expect(hasRuntimeAlpineImport('import type Alpine from "alpinejs";')).toBe(false);
    expect(hasRuntimeAlpineImport('import { type AlpineType } from "alpinejs";')).toBe(false);
    expect(hasRuntimeAlpineImport('import Alpine from "alpinejs";')).toBe(true);
    expect(hasRuntimeAlpineImport('import { reactive } from "alpinejs";')).toBe(true);
    expect(hasRuntimeAlpineImport('import "alpinejs";')).toBe(true);
  });

  it("detects forbidden barrel re-exports from export declarations only", () => {
    const source = `
      const internalPath = "./internal/hidden.js";
      export { helper } from "./internal/helper.js";
      export * from "./adapter/bridge.js";
    `;

    const violations = findForbiddenBarrelReExports(source);
    expect(violations.map((violation) => violation.specifier)).toEqual([
      "./internal/helper.js",
      "./adapter/bridge.js",
    ]);
  });

  it("detects cross-package internal imports in export-from statements", () => {
    const violations = findCrossPackageInternalImportViolations(`
      export { helper } from "@ailuracode/alpine-theme/src/internal/helper.js";
    `);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("@ailuracode/alpine-theme/src/internal/helper.js");
  });

  it("detects index entrypoint imports in controller tests only", () => {
    expect(importsPackageEntrypoint('import { x } from "../../src/index.ts";')).toBe(true);
    expect(importsPackageEntrypoint('import { x } from "../../src/controller.ts";')).toBe(false);
  });
});
