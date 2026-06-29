import { describe, expect, it } from "vitest";
import { applyResponsiveLayout, isCompactLayout } from "../src/devtools/responsive-layout.js";

describe("query devtools responsive layout", () => {
  it("switches to compact layout on narrow panels", () => {
    const panel = document.createElement("section");
    const headerToolbar = document.createElement("div");
    const toolbarTop = document.createElement("div");
    const toolbarBottom = document.createElement("div");
    const body = document.createElement("div");
    const list = document.createElement("div");
    const searchInput = document.createElement("input");
    const adapterSelect = document.createElement("select");
    const sortSelect = document.createElement("select");
    const tabs = document.createElement("div");
    const queriesTab = document.createElement("button");
    const mutationsTab = document.createElement("button");
    const resizeHandle = document.createElement("div");

    applyResponsiveLayout(
      {
        panel,
        resizeHandle,
        headerToolbar,
        toolbarTop,
        toolbarBottom,
        body,
        list,
        searchInput,
        adapterSelect,
        sortSelect,
        tabs,
        queriesTab,
        mutationsTab,
        position: "bottom",
      },
      true,
      520
    );

    expect(isCompactLayout()).toBe(true);
    expect(body.style.gridTemplateColumns).toBe("1fr");
    expect(body.style.gridTemplateRows).toBe("1fr");
    expect(searchInput.style.width).toBe("100%");
    expect(panel.style.width).toBe("auto");
    expect(panel.style.left).toBe("0.5rem");
    expect(panel.style.right).toBe("0.5rem");
    expect(panel.style.height).toBe("520px");
    expect(panel.style.minHeight).toBe("400px");
    expect(resizeHandle.hidden).toBe(false);
  });
});
