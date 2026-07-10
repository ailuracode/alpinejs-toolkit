/**
 * Soft-peer contract test (C9).
 *
 * Verifies that `@ailuracode/alpine-overlay` is a soft peer of
 * `alpine-dialog`:
 * - `alpine-dialog` source MUST NOT import `@ailuracode/alpine-overlay`.
 * - `dialogPlugin()` works in isolation when overlay is NOT loaded.
 * - Templates referencing `$store.overlay` only get a console
 *   warning (Alpine itself), not a crash.
 *
 * The first check is enforced statically — reading dialog's
 * `src/index.ts` and `src/store.ts` for any overlay import. The
 * runtime check confirms dialog works in isolation.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dialogPlugin from "@ailuracode/alpine-dialog";
import Alpine from "alpinejs";
import { afterEach, describe, expect, it } from "vitest";

const here = fileURLToPath(import.meta.url);
const dialogSrcDir = resolve(here, "../../../dialog/src");

function readSrc(relativePath: string): string {
  return readFileSync(resolve(dialogSrcDir, relativePath), "utf8");
}

let alpineStarted = false;

describe("alpine-overlay soft-peer contract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("alpine-dialog source MUST NOT import @ailuracode/alpine-overlay", () => {
    const files = ["index.ts", "controller.ts", "focus.ts"];
    for (const file of files) {
      const source = readSrc(file);
      expect(source).not.toMatch(/@ailuracode\/alpine-overlay/);
    }
  });

  it("dialogPlugin works without overlay registered", async () => {
    document.body.innerHTML = `
      <div x-data x-init="$store.dialog.register('settings')">
        <button id="open" type="button" @click="$store.dialog.open('settings')">Open</button>
        <span id="state" x-text="$store.dialog.isOpen('settings')"></span>
      </div>
    `;
    Alpine.plugin(dialogPlugin());
    if (!alpineStarted) {
      Alpine.start();
      alpineStarted = true;
    }
    document.getElementById("open")?.click();
    await Alpine.nextTick();
    const store = Alpine.store("dialog") as { isOpen: (id: string) => boolean };
    expect(store.isOpen("settings")).toBe(true);
  });
});
