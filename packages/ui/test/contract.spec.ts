import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("package contract", () => {
  it("packs and imports without @ailuracode/alpine-core in the manifest", () => {
    execFileSync("pnpm", ["build"], {
      cwd: packageRoot,
      encoding: "utf8",
      stdio: "pipe",
    });

    const packDir = makeTempDir("alpine-ui-pack-");
    const packOutput = execFileSync("pnpm", ["pack", "--pack-destination", packDir, "--json"], {
      cwd: packageRoot,
      encoding: "utf8",
      stdio: "pipe",
    });
    const packResult = JSON.parse(packOutput);
    const tarballName = Array.isArray(packResult) ? packResult[0]?.filename : packResult.filename;
    const tarballPath = path.isAbsolute(tarballName)
      ? tarballName
      : path.join(packDir, tarballName);

    const manifest = JSON.parse(
      execFileSync("tar", ["-xOf", tarballPath, "package/package.json"], {
        encoding: "utf8",
        stdio: "pipe",
      })
    );

    expect(manifest.peerDependencies?.["@ailuracode/alpine-core"]).toBeUndefined();
    expect(manifest.dependencies?.["@ailuracode/alpine-core"]).toBeUndefined();
    expect(manifest.devDependencies?.["@ailuracode/alpine-core"]).toBeUndefined();

    const extractDir = makeTempDir("alpine-ui-extract-");
    execFileSync("tar", ["-xzf", tarballPath, "-C", extractDir], {
      encoding: "utf8",
      stdio: "pipe",
    });

    const moduleUrl = pathToFileURL(path.join(extractDir, "package", "dist", "index.js")).href;
    const output = execFileSync(
      "node",
      [
        "--input-type=module",
        "-e",
        `const mod = await import(${JSON.stringify(moduleUrl)});\nconsole.log(JSON.stringify(Object.keys(mod).sort()));`,
      ],
      {
        encoding: "utf8",
        stdio: "pipe",
      }
    );
    const keys = JSON.parse(output.trim()) as string[];

    expect(keys).toContain("createLocalStorageAdapter");
    expect(keys).toContain("createMemoryAdapter");
    expect(keys).toContain("createMediaQueryListener");
    expect(keys).toContain("createPortalRoot");
  }, 120_000);
});
