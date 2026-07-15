/**
 * Per-package Vitest configuration for `@ailuracode/alpine-theme`.
 *
 * Per `.cursor/rules/tooling-configs.mdc` the package owns its
 * own `vitest.config.ts`. We override the root defaults:
 *
 * - `environment: 'happy-dom'` — `localStorage`, `matchMedia`, `window`, and
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
    environment: "happy-dom",
    include: ["test/**/*.{test,spec}.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
