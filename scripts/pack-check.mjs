import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverPackages, publishablePackages } from "./repo-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_TARBALL_FILES = ["package.json", "README.md"];
const FORBIDDEN_TARBALL_PATTERNS = [
  /(^|\/)test\//,
  /(^|\/)__tests__\//,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /(^|\/)coverage\//,
  /\.map$/,
  /\.tsbuildinfo$/,
  /(^|\/)[^/]+\.(tmp|swp)$/,
];
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function normalizePackResult(stdout) {
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

function normalizeTarballPath(target) {
  return target.startsWith("./") ? target.slice(2) : target;
}

function collectManifestTargets(value) {
  if (typeof value === "string") {
    return [value];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = /** @type {Record<string, unknown>} */ (value);
  const targets = [];

  for (const key of ["types", "import", "require", "default", "browser"]) {
    if (typeof record[key] === "string") {
      targets.push(record[key]);
    }
  }

  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") {
      targets.push(...collectManifestTargets(nested));
    }
  }

  return targets;
}

function collectPublishedArtifactTargets(manifest) {
  const targets = [];

  for (const field of ["main", "module", "types"]) {
    if (typeof manifest[field] === "string") {
      targets.push(manifest[field]);
    }
  }

  targets.push(...collectManifestTargets(manifest.exports));
  return [...new Set(targets.map(normalizeTarballPath).filter((target) => target.length > 0))];
}

function collectWorkspaceDependencyRanges(manifest) {
  const ranges = [];

  for (const field of DEPENDENCY_FIELDS) {
    const deps = manifest[field];
    if (!deps || typeof deps !== "object") {
      continue;
    }

    for (const [name, version] of Object.entries(deps)) {
      if (typeof version === "string" && version.startsWith("workspace:")) {
        ranges.push(`${field}.${name}=${version}`);
      }
    }
  }

  return ranges;
}

function readPackedManifest(tarballPath) {
  return JSON.parse(
    execFileSync("tar", ["-xOf", tarballPath, "package/package.json"], { encoding: "utf8" })
  );
}

function packWorkspace(rootDir, packageName) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "pack-check-"));

  try {
    const stdout = execFileSync(
      "pnpm",
      ["--filter", packageName, "pack", "--pack-destination", tempDir, "--json"],
      {
        cwd: rootDir,
        encoding: "utf8",
      }
    );
    const result = normalizePackResult(stdout);
    const files = Array.isArray(result.files)
      ? result.files
          .map((entry) => (entry && typeof entry.path === "string" ? entry.path : null))
          .filter((entry) => entry !== null)
      : [];

    return {
      files,
      manifest: readPackedManifest(result.filename),
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

export function discoverPublishablePackages(rootDir = root) {
  return publishablePackages(discoverPackages(path.join(rootDir, "packages")));
}

export function validatePackedWorkspace(pkg, packed) {
  const errors = [];
  const packedFiles = new Set(packed.files);

  for (const file of REQUIRED_TARBALL_FILES) {
    if (!packedFiles.has(file)) {
      errors.push(`${pkg.name}: packed tarball missing ${file}`);
    }
  }

  for (const target of collectPublishedArtifactTargets(packed.manifest)) {
    if (!packedFiles.has(target)) {
      errors.push(`${pkg.name}: packed tarball missing manifest target ${target}`);
    }
  }

  if ([...packedFiles].every((file) => !file.startsWith("dist/"))) {
    errors.push(`${pkg.name}: packed tarball missing dist artifacts`);
  }

  for (const file of packed.files) {
    if (FORBIDDEN_TARBALL_PATTERNS.some((pattern) => pattern.test(file))) {
      errors.push(`${pkg.name}: packed tarball includes forbidden file ${file}`);
    }
  }

  for (const range of collectWorkspaceDependencyRanges(packed.manifest)) {
    errors.push(`${pkg.name}: packed manifest still contains ${range}`);
  }

  return errors;
}

export function runPackCheck(rootDir = root) {
  const packages = discoverPublishablePackages(rootDir);
  const errors = [];

  for (const pkg of packages) {
    const packed = packWorkspace(rootDir, pkg.name);
    errors.push(...validatePackedWorkspace(pkg, packed));
  }

  return {
    ok: errors.length === 0,
    errors,
    packageCount: packages.length,
  };
}

function main() {
  const result = runPackCheck(root);

  if (result.ok) {
    console.log(`Packed ${result.packageCount} workspaces successfully.`);
    process.exit(0);
  }

  console.error("pack:check failed:\n");
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (entryPath === modulePath) {
  main();
}
