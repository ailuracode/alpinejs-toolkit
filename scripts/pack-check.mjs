import { execSync } from "node:child_process";

const workspaces = [
  "@ailuracode/alpine-theme",
  "@ailuracode/alpine-screen",
  "@ailuracode/alpine-online",
  "@ailuracode/alpine-clipboard",
  "@ailuracode/alpine-scroll",
  "@ailuracode/alpine-touch",
];

for (const workspace of workspaces) {
  execSync(`npm pack -w ${workspace} --dry-run`, { stdio: "inherit" });
}

console.log(`Packed ${workspaces.length} workspaces successfully.`);
