import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(root, "packages");

const packageAliases = Object.fromEntries(
  readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => entry.name !== "core" && entry.name !== "plugin-registry")
    .map((entry) => [
      `@ailuracode/alpine-${entry.name}`,
      path.resolve(packagesDir, entry.name, "src/index.ts"),
    ])
);

const coreSubpathAliases: Array<{ find: string; replacement: string }> = [
  {
    find: "@ailuracode/alpine-core/browser",
    replacement: path.resolve(packagesDir, "core/src/browser.ts"),
  },
  {
    find: "@ailuracode/alpine-core/controller",
    replacement: path.resolve(packagesDir, "core/src/exports/controller.ts"),
  },
  {
    find: "@ailuracode/alpine-core/bridge",
    replacement: path.resolve(packagesDir, "core/src/exports/bridge.ts"),
  },
  {
    find: "@ailuracode/alpine-core/registration",
    replacement: path.resolve(packagesDir, "core/src/exports/registration.ts"),
  },
  {
    find: "@ailuracode/alpine-core/singleton",
    replacement: path.resolve(packagesDir, "core/src/exports/singleton.ts"),
  },
  {
    find: "@ailuracode/alpine-core/events",
    replacement: path.resolve(packagesDir, "core/src/exports/events.ts"),
  },
  {
    find: "@ailuracode/alpine-core/types",
    replacement: path.resolve(packagesDir, "core/src/public-types.ts"),
  },
  {
    find: "@ailuracode/alpine-core",
    replacement: path.resolve(packagesDir, "core/src/index.ts"),
  },
  {
    find: "@ailuracode/alpine-plugin-registry",
    replacement: path.resolve(packagesDir, "plugin-registry/src/index.ts"),
  },
];

const SUBPATH_SOURCE_ENTRIES: Record<string, string> = {
  "@ailuracode/alpine-query-kit/devtools": "query-kit/src/devtools-entry.ts",
  "@ailuracode/alpine-query/instrumentation": "query/src/instrumentation-entry.ts",
  "@ailuracode/alpine-calendar/date-fns": "calendar/src/date-fns-entry.ts",
  "@ailuracode/alpine-carousel/autoplay": "carousel/src/autoplay-entry.ts",
  "@ailuracode/alpine-realtime/sse": "realtime/src/entries/sse.ts",
  "@ailuracode/alpine-realtime/websocket": "realtime/src/entries/websocket.ts",
  "@ailuracode/alpine-scroll/lock": "scroll/src/entries/lock.ts",
  "@ailuracode/alpine-scroll/navigation": "scroll/src/entries/navigation.ts",
  "@ailuracode/alpine-form/controller": "form/src/entries/controller.ts",
  "@ailuracode/alpine-form/validation": "form/src/entries/validation.ts",
  "@ailuracode/alpine-form/json-api": "form/src/entries/json-api.ts",
  "@ailuracode/alpine-form/standard-schema": "form/src/entries/standard-schema.ts",
  "@ailuracode/alpine-selection/controller": "selection/src/entries/controller.ts",
  "@ailuracode/alpine-selection/serialization": "selection/src/entries/serialization.ts",
  "@ailuracode/alpine-selection/navigation": "selection/src/entries/navigation.ts",
};

const bundleSubpathAliases: Array<{ find: string; replacement: string }> = Object.entries(
  SUBPATH_SOURCE_ENTRIES
).map(([find, relativePath]) => ({
  find,
  replacement: path.resolve(packagesDir, relativePath),
}));

const subpathAliases: Array<{ find: string | RegExp; replacement: string }> = [
  ...bundleSubpathAliases,
  ...coreSubpathAliases,
];

export default defineConfig({
  root,
  resolve: {
    alias: [
      ...subpathAliases,
      ...Object.entries(packageAliases).map(([find, replacement]) => ({
        find,
        replacement,
      })),
    ],
  },
  test: {
    environment: "happy-dom",
    setupFiles: [path.join(root, "test/setup.ts")],
    include: [
      path.join(root, "packages/*/test/**/*.{test,spec}.ts"),
      path.join(root, "apps/demo/test/**/*.test.ts"),
      path.join(root, "test/**/*.test.ts"),
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.d.ts", "**/types.ts", "**/events.ts", "**/index.ts"],
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 75,
        statements: 85,
      },
    },
  },
});
