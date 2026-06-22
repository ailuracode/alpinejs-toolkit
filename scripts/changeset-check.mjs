import { spawnSync } from "node:child_process";

const since = process.argv[2] ?? "origin/master";

const result = spawnSync("changeset", ["status", "--since", since], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
