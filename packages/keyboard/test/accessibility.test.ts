/**
 * Accessibility notes for `@ailuracode/alpine-keyboard`.
 *
 * - Shortcuts MUST be discoverable: expose `commands` metadata (`label`, `description`, `group`)
 *   and render help UI in the host application. This package does not render help surfaces.
 * - Avoid single-key global bindings that conflict with assistive technology or browser defaults.
 * - Prefer chord shortcuts (`mod+k`) over bare letters for global actions.
 * - When multiple shortcuts share a chord, the highest `priority` registration wins; listen for
 *   `conflict` events during development to detect collisions.
 * - Use scoped shortcuts in overlays (`activateScope('dialog')`) so global bindings pause via
 *   `pauseWhileScopesActive` and do not trap users inside modal contexts.
 * - Default editable-target filtering keeps typing shortcuts out of inputs; opt in with
 *   `allowInEditable` only for editor-specific scopes.
 */

import { describe, expect, it, vi } from "vitest";
import { createKeyboard } from "../src/controller.js";

describe("@ailuracode/alpine-keyboard accessibility", () => {
  it("exposes command metadata for discovery UIs", () => {
    const keyboard = createKeyboard();
    keyboard.register("mod+/", vi.fn(), {
      id: "help",
      metadata: {
        label: "Show keyboard help",
        description: "Opens the shortcut reference panel",
        group: "Global",
      },
    });

    const command = keyboard.commands.find((entry) => entry.id === "help");
    expect(command?.label).toBe("Show keyboard help");
    expect(command?.description).toContain("shortcut reference");
    keyboard.destroy();
  });

  it("documents conflict events for keyboard-only auditing", () => {
    const keyboard = createKeyboard();
    const conflicts: string[] = [];

    keyboard.on("conflict", ({ winnerId, loserId }) => {
      conflicts.push(`${winnerId}:${loserId}`);
    });

    keyboard.register("mod+k", vi.fn(), { id: "primary", priority: 2 });
    keyboard.register("mod+k", vi.fn(), { id: "secondary", priority: 1 });

    expect(conflicts).toEqual(["primary:secondary"]);
    keyboard.destroy();
  });
});
