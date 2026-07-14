/**
 * Per-package Vitest project for `@ailuracode/alpine-media`.
 *
 * happy-dom integration specs run here with package-local matchMedia setup.
 * Controller and other node-classified specs run in the root `node` project.
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
    setupFiles: ["./test/setup.ts"],
    exclude: ["**/e2e/**"],
  },
});
