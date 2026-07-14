#!/usr/bin/env node
/**
 * Scaffold Playwright E2E boilerplate for packages that do not yet have it.
 * Run: node scripts/scaffold-e2e-packages.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

const PACKAGES = [
  "core",
  "child",
  "overlay",
  "dialog",
  "menu",
  "tooltip",
  "accordion",
  "tabs",
  "keyboard",
  "command",
  "media",
  "scroll",
  "sidebar",
  "carousel",
  "virtual",
  "query-kit",
  "toast",
  "env",
  "lang",
  "transfer",
  "permissions",
  "geo",
  "notify",
  "attention",
  "selection",
];

function playwrightConfig(packageName) {
  return `import path from "node:path";
import { fileURLToPath } from "node:url";
import { definePackagePlaywrightConfig } from "../../e2e/playwright.base.js";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

export default definePackagePlaywrightConfig({
  packageName: "${packageName}",
  packageDir,
});
`;
}

function ensurePackageScripts(packageDir) {
  const packageJsonPath = path.join(packageDir, "package.json");
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  let changed = false;

  if (!pkg.scripts) {
    pkg.scripts = {};
    changed = true;
  }

  if (!pkg.scripts["test:e2e"]) {
    pkg.scripts["test:e2e"] = "playwright test --config playwright.config.ts";
    changed = true;
  }

  if (!pkg.scripts["test:e2e:report"]) {
    pkg.scripts["test:e2e:report"] = "playwright show-report e2e/playwright-report";
    changed = true;
  }

  if (changed) {
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  }
}

for (const name of PACKAGES) {
  const packageDir = path.join(packagesDir, name);
  if (!existsSync(packageDir)) {
    console.warn(`[skip] missing package: ${name}`);
    continue;
  }

  const configPath = path.join(packageDir, "playwright.config.ts");
  if (!existsSync(configPath)) {
    writeFileSync(configPath, playwrightConfig(name), "utf8");
    console.log(`[created] ${name}/playwright.config.ts`);
  }

  const fixtureDir = path.join(packageDir, "e2e", "fixture");
  mkdirSync(fixtureDir, { recursive: true });

  ensurePackageScripts(packageDir);
}

console.log("Scaffold complete. Customize e2e/fixture and e2e/*.spec.ts per package.");
