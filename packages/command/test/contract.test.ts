import { describe, expect, it } from "vitest";
import commandPlugin, {
  CommandController,
  CommandError,
  createCommandController,
  createCommandStore,
  ROOT_PAGE_ID,
} from "../src/index.js";

describe("@ailuracode/alpine-command contract", () => {
  it("imports the published entrypoint without a DOM", async () => {
    await expect(import("../src/index.js")).resolves.toBeDefined();
  });

  it("exports the evolved public surface", () => {
    expect(typeof createCommandController).toBe("function");
    expect(typeof createCommandStore).toBe("function");
    expect(typeof commandPlugin).toBe("function");
    expect(CommandController).toBeDefined();
    expect(CommandError).toBeDefined();
    expect(ROOT_PAGE_ID).toBe("root");
  });
});
