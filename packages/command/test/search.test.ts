import { describe, expect, it, vi } from "vitest";
import { defaultSubstringRank, fuzzyRank } from "../src/search.js";
import type { CommandItem } from "../src/types.js";

const item: CommandItem = {
  id: "theme",
  label: "Toggle theme",
  aliases: ["spotlight"],
  keywords: ["dark"],
  action: vi.fn(),
};

describe("command search", () => {
  it("ranks empty search as a match", () => {
    expect(defaultSubstringRank(item, "")).toBe(0);
  });

  it("prefers label prefix matches", () => {
    expect(defaultSubstringRank(item, "toggle")).toBe(100);
    expect(defaultSubstringRank(item, "theme")).toBe(80);
  });

  it("matches aliases and keywords with lower scores", () => {
    expect(defaultSubstringRank(item, "spot")).toBe(70);
    expect(defaultSubstringRank(item, "dark")).toBe(50);
  });

  it("supports fuzzy consecutive character matching", () => {
    expect(fuzzyRank(item, "tth")).not.toBeNull();
    expect(fuzzyRank(item, "zzz")).toBeNull();
  });
});
