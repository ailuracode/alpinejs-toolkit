import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    lock: "src/entries/lock.ts",
    navigation: "src/entries/navigation.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  minify: true,
});
