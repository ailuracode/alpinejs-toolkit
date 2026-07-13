import { describe, expect, it } from "vitest";
import { createJsonTree } from "../src/devtools/json-tree.js";

describe("json-tree", () => {
  it("renders a null value as a leaf", () => {
    const root = createJsonTree(null);
    const leaf = root.querySelector(".aq-devtools-tree-row--leaf");
    expect(leaf).toBeTruthy();
    expect(leaf?.textContent).toContain("null");
  });

  it("renders a string value as a leaf with JSON quotes", () => {
    const root = createJsonTree("hello");
    const leaf = root.querySelector(".aq-devtools-tree-row--leaf");
    expect(leaf?.textContent).toContain('"hello"');
  });

  it("renders a number value as a leaf", () => {
    const root = createJsonTree(42);
    const leaf = root.querySelector(".aq-devtools-tree-row--leaf");
    expect(leaf?.textContent).toContain("42");
  });

  it("renders a boolean value as a leaf", () => {
    const root = createJsonTree(true);
    const leaf = root.querySelector(".aq-devtools-tree-row--leaf");
    expect(leaf?.textContent).toContain("true");
  });

  it("renders an empty array as a branch with []", () => {
    const root = createJsonTree([]);
    const branch = root.querySelector(".aq-devtools-tree-row--leaf");
    expect(branch?.textContent).toContain("[]");
  });

  it("renders a non-empty array as a branch", () => {
    const root = createJsonTree([1, 2, 3]);
    const branch = root.querySelector(".aq-devtools-tree-branch");
    expect(branch).toBeTruthy();
  });

  it("renders an empty object as a branch with []", () => {
    const root = createJsonTree({});
    const branch = root.querySelector(".aq-devtools-tree-row--leaf");
    expect(branch?.textContent).toContain("[]");
  });

  it("renders a non-empty object as a branch", () => {
    const root = createJsonTree({ a: 1, b: 2 });
    const branch = root.querySelector(".aq-devtools-tree-branch");
    expect(branch).toBeTruthy();
  });

  it("uses custom root label", () => {
    const root = createJsonTree({ a: 1 }, "payload");
    expect(root.textContent).toContain("payload");
  });
});
