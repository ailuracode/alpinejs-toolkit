import { describe, expect, it } from "vitest";
import { VirtualController } from "../src/controller.js";

describe("@ailuracode/alpine-virtual encapsulation", () => {
  it("does not expose live mutable instance registries", () => {
    const controller = new VirtualController();
    controller.create("list", { count: 5, estimateSize: 20 });

    const snapshot = controller.snapshotInstances();
    const list = snapshot.list;
    if (list) {
      (list as { count: number }).count = 99;
    }
    expect(controller.snapshotInstances().list?.count).toBe(5);
  });
});
