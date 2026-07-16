import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    browser: "src/browser.ts",
    controller: "src/exports/controller.ts",
    bridge: "src/exports/bridge.ts",
    registration: "src/exports/registration.ts",
    singleton: "src/exports/singleton.ts",
    events: "src/exports/events.ts",
    types: "src/public-types.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  minify: true,
  splitting: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
