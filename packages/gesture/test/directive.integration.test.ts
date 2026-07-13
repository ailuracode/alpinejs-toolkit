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
