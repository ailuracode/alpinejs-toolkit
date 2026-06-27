import { execSync } from "node:child_process";

const workspaces = [
  "@ailuracode/alpinejs-theme",
  "@ailuracode/alpinejs-screen",
  "@ailuracode/alpinejs-network",
  "@ailuracode/alpinejs-clipboard",
  "@ailuracode/alpinejs-attention",
  "@ailuracode/alpinejs-export",
  "@ailuracode/alpinejs-scroll",
  "@ailuracode/alpinejs-touch",
  "@ailuracode/alpinejs-platform",
  "@ailuracode/alpinejs-notify",
  "@ailuracode/alpinejs-geo",
  "@ailuracode/alpinejs-visibility",
  "@ailuracode/alpinejs-battery",
];

for (const workspace of workspaces) {
  execSync(`pnpm --filter ${workspace} pack --dry-run`, { stdio: "inherit" });
}

console.log(`Packed ${workspaces.length} workspaces successfully.`);
