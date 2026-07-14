import {
  getCatalogEntriesByCategory,
  getCatalogEntriesByFamily,
  getCatalogEntry,
  getFamiliesByCategory,
  getPlaygroundCatalogEntries,
  PACKAGE_CATEGORIES,
  type PackageCatalogEntry,
  type PackageCategoryId,
  type PackageFamilyId,
} from "./index.js";

export type PlaygroundSidebarFamily = {
  id: PackageFamilyId;
  title: string;
  entries: PackageCatalogEntry[];
};

export type PlaygroundSidebarCategory = {
  id: PackageCategoryId;
  title: string;
  summary: string;
  families: PlaygroundSidebarFamily[];
  standalone: PackageCatalogEntry[];
};

function hasDemo(entry: PackageCatalogEntry): boolean {
  return entry.demo?.available === true;
}

export function playgroundCategoryPath(categoryId: PackageCategoryId): string {
  return `/playground/${categoryId}/`;
}

export function playgroundFamilyPath(
  categoryId: PackageCategoryId,
  familyId: PackageFamilyId
): string {
  return `/playground/${categoryId}/${familyId}/`;
}

export function playgroundPackagePath(entry: PackageCatalogEntry | string): string {
  const id = typeof entry === "string" ? entry : entry.id;
  return `/playground/${id}/`;
}

export function buildPlaygroundSidebar(): PlaygroundSidebarCategory[] {
  return PACKAGE_CATEGORIES.map((category) => ({
    id: category.id,
    title: category.title,
    summary: category.summary,
    families: getFamiliesByCategory(category.id)
      .map((family) => ({
        id: family.id,
        title: family.title,
        entries: getCatalogEntriesByFamily(family.id).filter(hasDemo),
      }))
      .filter((family) => family.entries.length > 0),
    standalone: getCatalogEntriesByCategory(category.id).filter(
      (entry) => entry.family === undefined && hasDemo(entry)
    ),
  })).filter((category) => category.families.length > 0 || category.standalone.length > 0);
}

export function getPlaygroundPeers(id: string): PackageCatalogEntry[] {
  const entry = getCatalogEntry(id);
  if (!(entry && hasDemo(entry))) {
    return [];
  }

  if (entry.family) {
    return getCatalogEntriesByFamily(entry.family).filter(hasDemo);
  }

  return getCatalogEntriesByCategory(entry.category).filter(
    (peer) => peer.family === undefined && hasDemo(peer)
  );
}

export function getAdjacentPlaygroundEntries(id: string): {
  prev?: PackageCatalogEntry;
  next?: PackageCatalogEntry;
} {
  const peers = getPlaygroundPeers(id);
  const index = peers.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return {};
  }

  return {
    prev: index > 0 ? peers[index - 1] : undefined,
    next: index < peers.length - 1 ? peers[index + 1] : undefined,
  };
}

export function getPlaygroundBreadcrumbs(id: string): Array<{ label: string; href: string }> {
  const entry = getCatalogEntry(id);
  if (!entry) {
    return [{ label: "Playground", href: "/playground/" }];
  }

  const crumbs = [
    { label: "Playground", href: "/playground/" },
    {
      label:
        PACKAGE_CATEGORIES.find((category) => category.id === entry.category)?.title ??
        entry.category,
      href: playgroundCategoryPath(entry.category),
    },
  ];

  if (entry.family) {
    const family = getFamiliesByCategory(entry.category).find((item) => item.id === entry.family);
    if (family) {
      crumbs.push({
        label: family.title,
        href: playgroundFamilyPath(entry.category, entry.family),
      });
    }
  }

  crumbs.push({ label: entry.title, href: playgroundPackagePath(entry) });
  return crumbs;
}

export function getPlaygroundCategoryGroups(): PlaygroundSidebarCategory[] {
  return buildPlaygroundSidebar();
}

export function getPlaygroundDemoCount(): number {
  return getPlaygroundCatalogEntries().length;
}
