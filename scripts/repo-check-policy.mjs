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

  /**
   * Dependency direction boundaries for infrastructure packages.
   * Packages listed here are validated to NOT import higher-level toolkit
   * packages. The value lists the packages they ARE allowed to import from
   * `@ailuracode/alpine-*` (empty = none).
   */
  depBoundaries: {
    /** `alpine-ui` must not import any higher-level toolkit package. */
    ui: [],
  },
};
