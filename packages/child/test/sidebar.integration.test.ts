import morph from "@alpinejs/morph";
import Alpine from "alpinejs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import childPlugin from "../src/index.js";

let alpineStarted = false;

function labelDisplay(id: string): string {
  const el = document.getElementById(id);
  return el ? getComputedStyle(el).display : "";
}

async function mountLayout(html: string): Promise<void> {
  document.body.innerHTML = html;

  if (!alpineStarted) {
    window.Alpine = Alpine;
    Alpine.plugin(morph);
    Alpine.plugin(childPlugin);
    Alpine.start();
    alpineStarted = true;
  } else {
    Alpine.initTree(document.body);
  }

  await Alpine.nextTick();
}

describe("@ailuracode/alpine-child sidebar integration", () => {
  beforeAll(() => {
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("does not break sidebar x-show when x-child unwrap runs before aside init", async () => {
    await mountLayout(`
      <div x-data="{ expanded: false }">
        <main id="main">
          <span x-child class="btn" @click="void 0">
            <button type="button">Open</button>
          </span>
          <span x-child.replace aria-label="Wrapper">
            <button type="button">Replace</button>
          </span>
        </main>
        <aside id="sidebar">
          <a href="/playground/">
            <span id="nav-label" x-show="expanded" x-cloak>Overview</span>
          </a>
        </aside>
      </div>
    `);

    expect(document.getElementById("main")?.querySelector("span[x-child]")).toBeNull();
    expect(labelDisplay("nav-label")).toBe("none");
  });
});
