import { describe, expect, it } from "vitest";
import {
  createCarouselController,
  createCarouselStore,
  createCarouselStoreFromController,
} from "../src/index.js";

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

  it("does not expose engine handles through snapshots or stores", () => {
    const controller = createCarouselController();
    const store = createCarouselStoreFromController(controller);

    store.create("gallery", { autoplay: true });

    const snapshot = controller.snapshotInstances().gallery;
    expect(snapshot).toBeDefined();
    expect(snapshot).not.toHaveProperty("embla");
    expect(snapshot).not.toHaveProperty("autoplay");
    expect(snapshot).not.toHaveProperty("viewport");

    expect(store.instances.gallery).toBeDefined();
    expect(store.instances.gallery).not.toHaveProperty("embla");
    expect(store.instances.gallery).not.toHaveProperty("autoplay");
    expect(store.instances.gallery).not.toHaveProperty("viewport");
  });
});
