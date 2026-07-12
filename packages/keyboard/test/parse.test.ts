import { afterEach, describe, expect, it } from "vitest";
import { KeyboardError } from "../src/errors.js";
import { chordMatchesEvent, isMacPlatform, resetMacPlatformCache } from "../src/match.js";
import { formatShortcut, parseShortcut } from "../src/parse.js";

describe("@ailuracode/alpine-keyboard parse", () => {
  it("parses modifier chords", () => {
    const chords = parseShortcut("mod+k");
    expect(chords).toHaveLength(1);
    expect(chords[0]?.modifiers.mod).toBe(true);
    expect(chords[0]?.key).toBe("k");
  });

  it("parses multi-key sequences", () => {
    const chords = parseShortcut("g h");
    expect(chords).toHaveLength(2);
    expect(chords[0]?.key).toBe("g");
    expect(chords[1]?.key).toBe("h");
  });

  it("rejects empty shortcuts", () => {
    expect(() => parseShortcut("   ")).toThrow(KeyboardError);
  });

  it("formats shortcuts canonically", () => {
    expect(formatShortcut(parseShortcut("ctrl+shift+s"))).toBe("ctrl+shift+s");
  });
});

describe("@ailuracode/alpine-keyboard match", () => {
  afterEach(() => {
    resetMacPlatformCache();
  });

  it("matches mod on non-mac as ctrl", () => {
    const chord = parseShortcut("mod+k")[0];
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    expect(chordMatchesEvent(chord, event, false)).toBe(true);
  });

  it("matches mod on mac as meta", () => {
    const chord = parseShortcut("mod+k")[0];
    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
    expect(chordMatchesEvent(chord, event, true)).toBe(true);
  });

  it("detects mac platforms", () => {
    expect(isMacPlatform({ platform: "MacIntel", userAgent: "" })).toBe(true);
    expect(isMacPlatform({ platform: "Win32", userAgent: "" })).toBe(false);
  });
});
