import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildTestEnvironmentInventory } from "../scripts/test-environment-classify.mjs";
import {
  buildRootVitestProjects,
  packageProjectIncludesRelative,
  VITEST_PROJECT_PACKAGES,
} from "../scripts/vitest-projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("vitest projects", () => {
  it("registers package overlay projects in the root workspace", () => {
    const projects = buildRootVitestProjects(root);
    for (const pkg of VITEST_PROJECT_PACKAGES) {
      expect(projects).toContain(`packages/${pkg}`);
    }
  });

  it("uses package-relative include paths for overlay configs", () => {
    const relative = packageProjectIncludesRelative("theme", "happy-dom", root);
    expect(relative.every((filePath) => !filePath.startsWith("packages/"))).toBe(true);
    expect(relative).toContain("test/plugin.spec.ts");
  });

  it("collects every inventory file in the Vitest workspace", () => {
    const inventory = buildTestEnvironmentInventory(root);
    const listResult = spawnSync("pnpm", ["exec", "vitest", "list", "--filesOnly"], {
      cwd: root,
      encoding: "utf8",
    });

    const listed = new Set(
      (listResult.stdout ?? "")
        .split("\n")
        .map((line) => line.replace(/^\[[^\]]+\]\s*/, "").trim())
        .filter(Boolean)
    );

    const expected = inventory.files
      .filter((file) => file.layer !== "e2e")
      .map((file) => file.path);

    expect(listed.size).toBe(expected.length);
    expect([...listed].sort()).toEqual([...expected].sort());
  });
});
