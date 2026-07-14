/**
 * Per-package Vitest configuration for `@ailuracode/alpine-realtime`.
 *
 * The root `vitest.config.ts` auto-aliases every package under
 * `packages/\*\/src/index.ts`, so we only declare what is genuinely
 * different here:
 *
 * - `environment: 'happy-dom'` — `document.visibilityState`,
 *   `EventSource`, and `WebSocket` (available through globals) all
 *   require a DOM polyfill. Tests still stub these as needed.
 * - `globals: true` so `describe`, `expect`, `vi`, etc. work without
 *   per-file imports in this lightweight util-focused package.
 *
 * Coverage settings inherit from the root config.
 */
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["test/**/*.{test,spec}.ts"],
  },
});
