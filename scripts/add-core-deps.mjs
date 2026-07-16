#!/usr/bin/env node
/**
 * Adds `src/core-deps.ts` barrels and rewrites internal `@ailuracode/alpine-core/*`
 * imports so tsup emits one external import per subpath.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PACKAGES = path.join(ROOT, "packages");

const SKIP_PACKAGES = new Set(["core", "attention"]);
const SKIP_FILES = new Set(["core-deps.ts", "global.d.ts"]);

const TYPE_ONLY_SYMBOLS = new Set(["Unsubscribe", "Alpine", "PluginCallback", "SingletonScope"]);

const QUOTE = "(?:\"|')";
const CORE_FROM = `${QUOTE}@ailuracode\\/alpine-core\\/[^"']+${QUOTE}`;
const REWRITE_CORE = new RegExp(
  `(?:import\\s+(type\\s+)?\\{([^}]+)\\}\\s+from\\s+${CORE_FROM}|export\\s+(type\\s+)?\\{([^}]+)\\}\\s+from\\s+${CORE_FROM})`,
  "g"
);
const SCAN_CORE = new RegExp(
  `(?:import\\s+(type\\s+)?\\{([^}]+)\\}\\s+from\\s+${CORE_FROM}|export\\s+(type\\s+)?\\{([^}]+)\\}\\s+from\\s+${CORE_FROM})`,
  "g"
);

/** @param {string} specifiersText @param {boolean} defaultTypeOnly */
function parseSpecifiers(specifiersText, defaultTypeOnly) {
  /** @type {{ name: string, typeOnly: boolean, raw: string }[]} */
  const specs = [];
  for (const part of specifiersText.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const inlineType = trimmed.startsWith("type ");
    const body = inlineType ? trimmed.slice(5).trim() : trimmed;
    const aliasMatch = body.match(/^(\w+)\s+as\s+(\w+)$/);
    const name = aliasMatch ? aliasMatch[1] : body;
    const typeOnly = defaultTypeOnly || inlineType || TYPE_ONLY_SYMBOLS.has(name);
    specs.push({
      name,
      typeOnly,
      raw: name,
    });
  }
  return specs;
}

/** @param {string} dir */
function walkTs(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkTs(full, files);
    } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      files.push(full);
    }
  }
  return files;
}

/** @param {string} filePath @param {string} srcRoot */
function coreDepsImportPath(filePath, srcRoot) {
  const rel = path.relative(path.dirname(filePath), path.join(srcRoot, "core-deps.js"));
  return rel.startsWith(".") ? rel : `./${rel}`;
}

/** @param {string} packageDir */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one-off codegen script
function processPackage(packageDir) {
  const folder = path.basename(packageDir);
  if (SKIP_PACKAGES.has(folder)) {
    return { folder, skipped: true };
  }

  const srcRoot = path.join(packageDir, "src");
  if (!statSync(srcRoot).isDirectory()) {
    return { folder, skipped: true };
  }

  /** @type {Map<string, { typeOnly: boolean, raw: string, subpath: string }>} */
  const symbols = new Map();
  const files = walkTs(srcRoot).filter((file) => !SKIP_FILES.has(path.basename(file)));

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(SCAN_CORE)) {
      const isExport = match[0].startsWith("export");
      const typeKeyword = isExport ? match[3] : match[1];
      const specifiersText = isExport ? match[4] : match[2];
      const full = match[0];
      const subpathMatch = full.match(/@ailuracode\/alpine-core\/([^"']+)/);
      const subpath = subpathMatch?.[1];
      if (!(specifiersText && subpath)) {
        continue;
      }
      for (const spec of parseSpecifiers(specifiersText, Boolean(typeKeyword?.trim()))) {
        const existing = symbols.get(spec.name);
        if (!existing) {
          symbols.set(spec.name, { typeOnly: spec.typeOnly, raw: spec.raw, subpath });
          continue;
        }
        if (spec.typeOnly && !existing.typeOnly) {
          continue;
        }
        if (!spec.typeOnly && existing.typeOnly) {
          symbols.set(spec.name, { typeOnly: false, raw: spec.raw, subpath });
        }
      }
    }
  }

  if (symbols.size === 0) {
    return { folder, skipped: true };
  }

  /** @type {Map<string, { value: string[], type: string[] }>} */
  const subpathExports = new Map();
  for (const [, spec] of symbols) {
    const bucket = subpathExports.get(spec.subpath) ?? { value: [], type: [] };
    (spec.typeOnly ? bucket.type : bucket.value).push(spec.raw);
    subpathExports.set(spec.subpath, bucket);
  }

  const coreDepsLines = [
    "/**",
    " * Shared `@ailuracode/alpine-core` subpath imports.",
    " * Single module keeps tsup from emitting duplicate external import statements.",
    " */",
    "",
  ];

  for (const subpath of [...subpathExports.keys()].sort()) {
    const bucket = subpathExports.get(subpath);
    if (bucket.value.length > 0) {
      coreDepsLines.push(
        `export { ${bucket.value.join(", ")} } from "@ailuracode/alpine-core/${subpath}";`
      );
    }
    if (bucket.type.length > 0) {
      coreDepsLines.push(
        `export type { ${bucket.type.join(", ")} } from "@ailuracode/alpine-core/${subpath}";`
      );
    }
  }

  coreDepsLines.push("");
  writeFileSync(path.join(srcRoot, "core-deps.ts"), coreDepsLines.join("\n"));

  let changedFiles = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (!source.includes("@ailuracode/alpine-core/")) {
      continue;
    }
    const importPath = coreDepsImportPath(file, srcRoot);
    const next = source.replace(
      REWRITE_CORE,
      (full, typeKeyword, importSpecs, exportTypeKeyword, exportSpecs) => {
        if (full.startsWith("export")) {
          const prefix = exportTypeKeyword ? "export type" : "export";
          return `${prefix} { ${exportSpecs} } from "${importPath}"`;
        }
        const prefix = typeKeyword ? "import type" : "import";
        return `${prefix} { ${importSpecs} } from "${importPath}"`;
      }
    );
    if (next !== source) {
      writeFileSync(file, next);
      changedFiles += 1;
    }
  }

  return { folder, skipped: false, subpaths: subpathExports.size, changedFiles };
}

for (const folder of readdirSync(PACKAGES).sort()) {
  const dir = path.join(PACKAGES, folder);
  if (!statSync(dir).isDirectory()) {
    continue;
  }
  try {
    statSync(path.join(dir, "package.json"));
  } catch {
    continue;
  }
  const result = processPackage(dir);
  if (!result.skipped) {
    console.log(
      `${result.folder}: core-deps.ts (${result.subpaths} subpaths), ${result.changedFiles} files updated`
    );
  }
}
