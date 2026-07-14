import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeCiChanges } from "./ci-changes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");
const basePort = 4200;

/**
 * @returns {string[]}
 */
export function discoverE2ePackages() {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((folder) => existsSync(path.join(packagesDir, folder, "playwright.config.ts")))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string[]} folders
 * @returns {string[]}
 */
export function filterE2ePackages(folders) {
  const available = new Set(discoverE2ePackages());
  return folders.filter((folder) => available.has(folder));
}

/**
 * @param {string[]} packageFolders
 * @returns {number}
 */
export function runE2ePackages(packageFolders) {
  if (packageFolders.length === 0) {
    console.log("No Playwright E2E projects to run.");
    return 0;
  }

  let exitCode = 0;

  for (const [index, folder] of packageFolders.entries()) {
    const packageDir = path.join(packagesDir, folder);
    const port = basePort + index;
    console.log(`\n[e2e] running @ailuracode/alpine-${folder} on port ${port}`);

    const result = spawnSync(
      "pnpm",
      ["exec", "playwright", "test", "--config", "playwright.config.ts"],
      {
        cwd: packageDir,
        env: {
          ...process.env,
          E2E_PORT: String(port),
        },
        stdio: "inherit",
      }
    );

    if (result.status !== 0) {
      exitCode = result.status ?? 1;
    }
  }

  return exitCode;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const discovered = discoverE2ePackages();

  if (discovered.length === 0) {
    console.error("No package Playwright configs found under packages/*/playwright.config.ts");
    process.exit(1);
  }

  let targets = discovered;

  if (args.has("--affected")) {
    const analysis = analyzeCiChanges();
    const changed = new Set([
      ...analysis.changedFolders,
      ...analysis.buildFolders,
      ...analysis.testFolders,
    ]);

    if (analysis.runFull) {
      targets = discovered;
    } else {
      targets = filterE2ePackages([...changed]);
    }
  }

  if (args.has("--packages")) {
    const valueIndex = process.argv.indexOf("--packages");
    const value = process.argv[valueIndex + 1] ?? "";
    targets = filterE2ePackages(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    );
  }

  const exitCode = runE2ePackages(targets);
  process.exit(exitCode);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (entryPath === modulePath) {
  main();
}
