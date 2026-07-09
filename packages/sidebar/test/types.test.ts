/**
 * Type-level tests for `@ailuracode/alpine-sidebar` v2.0.
 *
 * Per `.agents/instructions/testing.instructions.md`, type tests
 * catch regressions in the public contract without booting the
 * runtime. We use Vitest's `expectTypeOf` for shape assertions
 * and `@ts-expect-error` for the negative case that proves the
 * string-shortcut `breakpoint` shape is rejected at compile time.
 *
 * 6 tests map to the spec matrix rows #33–#38.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core";
import { describe, expectTypeOf, it } from "vitest";
import type {
  CreateSidebarOptions,
  SidebarBreakpointOption,
  SidebarChangeDetail,
  SidebarChangeSource,
  SidebarOnMismatch,
} from "../src/index";
import { createSidebar, type SidebarController } from "../src/index";

describe("@ailuracode/alpine-sidebar type contract", () => {
  it("SidebarController has visible / isVisible / hasOverlay / matchesBreakpoint (boolean)", () => {
    const controller: SidebarController = createSidebar();
    expectTypeOf(controller.visible).toEqualTypeOf<boolean>();
    expectTypeOf(controller.isVisible).toEqualTypeOf<boolean>();
    expectTypeOf(controller.hasOverlay).toEqualTypeOf<boolean>();
    expectTypeOf(controller.matchesBreakpoint).toEqualTypeOf<boolean>();
    controller.destroy();
  });

  it("show / hide / toggle / reset take no parameters and return void", () => {
    expectTypeOf<SidebarController["show"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<SidebarController["hide"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<SidebarController["toggle"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<SidebarController["reset"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<SidebarController["show"]>().returns.toEqualTypeOf<void>();
    expectTypeOf<SidebarController["hide"]>().returns.toEqualTypeOf<void>();
    expectTypeOf<SidebarController["toggle"]>().returns.toEqualTypeOf<void>();
    expectTypeOf<SidebarController["reset"]>().returns.toEqualTypeOf<void>();
  });

  it("controller.on('change', detail => ...) is typed as (detail: SidebarChangeDetail) => void", () => {
    const controller: SidebarController = createSidebar();
    controller.on("change", (detail) => {
      expectTypeOf(detail).toEqualTypeOf<SidebarChangeDetail>();
    });
    expectTypeOf<ReturnType<SidebarController["on"]>>().toEqualTypeOf<Unsubscribe>();
    controller.destroy();
  });

  it("SidebarChangeDetail.event is KeyboardEvent | MediaQueryListEvent | undefined", () => {
    expectTypeOf<SidebarChangeDetail["event"]>().toEqualTypeOf<
      KeyboardEvent | MediaQueryListEvent | undefined
    >();
  });

  it("SidebarChangeSource is the 6-value literal union (5 + 'storage' added in v2.1.0)", () => {
    expectTypeOf<SidebarChangeSource>().toEqualTypeOf<
      "user" | "breakpoint" | "escape" | "reset" | "initialization" | "storage"
    >();
  });

  it("CreateSidebarOptions.breakpoint is { query: string; onMismatch: 'hide' | 'keep' } (NOT string)", () => {
    expectTypeOf<CreateSidebarOptions["breakpoint"]>().toEqualTypeOf<
      SidebarBreakpointOption | undefined
    >();
    expectTypeOf<SidebarBreakpointOption>().toEqualTypeOf<{
      readonly query: string;
      readonly onMismatch: SidebarOnMismatch;
    }>();
    expectTypeOf<SidebarOnMismatch>().toEqualTypeOf<"hide" | "keep">();
    // Negative case — a string is NOT assignable to the object shape.
    // @ts-expect-error strings are not assignable to SidebarBreakpointOption
    const bad: CreateSidebarOptions = { breakpoint: "(min-width: 1024px)" };
    void bad;
  });
});
