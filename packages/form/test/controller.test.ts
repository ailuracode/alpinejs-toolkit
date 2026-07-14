import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFormController } from "../src/controller.js";
import { createFormStore } from "../src/store.js";

describe("@ailuracode/alpine-form controller", () => {
  let controller: ReturnType<typeof createFormController>;

  beforeEach(() => {
    controller = createFormController();
    controller.register("signup", {
      initialValues: { email: "", password: "" },
    });
    controller.registerField("signup", "email", {
      initialValue: "",
      validate: (value) => (value === "" ? "Email is required" : null),
    });
    controller.registerField("signup", "password", {
      initialValue: "",
      validate: (value) => (value === "" ? "Password is required" : null),
    });
  });

  it("tracks dirty and touched state", () => {
    expect(controller.snapshotInstances().signup.dirty).toBe(false);
    controller.setValue("signup", "email", "user@example.com");
    expect(controller.snapshotInstances().signup.dirty).toBe(true);
    controller.touch("signup", "email");
    expect(controller.snapshotInstances().signup.touched).toBe(true);
  });

  it("validates registered fields", async () => {
    const valid = await controller.validate("signup");
    expect(valid).toBe(false);
    expect(controller.snapshotInstances().signup.invalid).toBe(true);
    expect(controller.snapshotInstances().signup.fields.email.errors).toEqual([
      "Email is required",
    ]);
  });

  it("resets to initial values", () => {
    controller.setValue("signup", "email", "user@example.com");
    controller.touch("signup", "email");
    controller.reset("signup");
    const snapshot = controller.snapshotInstances().signup;
    expect(snapshot.values.email).toBe("");
    expect(snapshot.dirty).toBe(false);
    expect(snapshot.touched).toBe(false);
  });

  it("submits when valid", async () => {
    const onSubmit = vi.fn();
    controller.setValue("signup", "email", "user@example.com");
    controller.setValue("signup", "password", "secret");
    await controller.submit("signup", onSubmit);
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(controller.snapshotInstances().signup.submitted).toBe(true);
  });

  it("maps server errors to fields", () => {
    controller.setServerErrors("signup", { email: ["Already taken"] }, ["Check your input"]);
    const snapshot = controller.snapshotInstances().signup;
    expect(snapshot.fields.email.errors).toEqual(["Already taken"]);
    expect(snapshot.formErrors).toEqual(["Check your input"]);
  });

  it("supports nested field paths", () => {
    controller.registerField("signup", "address.city", { initialValue: "" });
    controller.setValue("signup", "address.city", "Quito");
    expect(controller.getValue("signup", "address.city")).toBe("Quito");
  });

  it("unregisters fields and forms", () => {
    controller.unregisterField("signup", "password");
    expect(controller.snapshotInstances().signup.fields.password).toBeUndefined();
    controller.unregister("signup");
    expect(controller.hasInstance("signup")).toBe(false);
  });
});

describe("@ailuracode/alpine-form store", () => {
  it("mirrors controller snapshots", async () => {
    const store = createFormStore();
    store.register("profile", { initialValues: { name: "" } });
    store.registerField("profile", "name", {
      validate: (value) => (value === "" ? "Required" : null),
    });
    const valid = await store.validate("profile");
    expect(valid).toBe(false);
    expect(store.instances.profile.invalid).toBe(true);
  });
});
