import anchor from "@alpinejs/anchor";
import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import tooltipPlugin from "../src/index.js";

describe("@ailuracode/alpine-tooltip playground markup", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div
        x-data="{
          demos: [
            { id: 'tip-top', placement: 'top', label: 'Top', text: 'Top placement' },
            { id: 'tip-bottom', placement: 'bottom', label: 'Bottom', text: 'Bottom placement' },
          ],
          activeDemo: null,
          activeTrigger: null,
          showDemo(demo, trigger) {
            this.activeDemo = demo;
            this.activeTrigger = trigger;
            $store.tooltip.showOnHover(demo.id);
          },
          hideDemo(demo) {
            $store.tooltip.hideOnHover(demo.id);
          },
        }"
        x-init="demos.forEach(d => $store.tooltip.register(d.id, { openDelay: 0, closeDelay: 0 }))"
      >
        <strong id="active" x-text="activeDemo?.placement ?? '—'"></strong>

        <template x-for="demo in demos" :key="demo.id">
          <button
            type="button"
            class="trigger"
            x-bind:data-placement="demo.placement"
            @mouseenter="showDemo(demo, $el)"
            @mouseleave="hideDemo(demo)"
            x-text="demo.label"
          ></button>
        </template>

        <template x-if="activeDemo?.placement === 'top'">
          <template x-teleport="body">
            <div
              id="tooltip-panel"
              x-show="activeDemo && $store.tooltip.isOpen(activeDemo.id)"
              x-anchor.top.fixed.noflip.offset.8="activeTrigger"
              role="tooltip"
              x-text="activeDemo?.text"
            ></div>
          </template>
        </template>
        <template x-if="activeDemo?.placement === 'bottom'">
          <template x-teleport="body">
            <div
              id="tooltip-panel-bottom"
              x-show="activeDemo && $store.tooltip.isOpen(activeDemo.id)"
              x-anchor.bottom.fixed.noflip.offset.8="activeTrigger"
              role="tooltip"
              x-text="activeDemo?.text"
            ></div>
          </template>
        </template>
      </div>
    `;

    window.Alpine = Alpine;
    Alpine.plugin(anchor);
    Alpine.plugin(tooltipPlugin());
    Alpine.start();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("updates active placement label in parent scope", async () => {
    expect(document.getElementById("active")?.textContent).toBe("—");

    const trigger = document.querySelector(".trigger") as HTMLButtonElement;
    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await Alpine.nextTick();

    expect(document.getElementById("active")?.textContent).toBe("top");
  });

  it("opens teleported tooltip panel on hover", async () => {
    const trigger = document.querySelector(".trigger") as HTMLButtonElement;
    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await Alpine.nextTick();

    const panel = document.getElementById("tooltip-panel");
    expect(panel).not.toBeNull();
    expect(panel?.style.display).not.toBe("none");
    expect(panel?.textContent).toBe("Top placement");
  });

  it("opens bottom placement when x-if wraps x-teleport", async () => {
    const trigger = document.querySelector('[data-placement="bottom"]') as HTMLButtonElement;
    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await Alpine.nextTick();

    const panel = document.getElementById("tooltip-panel-bottom");
    expect(panel).not.toBeNull();
    expect(panel?.style.display).not.toBe("none");
    expect(panel?.textContent).toBe("Bottom placement");
    expect(document.getElementById("active")?.textContent).toBe("bottom");
  });
});
