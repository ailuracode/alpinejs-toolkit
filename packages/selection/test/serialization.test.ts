import { describe, expect, it } from "vitest";
import { deserializeSelection, serializeSelection } from "../src/serialization.js";

describe("@ailuracode/alpine-selection serialization", () => {
  it("serializes single, multiple, and range values", () => {
    expect(serializeSelection("alpha", "single")).toBe("alpha");
    expect(serializeSelection(["a", "b"], "multiple")).toBe("a,b");
    expect(serializeSelection({ from: "a", to: "c" }, "range")).toBe("a..c");
  });

  it("deserializes stored values", () => {
    expect(deserializeSelection("alpha", "single")).toBe("alpha");
    expect(deserializeSelection("a,b", "multiple")).toEqual(["a", "b"]);
    expect(deserializeSelection("a..c", "range")).toEqual({ from: "a", to: "c" });
  });
});
