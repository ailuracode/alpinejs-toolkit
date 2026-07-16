/**
 * Alpine integration tests for `@ailuracode/alpine-timer`.
 */

import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import timerPlugin from "../src/index.js";

describe("@ailuracode/alpine-timer alpine integration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Alpine.plugin(timerPlugin());
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes basic Alpine markup", async () => {
    document.body.innerHTML = `<div x-data="{ value: 'ok' }"><span id="probe" x-text="value"></span></div>`;
    Alpine.initTree(document.body);
    await Alpine.nextTick();
    expect(document.querySelector("#probe")?.textContent).toBe("ok");
  });

  it("exposes $timer from click handlers", async () => {
    document.body.innerHTML = `
      <div x-data="{ label: 'pending' }">
        <button id="probe" @click="label = typeof $timer">Probe</button>
        <span id="label" x-text="label"></span>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();
    document.querySelector("#probe")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Alpine.nextTick();
    expect(document.querySelector("#label")?.textContent).toBe("object");
  });

  it("creates countdown timers from the $timer magic", async () => {
    document.body.innerHTML = `
      <div x-data="{
        timer: null,
        create() { this.timer = $timer.countdown({ duration: 1000 }) },
      }">
        <button id="create" @click="create()">Create</button>
        <span id="elapsed" x-text="timer ? timer.formatted : '0'"></span>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    document.querySelector("#create")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Alpine.nextTick();

    expect(document.querySelector("#elapsed")?.textContent).toBe("00:01");
  });

  it("records stopwatch laps from the $timer magic", async () => {
    document.body.innerHTML = `
      <div x-data="{
        stopwatch: null,
        create() { this.stopwatch = $timer.stopwatch() },
      }">
        <button id="create" @click="create()">Create</button>
        <button id="lap" @click="stopwatch.start(); stopwatch.lap()">Lap</button>
        <span id="count" x-text="stopwatch ? stopwatch.laps.length : 0"></span>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    document.querySelector("#create")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Alpine.nextTick();
    document.querySelector("#lap")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Alpine.nextTick();

    expect(document.querySelector("#count")?.textContent).toBe("1");
  });

  it("creates stopwatch timers with formatPattern options", async () => {
    document.body.innerHTML = `
      <div x-data="{
        stopwatch: null,
        create() {
          this.stopwatch = $timer.stopwatch({
            formatPattern: 'mm:ss',
            lapFormatPattern: 'mm:ss',
          });
        },
      }">
        <button id="create" @click="create()">Create</button>
        <span id="formatted" x-text="stopwatch ? stopwatch.formatted : 'missing'"></span>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    document.querySelector("#create")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Alpine.nextTick();

    expect(document.querySelector("#formatted")?.textContent).toBe("00:00");
  });
});
