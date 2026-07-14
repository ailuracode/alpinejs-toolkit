import { describe, expect, it } from "vitest";
import { calculateBackoff, DEFAULT_BACKOFF_CONFIG } from "../src/utils/backoff";

describe("calculateBackoff", () => {
  const config = {
    baseDelayMs: 1_000,
    maxDelayMs: 30_000,
    jitterFactor: 0.5,
  };

  describe("deterministic behaviour (jitter = 0)", () => {
    it("returns the base delay for attempt 0", () => {
      expect(calculateBackoff(0, { ...config, jitterFactor: 0 }, () => 0.5)).toBe(1_000);
    });

    it("doubles the delay on each successive attempt", () => {
      expect(calculateBackoff(1, { ...config, jitterFactor: 0 }, () => 0.5)).toBe(2_000);
      expect(calculateBackoff(2, { ...config, jitterFactor: 0 }, () => 0.5)).toBe(4_000);
      expect(calculateBackoff(3, { ...config, jitterFactor: 0 }, () => 0.5)).toBe(8_000);
    });

    it("caps the raw delay at maxDelayMs", () => {
      // 1_000 * 2^5 = 32_000, capped to 30_000.
      const result = calculateBackoff(5, { ...config, jitterFactor: 0 }, () => 0.5);
      expect(result).toBe(30_000);
      const capped = calculateBackoff(10, { ...config, jitterFactor: 0 }, () => 0.5);
      expect(capped).toBe(30_000);
    });
  });

  describe("jitter behaviour", () => {
    it("returns the lower bound when random() = 0 and jitter = 0.5", () => {
      const result = calculateBackoff(0, config, () => 0);
      // 1000 * (1 - 0.5) = 500.
      expect(result).toBe(500);
    });

    it("returns the upper bound when random() = 1 and jitter = 0.5", () => {
      const result = calculateBackoff(0, config, () => 1);
      // 1000 * (0.5 + 2 * 0.5 * 1) = 1500.
      expect(result).toBe(1_500);
    });

    it("clamps jitter outside the [0, 1] range", () => {
      const negative = calculateBackoff(0, { ...config, jitterFactor: -0.5 }, () => 0.5);
      expect(negative).toBe(1_000);

      const tooLarge = calculateBackoff(0, { ...config, jitterFactor: 5 }, () => 0.5);
      // jitterFactor clamped to 1 (full jitter); at random=0.5 the
      // equal-jitter formula collapses to the raw cap.
      expect(tooLarge).toBe(1_000);
    });
  });

  describe("input validation", () => {
    it("clamps negative attempts to 0", () => {
      expect(calculateBackoff(-10, { ...config, jitterFactor: 0 }, () => 0.5)).toBe(1_000);
    });

    it("floors fractional attempts", () => {
      expect(calculateBackoff(1.9, { ...config, jitterFactor: 0 }, () => 0.5)).toBe(2_000);
    });

    it("treats NaN / Infinity attempts as 0", () => {
      const nan = calculateBackoff(Number.NaN, { ...config, jitterFactor: 0 }, () => 0.5);
      expect(nan).toBe(1_000);
      const inf = calculateBackoff(
        Number.POSITIVE_INFINITY,
        { ...config, jitterFactor: 0 },
        () => 0.5
      );
      expect(inf).toBe(1_000);
    });

    it("clamps non-positive baseDelayMs to 1", () => {
      const zero = calculateBackoff(0, { ...config, baseDelayMs: 0, jitterFactor: 0 }, () => 0.5);
      expect(zero).toBe(1);
      const negative = calculateBackoff(
        0,
        { ...config, baseDelayMs: -100, jitterFactor: 0 },
        () => 0.5
      );
      expect(negative).toBe(1);
    });

    it("lifts maxDelayMs to baseDelayMs when too small", () => {
      const result = calculateBackoff(
        5,
        { ...config, maxDelayMs: 500, jitterFactor: 0 },
        () => 0.5
      );
      // baseDelayMs * 2^5 = 32_000, but cap lifted to 1_000.
      expect(result).toBe(1_000);
    });
  });

  describe("random source resilience", () => {
    it("falls back to Math.random when the source throws", () => {
      const result = calculateBackoff(0, config, () => {
        throw new Error("boom");
      });
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(500);
      expect(result).toBeLessThanOrEqual(1_500);
    });

    it("falls back when the source returns a non-number", () => {
      const result = calculateBackoff(
        0,
        config,
        // biome-ignore lint/suspicious/noExplicitAny: testing fallback shape
        () => "nope" as any
      );
      expect(typeof result).toBe("number");
    });

    it("falls back when the source returns NaN", () => {
      const result = calculateBackoff(0, config, () => Number.NaN);
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  describe("default export", () => {
    it("DEFAULT_BACKOFF_CONFIG matches the documented defaults", () => {
      expect(DEFAULT_BACKOFF_CONFIG).toEqual({
        baseDelayMs: 1_000,
        maxDelayMs: 30_000,
        jitterFactor: 0.5,
      });
    });
  });

  describe("extreme attempts", () => {
    it("does not overflow for huge attempt counts", () => {
      const result = calculateBackoff(4096, { ...config, jitterFactor: 0 }, () => 0.5);
      // Cap applied: maxDelayMs (30_000).
      expect(result).toBe(30_000);
    });
  });
});
