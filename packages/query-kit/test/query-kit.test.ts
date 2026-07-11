import { queryKey } from "@ailuracode/alpine-query";
import { describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import queryKitPlugin from "../src/plugin.js";

describe("@ailuracode/alpine-query-kit", () => {
  it("registers query store by default", () => {
    const Alpine = startAlpine(queryKitPlugin());

    expect(Alpine.store("query")).toBeDefined();
  });

  it("re-exports query helpers", () => {
    expect(queryKey(["users"])).toEqual(["users"]);
  });
});
