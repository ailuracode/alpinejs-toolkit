import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildRootVitestProjects } from "../scripts/vitest-projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function projectSetupFiles(
  projects: ReturnType<typeof buildRootVitestProjects>,
  name: string
): string[] {
  const project = projects.find((entry) => typeof entry === "object" && entry.test?.name === name);

  if (typeof project !== "object" || !project.test?.setupFiles) {
    return [];
  }

  return project.test.setupFiles.map((filePath: string) => path.basename(filePath));
}

describe("test setup modules", () => {
  it("loads node setup without DOM reset modules", () => {
    const nodeSetup = readFileSync(path.join(root, "test/setup.node.ts"), "utf8");

    expect(nodeSetup).not.toMatch(/dom-reset/);
    expect(nodeSetup).toMatch(/singleton-cleanup/);
    expect(nodeSetup).toMatch(/fetch-stub/);
  });

  it("loads happy-dom setup without match-media or observer polyfills", () => {
    const happyDomSetup = readFileSync(path.join(root, "test/setup/happy-dom.ts"), "utf8");

    expect(happyDomSetup).toMatch(/dom-reset/);
    expect(happyDomSetup).toMatch(/singleton-cleanup/);
    expect(happyDomSetup).toMatch(/fetch-stub/);
    expect(happyDomSetup).not.toMatch(/import "\.\/match-media\.js"/);
    expect(happyDomSetup).not.toMatch(/import "\.\/observers\.js"/);
  });

  it("routes root Vitest projects to focused setup entrypoints", () => {
    const projects = buildRootVitestProjects(root);

    expect(projectSetupFiles(projects, "node")).toEqual(["setup.node.ts"]);
    expect(projectSetupFiles(projects, "happy-dom")).toEqual(["happy-dom.ts"]);
  });
});
