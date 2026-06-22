import { defineConfig } from "vitest/config";

export default defineConfig({
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
