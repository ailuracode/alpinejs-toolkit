import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./test/setup.js"],
    include: ["packages/*/test/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.js"],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 75,
        statements: 80,
      },
    },
  },
});
