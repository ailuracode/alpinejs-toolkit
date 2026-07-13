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
      `@ailuracode/alpine-${entry.name}`,
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
