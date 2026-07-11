import { describe, expect, it } from "vitest";
import { createFormController } from "../src/controller.js";

describe("@ailuracode/alpine-form async races", () => {
  it("ignores stale async validation results", async () => {
    const controller = createFormController();
    controller.register("async", { validateOn: "submit" });
    controller.registerField("async", "email", {
      initialValue: "",
      validate: () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("Too slow"), 20);
        }),
    });

    const first = controller.validate("async");
    const second = controller.validate("async");
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(false);
    expect(secondResult).toBe(false);
    expect(controller.snapshotInstances().async.fields.email.errors).toEqual(["Too slow"]);
  });

  it("aborts in-flight submission on destroy", async () => {
    const controller = createFormController();
    controller.register("submit", {});
    controller.registerField("submit", "email", { initialValue: "user@example.com" });

    let aborted = false;
    const promise = controller.submit("submit", async (_values, { signal }) => {
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          aborted = true;
          reject(new Error("aborted"));
        };
        signal.addEventListener("abort", onAbort, { once: true });
        setTimeout(() => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        }, 100);
      });
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    controller.destroy();
    await expect(promise).rejects.toThrow("aborted");
    expect(aborted).toBe(true);
  });

  it("does not emit after destroy", () => {
    const controller = createFormController();
    const changes: string[] = [];
    controller.on("change", (detail) => {
      changes.push(detail.formId);
    });
    controller.register("demo", {});
    controller.destroy();
    controller.register("demo", {});
    expect(changes).toEqual(["demo"]);
  });
});
