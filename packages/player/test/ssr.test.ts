import { describe, expect, it } from "vitest";

describe("@ailuracode/alpine-player SSR", () => {
  it("imports without accessing browser globals", async () => {
    const mod = await import("../src/index.js");
    expect(mod.playerPlugin).toBeTypeOf("function");
    expect(mod.createPlayerController).toBeTypeOf("function");
    expect(mod.PlayerController).toBeTypeOf("function");
  });
});
