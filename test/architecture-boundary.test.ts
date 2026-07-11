/**
 * Architecture boundary — no public barrel may re-export from
 * `src/internal/`. The internal/ directory is reserved for
 * package-private helpers and any leak through the public surface
 * breaks the architecture's visibility contract.
 *
 * Scoped to packages fixed by ALP-30:
 *   core, lang, media, theme.
 *
 * Follow-up packages whose barrels still import from `src/internal/`
 * (env, sidebar, scroll, child, toggle) are tracked separately — they
 * were intentionally out of scope for ALP-30. When the audit expands,
 * add the package to `AUDITED_PACKAGES` and move its public modules
 * up. The audited-pacakges gate ensures regressions in this issue's
 * scope can't slip back in.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDITED_PACKAGES = ["core", "lang", "media", "theme"] as const;

const FROM_INTERNAL_RE = /\bfrom\s+["'](?:\.\/|\.\.\/)internal\//;

function readBarrel(packageName: string): string {
  return readFileSync(path.join(root, "packages", packageName, "src", "index.ts"), "utf-8");
}

describe("architecture: no internal/ re-exports from barrel", () => {
  for (const packageName of AUDITED_PACKAGES) {
    it(`${packageName}/src/index.ts has no './internal/' import`, () => {
      const barrel = readBarrel(packageName);
      const violations = barrel
        .split(/\r?\n/)
        .map((line, index) => ({ line, index: index + 1 }))
        .filter(({ line }) => FROM_INTERNAL_RE.test(line));

      expect(violations).toEqual([]);
    });
  }
});
