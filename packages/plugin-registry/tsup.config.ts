import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/public-types.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  minify: true,
  external: ["@ailuracode/alpine-core", "alpinejs"],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
