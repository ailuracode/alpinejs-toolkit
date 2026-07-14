import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildTestEnvironmentInventory,
  classifyTestFile,
} from "../scripts/test-environment-classify.mjs";
import {
  buildRootVitestProjects,
  packageProjectIncludes,
  packageProjectIncludesRelative,
  resolveVitestRuntimeEnvironment,
  VITEST_PROJECT_PACKAGES,
  vitestIncludesForEnvironment,
} from "../scripts/vitest-projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function happyDomProjectIncludes(
  projects: ReturnType<typeof buildRootVitestProjects>
): readonly string[] {
  const happyDomProject = projects.find(
    (project) => typeof project === "object" && project.test?.name === "happy-dom"
  );

  if (typeof happyDomProject !== "object" || !happyDomProject.test?.include) {
    return [];
  }

  return happyDomProject.test.include;
}

describe("vitest projects", () => {
  it("routes every Vitest file exactly once across root and overlay projects", () => {
    const nodeIncludes = vitestIncludesForEnvironment(root, "node");
    const happyDomIncludes = vitestIncludesForEnvironment(root, "happy-dom");
    const rootProjects = buildRootVitestProjects(root);

    const overlayIncludes = VITEST_PROJECT_PACKAGES.flatMap((pkg) =>
      packageProjectIncludes(pkg, "happy-dom", root)
    );

    const assigned = new Set([
      ...nodeIncludes,
      ...happyDomProjectIncludes(rootProjects),
      ...overlayIncludes,
    ]);

    const expected = new Set([...nodeIncludes, ...happyDomIncludes]);

    expect(assigned).toEqual(expected);
    expect(assigned.size).toBe(buildTestEnvironmentInventory(root).vitestFileCount);
  });

  it("keeps DOM-only specs on simulated DOM when classification requires it", () => {
    const packagesDir = path.join(root, "packages");
    const attentionPath = path.join(root, "packages/attention/test/attention.test.ts");
    const attentionContent = readFileSync(attentionPath, "utf8");
    const attentionFile = classifyTestFile({
      filePath: attentionPath,
      content: attentionContent,
      root,
      packagesDir,
    });

    expect(attentionFile.targetEnvironment).toBe("node");
    expect(resolveVitestRuntimeEnvironment(attentionFile, attentionContent, packagesDir)).toBe(
      "happy-dom"
    );
  });

  it("aligns runtime routing with classification for node-eligible specs", () => {
    const packagesDir = path.join(root, "packages");
    const adapterPath = path.join(root, "packages/attention/test/permission-adapter.test.ts");
    const adapterContent = readFileSync(adapterPath, "utf8");
    const adapterFile = classifyTestFile({
      filePath: adapterPath,
      content: adapterContent,
      root,
      packagesDir,
    });

    expect(adapterFile.targetEnvironment).toBe("node");
    expect(resolveVitestRuntimeEnvironment(adapterFile, adapterContent, packagesDir)).toBe("node");
  });

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
