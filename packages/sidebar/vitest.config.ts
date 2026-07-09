/**
 * Per-package Vitest configuration for `@ailuracode/alpine-sidebar`.
 *
 * Per `.agents/instructions/tooling.instructions.md` the package owns its
 * own `vitest.config.ts`. We override the root defaults:
 *
 * - `environment: 'jsdom'` — `window`, `matchMedia`, and
 *   `MediaQueryList` listeners all require a DOM polyfill.
 * - `setupFiles` installs the matchMedia stub the controller and store
 *   rely on. Per-test isolation is handled inside the setup module.
 *
 * Coverage defaults live on the root config — the per-package file only
 * declares what is genuinely different.
 */
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["test/**/*.{test,spec}.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
