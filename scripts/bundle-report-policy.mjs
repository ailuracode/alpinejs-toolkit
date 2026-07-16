/**
 * Bundle measurement policy for `scripts/bundle-report.mjs`.
 *
 * Relates to ALP-20 category budgets without replacing per-package size-limit checks.
 */

/** Packages excluded from consumer bundle reporting. */
export const BUNDLE_REPORT_EXCLUDED = ["ui"];

/** Subpath export keys skipped (types-only or non-consumer surfaces). */
export const TYPES_ONLY_EXPORT_SUFFIXES = ["/global", "/test"];

/** Module specifiers never bundled in any measurement mode. */
export const TYPE_ONLY_EXTERNALS = ["alpinejs", "@types/alpinejs"];

/**
 * Maximum intrinsic-full gzip size (bytes) per ALP-20 category.
 * Enforced numerically by repo:check via toolkit.bundleBudget.category.
 */
export const BUNDLE_CATEGORY_INTRINSIC_GZIP_BYTES = {
  primitive: 4_608,
  infrastructure: 6_144,
  adapter: 3_072,
  "small-feature": 5_120,
  "complex-feature": 12_288,
};

/**
 * Maximum default-cold gzip size (bytes) per category.
 * Optional guardrail for consumer-facing entrypoints.
 */
export const BUNDLE_CATEGORY_DEFAULT_COLD_GZIP_BYTES = {
  primitive: 4_608,
  infrastructure: 7_168,
  adapter: 4_096,
  "small-feature": 6_144,
  "complex-feature": 14_336,
};

/**
 * Default import surface used for the default-cold measurement when a package
 * has no `export default` on its root entry.
 */
export const DEFAULT_COLD_IMPORT_HINTS = {
  "@ailuracode/alpine-collection": "{ createCollectionController }",
  "@ailuracode/alpine-core": "{ BaseController, bridgeControllerStore }",
  "@ailuracode/alpine-plugin-registry": "{ registerPlugin, initPlugins }",
  "@ailuracode/alpine-query": "{ createQueryClient }",
  "@ailuracode/alpine-permissions": "{ permissionsPlugin }",
  "@ailuracode/alpine-keyboard": "{ keyboardPlugin }",
};

/** Regression tolerance before CI fails (fraction, e.g. 0.02 = 2%). */
export const BUNDLE_REGRESSION_TOLERANCE = 0.02;
