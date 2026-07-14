/**
 * Per-package Vitest project for `@ailuracode/alpine-realtime`.
 *
 * happy-dom integration specs run here. Controller and adapter unit tests
 * run in the root `node` project instead.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";
import { packageProjectIncludes } from "../../scripts/vitest-projects.mjs";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const packageName = path.basename(packageDir);

export default defineProject({
  test: {
    name: `${packageName}-happy-dom`,
    globals: true,
    environment: "happy-dom",
    include: packageProjectIncludes(packageName, "happy-dom"),
    exclude: ["**/e2e/**"],
  },
});
