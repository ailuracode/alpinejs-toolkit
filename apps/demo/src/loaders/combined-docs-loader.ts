import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { docsLoader } from "@astrojs/starlight/loaders";
import type { Loader, LoaderContext } from "astro/loaders";
import {
  getDocumentedCatalogEntries,
  type PackageCatalogEntry,
  packageDocsRouteId,
} from "../catalog/index.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const PACKAGE_EDIT_BASE = "https://github.com/ailuracode/alpinejs-toolkit/edit/master/packages";

export function docsEntryId(entry: PackageCatalogEntry): string {
  const routeId = packageDocsRouteId(entry);
  if (routeId === "core" || routeId === "query") {
    return routeId;
  }
  return `plugins/${routeId}`;
}

function stripReadmeTitle(content: string): string {
  const lines = content.split("\n");
  if (!lines[0]?.startsWith("# ")) {
    return content;
  }

  const rest = lines.slice(1);
  while (rest[0]?.trim() === "") {
    rest.shift();
  }
  return rest.join("\n");
}

function transformReadmeLinks(content: string): string {
  return content
    .replace(/\]\(\.\.\/\.\.\/docs\/plugins\/([^)#]+)(#[^)]+)?\)/g, "](/plugins/$1/$2)")
    .replace(/\]\(\.\.\/\.\.\/docs\/([^)#]+)(#[^)]+)?\)/g, "](/$1/$2)")
    .replace(/\]\(\.\.\/\.\.\/packages\/([^/#)]+)\/README\.md(#[^)]+)?\)/g, "](/plugins/$1/$2)")
    .replace(/\]\(\.\.\/([^/#)]+)\/README\.md(#[^)]+)?\)/g, "](/plugins/$1/$2)");
}

async function loadPackageReadmeDocs(context: LoaderContext): Promise<void> {
  for (const entry of getDocumentedCatalogEntries()) {
    const docId = docsEntryId(entry);
    const readmePath = path.join(REPO_ROOT, entry.readmePath);

    if (!existsSync(readmePath)) {
      throw new Error(`Missing README for catalog entry "${entry.id}": ${readmePath}`);
    }

    const raw = readFileSync(readmePath, "utf8");
    const body = transformReadmeLinks(stripReadmeTitle(raw));
    const digest = context.generateDigest(body);
    const existing = context.store.get(docId);
    const relativeReadmePath = path.posix.join("..", "..", "packages", entry.folder, "README.md");

    const parsedData = await context.parseData({
      id: docId,
      data: {
        title: entry.title,
        description: `Package: ${entry.npmPackage}`,
        editUrl: `${PACKAGE_EDIT_BASE}/${entry.folder}/README.md`,
      },
      filePath: relativeReadmePath,
    });

    if (existing?.digest === digest && existing.body) {
      continue;
    }

    context.store.set({
      id: docId,
      data: parsedData,
      body,
      filePath: relativeReadmePath,
      digest,
      deferredRender: true,
    });
  }
}

function removeEnglishPluginDocCopies(context: LoaderContext): void {
  for (const id of [...context.store.keys()]) {
    if (id.startsWith("plugins/")) {
      context.store.delete(id);
    }
  }
}

/** Loads Starlight guides from docs/ and package reference pages from package READMEs. */
export function combinedDocsLoader(): Loader {
  const starlightDocsLoader = docsLoader();

  return {
    name: "combined-starlight-docs-loader",
    async load(context) {
      await starlightDocsLoader.load(context);
      removeEnglishPluginDocCopies(context);
      await loadPackageReadmeDocs(context);
    },
  };
}
