import { describe, expect, it } from "vitest";
import { mapJsonApiErrors, pointerToFieldPath } from "../src/json-api-errors.js";

describe("@ailuracode/alpine-form json-api-errors", () => {
  it("maps attribute pointers to field paths", () => {
    expect(pointerToFieldPath("/data/attributes/email")).toBe("email");
    expect(pointerToFieldPath("/data/attributes/address/city")).toBe("address.city");
  });

  it("maps relationship pointers to field paths", () => {
    expect(pointerToFieldPath("/data/relationships/author")).toBe("author");
  });

  it("maps JSON:API errors to field and form errors", () => {
    const result = mapJsonApiErrors([
      {
        detail: "is invalid",
        source: { pointer: "/data/attributes/email" },
      },
      {
        title: "Forbidden",
      },
    ]);

    expect(result.fieldErrors.email).toEqual(["is invalid"]);
    expect(result.formErrors).toEqual(["Forbidden"]);
  });
});
