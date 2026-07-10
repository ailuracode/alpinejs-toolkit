/**
 * Per-package Vitest configuration for `@ailuracode/alpine-scroll`.
 *
 * Per `.cursor/rules/tooling-configs.mdc` the package owns its
 * own `vitest.config.ts`. We override the root defaults:
 *
 * - `environment: 'jsdom'` — `Element.scrollIntoView`, `window.scrollTo`,
 *   `window.scrollBy`, `IntersectionObserver`, and `matchMedia` all
 *   require a DOM polyfill under happy-dom v29.
 * - `setupFiles` installs the controller's stubs (`setup.ts`).
 * - `coverage.include` / `exclude` keeps the public re-export barrel
 *   (`src/index.ts`) and pure type modules out of the coverage totals
 *   so they do not tank the per-package thresholds.
 * - `forbidOnly: true` is the safety belt — a `test.only()` left in the
 *   suite would silently skip every other test in CI.
 *
 * Coverage thresholds live on the root config; the per-package file only
 * declares what is genuinely different.
 */
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["test/**/*.{test,spec}.ts"],
    setupFiles: ["./test/setup.ts"],
    forbidOnly: true,
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/global.d.ts", "src/types.ts", "src/events.ts"],
    },
  },
});
