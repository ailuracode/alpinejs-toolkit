import {
  packageDocsPath as catalogDocsPath,
  getCatalogEntriesByCategory,
  getCatalogEntriesByTier,
  getCatalogEntry,
  getDocumentedCatalogEntries,
  getPlaygroundCatalogEntries,
  PACKAGE_CATEGORIES,
  type PackageCatalogEntry,
} from "./catalog/index.js";

export type PluginKind = PackageCatalogEntry["surface"];

export type PluginTier = PackageCatalogEntry["tier"];

export type PluginNavItem = {
  id: string;
  title: string;
  package: string;
  api: string;
  kind: PluginKind;
  tier: PluginTier;
  description: string;
};

export type PluginNavGroup = {
  id: string;
  label: string;
  items: PluginNavItem[];
};

function toNavItem(entry: PackageCatalogEntry): PluginNavItem {
  return {
    id: entry.id,
    title: entry.title,
    package: entry.npmPackage,
    api: entry.api,
    kind: entry.surface,
    tier: entry.tier,
    description: entry.summary,
  };
}

/** Category-grouped navigation derived from the unified package catalog. */
export const PLUGIN_NAV_GROUPS: PluginNavGroup[] = PACKAGE_CATEGORIES.map((category) => ({
  id: category.id,
  label: category.title,
  items: getCatalogEntriesByCategory(category.id)
    .filter((entry) => entry.demo?.available === true)
    .map(toNavItem),
})).filter((group) => group.items.length > 0);

export const PLUGIN_NAV_ITEMS: PluginNavItem[] = getPlaygroundCatalogEntries().map(toNavItem);

export function getPluginsByTier(tier: PluginTier): PluginNavItem[] {
  return getCatalogEntriesByTier(tier).map(toNavItem);
}

export function getPluginNavItem(id: string): PluginNavItem | undefined {
  const entry = getCatalogEntry(id);
  return entry ? toNavItem(entry) : undefined;
}

export function getAdjacentPlugins(id: string): {
  prev?: PluginNavItem;
  next?: PluginNavItem;
} {
  const index = PLUGIN_NAV_ITEMS.findIndex((item) => item.id === id);
  if (index === -1) {
    return {};
  }

  return {
    prev: index > 0 ? PLUGIN_NAV_ITEMS[index - 1] : undefined,
    next: index < PLUGIN_NAV_ITEMS.length - 1 ? PLUGIN_NAV_ITEMS[index + 1] : undefined,
  };
}

export function playgroundPath(id: string): string {
  return `/playground/${id}/`;
}

export function pluginDocsPath(id: string): string {
  const entry = getCatalogEntry(id);
  if (!entry) {
    return `/plugins/${id}/`;
  }
  return catalogDocsPath(entry);
}

/** Package ids with README-backed documentation routes, derived from the catalog. */
export const PLUGIN_DOCS: ReadonlySet<string> = new Set(
  getDocumentedCatalogEntries().map((entry) => entry.id)
);

/** Starlight sidebar entries for plugin doc pages, grouped by tier (legacy until ALP-113). */
export function pluginDocsSidebarItems(tier: PluginTier): { label: string; link: string }[] {
  return getCatalogEntriesByTier(tier)
    .filter((entry) => entry.docs?.available !== false)
    .map((entry) => ({
      label: entry.title,
      link: catalogDocsPath(entry),
    }));
}

export type {
  PackageBadge,
  PackageCatalogEntry,
  PackageCategory,
  PackageCategoryId,
  PackageFamily,
  PackageFamilyId,
  PackageRole,
} from "./catalog/index.js";
export {
  getCatalogEntriesByCategory,
  getCatalogEntriesByFamily,
  getCatalogEntry,
  getFamiliesByCategory,
  getStandaloneEntriesByCategory,
  PACKAGE_CATALOG,
  PACKAGE_CATEGORIES,
  PACKAGE_FAMILIES,
  validateCatalogRelations,
} from "./catalog/index.js";
