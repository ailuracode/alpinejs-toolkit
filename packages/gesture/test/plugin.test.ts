import { beforeEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers";
import { gesturePlugin } from "../src/plugin";
import type { GestureStore } from "../src/types";

describe("gesturePlugin", () => {
  let alpine: ReturnType<typeof startAlpine>;

  beforeEach(() => {
    alpine = startAlpine(gesturePlugin({ id: "test" }));
  });

  it("registers the gesture store", () => {
    const store = alpine.store("gesture") as unknown as GestureStore;
    expect(store).toBeDefined();
    expect(store.active).toBe(false);
    expect(store.kind).toBeNull();
  });

  it("exposes cancel method on store", () => {
    const store = alpine.store("gesture") as unknown as GestureStore;
    expect(typeof store.cancel).toBe("function");
  });

  it("has correct initial state", () => {
    const store = alpine.store("gesture") as unknown as GestureStore;
    expect(store.x).toBe(0);
    expect(store.y).toBe(0);
    expect(store.distanceX).toBe(0);
    expect(store.distanceY).toBe(0);
    expect(store.totalDistance).toBe(0);
    expect(store.velocityX).toBe(0);
    expect(store.velocityY).toBe(0);
    expect(store.pointerCount).toBe(0);
    expect(store.scale).toBe(1);
    expect(store.rotation).toBe(0);
    expect(store.direction).toBe("none");
  });

  it("plugin is idempotent", () => {
    alpine.plugin(gesturePlugin({ id: "test" }));
    const store = alpine.store("gesture") as unknown as GestureStore;
    expect(store).toBeDefined();
  });
});
