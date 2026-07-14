export type PackageCategoryId =
  | "runtime-composition"
  | "application-shell"
  | "browser-capabilities"
  | "interaction-primitives"
  | "headless-ui"
  | "data-networking";

export type PackageFamilyId = "permissions" | "query-stack";

export type PackageRole =
  | "foundation"
  | "feature"
  | "capability"
  | "adapter"
  | "bundle"
  | "standalone";

export type PackageBadge =
  | "recommended"
  | "specialized"
  | "browser-only"
  | "infrastructure"
  | "adapter"
  | "bundle";

export type PackageSurface = "store" | "magic" | "directive" | "core";

/** Legacy tier used by Starlight sidebar until ALP-113 migrates navigation. */
export type PackageTier = "essential" | "extended" | "advanced" | "headless";

export type PackageCatalogEntry = {
  id: string;
  title: string;
  npmPackage: string;
  folder: string;
  category: PackageCategoryId;
  family?: PackageFamilyId;
  role: PackageRole;
  surface: PackageSurface;
  api: string;
  summary: string;
  readmePath: string;
  tier: PackageTier;
  order: number;
  badges?: readonly PackageBadge[];
  related?: readonly string[];
  requires?: readonly string[];
  demo?: {
    available: boolean;
    componentId?: string;
  };
  docs?: {
    /** Whether a README-backed documentation page is available. */
    available: boolean;
    /** Override route slug when it differs from the package id. */
    routeId?: string;
  };
};

export type PackageCategory = {
  id: PackageCategoryId;
  title: string;
  summary: string;
  order: number;
};

export type PackageFamily = {
  id: PackageFamilyId;
  category: PackageCategoryId;
  title: string;
  summary: string;
  order: number;
};
