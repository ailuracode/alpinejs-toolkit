/**
 * @typedef {"primitive" | "infrastructure" | "small-feature" | "complex-feature" | "adapter"} BundleBudgetCategory
 */

/**
 * @typedef {object} SizeLimitEntry
 * @property {string} name
 * @property {string} path
 * @property {string} import
 * @property {string[]} ignore
 * @property {boolean} gzip
 * @property {boolean} brotli
 * @property {string} limit
 */

/**
 * @typedef {object} BundleBudgetRule
 * @property {BundleBudgetCategory} category
 * @property {SizeLimitEntry[]} [entries]
 * @property {string} [exclude]
 */

export const BUNDLE_BUDGET_CATEGORIES = new Set([
  "primitive",
  "infrastructure",
  "small-feature",
  "complex-feature",
  "adapter",
]);

/** @type {Record<string, BundleBudgetRule>} */
export const BUNDLE_BUDGET_POLICY = {
  accordion: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "2 kB",
      },
    ],
  },
  attention: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.8 kB",
      },
    ],
  },
  calendar: {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "8.9 kB",
      },
    ],
  },
  carousel: {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "12 kB",
      },
    ],
  },
  child: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@alpinejs/morph"],
        gzip: true,
        brotli: true,
        limit: "1.5 kB",
      },
    ],
  },
  command: {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.8 kB",
      },
    ],
  },
  core: {
    category: "primitive",
    entries: [
      {
        name: "minimal (registerPlugin + definePlugin)",
        path: "dist/index.js",
        import: "{ registerPlugin, definePlugin }",
        ignore: ["alpinejs"],
        gzip: true,
        brotli: true,
        limit: "400 B",
      },
      {
        name: "typical (registry + browser helpers)",
        path: "dist/index.js",
        import: "{ registerPlugin, definePlugin, initPlugins, isBrowser, safeWindow }",
        ignore: ["alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.1 kB",
      },
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs"],
        gzip: true,
        brotli: true,
        limit: "2.9 kB",
      },
    ],
  },
  dialog: {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: [
          "alpinejs",
          "@ailuracode/alpine-core",
          "@ailuracode/alpine-scroll",
          "@types/alpinejs",
        ],
        gzip: true,
        brotli: true,
        limit: "2.2 kB",
      },
    ],
  },
  env: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.6 kB",
      },
    ],
  },
  geo: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.5 kB",
      },
    ],
  },
  "json-api": {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "2.4 kB",
      },
    ],
  },
  lang: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core"],
        gzip: true,
        brotli: true,
        limit: "1.6 kB",
      },
    ],
  },
  media: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core"],
        gzip: true,
        brotli: true,
        limit: "3.3 kB",
      },
    ],
  },
  menu: {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: [
          "alpinejs",
          "@ailuracode/alpine-core",
          "@ailuracode/alpine-scroll",
          "@types/alpinejs",
        ],
        gzip: true,
        brotli: true,
        limit: "2.5 kB",
      },
    ],
  },
  notify: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.5 kB",
      },
    ],
  },
  overlay: {
    category: "infrastructure",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "2.4 kB",
      },
    ],
  },
  query: {
    category: "infrastructure",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "5.2 kB",
      },
    ],
  },
  "query-adapter-alpine": {
    category: "adapter",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-query", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "550 B",
      },
    ],
  },
  "query-adapter-zustand": {
    category: "adapter",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-query", "@types/alpinejs", "zustand"],
        gzip: true,
        brotli: true,
        limit: "600 B",
      },
    ],
  },
  "query-kit": {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@nanostores/alpine", "@types/alpinejs", "nanostores"],
        gzip: true,
        brotli: true,
        limit: "20.9 kB",
      },
    ],
  },
  scroll: {
    category: "infrastructure",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core"],
        gzip: true,
        brotli: true,
        limit: "5.9 kB",
      },
    ],
  },
  sidebar: {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: [
          "alpinejs",
          "@ailuracode/alpine-core",
          "@ailuracode/alpine-toggle",
          "@ailuracode/alpine-scroll",
        ],
        gzip: true,
        brotli: true,
        limit: "2.6 kB",
      },
    ],
  },
  tabs: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.9 kB",
      },
    ],
  },
  theme: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@ailuracode/alpine-toggle"],
        gzip: true,
        brotli: true,
        limit: "2.5 kB",
      },
    ],
  },
  toast: {
    category: "complex-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core"],
        gzip: true,
        brotli: true,
        limit: "3.7 kB",
      },
    ],
  },
  toggle: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core"],
        gzip: true,
        brotli: true,
        limit: "1.1 kB",
      },
    ],
  },
  tooltip: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core", "@types/alpinejs"],
        gzip: true,
        brotli: true,
        limit: "1.2 kB",
      },
    ],
  },
  transfer: {
    category: "small-feature",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@types/alpinejs", "@ailuracode/alpine-core"],
        gzip: true,
        brotli: true,
        limit: "1.7 kB",
      },
    ],
  },
  ui: {
    category: "primitive",
    entries: [
      {
        name: "full surface",
        path: "dist/index.js",
        import: "*",
        ignore: ["alpinejs", "@ailuracode/alpine-core"],
        gzip: true,
        brotli: true,
        limit: "850 B",
      },
    ],
  },
};

/**
 * @param {string} folder
 * @returns {BundleBudgetRule | null}
 */
export function bundleBudgetRuleFor(folder) {
  return BUNDLE_BUDGET_POLICY[folder] ?? null;
}

/**
 * @param {string} folder
 * @returns {SizeLimitEntry[] | null}
 */
export function expectedSizeLimitConfig(folder) {
  const rule = bundleBudgetRuleFor(folder);
  if (!rule || rule.exclude) {
    return null;
  }

  return rule.entries ? JSON.parse(JSON.stringify(rule.entries)) : null;
}
