import { describe, expect, it } from "vitest";
import { resolveDateFnsContext } from "../src/context.js";
import {
  isMultipleSelected,
  isRangeEndpointSelected,
  isSingleSelected,
  normalizeRange,
  normalizeSelection,
  selectMultipleDate,
  selectRangeDate,
  selectSingleDate,
} from "../src/internal/selection.js";

const context = resolveDateFnsContext();

describe("calendar/internal/selection", () => {
  describe("normalizeRange", () => {
    it("normalizes from and to to start of day", () => {
      const result = normalizeRange(
        { from: new Date(2024, 0, 15, 14, 30), to: new Date(2024, 0, 20, 9, 0) },
        context
      );
      expect(result.from?.getHours()).toBe(0);
      expect(result.to?.getHours()).toBe(0);
    });

    it("handles undefined from and to", () => {
      const result = normalizeRange({ from: undefined, to: undefined }, context);
      expect(result.from).toBeUndefined();
      expect(result.to).toBeUndefined();
    });
  });

  describe("normalizeSelection", () => {
    it("returns null for null selection", () => {
      expect(normalizeSelection(null, "single", context)).toBeNull();
    });

    it("normalizes single date selection", () => {
      const date = new Date(2024, 0, 15, 14, 30);
      const result = normalizeSelection(date, "single", context);
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getHours()).toBe(0);
    });

    it("returns null for non-Date single selection", () => {
      expect(normalizeSelection(("invalid" as any as import("../src/types.js").CalendarSelection), "single", context)).toBeNull();
    });

    it("normalizes multiple date selection", () => {
      const dates = [new Date(2024, 0, 15, 14, 30), new Date(2024, 0, 20, 9, 0)];
      const result = normalizeSelection(dates, "multiple", context);
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array for non-array multiple selection", () => {
      expect(normalizeSelection(("invalid" as any as import("../src/types.js").CalendarSelection), "multiple", context)).toEqual([]);
    });

    it("normalizes range selection", () => {
      const range = { from: new Date(2024, 0, 15), to: new Date(2024, 0, 20) };
      const result = normalizeSelection(range, "range", context);
      expect(result).toHaveProperty("from");
      expect(result).toHaveProperty("to");
    });

    it("returns null for invalid range selection", () => {
      expect(normalizeSelection(null, "range", context)).toBeNull();
    });
  });

  describe("selectSingleDate", () => {
    it("returns the selected day", () => {
      const day = new Date(2024, 0, 15);
      expect(selectSingleDate(null, day)).toBe(day);
    });
  });

  describe("selectMultipleDate", () => {
    it("adds a new date", () => {
      const day = new Date(2024, 0, 15);
      const result = selectMultipleDate([], day, context);
      expect(result).toHaveLength(1);
    });

    it("removes an existing date", () => {
      const day = new Date(2024, 0, 15);
      const result = selectMultipleDate([day], day, context);
      expect(result).toHaveLength(0);
    });

    it("handles non-array current", () => {
      const day = new Date(2024, 0, 15);
      const result = selectMultipleDate(null, day, context);
      expect(result).toHaveLength(1);
    });
  });

  describe("selectRangeDate", () => {
    it("sets from when no current range", () => {
      const day = new Date(2024, 0, 15);
      const result = selectRangeDate(null, day, context);
      expect(result).toEqual({ from: day, to: undefined });
    });

    it("sets to when from exists and to is undefined", () => {
      const from = new Date(2024, 0, 15);
      const to = new Date(2024, 0, 20);
      const result = selectRangeDate({ from, to: undefined }, to, context);
      expect(result).toEqual({ from, to });
    });

    it("resets to new from when both from and to exist", () => {
      const day = new Date(2024, 0, 25);
      const result = selectRangeDate(
        { from: new Date(2024, 0, 15), to: new Date(2024, 0, 20) },
        day,
        context
      );
      expect(result).toEqual({ from: day, to: undefined });
    });

    it("swaps when day is before from", () => {
      const day = new Date(2024, 0, 10);
      const from = new Date(2024, 0, 15);
      const result = selectRangeDate({ from, to: undefined }, day, context);
      expect(result).toEqual({ from: day, to: from });
    });

    it("returns current when day equals from", () => {
      const day = new Date(2024, 0, 15);
      const result = selectRangeDate({ from: day, to: undefined }, day, context);
      expect(result).toEqual({ from: day, to: undefined });
    });
  });

  describe("isSingleSelected", () => {
    it("returns true when day matches", () => {
      const day = new Date(2024, 0, 15);
      expect(isSingleSelected(day, day, context)).toBe(true);
    });

    it("returns false when day doesn't match", () => {
      const day1 = new Date(2024, 0, 15);
      const day2 = new Date(2024, 0, 20);
      expect(isSingleSelected(day1, day2, context)).toBe(false);
    });

    it("returns false for non-Date selection", () => {
      const day = new Date(2024, 0, 15);
      expect(isSingleSelected(null, day, context)).toBe(false);
    });
  });

  describe("isMultipleSelected", () => {
    it("returns true when day is in array", () => {
      const day = new Date(2024, 0, 15);
      expect(isMultipleSelected([day], day, context)).toBe(true);
    });

    it("returns false when day is not in array", () => {
      const day1 = new Date(2024, 0, 15);
      const day2 = new Date(2024, 0, 20);
      expect(isMultipleSelected([day1], day2, context)).toBe(false);
    });

    it("returns false for non-array selection", () => {
      const day = new Date(2024, 0, 15);
      expect(isMultipleSelected(null, day, context)).toBe(false);
    });
  });

  describe("isRangeEndpointSelected", () => {
    it("returns true when day matches from", () => {
      const day = new Date(2024, 0, 15);
      expect(isRangeEndpointSelected({ from: day }, day, context)).toBe(true);
    });

    it("returns true when day matches to", () => {
      const day = new Date(2024, 0, 20);
      expect(isRangeEndpointSelected({ from: new Date(2024, 0, 15), to: day }, day, context)).toBe(
        true
      );
    });

    it("returns false when day doesn't match", () => {
      const day = new Date(2024, 0, 25);
      expect(isRangeEndpointSelected({ from: new Date(2024, 0, 15) }, day, context)).toBe(false);
    });

    it("returns false for null selection", () => {
      const day = new Date(2024, 0, 15);
      expect(isRangeEndpointSelected(null, day, context)).toBe(false);
    });
  });
});
