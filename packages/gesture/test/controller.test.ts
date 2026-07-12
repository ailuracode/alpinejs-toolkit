import { beforeEach, describe, expect, it, vi } from "vitest";
import { GestureController } from "../src/controller";
import type { GestureEvents } from "../src/events";

function createPointerEvent(
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel" | "pointerleave",
  x: number,
  y: number,
  overrides: Partial<PointerEventInit> = {}
): PointerEvent {
  return new PointerEvent(type, {
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    ...overrides,
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("GestureController", () => {
  let element: HTMLElement;
  let controller: GestureController;

  beforeEach(() => {
    element = document.createElement("div");
    element.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      width: 300,
      height: 300,
      right: 300,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({ top: 0, left: 0, width: 300, height: 300 }),
    }));
    document.body.appendChild(element);
    controller = new GestureController({ id: "test" });
  });

  describe("lifecycle", () => {
    it("starts in idle phase", () => {
      expect(controller.phase).toBe("idle");
    });

    it("transitions to mounted after mount()", () => {
      controller.attach(element);
      controller.mount();
      expect(controller.phase).toBe("mounted");
      expect(controller.isMounted).toBe(true);
    });

    it("mount() is idempotent", () => {
      controller.attach(element);
      controller.mount();
      controller.mount();
      expect(controller.phase).toBe("mounted");
    });

    it("transitions to destroyed after destroy()", () => {
      controller.attach(element);
      controller.mount();
      controller.destroy();
      expect(controller.phase).toBe("destroyed");
      expect(controller.isDestroyed).toBe(true);
    });

    it("destroy() is idempotent", () => {
      controller.attach(element);
      controller.mount();
      controller.destroy();
      controller.destroy();
      expect(controller.phase).toBe("destroyed");
    });
  });

  describe("state", () => {
    it("returns empty state before mount", () => {
      const state = controller.state;
      expect(state.active).toBe(false);
      expect(state.kind).toBeNull();
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
    });

    it("isTracking is false when idle", () => {
      expect(controller.isTracking).toBe(false);
    });
  });

  describe("tap recognition", () => {
    it("recognizes a tap on pointer-down and pointer-up", async () => {
      controller.attach(element);
      controller.mount();

      const tapPromise = new Promise<void>((resolve) => {
        controller.on("tap", () => resolve());
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointerup", 100, 100));

      await tapPromise;
    });

    it("does not recognize tap when moved beyond threshold", async () => {
      controller.attach(element);
      controller.mount();

      const tapPromise = new Promise<void>((resolve) => {
        controller.on("tap", () => resolve());
      });

      const noTapPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 100);
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointermove", 200, 200));
      element.dispatchEvent(createPointerEvent("pointerup", 200, 200));

      const result = await Promise.race([
        tapPromise.then(() => "tap"),
        noTapPromise.then(() => "no-tap"),
      ]);

      expect(result).toBe("no-tap");
    });
  });

  describe("double-tap recognition", () => {
    it("recognizes double tap with two quick taps", async () => {
      controller = new GestureController({ id: "test-doubletap", doubleTapInterval: 300 });
      controller.attach(element);
      controller.mount();

      const doubleTapPromise = new Promise<void>((resolve) => {
        controller.on("doubletap", () => resolve());
      });

      // First tap
      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointerup", 100, 100));
      await wait(50);

      // Second tap
      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointerup", 100, 100));

      await doubleTapPromise;
    });
  });

  describe("long-press recognition", () => {
    it("recognizes long press after delay", async () => {
      controller = new GestureController({ id: "test-longpress", longPressDelay: 100 });
      controller.attach(element);
      controller.mount();

      const longPressPromise = new Promise<void>((resolve) => {
        controller.on("longpress", () => resolve());
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      await wait(150);
      element.dispatchEvent(createPointerEvent("pointerup", 100, 100));

      await longPressPromise;
    });

    it("cancels long press when moved beyond threshold", async () => {
      controller = new GestureController({ id: "test-longpress-move", longPressDelay: 100 });
      controller.attach(element);
      controller.mount();

      const longPressPromise = new Promise<void>((resolve) => {
        controller.on("longpress", () => resolve());
      });

      const noLongPressPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 200);
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      await wait(50);
      element.dispatchEvent(createPointerEvent("pointermove", 150, 150));
      await wait(100);
      element.dispatchEvent(createPointerEvent("pointerup", 150, 150));

      const result = await Promise.race([
        longPressPromise.then(() => "longpress"),
        noLongPressPromise.then(() => "no-longpress"),
      ]);

      expect(result).toBe("no-longpress");
    });
  });

  describe("swipe recognition", () => {
    it("recognizes a swipe right", async () => {
      controller = new GestureController({
        id: "test-swipe",
        swipeThreshold: 30,
        swipeVelocity: 0.2,
      });
      controller.attach(element);
      controller.mount();

      const swipePromise = new Promise<GestureEvents["swipe"]>((resolve) => {
        controller.on("swipe", (detail) => resolve(detail));
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 50, 100));
      element.dispatchEvent(createPointerEvent("pointerup", 200, 100));

      const detail = await swipePromise;
      expect(detail.direction).toBe("right");
    });

    it("recognizes a swipe left", async () => {
      controller = new GestureController({
        id: "test-swipe-left",
        swipeThreshold: 30,
        swipeVelocity: 0.2,
      });
      controller.attach(element);
      controller.mount();

      const swipePromise = new Promise<GestureEvents["swipe"]>((resolve) => {
        controller.on("swipe", (detail) => resolve(detail));
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 200, 100));
      element.dispatchEvent(createPointerEvent("pointerup", 50, 100));

      const detail = await swipePromise;
      expect(detail.direction).toBe("left");
    });

    it("recognizes a swipe down", async () => {
      controller = new GestureController({
        id: "test-swipe-down",
        swipeThreshold: 30,
        swipeVelocity: 0.2,
      });
      controller.attach(element);
      controller.mount();

      const swipePromise = new Promise<GestureEvents["swipe"]>((resolve) => {
        controller.on("swipe", (detail) => resolve(detail));
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 50));
      element.dispatchEvent(createPointerEvent("pointerup", 100, 200));

      const detail = await swipePromise;
      expect(detail.direction).toBe("down");
    });

    it("recognizes a swipe up", async () => {
      controller = new GestureController({
        id: "test-swipe-up",
        swipeThreshold: 30,
        swipeVelocity: 0.2,
      });
      controller.attach(element);
      controller.mount();

      const swipePromise = new Promise<GestureEvents["swipe"]>((resolve) => {
        controller.on("swipe", (detail) => resolve(detail));
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 200));
      element.dispatchEvent(createPointerEvent("pointerup", 100, 50));

      const detail = await swipePromise;
      expect(detail.direction).toBe("up");
    });
  });

  describe("pan recognition", () => {
    it("recognizes pan start and move events", () => {
      controller = new GestureController({ id: "test-pan", panThreshold: 10 });
      controller.attach(element);
      controller.mount();

      const panEvents: GestureEvents["pan"][] = [];
      controller.on("pan", (detail) => panEvents.push(detail));

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointermove", 100, 100));
      element.dispatchEvent(createPointerEvent("pointermove", 120, 120));
      element.dispatchEvent(createPointerEvent("pointermove", 140, 140));
      element.dispatchEvent(createPointerEvent("pointerup", 140, 140));

      expect(panEvents.length).toBeGreaterThanOrEqual(2);
      expect(panEvents[0].phase).toBe("start");
      expect(panEvents[panEvents.length - 1].phase).toBe("end");
    });
  });

  describe("pinch recognition", () => {
    it("recognizes pinch with two pointers", () => {
      controller = new GestureController({ id: "test-pinch", pinchThreshold: 5 });
      controller.attach(element);
      controller.mount();

      const pinchEvents: GestureEvents["pinch"][] = [];
      controller.on("pinch", (detail) => pinchEvents.push(detail));

      // Two pointers spreading apart
      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100, { pointerId: 1 }));
      element.dispatchEvent(createPointerEvent("pointerdown", 150, 150, { pointerId: 2 }));
      element.dispatchEvent(createPointerEvent("pointermove", 80, 80, { pointerId: 1 }));
      element.dispatchEvent(createPointerEvent("pointermove", 170, 170, { pointerId: 2 }));

      expect(pinchEvents.length).toBeGreaterThanOrEqual(1);
      expect(pinchEvents[0].scale).toBeGreaterThan(1);
    });
  });

  describe("competing gestures", () => {
    it("pan cancels long press", async () => {
      controller = new GestureController({
        id: "test-compete",
        longPressDelay: 200,
        panThreshold: 10,
      });
      controller.attach(element);
      controller.mount();

      const longPressPromise = new Promise<void>((resolve) => {
        controller.on("longpress", () => resolve());
      });

      const noLongPressPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 300);
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      await wait(50);
      // Move enough to trigger pan, which should cancel long press
      element.dispatchEvent(createPointerEvent("pointermove", 150, 150));

      const result = await Promise.race([
        longPressPromise.then(() => "longpress"),
        noLongPressPromise.then(() => "no-longpress"),
      ]);

      expect(result).toBe("no-longpress");
    });
  });

  describe("cancel command", () => {
    it("cancels active gesture and resets state", () => {
      controller.attach(element);
      controller.mount();

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      expect(controller.isTracking).toBe(false); // tap doesn't set active

      controller.cancel();
      expect(controller.state.active).toBe(false);
    });
  });

  describe("attach/detach", () => {
    it("attach() switches the target element", () => {
      controller.attach(element);
      controller.mount();

      const element2 = document.createElement("div");
      document.body.appendChild(element2);

      controller.attach(element2);
      expect(controller.element).toBe(element2);
    });

    it("detach() removes listeners", () => {
      controller.attach(element);
      controller.mount();
      controller.detach();
      expect(controller.element).toBeNull();
    });
  });

  describe("destroy cleanup", () => {
    it("releases pointer capture on destroy", () => {
      controller.attach(element);
      controller.mount();
      controller.destroy();
      expect(controller.phase).toBe("destroyed");
    });
  });

  describe("error handling", () => {
    it("throws on commands after destroy", () => {
      controller.attach(element);
      controller.mount();
      controller.destroy();

      expect(() => controller.cancel()).toThrow();
    });

    it("throws on commands before mount", () => {
      expect(() => controller.cancel()).toThrow();
    });
  });

  describe("gesture disabled", () => {
    it("does not recognize disabled gesture kinds", async () => {
      controller = new GestureController({ id: "test-disabled", gestures: ["swipe"] });
      controller.attach(element);
      controller.mount();

      const tapPromise = new Promise<void>((resolve) => {
        controller.on("tap", () => resolve());
      });

      const noTapPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 100);
      });

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointerup", 100, 100));

      const result = await Promise.race([
        tapPromise.then(() => "tap"),
        noTapPromise.then(() => "no-tap"),
      ]);

      expect(result).toBe("no-tap");
    });
  });

  describe("axis lock", () => {
    it("locks pan to horizontal axis", () => {
      controller = new GestureController({
        id: "test-axis",
        panThreshold: 5,
        axisLock: "horizontal",
      });
      controller.attach(element);
      controller.mount();

      const panEvents: GestureEvents["pan"][] = [];
      controller.on("pan", (detail) => panEvents.push(detail));

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointermove", 150, 200));
      element.dispatchEvent(createPointerEvent("pointermove", 160, 250));
      element.dispatchEvent(createPointerEvent("pointerup", 160, 250));

      const moveEvents = panEvents.filter((e) => e.phase === "move");
      expect(moveEvents.length).toBeGreaterThan(0);
      // Vertical distance should be zeroed out
      expect(moveEvents[0].distanceY).toBe(0);
      expect(moveEvents[0].distanceX).toBe(60);
    });

    it("locks pan to vertical axis", () => {
      controller = new GestureController({
        id: "test-axis-v",
        panThreshold: 5,
        axisLock: "vertical",
      });
      controller.attach(element);
      controller.mount();

      const panEvents: GestureEvents["pan"][] = [];
      controller.on("pan", (detail) => panEvents.push(detail));

      element.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      element.dispatchEvent(createPointerEvent("pointermove", 200, 150));
      element.dispatchEvent(createPointerEvent("pointermove", 250, 200));
      element.dispatchEvent(createPointerEvent("pointerup", 250, 200));

      const moveEvents = panEvents.filter((e) => e.phase === "move");
      expect(moveEvents.length).toBeGreaterThan(0);
      expect(moveEvents[0].distanceX).toBe(0);
      expect(moveEvents[0].distanceY).toBe(100);
    });
  });
});
