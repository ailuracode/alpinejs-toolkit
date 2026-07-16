import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const esbuildPath = require.resolve("esbuild", {
  paths: [require.resolve("@size-limit/esbuild")],
});
const { build } = await import(esbuildPath);

interface TreeShakingFixture {
  readonly label: string;
  readonly entry: string;
  readonly namedImport: string;
  readonly marker: string;
}

const REPRESENTATIVE_PACKAGES: TreeShakingFixture[] = [
  {
    label: "core-controller",
    entry: path.join(root, "packages/core/dist/controller.js"),
    namedImport: "BaseController",
    marker: "bridgeControllerStore",
  },
  {
    label: "plugin-registry",
    entry: path.join(root, "packages/plugin-registry/dist/index.js"),
    namedImport: "registerPlugin",
    marker: "bridgeControllerStore",
  },
  {
    label: "theme",
    entry: path.join(root, "packages/theme/dist/index.js"),
    namedImport: "themePlugin",
    marker: "createMemoryThemeStorage",
  },
  {
    label: "query",
    entry: path.join(root, "packages/query/dist/index.js"),
    namedImport: "createQueryClient",
    marker: "typedFetch",
  },
];

async function bundleNamedImport(entry: string, namedImport: string): Promise<string> {
  const result = await build({
    stdin: {
      contents: `import { ${namedImport} } from "./index.js"; export { ${namedImport} };`,
      loader: "js",
      resolveDir: path.dirname(entry),
    },
    bundle: true,
    write: false,
    minify: false,
    format: "esm",
    platform: "neutral",
    treeShaking: true,
    external: [
      "alpinejs",
      "@ailuracode/alpine-core",
      "@ailuracode/alpine-plugin-registry",
      "@types/alpinejs",
    ],
  });

  return result.outputFiles[0]?.text ?? "";
}

describe("tree-shaking smoke", () => {
  for (const fixture of REPRESENTATIVE_PACKAGES) {
    it(`tree-shakes unused exports from @ailuracode/alpine-${fixture.label}`, async () => {
      const output = await bundleNamedImport(fixture.entry, fixture.namedImport);

      expect(output).not.toContain(fixture.marker);
    });
  }
});
