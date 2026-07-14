import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getDocumentedCatalogEntries, packageDocsRouteId } from "../src/catalog/index.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DOCS_ROOT = path.join(REPO_ROOT, "docs");

const LOCALES = ["es", "pt"] as const;

const GUIDE_PAGES = ["guides/permissions.md", "guides/query-stack.md"] as const;

const ROOT_PAGES = [
  "core.md",
  "getting-started.md",
  "device-detection.md",
  "query.md",
  "packages.md",
] as const;

function pluginTranslationPath(locale: (typeof LOCALES)[number], routeId: string): string {
  if (routeId === "core" || routeId === "query") {
    return path.join(DOCS_ROOT, locale, `${routeId}.md`);
  }
  return path.join(DOCS_ROOT, locale, "plugins", `${routeId}.md`);
}

describe("docs translations", () => {
  it("has Spanish and Portuguese plugin pages for every documented catalog entry", () => {
    const missing: string[] = [];

    for (const entry of getDocumentedCatalogEntries()) {
      const routeId = packageDocsRouteId(entry);
      for (const locale of LOCALES) {
        const filePath = pluginTranslationPath(locale, routeId);
        if (!existsSync(filePath)) {
          missing.push(`${locale}/${routeId}`);
        }
      }
    }

    expect(missing, `Missing translated plugin docs: ${missing.join(", ")}`).toEqual([]);
  });

  it("has Spanish and Portuguese root guide pages", () => {
    const missing: string[] = [];

    for (const locale of LOCALES) {
      for (const page of [...ROOT_PAGES, ...GUIDE_PAGES]) {
        const filePath = path.join(DOCS_ROOT, locale, page);
        if (!existsSync(filePath)) {
          missing.push(`${locale}/${page}`);
        }
      }
    }

    expect(missing, `Missing translated guide pages: ${missing.join(", ")}`).toEqual([]);
  });
});
