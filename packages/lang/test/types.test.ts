import { describe, expectTypeOf, it } from "vitest";
import type {
  LangChangeDetail,
  LangChangeSource,
  LangListener,
  LangManager,
  LangPluginCallback,
  LangPluginOptions,
  LangState,
  LangStore,
  Unsubscribe,
} from "../src/index.js";
import { type LangEvents, normalizeLanguageTag, parseLanguageTag } from "../src/index.js";

describe("@ailuracode/alpine-lang type inference", () => {
  it("infers LangState fields", () => {
    expectTypeOf<LangState["current"]>().toEqualTypeOf<string>();
    expectTypeOf<LangState["base"]>().toEqualTypeOf<string>();
    expectTypeOf<LangState["region"]>().toEqualTypeOf<string | null>();
    expectTypeOf<LangState["languages"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<LangState["fallback"]>().toEqualTypeOf<string>();
    expectTypeOf<LangState["isDetected"]>().toEqualTypeOf<boolean>();
  });

  it("infers LangChangeDetail payload", () => {
    expectTypeOf<LangChangeDetail["source"]>().toEqualTypeOf<LangChangeSource>();
    expectTypeOf<LangChangeDetail["previous"]>().toEqualTypeOf<LangState | null>();
    expectTypeOf<LangChangeDetail["current"]>().toEqualTypeOf<string>();
  });

  it("infers LangChangeSource as a literal union", () => {
    expectTypeOf<LangChangeSource>().toEqualTypeOf<"initialization" | "user" | "reset">();
  });

  it("infers LangListener signature", () => {
    expectTypeOf<LangListener>().toEqualTypeOf<(detail: LangChangeDetail) => void>();
  });

  it("infers LangEvents map", () => {
    expectTypeOf<LangEvents["change"]>().toEqualTypeOf<LangChangeDetail>();
  });

  it("infers LangStore fields and methods", () => {
    expectTypeOf<LangStore["current"]>().toEqualTypeOf<string>();
    expectTypeOf<LangStore["base"]>().toEqualTypeOf<string>();
    expectTypeOf<LangStore["region"]>().toEqualTypeOf<string | null>();
    expectTypeOf<LangStore["languages"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<LangStore["fallback"]>().toEqualTypeOf<string>();
    expectTypeOf<LangStore["isDetected"]>().toEqualTypeOf<boolean>();
    expectTypeOf<LangStore["is"]>().parameters.toEqualTypeOf<[value: string]>();
    expectTypeOf<LangStore["is"]>().returns.toEqualTypeOf<boolean>();
    expectTypeOf<LangStore["includes"]>().parameters.toEqualTypeOf<[value: string]>();
    expectTypeOf<LangStore["includes"]>().returns.toEqualTypeOf<boolean>();
    expectTypeOf<LangStore["set"]>().parameters.toEqualTypeOf<[language: string]>();
    expectTypeOf<LangStore["reset"]>().parameters.toEqualTypeOf<[]>();
  });

  it("infers LangManager contract", () => {
    expectTypeOf<LangManager["is"]>().returns.toEqualTypeOf<boolean>();
    expectTypeOf<LangManager["on"]>().parameters.toEqualTypeOf<
      ["change", (detail: LangChangeDetail) => void]
    >();
    expectTypeOf<ReturnType<LangManager["on"]>>().toEqualTypeOf<Unsubscribe>();
  });

  it("infers LangPluginOptions", () => {
    expectTypeOf<LangPluginOptions["fallback"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<LangPluginOptions["normalize"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("infers LangPluginCallback", () => {
    expectTypeOf<LangPluginCallback>().toBeFunction();
  });

  it("exposes normalizeLanguageTag / parseLanguageTag helpers", () => {
    expectTypeOf(normalizeLanguageTag).parameters.toEqualTypeOf<[value: string]>();
    expectTypeOf(normalizeLanguageTag).returns.toEqualTypeOf<string>();
    expectTypeOf(parseLanguageTag).parameters.toEqualTypeOf<[tag: string]>();
    expectTypeOf(parseLanguageTag).returns.toEqualTypeOf<{
      base: string;
      region: string | null;
    }>();
  });
});
