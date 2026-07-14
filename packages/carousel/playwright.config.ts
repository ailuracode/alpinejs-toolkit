import path from "node:path";
import { fileURLToPath } from "node:url";
import { definePackagePlaywrightConfig } from "../../e2e/playwright.base.js";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

export default definePackagePlaywrightConfig({
  packageName: "carousel",
  packageDir,
});
