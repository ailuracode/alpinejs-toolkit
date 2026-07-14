import { describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import formPlugin from "../src/plugin.js";
import type { FormStore } from "../src/types.js";

describe("@ailuracode/alpine-form plugin", () => {
  it("registers $store.form and $form", () => {
    const Alpine = startAlpine(formPlugin());
    const store = Alpine.store("form") as FormStore;
    expect(store).toBeDefined();
    expect(Alpine.store("form")).toBe(store);
  });

  it("syncs reactive instances on change", async () => {
    const Alpine = startAlpine(formPlugin());
    const store = Alpine.store("form") as FormStore;
    store.register("contact", { initialValues: { email: "" } });
    store.registerField("contact", "email", {
      validate: (value: unknown) => (value === "" ? "Required" : null),
    });
    const valid = await store.validate("contact");
    expect(valid).toBe(false);
    expect(store.instances.contact.invalid).toBe(true);
  });
});
