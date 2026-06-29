import { execSync } from "node:child_process";

const workspaces = [
  "@ailuracode/alpine-theme",
  "@ailuracode/alpine-media",
  "@ailuracode/alpine-env",
  "@ailuracode/alpine-transfer",
  "@ailuracode/alpine-attention",
  "@ailuracode/alpine-scroll",
  "@ailuracode/alpine-notify",
  "@ailuracode/alpine-geo",
  "@ailuracode/alpine-lang",
];

for (const workspace of workspaces) {
  execSync(`pnpm --filter ${workspace} pack --dry-run`, { stdio: "inherit" });
}

console.log(`Packed ${workspaces.length} workspaces successfully.`);
