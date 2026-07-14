import { describe, expect, it } from "vitest";
import { createForm } from "../src/create-form.js";
import { createMockStandardSchema } from "./helpers/mock-standard-schema.js";

describe("@ailuracode/alpine-form createForm", () => {
  it("exposes TanStack-like field and form state", async () => {
    const form = createForm({
      defaultValues: { email: "", password: "" },
      validators: {
        onSubmit: createMockStandardSchema((value) => {
          const record = value as { email?: string; password?: string };
          const issues = [];
          if (!record.email) {
            issues.push({ message: "Email required", path: ["email"] });
          }
          if (!record.password) {
            issues.push({ message: "Password required", path: ["password"] });
          }
          return issues.length > 0 ? { issues } : { value: record };
        }),
      },
    });

    const email = form.field("email", {
      onChange: ({ value }) => (value ? undefined : "Required"),
    });

    email.handleChange("temp");
    expect(email.state.meta.isDirty).toBe(true);

    email.handleChange("");
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(email.state.meta.errorMap.onChange).toBe("Required");

    email.handleChange("user@example.com");
    form.field("password").handleChange("secret");

    await expect(form.handleSubmit()).resolves.toBeUndefined();
    expect(form.state.isSubmitting).toBe(false);
  });

  it("supports handleBlur validators", async () => {
    const form = createForm({
      defaultValues: { email: "" },
    });

    const email = form.field("email", {
      onBlur: ({ value }) => (value ? undefined : "Required on blur"),
    });

    email.handleChange("user@example.com");
    email.handleBlur();

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(email.state.meta.isTouched).toBe(true);
    expect(email.state.meta.isValid).toBe(true);

    email.handleChange("");
    email.handleBlur();

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(email.state.meta.errorMap.onBlur).toBe("Required on blur");
  });

  it("calls onSubmit with typed values", async () => {
    const submitted: Array<Record<string, unknown>> = [];
    const form = createForm({
      defaultValues: { email: "user@example.com" },
      onSubmit: ({ value }) => {
        submitted.push({ ...value });
      },
    });

    form.field("email");
    await form.handleSubmit();
    expect(submitted).toEqual([{ email: "user@example.com" }]);
  });
});
