import { PACKAGE_CATALOG } from "./entries.js";
import { PACKAGE_CATEGORIES, PACKAGE_FAMILIES } from "./metadata.js";
import type {
  PackageCatalogEntry,
  PackageCategory,
  PackageCategoryId,
  PackageFamily,
  PackageFamilyId,
  PackageTier,
} from "./types.js";

export type { PackageCatalogEntry, PackageCategory, PackageFamily } from "./types.js";
export { PACKAGE_CATALOG, PACKAGE_CATEGORIES, PACKAGE_FAMILIES };

const catalogById = new Map(PACKAGE_CATALOG.map((item) => [item.id, item]));

export function getCatalogEntry(id: string): PackageCatalogEntry | undefined {
  return catalogById.get(id);
}

export function getCatalogEntries(): readonly PackageCatalogEntry[] {
  return PACKAGE_CATALOG;
}

export function getCatalogEntriesByCategory(category: PackageCategoryId): PackageCatalogEntry[] {
  return PACKAGE_CATALOG.filter((item) => item.category === category).sort(
    (a, b) => a.order - b.order
  );
}

export function getCatalogEntriesByFamily(family: PackageFamilyId): PackageCatalogEntry[] {
  return PACKAGE_CATALOG.filter((item) => item.family === family).sort((a, b) => a.order - b.order);
}

export function getCatalogEntriesByTier(tier: PackageTier): PackageCatalogEntry[] {
  return PACKAGE_CATALOG.filter((item) => item.tier === tier).sort((a, b) => {
    const aCategoryOrder = getCategory(a.category)?.order ?? 0;
    const bCategoryOrder = getCategory(b.category)?.order ?? 0;
    if (aCategoryOrder !== bCategoryOrder) {
      return aCategoryOrder - bCategoryOrder;
    }
    return a.order - b.order;
  });
}

export function getCategory(id: PackageCategoryId): PackageCategory | undefined {
  return PACKAGE_CATEGORIES.find((category) => category.id === id);
}

export function getFamily(id: PackageFamilyId): PackageFamily | undefined {
  return PACKAGE_FAMILIES.find((family) => family.id === id);
}

export function getFamiliesByCategory(category: PackageCategoryId): PackageFamily[] {
  return PACKAGE_FAMILIES.filter((family) => family.category === category).sort(
    (a, b) => a.order - b.order
  );
}

export function getStandaloneEntriesByCategory(category: PackageCategoryId): PackageCatalogEntry[] {
  return getCatalogEntriesByCategory(category).filter((item) => item.family === undefined);
}

export function getDocumentedCatalogEntries(): PackageCatalogEntry[] {
  return PACKAGE_CATALOG.filter((item) => item.docs?.available !== false);
}

export function getPlaygroundCatalogEntries(): PackageCatalogEntry[] {
  return PACKAGE_CATALOG.filter((item) => item.demo?.available === true);
}

export function packageDocsRouteId(entry: PackageCatalogEntry): string {
  return entry.docs?.routeId ?? entry.id;
}

export function packageDocsPath(entry: PackageCatalogEntry): string {
  const routeId = packageDocsRouteId(entry);
  if (routeId === "core") {
    return "/core/";
  }
  if (routeId === "query") {
    return "/query/";
  }
  return `/plugins/${routeId}/`;
}

export function playgroundPath(entry: PackageCatalogEntry): string {
  return `/playground/${entry.id}/`;
}

function validateEntryRelations(entry: PackageCatalogEntry, ids: ReadonlySet<string>): string[] {
  const errors: string[] = [];

  for (const relatedId of entry.related ?? []) {
    if (!ids.has(relatedId)) {
      errors.push(`${entry.id}: unknown related package "${relatedId}"`);
    }
  }

  for (const requiredId of entry.requires ?? []) {
    if (!(ids.has(requiredId) || requiredId.startsWith("@"))) {
      errors.push(`${entry.id}: unknown required package "${requiredId}"`);
    }
  }

  if (entry.family && !getFamily(entry.family)) {
    errors.push(`${entry.id}: unknown family "${entry.family}"`);
  }

  if (!getCategory(entry.category)) {
    errors.push(`${entry.id}: unknown category "${entry.category}"`);
  }

  return errors;
}

function validateEntryOrdering(): string[] {
  const errors: string[] = [];
  const positions = new Map<string, string>();

  for (const entry of PACKAGE_CATALOG) {
    const key = `${entry.category}:${entry.family ?? "_"}:${entry.order}`;
    const existing = positions.get(key);
    if (existing) {
      errors.push(
        `${entry.id}: duplicate order ${entry.order} in ${key} (also used by ${existing})`
      );
    }
    positions.set(key, entry.id);
  }

  return errors;
}

export function validateCatalogRelations(): string[] {
  const ids = new Set(PACKAGE_CATALOG.map((item) => item.id));
  const relationErrors = PACKAGE_CATALOG.flatMap((entry) => validateEntryRelations(entry, ids));
  return [...relationErrors, ...validateEntryOrdering()];
}
