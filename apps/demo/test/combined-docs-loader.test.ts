import { describe, expect, it } from "vitest";
import {
  getDocumentedCatalogEntries,
  getReadmeBackedDocumentedEntries,
  usesGuideDocs,
} from "../src/catalog/index.js";
import {
  docsContentEditUrl,
  docsEntryId,
  packageReadmeEditUrl,
  transformReadmeLinks,
} from "../src/loaders/combined-docs-loader.js";

describe("combined docs loader helpers", () => {
  it("maps catalog entries to stable Starlight doc ids", () => {
    const ids = getDocumentedCatalogEntries().map((entry) => docsEntryId(entry));
    expect(ids).toContain("core");
    expect(ids).toContain("query");
    expect(ids).toContain("plugins/theme");
    expect(ids).toContain("plugins/gesture");
    expect(ids).toContain("plugins/overlay");
    expect(ids).toContain("plugins/collection");
    expect(ids).toContain("plugins/realtime");
  });

  it("serves package reference pages from READMEs", () => {
    const readmeBacked = getReadmeBackedDocumentedEntries().map((entry) => docsEntryId(entry));
    expect(readmeBacked).toContain("core");
    expect(readmeBacked).toContain("query");
    expect(readmeBacked).toContain("plugins/form");
    expect(getDocumentedCatalogEntries().filter((entry) => usesGuideDocs(entry))).toEqual([]);
  });

  it("rewrites relative README links to site routes", () => {
    const transformed = transformReadmeLinks(
      [
        "See [env](./env.md) and [attention](./attention.md).",
        "See [device](../device-detection.md).",
        "See [query](../query.md).",
      ].join("\n")
    );

    expect(transformed).toContain("](/plugins/env/)");
    expect(transformed).toContain("](/plugins/attention/)");
    expect(transformed).toContain("](/device-detection/)");
    expect(transformed).toContain("](/query/)");
  });

  it("builds GitHub edit URLs for README-backed and Starlight docs content", () => {
    expect(packageReadmeEditUrl("overlay")).toBe(
      "https://github.com/ailuracode/alpinejs-toolkit/edit/master/packages/overlay/README.md"
    );
    expect(docsContentEditUrl("getting-started.md")).toBe(
      "https://github.com/ailuracode/alpinejs-toolkit/edit/master/docs/getting-started.md"
    );
    expect(docsContentEditUrl("plugins/toggle.md")).toBe(
      "https://github.com/ailuracode/alpinejs-toolkit/edit/master/docs/plugins/toggle.md"
    );
  });
});
