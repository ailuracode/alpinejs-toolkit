import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  minify: true,
  treeshake: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
