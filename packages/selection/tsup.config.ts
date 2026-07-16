import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    controller: "src/entries/controller.ts",
    serialization: "src/entries/serialization.ts",
    navigation: "src/entries/navigation.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
});
