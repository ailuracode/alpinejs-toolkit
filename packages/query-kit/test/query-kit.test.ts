import { describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import queryKitPlugin, { queryKey } from "../src/index.js";

describe("@ailuracode/alpine-query-kit", () => {
  it("registers query store by default", () => {
    const Alpine = startAlpine(queryKitPlugin({ devtools: false }));

    expect(Alpine.store("query")).toBeDefined();
  });

  it("re-exports query helpers", () => {
    expect(queryKey(["users"])).toEqual(["users"]);
  });
});
