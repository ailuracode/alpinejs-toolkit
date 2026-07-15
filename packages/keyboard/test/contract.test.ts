import { afterEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import keyboardPlugin, { createKeyboard } from "../src/index.js";

describe("@ailuracode/alpine-keyboard contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("imports without browser globals", async () => {
    await expect(import("../src/index.js")).resolves.toBeDefined();
  });

  it("registers $store.keyboard and $keyboard magic", () => {
    const plugin = keyboardPlugin({
      shortcuts: [
        {
          shortcut: "mod+shift+p",
          handler: vi.fn(),
          options: { id: "palette", metadata: { label: "Palette" } },
        },
      ],
    });
    const Alpine = startAlpine(plugin);

    const store = Alpine.store("keyboard") as import("../src/types.js").KeyboardStore;
    expect(store.commands.some((command) => command.id === "palette")).toBe(true);
    expect(Alpine.store("keyboard")).toBe(store);
  });

  it("does not duplicate listeners when plugin mounts twice", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const controller = createKeyboard();
    const before = addSpy.mock.calls.filter(([type]) => type === "keydown").length;

    const plugin = keyboardPlugin({ controller });
    const Alpine = startAlpine(plugin);
    Alpine.plugin(plugin);

    const after = addSpy.mock.calls.filter(([type]) => type === "keydown").length;
    expect(after).toBe(before);

    controller.destroy();
    addSpy.mockRestore();
  });
});
