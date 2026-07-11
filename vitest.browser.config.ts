/**
 * Real-browser Vitest configuration (ALP-23).
 *
 * happy-dom cannot faithfully exercise real focus management, portals, scroll
 * locking, or keyboard/focus semantics. This config runs a small, targeted
 * browser suite (Playwright + Chromium) against the highest-risk headless-UI
 * contracts: dialog focus capture/restore, keyboard navigation for menu/tabs/
 * accordion, escape + nested overlay stacks, portals, and `aria-*`/`inert`.
 *
 * Unit/controller tests remain in the happy-dom runner (`vitest.config.ts`).
 * This config only collects `*.browser.test.ts` files. It is intended to run in
 * CI (which installs the Playwright browser binary); run it locally with
 * `pnpm run test:browser` after `npx playwright install chromium`.
 *
 * See `.cursor/rules/testing.mdc` for the layer split.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(root, "packages");

const packageAliases = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    find: `@ailuracode/alpine-${entry.name}`,
    replacement: path.resolve(packagesDir, entry.name, "src/index.ts"),
  }))
  .sort((a, b) => b.find.length - a.find.length);

export default defineConfig({
  resolve: {
    alias: packageAliases,
  },
  test: {
    include: ["packages/*/test/browser/**/*.browser.test.ts"],
    setupFiles: [path.join(root, "test/setup.ts")],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/*/src/**/*.ts"],
    },
  },
});
