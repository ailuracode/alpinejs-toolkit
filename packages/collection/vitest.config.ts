/**
 * Per-package Vitest project for `@ailuracode/alpine-collection`.
 *
 * jsdom files for this package are routed here from the root workspace.
 * Node-classified specs run in the root `node` project instead.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";
import { packageProjectIncludes } from "../../scripts/vitest-projects.mjs";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const packageName = path.basename(packageDir);

export default defineProject({
  test: {
    name: `${packageName}-jsdom`,
    globals: true,
    environment: "jsdom",
    include: packageProjectIncludes(packageName, "jsdom"),
    exclude: ["**/e2e/**"],
  },
});
