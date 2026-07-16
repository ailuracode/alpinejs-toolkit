import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    controller: "src/entries/controller.ts",
    validation: "src/entries/validation.ts",
    "json-api": "src/entries/json-api.ts",
    "standard-schema": "src/entries/standard-schema.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
});
