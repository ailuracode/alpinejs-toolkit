import { describe, expect, it } from "vitest";
import {
  createInitialSnapshot,
  deriveCanRequest,
  normalizePermissionState,
} from "../src/snapshot.js";

describe("permissions/snapshot", () => {
  describe("createInitialSnapshot", () => {
    it("creates snapshot with available availability", () => {
      const snap = createInitialSnapshot("available");
      expect(snap.availability).toBe("available");
      expect(snap.canRequest).toBe(true);
      expect(snap.requiresUserGesture).toBe(true);
      expect(snap.permission).toBe("unknown");
    });

    it("creates snapshot with unsupported availability", () => {
      const snap = createInitialSnapshot("unsupported");
      expect(snap.canRequest).toBe(false);
    });

    it("uses provided requiresUserGesture", () => {
      const snap = createInitialSnapshot("available", { requiresUserGesture: false });
      expect(snap.requiresUserGesture).toBe(false);
    });

    it("uses provided permission", () => {
      const snap = createInitialSnapshot("available", { permission: "granted" });
      expect(snap.permission).toBe("granted");
    });
  });

  describe("deriveCanRequest", () => {
    it("returns false for non-available availability", () => {
      expect(
        deriveCanRequest({
          permission: "prompt",
          availability: "unsupported",
          requestState: "idle",
        })
      ).toBe(false);
    });

    it("returns false when requesting", () => {
      expect(
        deriveCanRequest({
          permission: "prompt",
          availability: "available",
          requestState: "requesting",
        })
      ).toBe(false);
    });

    it("returns true for prompt permission", () => {
      expect(
        deriveCanRequest({ permission: "prompt", availability: "available", requestState: "idle" })
      ).toBe(true);
    });

    it("returns true for unknown permission", () => {
      expect(
        deriveCanRequest({ permission: "unknown", availability: "available", requestState: "idle" })
      ).toBe(true);
    });

    it("returns false for granted permission", () => {
      expect(
        deriveCanRequest({ permission: "granted", availability: "available", requestState: "idle" })
      ).toBe(false);
    });

    it("returns false for denied permission", () => {
      expect(
        deriveCanRequest({ permission: "denied", availability: "available", requestState: "idle" })
      ).toBe(false);
    });
  });

  describe("normalizePermissionState", () => {
    it("normalizes granted", () => {
      expect(normalizePermissionState("granted")).toBe("granted");
    });

    it("normalizes prompt", () => {
      expect(normalizePermissionState("prompt")).toBe("prompt");
    });

    it("normalizes denied", () => {
      expect(normalizePermissionState("denied")).toBe("denied");
    });

    it("returns unknown for null", () => {
      expect(normalizePermissionState(null)).toBe("unknown");
    });

    it("returns unknown for undefined", () => {
      expect(normalizePermissionState(undefined)).toBe("unknown");
    });

    it("returns unknown for invalid string", () => {
      expect(
        normalizePermissionState(
          "invalid" as unknown as Parameters<typeof normalizePermissionState>[0]
        )
      ).toBe("unknown");
    });
  });
});
