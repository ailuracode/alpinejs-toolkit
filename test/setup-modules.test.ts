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
  it("routes root Vitest projects to focused setup entrypoints", () => {
    const projects = buildRootVitestProjects(root);

    expect(projectSetupFiles(projects, "node")).toEqual(["setup.node.ts"]);
    expect(projectSetupFiles(projects, "happy-dom")).toEqual(["happy-dom.ts"]);
  });
});
