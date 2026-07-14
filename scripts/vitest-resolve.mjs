/**
 * @fileoverview Shared Vitest/Vite resolve aliases for the monorepo workspace.
 */

import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * @param {string} root
 * @returns {Array<{ find: string | RegExp; replacement: string }>}
 */
export function buildVitestAliases(root) {
  const packagesDir = path.resolve(root, "packages");

  const packageAliases = Object.fromEntries(
    readdirSync(packagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => [
        `@ailuracode/alpine-${entry.name}`,
        path.resolve(packagesDir, entry.name, "src/index.ts"),
      ])
  );

  const subpathAliases = [
    {
      find: "@ailuracode/alpine-query-kit/devtools",
      replacement: path.resolve(packagesDir, "query-kit/src/devtools-entry.ts"),
    },
  ];

  return [
    ...subpathAliases,
    ...Object.entries(packageAliases).map(([find, replacement]) => ({
      find,
      replacement,
    })),
  ];
}
