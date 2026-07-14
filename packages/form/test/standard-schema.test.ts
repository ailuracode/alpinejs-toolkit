import { describe, expect, it } from "vitest";
import {
  createStandardSchemaAdapter,
  isStandardSchema,
  type StandardSchemaV1,
  standardSchemaIssuesToFieldErrors,
  validateStandardSchema,
} from "../src/standard-schema.js";

function createMockSchema(validate: StandardSchemaV1["~standard"]["validate"]): StandardSchemaV1 {
  return {
    "~standard": {
      version: 1,
      vendor: "mock",
      validate,
    },
  };
}

describe("@ailuracode/alpine-form standard-schema", () => {
  it("detects Standard Schema values", () => {
    const schema = createMockSchema(() => ({ value: true }));
    expect(isStandardSchema(schema)).toBe(true);
    expect(isStandardSchema({})).toBe(false);
  });

  it("maps issues to field paths", () => {
    const errors = standardSchemaIssuesToFieldErrors([
      { message: "Required", path: ["email"] },
      { message: "Too short", path: ["address", "city"] },
    ]);

    expect(errors.email).toEqual(["Required"]);
    expect(errors["address.city"]).toEqual(["Too short"]);
  });

  it("validates through an adapter", async () => {
    const schema = createMockSchema((value) => {
      const record = value as { email?: string };
      if (!record.email) {
        return { issues: [{ message: "Email required", path: ["email"] }] };
      }
      return { value: record };
    });

    const adapter = createStandardSchemaAdapter(schema);
    const result = await adapter.validate({ email: "" }, { signal: new AbortController().signal });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.email).toEqual(["Email required"]);
  });

  it("returns issues from validateStandardSchema", async () => {
    const schema = createMockSchema(() => ({
      issues: [{ message: "Invalid" }],
    }));

    const issues = await validateStandardSchema(schema, {});
    expect(issues).toEqual([{ message: "Invalid" }]);
  });
});
