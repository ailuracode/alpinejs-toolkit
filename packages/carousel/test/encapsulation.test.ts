import { describe, expect, it } from "vitest";
import { createCarouselController, createCarouselStore } from "../src/index.js";

describe("CarouselController encapsulation", () => {
  it("does not expose live mutable instance registries", () => {
    const controller = createCarouselController();
    controller.create("gallery");

    const snapshot = controller.snapshotInstances();
    snapshot.gallery.currentIndex = 99;

    expect(controller.current("gallery")).toBe(0);
  });

  it("reports registration through hasInstance", () => {
    const controller = createCarouselController();
    controller.create("gallery");

    expect(controller.hasInstance("gallery")).toBe(true);
    controller.destroy("gallery");
    expect(controller.hasInstance("gallery")).toBe(false);
  });

  it("keeps the controller as the source of truth in standalone stores", () => {
    const store = createCarouselStore();
    store.create("gallery");

    store.instances.gallery.currentIndex = 99;

    expect(store.current("gallery")).toBe(0);
  });
});
