import { describe, expect, it } from "vitest";
import {
  clamp,
  clampSeek,
  clampVolume,
  sanitizeDuration,
  sanitizeTime,
} from "../src/controller/utils.js";

describe("@ailuracode/alpine-player utils", () => {
  it("sanitizes invalid duration values", () => {
    expect(sanitizeDuration(Number.NaN)).toBe(0);
    expect(sanitizeDuration(Number.POSITIVE_INFINITY)).toBe(0);
    expect(sanitizeDuration(-5)).toBe(0);
    expect(sanitizeDuration(120)).toBe(120);
  });

  it("sanitizes invalid time values", () => {
    expect(sanitizeTime(Number.NaN)).toBe(0);
    expect(sanitizeTime(-2)).toBe(0);
    expect(sanitizeTime(12.5)).toBe(12.5);
  });

  it("clamps seek targets when duration is known", () => {
    expect(clampSeek(-10, 100)).toBe(0);
    expect(clampSeek(150, 100)).toBe(100);
    expect(clampSeek(25, 100)).toBe(25);
    expect(clampSeek(25, 0)).toBe(25);
  });

  it("clamps volume between 0 and 1", () => {
    expect(clampVolume(-0.5)).toBe(0);
    expect(clampVolume(1.5)).toBe(1);
    expect(clampVolume(0.4)).toBe(0.4);
  });

  it("clamps generic values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
