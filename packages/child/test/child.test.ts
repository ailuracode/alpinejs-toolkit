import Alpine from "alpinejs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import childPlugin, {
  findFirstElementChild,
  parseChildDirective,
  transferAttributes,
} from "../src/index.js";

let alpineStarted = false;

async function mount(html: string): Promise<void> {
  document.body.innerHTML = html;

  if (!alpineStarted) {
    Alpine.plugin(childPlugin);
    Alpine.start();
    alpineStarted = true;
  } else {
    Alpine.initTree(document.body);
  }

  await Alpine.nextTick();
}

describe("@ailuracode/alpine-child transfer utilities", () => {
  it("finds the first element child and skips text nodes", () => {
    const wrapper = document.createElement("span");
    wrapper.append("text", document.createComment("note"), document.createElement("button"));

    expect(findFirstElementChild(wrapper)?.tagName).toBe("BUTTON");
  });

  it("parses default, merge, and replace modifiers", () => {
    const base = document.createElement("span");
    base.setAttribute("x-child", "");
    expect(parseChildDirective(base)?.mode).toBe("default");

    const merge = document.createElement("span");
    merge.setAttribute("x-child.merge", "");
    expect(parseChildDirective(merge)?.mode).toBe("merge");

    const replace = document.createElement("span");
    replace.setAttribute("x-child.replace", "");
    expect(parseChildDirective(replace)?.mode).toBe("replace");
  });

  it("merges classes with child tokens first by default", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("class", "btn");
    const child = document.createElement("button");
    child.setAttribute("class", "custom");

    transferAttributes(wrapper, child, "default");

    expect(child.getAttribute("class")).toBe("custom btn");
  });

  it("merges inline styles with child properties winning", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("style", "color: red; padding: 4px");
    const child = document.createElement("button");
    child.setAttribute("style", "color: blue");

    transferAttributes(wrapper, child, "default");

    expect(child.getAttribute("style")).toBe("color: blue; padding: 4px");
  });

  it("preserves existing child attributes over wrapper defaults", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("aria-label", "Open");
    wrapper.setAttribute("data-action", "wrapper");
    const child = document.createElement("button");
    child.setAttribute("aria-label", "Child label");
    child.setAttribute("data-action", "child");

    transferAttributes(wrapper, child, "default");

    expect(child.getAttribute("aria-label")).toBe("Child label");
    expect(child.getAttribute("data-action")).toBe("child");
  });

  it("copies missing aria and data attributes", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("aria-label", "Open");
    wrapper.setAttribute("data-track", "cta");
    const child = document.createElement("button");

    transferAttributes(wrapper, child, "default");

    expect(child.getAttribute("aria-label")).toBe("Open");
    expect(child.getAttribute("data-track")).toBe("cta");
  });

  it("does not duplicate id when the child already has one", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("id", "wrapper-id");
    const child = document.createElement("button");
    child.setAttribute("id", "child-id");

    transferAttributes(wrapper, child, "default");

    expect(child.getAttribute("id")).toBe("child-id");
  });

  it("overwrites child attributes in replace mode", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("aria-label", "Wrapper");
    wrapper.setAttribute("class", "wrapper");
    const child = document.createElement("button");
    child.setAttribute("aria-label", "Child");
    child.setAttribute("class", "child");

    transferAttributes(wrapper, child, "replace");

    expect(child.getAttribute("aria-label")).toBe("Wrapper");
    expect(child.getAttribute("class")).toBe("wrapper child");
  });

  it("does not copy x-child to the child", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("x-child", "");
    wrapper.setAttribute("class", "btn");
    const child = document.createElement("button");

    transferAttributes(wrapper, child, "default");

    expect(child.hasAttribute("x-child")).toBe(false);
    expect(child.getAttribute("class")).toBe("btn");
  });
});

describe("@ailuracode/alpine-child integration", () => {
  beforeAll(() => {
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("unwraps the wrapper and keeps only the child in the DOM", async () => {
    await mount(`
      <div id="host">
        <span x-child class="btn">
          <a href="/docs">Docs</a>
        </span>
      </div>
    `);

    const host = document.getElementById("host");
    expect(host?.children.length).toBe(1);
    expect(host?.firstElementChild?.tagName).toBe("A");
    expect(host?.querySelector("span")).toBeNull();
    expect(host?.querySelector("a")?.getAttribute("href")).toBe("/docs");
    expect(host?.querySelector("a")?.className).toBe("btn");
  });

  it("transfers click handlers to the child", async () => {
    await mount(`
      <div x-data="{ clicked: false }" id="click-host">
        <span x-child @click="clicked = true">
          <button type="button" id="child-button">Open</button>
        </span>
        <span id="clicked-state" x-text="clicked ? 'yes' : 'no'"></span>
      </div>
    `);

    const button = document.getElementById("child-button") as HTMLButtonElement;
    expect(button.getAttribute("@click")).toBe("clicked = true");

    button.click();
    await Alpine.nextTick();

    expect(document.getElementById("clicked-state")?.textContent).toBe("yes");
  });

  it("warns when the wrapper has no element child", async () => {
    await mount(`<span x-child class="btn">Only text</span>`);

    expect(console.warn).toHaveBeenCalledWith(
      "[x-child] No element child found; directive ignored."
    );
  });

  it("warns when multiple element children are present", async () => {
    await mount(`
      <span x-child>
        <button type="button">One</button>
        <button type="button">Two</button>
      </span>
    `);

    expect(console.warn).toHaveBeenCalledWith(
      "[x-child] Multiple element children; only the first is used."
    );
    expect(document.querySelectorAll("button").length).toBe(1);
  });

  it("transfers x-data scope to the child", async () => {
    await mount(`
      <span x-data="{ open: false }" x-child @click="open = !open">
        <button type="button" id="scoped-button" x-text="open ? 'open' : 'closed'">closed</button>
      </span>
    `);

    const button = document.getElementById("scoped-button") as HTMLButtonElement;
    expect(button.textContent).toBe("closed");

    button.click();
    await Alpine.nextTick();

    expect(button.textContent).toBe("open");
  });

  it("supports x-child.merge modifier", async () => {
    await mount(`
      <span x-child.merge class="wrapper" data-source="wrapper">
        <button type="button" class="child" data-source="child">Action</button>
      </span>
    `);

    const button = document.querySelector("button");
    expect(button?.className).toBe("child wrapper");
    expect(button?.getAttribute("data-source")).toBe("child");
  });
});
