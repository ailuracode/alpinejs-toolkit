import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", astro: "src/astro.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  minify: true,
});
