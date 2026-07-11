import { describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import queryKitWithDevtoolsPlugin from "../src/devtools/kit-with-devtools.js";

describe("@ailuracode/alpine-query-kit/devtools", () => {
  it("queryKitWithDevtoolsPlugin registers query store and devtools toggle", () => {
    const Alpine = startAlpine(queryKitWithDevtoolsPlugin({ devtools: { initialOpen: false } }));

    expect(Alpine.store("query")).toBeDefined();
    expect(document.querySelector(".aq-devtools-toggle")).not.toBeNull();
  });
});
