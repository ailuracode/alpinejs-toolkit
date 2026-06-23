import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageNames = [
  "core",
  "attention",
  "battery",
  "calendar",
  "clipboard",
  "export",
  "geo",
  "network",
  "notify",
  "platform",
  "query",
  "query-adapter-alpine",
  "query-adapter-nanostores",
  "query-adapter-zustand",
  "query-devtools",
  "screen",
  "scroll",
  "share",
  "theme",
  "touch",
  "visibility",
];

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      packageNames.map((name) => [
        `@ailuracode/alpine-${name}`,
        path.resolve(root, `packages/${name}/src/index.ts`),
      ])
    ),
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./test/setup.ts"],
    include: ["packages/*/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
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
