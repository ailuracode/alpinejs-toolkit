import { describe, expectTypeOf, it } from "vitest";
import {
  type ToastMagic,
  type ToastPayload,
  type ToastPosition,
  type ToastVariant,
  toastOptions,
  toastPositions,
  toastVariants,
} from "../src/index.js";

describe("@ailuracode/alpine-toast inference", () => {
  it("infers custom variant unions on payloads", () => {
    const variants = toastVariants(["queued", "failed"] as const);
    const options = toastOptions({ variants });

    type Variants = NonNullable<typeof options.variants>;
    type Variant = ToastVariant<Variants>;
    type Payload = ToastPayload<Variants>;

    expectTypeOf<Variant>().toEqualTypeOf<"default" | "queued" | "failed">();
    expectTypeOf<Payload["variant"]>().toEqualTypeOf<Variant | undefined>();
  });

  it("infers variant shortcut methods on ToastMagic", () => {
    const options = toastOptions({
      variants: toastVariants(["success", "archived"] as const),
    });

    type Magic = ToastMagic<NonNullable<typeof options.variants>>;

    expectTypeOf<Magic["success"]>().toBeFunction();
    expectTypeOf<Magic["archived"]>().toBeFunction();
    expectTypeOf<Magic["promise"]>().toBeFunction();
    // @ts-expect-error shortcuts exist only for configured variants
    expectTypeOf<Magic["info"]>().toBeFunction();
  });

  it("defaults to only the built-in default variant without options", () => {
    type Variant = ToastVariant;
    expectTypeOf<Variant>().toEqualTypeOf<"default">();
  });

  it("infers custom position unions on payloads", () => {
    const positions = toastPositions(["top-center", "bottom-right"] as const);
    const options = toastOptions({ positions });

    type Positions = NonNullable<typeof options.positions>;
    type Position = ToastPosition<Positions>;
    type Payload = ToastPayload<readonly [], Positions>;

    expectTypeOf<Position>().toEqualTypeOf<"bottom-right" | "top-center">();
    expectTypeOf<Payload["position"]>().toEqualTypeOf<Position | undefined>();
  });

  it("infers content type on payloads", () => {
    type AppContent = { id: number } | { html: string };
    type Payload = ToastPayload<readonly [], readonly [], AppContent>;

    expectTypeOf<Payload["content"]>().toEqualTypeOf<AppContent | null | undefined>();
  });

  it("defaults to only the built-in bottom-right position without options", () => {
    type Position = ToastPosition;
    expectTypeOf<Position>().toEqualTypeOf<"bottom-right">();
  });
});
