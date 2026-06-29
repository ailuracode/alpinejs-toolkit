import { describe, expect, expectTypeOf, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import {
  createVisibilityState,
  readVisibilityState,
  registerVisibilityMagic,
  VISIBILITY_STATES,
  type VisibilityMagic,
  type VisibilitySnapshot,
  type VisibilityState,
} from "../src/visibility.js";

function setDocumentVisibility(hidden: boolean, visibilityState: VisibilityState): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  });
}

describe("@ailuracode/alpine-env visibility", () => {
  it("exports literal visibility states", () => {
    expectTypeOf(VISIBILITY_STATES).toEqualTypeOf<readonly ["visible", "hidden", "prerender"]>();
  });

  it("types readVisibilityState() return shape", () => {
    const snapshot = readVisibilityState({
      hidden: true,
      visibilityState: "hidden",
    });

    expectTypeOf(snapshot).toEqualTypeOf<VisibilitySnapshot>();
    expectTypeOf(snapshot.isVisible).toEqualTypeOf<boolean>();
    expectTypeOf(snapshot.isHidden).toEqualTypeOf<boolean>();
    expectTypeOf(snapshot.state).toEqualTypeOf<VisibilityState>();
  });

  it("registers $visibility with initial visible state", () => {
    setDocumentVisibility(false, "visible");

    const { visibility } = createMagicHarness(registerVisibilityMagic) as {
      visibility: VisibilityMagic;
    };

    expect(visibility.isVisible).toBe(true);
    expect(visibility.isHidden).toBe(false);
    expect(visibility.state).toBe("visible");
    expect(visibility.is("visible")).toBe(true);
    expect(visibility.is("hidden")).toBe(false);
  });

  it("updates state on visibilitychange when tab is hidden", () => {
    setDocumentVisibility(false, "visible");

    const { visibility } = createMagicHarness(registerVisibilityMagic) as {
      visibility: VisibilityMagic;
    };

    setDocumentVisibility(true, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(visibility.isVisible).toBe(false);
    expect(visibility.isHidden).toBe(true);
    expect(visibility.state).toBe("hidden");
    expect(visibility.is("hidden")).toBe(true);
  });

  it("maps document.hidden and visibilityState in readVisibilityState", () => {
    expect(
      readVisibilityState({
        hidden: true,
        visibilityState: "hidden",
      })
    ).toEqual({
      isVisible: false,
      isHidden: true,
      state: "hidden",
    });

    expect(
      readVisibilityState({
        hidden: false,
        visibilityState: "prerender",
      })
    ).toEqual({
      isVisible: true,
      isHidden: false,
      state: "prerender",
    });
  });

  it("types createVisibilityState()", () => {
    const state = createVisibilityState({
      isVisible: true,
      isHidden: false,
      state: "visible",
    });

    expectTypeOf(state.isVisible).toEqualTypeOf<boolean>();
    expectTypeOf(state.isHidden).toEqualTypeOf<boolean>();
    expectTypeOf(state.state).toEqualTypeOf<VisibilityState>();
    expectTypeOf(state.is).parameters.toEqualTypeOf<[state: VisibilityState]>();
    expectTypeOf(state).toExtend<VisibilityMagic>();
  });
});
