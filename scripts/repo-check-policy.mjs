/**
 * Explicit exclusions for repository consistency checks.
 * Packages listed here are still discovered from each packages folder manifest.
 */
export const REPO_CHECK_POLICY = {
  /** Internal packages omitted from README and AGENTS package catalogs. */
  catalogExcluded: ["ui"],

  /** Packages not required in the demo app (package.json, tsconfig, astro aliases). */
  demoExcluded: ["ui"],

  /** Packages not required to have tests under packages/<name>/test/. */
  testExcluded: [],
};
