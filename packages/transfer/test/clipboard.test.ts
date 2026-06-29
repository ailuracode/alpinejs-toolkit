import { describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import {
  type ClipboardCopyText,
  type ClipboardMagic,
  copyToClipboard,
  registerClipboardMagic,
} from "../src/clipboard.js";

function installClipboardApi(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  return writeText;
}

function installLegacyCopy(execCommand = vi.fn().mockReturnValue(true)) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    writable: true,
    value: execCommand,
  });
  const select = vi.spyOn(HTMLTextAreaElement.prototype, "select").mockImplementation(vi.fn());

  return { execCommand, select };
}

describe("@ailuracode/alpine-transfer", () => {
  it("copies text via navigator.clipboard by default", async () => {
    const writeText = installClipboardApi();

    const { clipboard } = createMagicHarness(registerClipboardMagic) as {
      clipboard: ClipboardMagic;
    };
    await clipboard("hola");

    expect(writeText).toHaveBeenCalledWith("hola");
  });

  it("coerces values to string", async () => {
    const writeText = installClipboardApi();

    const { clipboard } = createMagicHarness(registerClipboardMagic) as {
      clipboard: ClipboardMagic;
    };
    await clipboard(42 satisfies ClipboardCopyText);

    expect(writeText).toHaveBeenCalledWith("42");
  });

  it("falls back to execCommand in auto mode when the Clipboard API is unavailable", async () => {
    const { execCommand, select } = installLegacyCopy();

    const { clipboard } = createMagicHarness(registerClipboardMagic) as {
      clipboard: ClipboardMagic;
    };
    await clipboard("fallback");

    expect(execCommand).toHaveBeenCalledWith("copy", false);
    expect(select).toHaveBeenCalled();
    select.mockRestore();
  });

  it("forces legacy copy when mode is legacy", async () => {
    const writeText = installClipboardApi();
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      writable: true,
      value: execCommand,
    });
    const select = vi.spyOn(HTMLTextAreaElement.prototype, "select").mockImplementation(vi.fn());

    await copyToClipboard("legacy-only", "legacy");

    expect(execCommand).toHaveBeenCalledWith("copy", false);
    expect(writeText).not.toHaveBeenCalled();
    select.mockRestore();
  });

  it("forces Clipboard API when mode is clipboard", async () => {
    const writeText = installClipboardApi();

    await copyToClipboard("modern", { mode: "clipboard" });

    expect(writeText).toHaveBeenCalledWith("modern");
  });

  it("accepts mode shorthand as the second argument", async () => {
    const writeText = installClipboardApi();

    await copyToClipboard("modern", "clipboard");

    expect(writeText).toHaveBeenCalledWith("modern");
  });

  it("throws when clipboard mode is requested but the API is unavailable", async () => {
    installLegacyCopy();

    await expect(copyToClipboard("nope", "clipboard")).rejects.toThrow(
      "Clipboard API is not available"
    );
  });

  it("throws when legacy copy fails in legacy mode", async () => {
    installLegacyCopy(vi.fn().mockReturnValue(false));

    await expect(copyToClipboard("failed", "legacy")).rejects.toThrow(
      "Failed to copy to clipboard"
    );
  });

  it("does not throw in auto mode when legacy copy fails", async () => {
    installLegacyCopy(vi.fn().mockReturnValue(false));

    await expect(copyToClipboard("failed")).resolves.toBeUndefined();
  });
});
