import { describe, expect, it } from "vitest";
import { applyResponsiveLayout, isCompactLayout } from "../src/devtools/responsive-layout.js";

function createTargets(position: "bottom" | "right" = "bottom") {
  return {
    panel: document.createElement("section"),
    resizeHandle: document.createElement("div"),
    headerToolbar: document.createElement("div"),
    toolbarTop: document.createElement("div"),
    toolbarBottom: document.createElement("div"),
    body: document.createElement("div"),
    list: document.createElement("div"),
    searchInput: document.createElement("input"),
    adapterSelect: document.createElement("select"),
    sortSelect: document.createElement("select"),
    tabs: document.createElement("div"),
    queriesTab: document.createElement("button"),
    mutationsTab: document.createElement("button"),
    position,
  };
}

describe("query devtools responsive layout", () => {
  it("switches to compact layout on narrow panels", () => {
    const targets = createTargets("bottom");
    applyResponsiveLayout(targets, true, 520);

    expect(isCompactLayout()).toBe(true);
    expect(targets.body.style.gridTemplateColumns).toBe("1fr");
    expect(targets.body.style.gridTemplateRows).toBe("1fr");
    expect(targets.searchInput.style.width).toBe("100%");
    expect(targets.panel.style.width).toBe("auto");
    expect(targets.panel.style.left).toBe("0.5rem");
    expect(targets.panel.style.right).toBe("0.5rem");
    expect(targets.panel.style.height).toBe("520px");
    expect(targets.panel.style.minHeight).toBe("400px");
    expect(targets.resizeHandle.hidden).toBe(false);
  });

  it("applies compact layout for right-positioned panels", () => {
    const targets = createTargets("right");
    applyResponsiveLayout(targets, true);

    expect(isCompactLayout()).toBe(true);
    expect(targets.body.style.gridTemplateRows).toBe("1fr");
  });

  it("applies non-compact layout for right-positioned panels", () => {
    const targets = createTargets("right");
    applyResponsiveLayout(targets, false);

    expect(isCompactLayout()).toBe(false);
    expect(targets.body.style.gridTemplateRows).toContain("minmax");
  });

  it("applies non-compact bottom layout", () => {
    const targets = createTargets("bottom");
    applyResponsiveLayout(targets, false);

    expect(isCompactLayout()).toBe(false);
    expect(targets.resizeHandle.hidden).toBe(true);
  });

  it("handles null mobilePanelHeight for compact bottom layout", () => {
    const targets = createTargets("bottom");
    applyResponsiveLayout(targets, true, null);

    // height is resolved from null fallback
    expect(isCompactLayout()).toBe(true);
  });
});
