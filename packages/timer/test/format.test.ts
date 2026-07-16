/**
 * Pattern-based formatting tests.
 */

import { describe, expect, it } from "vitest";
import { TimerControllerImpl } from "../src/create-timer.js";
import { format, formatPattern } from "../src/format-pattern.js";

describe("@ailuracode/alpine-timer format patterns", () => {
  it("formats mm:ss with zero-padded minutes and seconds", () => {
    expect(formatPattern("mm:ss", 10_000)).toBe("00:10");
    expect(format("mm:ss", 65_432)).toBe("01:05");
  });

  it("formats hh:mm with hours and minutes", () => {
    expect(formatPattern("hh:mm", 3_661_000)).toBe("01:01");
    expect(format("hh:mm", 7_200_000)).toBe("02:00");
  });

  it("formats hh:mm:ss for longer durations", () => {
    expect(formatPattern("hh:mm:ss", 3_661_000)).toBe("01:01:01");
  });

  it("formats sub-second patterns for stopwatch-style output", () => {
    expect(formatPattern("mm:ss.SSS", 1_234)).toBe("00:01.234");
    expect(formatPattern("mm:ss.mmm", 65_432)).toBe("01:05.432");
  });

  it("supports compact tokens without zero padding", () => {
    expect(formatPattern("h:m:s", 3_661_000)).toBe("1:1:1");
  });

  it("creates timer formatters from patterns", () => {
    const formatter = format("mm:ss", { field: "remaining" });
    const output = formatter({
      hours: 0,
      minutes: 0,
      seconds: 10,
      milliseconds: 0,
      elapsed: 0,
      remaining: 10_000,
    });

    expect(output).toBe("00:10");
  });

  it("applies formatPattern through timer options", () => {
    const timer = new TimerControllerImpl({
      direction: "down",
      duration: 90_000,
      formatPattern: "mm:ss",
    });
    timer.mount();

    expect(timer.formatted).toBe("01:30");
    timer.dispose();
  });

  it("formats current timer state through controller.format()", () => {
    const timer = new TimerControllerImpl({
      direction: "down",
      duration: 3_661_000,
    });
    timer.mount();

    expect(timer.format("hh:mm")).toBe("01:01");
    expect(timer.format("hh:mm:ss")).toBe("01:01:01");
    timer.dispose();
  });

  it("rejects conflicting format and formatPattern options", () => {
    expect(
      () =>
        new TimerControllerImpl({
          direction: "down",
          duration: 1_000,
          format: () => "x",
          formatPattern: "mm:ss",
        })
    ).toThrow("Provide either format or formatPattern, not both.");
  });
});
