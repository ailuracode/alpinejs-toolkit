import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildTestEnvironmentInventory,
  classifyTestFile,
  inferLayerFromFilename,
  validateTestEnvironmentInventory,
} from "../scripts/test-environment-classify.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = path.join(root, "benchmarks", "test-environment-inventory.json");

describe("test environment inventory", () => {
  it("matches the committed inventory artifact", () => {
    const errors = validateTestEnvironmentInventory(root, inventoryPath);
    expect(errors).toEqual([]);
  });

  it("classifies Playwright specs separately from Vitest", () => {
    const inventory = buildTestEnvironmentInventory(root);
    const e2e = inventory.files.filter((file) => file.path.includes("/e2e/"));

    expect(e2e.length).toBe(inventory.e2eFileCount);
    expect(e2e.every((file) => file.targetEnvironment === "playwright")).toBe(true);
  });

  it("infers controller layer from canonical filenames", () => {
    expect(inferLayerFromFilename("packages/foo/test/controller.test.ts")).toBe("controller");
    expect(
      inferLayerFromFilename("packages/realtime/test/controller/RealtimeController.test.ts")
    ).toBe("controller");
  });

  it("targets SSR contract tests to node", () => {
    const classified = classifyTestFile({
      filePath: path.join(root, "packages/selection/test/ssr.test.ts"),
      content: `import { describe, it } from "vitest";\ndescribe("ssr", () => { it("imports", async () => {}); });`,
      root,
      packagesDir: path.join(root, "packages"),
    });

    expect(classified.layer).toBe("contract");
    expect(classified.targetEnvironment).toBe("node");
  });
});
