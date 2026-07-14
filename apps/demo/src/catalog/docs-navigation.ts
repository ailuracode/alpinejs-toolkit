import {
  getCatalogEntriesByCategory,
  getCatalogEntriesByFamily,
  getCatalogEntry,
  getDocumentedCatalogEntries,
  getFamiliesByCategory,
  PACKAGE_CATEGORIES,
  type PackageCatalogEntry,
  packageDocsPath,
} from "./index.js";

type SidebarLink = {
  label: string;
  link: string;
};

type SidebarGroup = {
  label: string;
  translations?: Record<string, string>;
  link?: string;
  items?: SidebarEntry[];
  collapsed?: boolean;
};

type SidebarEntry = SidebarLink | SidebarGroup;

function isDocumented(entry: PackageCatalogEntry): boolean {
  return entry.docs?.available !== false;
}

function toSidebarLink(entry: PackageCatalogEntry): SidebarLink {
  return {
    label: entry.title,
    link: packageDocsPath(entry),
  };
}

function buildCategoryDocItems(categoryId: PackageCatalogEntry["category"]): SidebarEntry[] {
  const items: SidebarEntry[] = [];

  for (const family of getFamiliesByCategory(categoryId)) {
    const familyEntries = getCatalogEntriesByFamily(family.id).filter(isDocumented);
    if (familyEntries.length === 0) {
      continue;
    }

    items.push({
      label: family.title,
      collapsed: false,
      items: familyEntries.map(toSidebarLink),
    });
  }

  for (const entry of getCatalogEntriesByCategory(categoryId)) {
    if (entry.family || !isDocumented(entry)) {
      continue;
    }
    items.push(toSidebarLink(entry));
  }

  return items;
}

export function buildDocsSidebar(): SidebarGroup[] {
  const categorySections = PACKAGE_CATEGORIES.flatMap((category) => {
    const items = buildCategoryDocItems(category.id);
    if (items.length === 0) {
      return [];
    }

    return [
      {
        label: category.title,
        items,
      },
    ];
  });

  return [
    {
      label: "Playground",
      translations: { es: "Playground", pt: "Playground" },
      link: "/playground/",
    },
    {
      label: "Guides",
      translations: { es: "Guías", pt: "Guias" },
      items: [
        {
          label: "Getting started",
          translations: { es: "Primeros pasos", pt: "Primeiros passos" },
          link: "/getting-started/",
        },
        {
          label: "Core",
          translations: { es: "Core", pt: "Core" },
          link: "/core/",
        },
        {
          label: "Device detection",
          translations: { es: "Detección de dispositivo", pt: "Detecção de dispositivo" },
          link: "/device-detection/",
        },
        {
          label: "Permissions composition",
          link: "/guides/permissions/",
        },
        {
          label: "Query stack composition",
          link: "/guides/query-stack/",
        },
      ],
    },
    {
      label: "Packages",
      translations: { es: "Paquetes", pt: "Pacotes" },
      link: "/packages/",
    },
    ...categorySections,
  ];
}

export function getAdjacentDocumentedEntries(id: string): {
  prev?: PackageCatalogEntry;
  next?: PackageCatalogEntry;
} {
  const entry = getCatalogEntry(id);
  if (!(entry && isDocumented(entry))) {
    return {};
  }

  const peers = (
    entry.family
      ? getCatalogEntriesByFamily(entry.family)
      : getCatalogEntriesByCategory(entry.category).filter((item) => item.family === undefined)
  ).filter(isDocumented);

  const index = peers.findIndex((item) => item.id === id);
  if (index === -1) {
    return {};
  }

  return {
    prev: index > 0 ? peers[index - 1] : undefined,
    next: index < peers.length - 1 ? peers[index + 1] : undefined,
  };
}

export function getRelatedDocumentedEntries(id: string): PackageCatalogEntry[] {
  const entry = getCatalogEntry(id);
  if (!entry?.related?.length) {
    return [];
  }

  return entry.related
    .map((relatedId) => getCatalogEntry(relatedId))
    .filter(
      (related): related is PackageCatalogEntry => related !== undefined && isDocumented(related)
    );
}

export function getDocumentedEntriesGroupedByCategory(): Array<{
  category: (typeof PACKAGE_CATEGORIES)[number];
  families: Array<{
    family: ReturnType<typeof getFamiliesByCategory>[number];
    entries: PackageCatalogEntry[];
  }>;
  standalone: PackageCatalogEntry[];
}> {
  return PACKAGE_CATEGORIES.map((category) => ({
    category,
    families: getFamiliesByCategory(category.id).map((family) => ({
      family,
      entries: getCatalogEntriesByFamily(family.id).filter(isDocumented),
    })),
    standalone: getCatalogEntriesByCategory(category.id).filter(
      (entry) => entry.family === undefined && isDocumented(entry)
    ),
  })).filter(
    (group) =>
      group.standalone.length > 0 || group.families.some((family) => family.entries.length > 0)
  );
}

export function getDocumentedPackageCount(): number {
  return getDocumentedCatalogEntries().length;
}
