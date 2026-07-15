import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { docsLoader } from "@astrojs/starlight/loaders";
import type { Loader, LoaderContext } from "astro/loaders";
import {
  getAdjacentDocumentedEntries,
  getRelatedDocumentedEntries,
} from "../catalog/docs-navigation.js";
import {
  getReadmeBackedDocumentedEntries,
  type PackageCatalogEntry,
  packageDocsPath,
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

const GITHUB_SOURCE_BASE = "https://github.com/ailuracode/alpinejs-toolkit/blob/master/packages";

export function transformReadmeLinks(content: string): string {
  return content
    .replace(/\]\(\.\.\/\.\.\/docs\/plugins\/([^)#]+)(#[^)]+)?\)/g, "](/plugins/$1/$2)")
    .replace(/\]\(\.\.\/\.\.\/docs\/([^)#]+)(#[^)]+)?\)/g, "](/$1/$2)")
    .replace(/\]\(\.\.\/\.\.\/packages\/([^/#)]+)\/README\.md(#[^)]+)?\)/g, "](/plugins/$1/$2)")
    .replace(/\]\(\.\.\/([^/#)]+)\/README\.md(#[^)]+)?\)/g, "](/plugins/$1/$2)")
    .replace(/\]\(\.\/([^)#]+)\.md(#[^)]+)?\)/g, "](/plugins/$1/$2)")
    .replace(/\]\(\.\.\/([^)#]+)\.md(#[^)]+)?\)/g, "](/$1/$2)")
    .replace(/\]\(\.\.\/packages\/([^/]+)\/src\/([^)]+)\)/g, `](${GITHUB_SOURCE_BASE}/$1/src/$2)`);
}

function appendRelatedPackages(body: string, entry: PackageCatalogEntry): string {
  const related = getRelatedDocumentedEntries(entry.id);
  if (related.length === 0) {
    return body;
  }

  const lines = related.map((relatedEntry) => {
    const href = packageDocsPath(relatedEntry);
    return `- [${relatedEntry.title}](${href}) — ${relatedEntry.summary}`;
  });

  return `${body}\n\n## Related packages\n\n${lines.join("\n")}\n`;
}

function paginationForEntry(entry: PackageCatalogEntry) {
  const { prev, next } = getAdjacentDocumentedEntries(entry.id);
  return {
    ...(prev
      ? {
          prev: {
            label: prev.title,
            link: packageDocsPath(prev),
          },
        }
      : {}),
    ...(next
      ? {
          next: {
            label: next.title,
            link: packageDocsPath(next),
          },
        }
      : {}),
  };
}

async function loadPackageReadmeDocs(context: LoaderContext): Promise<void> {
  for (const entry of getReadmeBackedDocumentedEntries()) {
    const docId = docsEntryId(entry);
    const readmePath = path.join(REPO_ROOT, entry.readmePath);

    if (!existsSync(readmePath)) {
      throw new Error(`Missing README for catalog entry "${entry.id}": ${readmePath}`);
    }

    const raw = readFileSync(readmePath, "utf8");
    const body = appendRelatedPackages(transformReadmeLinks(stripReadmeTitle(raw)), entry);
    const digest = context.generateDigest(body);
    const existing = context.store.get(docId);
    const relativeReadmePath = path.posix.join("..", "..", "packages", entry.folder, "README.md");

    const parsedData = await context.parseData({
      id: docId,
      data: {
        title: entry.title,
        description: `Package: ${entry.npmPackage}`,
        editUrl: `${PACKAGE_EDIT_BASE}/${entry.folder}/README.md`,
        ...paginationForEntry(entry),
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

function removeEnglishDocsReplacedByReadme(context: LoaderContext): void {
  for (const entry of getReadmeBackedDocumentedEntries()) {
    context.store.delete(docsEntryId(entry));
  }
}

/** Loads Starlight guides from docs/ and package reference pages from package READMEs. */
export function combinedDocsLoader(): Loader {
  const starlightDocsLoader = docsLoader();

  return {
    name: "combined-starlight-docs-loader",
    async load(context) {
      await starlightDocsLoader.load(context);
      removeEnglishDocsReplacedByReadme(context);
      await loadPackageReadmeDocs(context);
    },
  };
}
