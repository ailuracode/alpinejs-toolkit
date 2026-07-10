import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverPackages, expectedSizeLimitConfig, publishablePackages } from "./repo-check.mjs";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {string} root
 * @returns {string[]}
 */
export function syncSizeLimitConfigs(root = defaultRoot) {
  const packages = publishablePackages(discoverPackages(path.join(root, "packages")));
  const changed = [];

  for (const pkg of packages) {
    const expected = expectedSizeLimitConfig(pkg);
    if (!expected) {
      continue;
    }

    const configPath = path.join(pkg.dir, ".size-limit.json");
    const next = `${JSON.stringify(expected, null, 2)}\n`;
    const current = existsSync(configPath) ? readFileSync(configPath, "utf8") : null;

    if (current) {
      try {
        if (JSON.stringify(JSON.parse(current)) === JSON.stringify(expected)) {
          continue;
        }
      } catch {
        // Invalid JSON should be rewritten from policy.
      }
    }

    writeFileSync(configPath, next);
    changed.push(path.relative(root, configPath));
  }

  return changed;
}

function main() {
  const changed = syncSizeLimitConfigs();

  if (changed.length === 0) {
    console.log("size-limit configs already in sync");
    return;
  }

  console.log("updated size-limit configs:");
  for (const file of changed) {
    console.log(`  - ${file}`);
  }
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (entryPath === modulePath) {
  main();
}
