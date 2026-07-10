export interface DiscoveredPackage {
  folder: string;
  name: string;
  dir: string;
  manifest: Record<string, unknown>;
  isPrivate: boolean;
}

export interface RepoCheckOptions {
  root?: string;
  packagesDir?: string;
  requireBuilt?: boolean;
}

export interface RepoCheckResult {
  ok: boolean;
  errors: string[];
  packages: DiscoveredPackage[];
  catalogCount: number;
}

export function discoverPackages(packagesDir: string): DiscoveredPackage[];
export function catalogPackages(packages: DiscoveredPackage[]): DiscoveredPackage[];
export function demoPackages(packages: DiscoveredPackage[]): DiscoveredPackage[];
export function publishablePackages(packages: DiscoveredPackage[]): DiscoveredPackage[];
export function readMarkdownPackageNames(filePath: string): Set<string>;
export function diffSurface(
  actual: Set<string>,
  expected: Iterable<DiscoveredPackage>,
  surface: string
): string[];
export function runRepoCheck(options?: RepoCheckOptions): RepoCheckResult;
