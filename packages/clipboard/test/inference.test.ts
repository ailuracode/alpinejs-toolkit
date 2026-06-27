import { describe, expectTypeOf, it } from "vitest";
import {
  CLIPBOARD_COPY_MODES,
  type ClipboardCopyText,
  type ClipboardMagic,
  clipboardOptions,
  copyToClipboard,
} from "../src/index.js";

describe("@ailuracode/alpinejs-clipboard type inference", () => {
  it("exports literal copy modes", () => {
    expectTypeOf(CLIPBOARD_COPY_MODES).toEqualTypeOf<readonly ["auto", "clipboard", "legacy"]>();
  });

  it("accepts coercible text values", () => {
    expectTypeOf(copyToClipboard).toBeCallableWith("hello");
    expectTypeOf(copyToClipboard).toBeCallableWith(42);
    expectTypeOf(copyToClipboard).toBeCallableWith(true);
    expectTypeOf(copyToClipboard).toBeCallableWith(1n);
  });

  it("infers literal mode from shorthand argument", () => {
    expectTypeOf(copyToClipboard).toBeCallableWith("text", "legacy");
    expectTypeOf(copyToClipboard).toBeCallableWith("text", "clipboard");
  });

  it("infers mode from clipboardOptions()", () => {
    const options = clipboardOptions({ mode: "clipboard" });

    expectTypeOf(options.mode).toEqualTypeOf<"clipboard">();
    expectTypeOf(copyToClipboard).toBeCallableWith("text", options);
  });

  it("types $clipboard the same as copyToClipboard", () => {
    expectTypeOf<ClipboardMagic>().toEqualTypeOf<typeof copyToClipboard>();
    expectTypeOf<ClipboardCopyText>().toEqualTypeOf<string | number | boolean | bigint>();
  });
});
