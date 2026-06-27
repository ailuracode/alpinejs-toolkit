import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(root, "packages");

const packageAliases = Object.fromEntries(
  readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [
      `@ailuracode/alpinejs-${entry.name}`,
      path.resolve(packagesDir, entry.name, "src/index.ts"),
    ])
);

export default defineConfig({
  root,
  resolve: {
    alias: packageAliases,
  },
  test: {
    environment: "happy-dom",
    setupFiles: [path.join(root, "test/setup.ts")],
    include: [
      path.join(root, "packages/*/test/**/*.test.ts"),
      path.join(root, "apps/demo/test/**/*.test.ts"),
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/*/src/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 75,
        statements: 80,
      },
    },
  },
});
