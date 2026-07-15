import { describe, expect, it } from "vitest";
import { validatePackedWorkspace } from "../scripts/pack-check.mjs";

describe("pack:check", () => {
  it("rejects forbidden tarball files and workspace ranges", () => {
    const errors = validatePackedWorkspace(
      { name: "@ailuracode/alpine-fixture" },
      {
        files: ["package.json", "README.md", "dist/index.js", "test/fixture.test.ts"],
        manifest: {
          types: "./dist/index.d.ts",
          exports: {
            ".": {
              default: "./dist/index.js",
            },
          },
          dependencies: {
            "@ailuracode/alpine-core": "workspace:*",
          },
        },
      }
    );

    expect(errors).toContain(
      "@ailuracode/alpine-fixture: packed tarball includes forbidden file test/fixture.test.ts"
    );
    expect(errors).toContain(
      "@ailuracode/alpine-fixture: packed tarball missing manifest target dist/index.d.ts"
    );
    expect(errors).toContain(
      "@ailuracode/alpine-fixture: packed manifest still contains dependencies.@ailuracode/alpine-core=workspace:*"
    );
    expect(errors).toContain('@ailuracode/alpine-fixture: packed manifest missing "sideEffects"');
  });

  it("rejects invalid packed sideEffects metadata", () => {
    const errors = validatePackedWorkspace(
      { name: "@ailuracode/alpine-fixture" },
      {
        files: ["package.json", "README.md", "dist/index.js"],
        manifest: {
          sideEffects: true,
          exports: {
            ".": {
              default: "./dist/index.js",
            },
          },
        },
      }
    );

    expect(errors).toContain(
      '@ailuracode/alpine-fixture: packed manifest has invalid "sideEffects" metadata'
    );
  });
});
