import { execSync } from "node:child_process";

const workspaces = [
  "@ailuracode/alpine-theme",
  "@ailuracode/alpine-screen",
  "@ailuracode/alpine-network",
  "@ailuracode/alpine-clipboard",
  "@ailuracode/alpine-attention",
  "@ailuracode/alpine-export",
  "@ailuracode/alpine-scroll",
  "@ailuracode/alpine-touch",
  "@ailuracode/alpine-platform",
  "@ailuracode/alpine-notify",
  "@ailuracode/alpine-geo",
  "@ailuracode/alpine-visibility",
  "@ailuracode/alpine-battery",
  "@ailuracode/alpine-lang",
];

for (const workspace of workspaces) {
  execSync(`pnpm --filter ${workspace} pack --dry-run`, { stdio: "inherit" });
}

console.log(`Packed ${workspaces.length} workspaces successfully.`);
