import { describe, expect, it } from "vitest";
import { getDocumentedCatalogEntries } from "../src/catalog/index.js";
import { docsEntryId } from "../src/loaders/combined-docs-loader.js";

describe("combined docs loader helpers", () => {
  it("maps catalog entries to stable Starlight doc ids", () => {
    const ids = getDocumentedCatalogEntries().map((entry) => docsEntryId(entry));
    expect(ids).toContain("core");
    expect(ids).toContain("query");
    expect(ids).toContain("plugins/theme");
    expect(ids).toContain("plugins/gesture");
    expect(ids).not.toContain("plugins/overlay");
  });
});
