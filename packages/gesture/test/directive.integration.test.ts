import Alpine from "alpinejs";
import { beforeEach, describe, expect, it } from "vitest";
import { gesturePlugin } from "../src/plugin.js";

describe("@ailuracode/alpine-gesture x-gesture directive integration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Alpine.plugin(gesturePlugin());
  });

  it("dispatches a CustomEvent when the recognized gesture fires", async () => {
    document.body.innerHTML = `
      <div id="host">
        <div id="target" x-gesture:tap>Tap target</div>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    const target = document.getElementById("target") as HTMLElement;
    let eventDetail: unknown = null;

    target.addEventListener("tap", (e) => {
      eventDetail = (e as CustomEvent).detail;
    });

    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 50,
        clientY: 50,
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
      })
    );
    target.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 50,
        clientY: 50,
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
      })
    );

    await Alpine.nextTick();

    expect(eventDetail).not.toBeNull();
    expect(eventDetail).toMatchObject({ kind: "tap" });
  });

  it("invokes the named handler with $event bound to the gesture detail", async () => {
    document.body.innerHTML = `
      <div id="host" x-data="{ lastGesture: 'none', handleTap(detail) { this.lastGesture = detail.kind } }">
        <div id="target" x-gesture:tap="handleTap">Tap target</div>
        <span id="state" x-text="lastGesture"></span>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    const target = document.getElementById("target") as HTMLElement;

    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 50,
        clientY: 50,
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
      })
    );
    target.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 50,
        clientY: 50,
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
      })
    );

    await Alpine.nextTick();

    expect(document.getElementById("state")?.textContent).toBe("tap");
  });

  it("dispatches pinch events when two pointers spread apart", async () => {
    document.body.innerHTML = `
      <div id="host" x-data="{ lastScale: 1, handlePinch(detail) { this.lastScale = detail.state?.scale ?? detail.scale ?? 1 } }">
        <div
          id="target"
          x-gesture:pinch="handlePinch"
          style="width: 200px; height: 200px;"
        >Pinch target</div>
        <span id="state" x-text="lastScale"></span>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    const target = document.getElementById("target") as HTMLElement;
    let eventDetail: unknown = null;

    target.addEventListener("pinch", (e) => {
      eventDetail = (e as CustomEvent).detail;
    });

    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 80,
        clientY: 80,
        bubbles: true,
        pointerId: 1,
        pointerType: "touch",
      })
    );
    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 120,
        clientY: 120,
        bubbles: true,
        pointerId: 2,
        pointerType: "touch",
      })
    );
    target.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 50,
        clientY: 50,
        bubbles: true,
        pointerId: 1,
        pointerType: "touch",
      })
    );
    target.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 150,
        bubbles: true,
        pointerId: 2,
        pointerType: "touch",
      })
    );

    await Alpine.nextTick();

    expect(eventDetail).not.toBeNull();
    expect(eventDetail).toMatchObject({
      kind: "pinch",
      state: expect.objectContaining({ scale: expect.any(Number) }),
    });
    const scale = (eventDetail as { state: { scale: number } }).state.scale;
    expect(scale).toBeGreaterThan(1);
    expect(Number(document.getElementById("state")?.textContent)).toBeGreaterThan(1);
  });

  it("cleans up its controller when the directive element is removed", async () => {
    document.body.innerHTML = `
      <div id="host">
        <div id="target" x-gesture:tap>Target</div>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    const target = document.getElementById("target") as HTMLElement;
    target.remove();

    expect(() => {
      target.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 50,
          clientY: 50,
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
        })
      );
    }).not.toThrow();
  });
});
