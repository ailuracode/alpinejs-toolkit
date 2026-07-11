import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const since = process.argv[2] ?? "origin/master";

function hasPendingChangesets() {
  return readdirSync(".changeset").some((file) => file.endsWith(".md") && file !== "README.md");
}

function getChangedPackageDirs() {
  const result = spawnSync("git", ["diff", "--name-only", since, "HEAD", "--", "packages/"], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return [];
  }

  return [
    ...new Set(
      result.stdout
        .trim()
        .split("\n")
        .filter((line) => line.startsWith("packages/"))
        .map((line) => line.split("/")[1])
    ),
  ];
}

function isPackageVersioned(pkg) {
  const changelog = spawnSync(
    "git",
    ["diff", "--name-only", since, "HEAD", "--", `packages/${pkg}/CHANGELOG.md`],
    { encoding: "utf8" }
  );

  if (changelog.stdout.trim()) {
    return true;
  }

  const version = spawnSync(
    "git",
    ["diff", "-U0", since, "HEAD", "--", `packages/${pkg}/package.json`],
    { encoding: "utf8" }
  );

  return /^\+\s*"version":/m.test(version.stdout);
}

const result = spawnSync("changeset", ["status", "--since", since], {
  stdio: "inherit",
});

if (result.status === 0) {
  process.exit(0);
}

// A maintainer may already have run `changeset version` on this branch.
if (!hasPendingChangesets()) {
  const changed = getChangedPackageDirs();

  if (changed.length > 0 && changed.every(isPackageVersioned)) {
    process.exit(0);
  }
}

process.exit(result.status ?? 1);
