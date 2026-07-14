import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { buildRootVitestProjects } from "./scripts/vitest-projects.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(root, "packages");

const packageAliases = Object.fromEntries(
  readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [
      `@ailuracode/alpine-${entry.name}`,
      path.resolve(packagesDir, entry.name, "src/index.ts"),
    ])
);

const subpathAliases: Array<{ find: string | RegExp; replacement: string }> = [
  {
    find: "@ailuracode/alpine-query-kit/devtools",
    replacement: path.resolve(packagesDir, "query-kit/src/devtools-entry.ts"),
  },
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
    projects: buildRootVitestProjects(root),
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
