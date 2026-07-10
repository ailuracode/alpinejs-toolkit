import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverPackages } from "./repo-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packages = discoverPackages(path.join(root, "packages")).filter((pkg) => !pkg.isPrivate);

for (const pkg of packages) {
  execSync(`pnpm --filter ${pkg.name} pack --dry-run`, { stdio: "inherit" });
}

console.log(`Packed ${packages.length} workspaces successfully.`);
