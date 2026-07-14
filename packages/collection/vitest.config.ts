import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["test/**/*.{test,spec}.ts"],
  },
});
