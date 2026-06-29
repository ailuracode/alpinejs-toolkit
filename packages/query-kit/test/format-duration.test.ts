import { describe, expect, it } from "vitest";
import { formatDuration } from "../src/devtools/format-duration.js";

describe("format-duration", () => {
  it("formats sub-second durations in milliseconds", () => {
    expect(formatDuration(245)).toBe("245ms");
  });

  it("formats longer durations in seconds", () => {
    expect(formatDuration(1520)).toBe("1.52s");
  });

  it("returns a dash when duration is unavailable", () => {
    expect(formatDuration(null)).toBe("—");
  });
});
