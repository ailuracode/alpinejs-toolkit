import { describe, expect, it } from "vitest";
import {
  getDocumentedCatalogEntries,
  getReadmeBackedDocumentedEntries,
  usesGuideDocs,
} from "../src/catalog/index.js";
import { docsEntryId, transformReadmeLinks } from "../src/loaders/combined-docs-loader.js";

describe("combined docs loader helpers", () => {
  it("maps catalog entries to stable Starlight doc ids", () => {
    const ids = getDocumentedCatalogEntries().map((entry) => docsEntryId(entry));
    expect(ids).toContain("core");
    expect(ids).toContain("query");
    expect(ids).toContain("plugins/theme");
    expect(ids).toContain("plugins/gesture");
    expect(ids).toContain("plugins/player");
    expect(ids).not.toContain("plugins/overlay");
  });

  it("keeps English guide docs for core, query, and form", () => {
    const guideEntries = getDocumentedCatalogEntries().filter((entry) => usesGuideDocs(entry));
    expect(guideEntries.map((entry) => entry.id)).toEqual(["core", "form", "query"]);
    expect(getReadmeBackedDocumentedEntries().map((entry) => docsEntryId(entry))).not.toContain(
      "core"
    );
    expect(getReadmeBackedDocumentedEntries().map((entry) => docsEntryId(entry))).not.toContain(
      "query"
    );
    expect(getReadmeBackedDocumentedEntries().map((entry) => docsEntryId(entry))).not.toContain(
      "plugins/form"
    );
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
});
