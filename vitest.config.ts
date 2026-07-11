import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(root, "packages");

const packageAliases = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    find: `@ailuracode/alpine-${entry.name}`,
    replacement: path.resolve(packagesDir, entry.name, "src/index.ts"),
  }))
  // Longest-first so specific names (e.g. `query-adapter-alpine`) win over
  // prefixes (`query`) during Vite alias resolution.
  .sort((a, b) => b.find.length - a.find.length);

// Per-package coverage floors live in scripts/coverage-policy.json and are
// enforced by scripts/per-package-coverage.mjs (run via `pnpm run
// test:coverage`). These global thresholds are retained as the backstop for a
// plain `vitest run --coverage` and MUST NOT be lowered (see .cursor/rules/
// coverage-thresholds.mdc). The per-package runner tightens enforcement so a
// weakly tested package can no longer pass on another workspace's coverage.
export default defineConfig({
  root,
  resolve: {
    alias: packageAliases,
  },
  test: {
    environment: "happy-dom",
    setupFiles: [path.join(root, "test/setup.ts")],
    include: [
      path.join(root, "packages/*/test/**/*.{test,spec}.ts"),
      path.join(root, "apps/demo/test/**/*.test.ts"),
      path.join(root, "test/**/*.test.ts"),
    ],
    // Real-browser contracts live in `test/browser/**` and run only via
    // `vitest.browser.config.ts` (ALP-23) — they must not run in happy-dom.
    exclude: ["**/test/browser/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/*/src/**/*.ts"],
      // Keep the historical global floor as a backstop. The per-package runner
      // is the authoritative gate (ALP-23).
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 75,
        statements: 80,
      },
    },
  },
});
