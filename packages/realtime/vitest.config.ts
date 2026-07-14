/**
 * Per-package Vitest project for `@ailuracode/alpine-realtime`.
 *
 * happy-dom integration specs run here. Controller and adapter unit tests
 * run in the root `node` project instead.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";
import { packageProjectIncludesRelative } from "../../scripts/vitest-projects.mjs";
import { buildVitestAliases } from "../../scripts/vitest-resolve.mjs";
import { domProjectRuntimeSettings } from "../../scripts/vitest-runtime-settings.mjs";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const packageName = path.basename(packageDir);
const root = path.resolve(packageDir, "../..");

export default defineProject({
  extends: true,
  resolve: {
    alias: buildVitestAliases(root),
  },
  test: {
    ...domProjectRuntimeSettings(),
    name: `${packageName}-happy-dom`,
    globals: true,
    environment: "happy-dom",
    include: packageProjectIncludesRelative(packageName, "happy-dom"),
    exclude: ["**/e2e/**"],
  },
});
