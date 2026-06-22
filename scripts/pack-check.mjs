import { execSync } from "node:child_process";

const workspaces = [
  "@ailuracode/alpine-theme",
  "@ailuracode/alpine-screen",
  "@ailuracode/alpine-network",
  "@ailuracode/alpine-clipboard",
  "@ailuracode/alpine-scroll",
  "@ailuracode/alpine-touch",
  "@ailuracode/alpine-platform",
  "@ailuracode/alpine-notify",
];

for (const workspace of workspaces) {
  execSync(`pnpm --filter ${workspace} pack --dry-run`, { stdio: "inherit" });
}

console.log(`Packed ${workspaces.length} workspaces successfully.`);
