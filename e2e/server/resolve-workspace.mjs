import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * @returns {Record<string, string>}
 */
export function readWorkspaceAliases() {
  const tsconfigPath = path.join(root, "tsconfig.json");
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
  const paths = tsconfig.compilerOptions?.paths ?? {};
  /** @type {Record<string, string>} */
  const aliases = {};

  for (const [key, values] of Object.entries(paths)) {
    if (!Array.isArray(values) || values.length === 0) {
      continue;
    }

    const importKey = key.replace(/\/?\*$/, "");
    const target = values[0].replace(/\/?\*$/, "");
    aliases[importKey] = path.resolve(root, target);
  }

  return aliases;
}
