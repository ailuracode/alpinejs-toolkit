import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { catalogPackages, discoverPackages } from "./repo-check.mjs";

const CATALOG_ENTRIES_PATH = "apps/demo/src/catalog/entries.ts";
const PLAYGROUND_DEMOS_PATH = "apps/demo/src/demo/playground-demos.ts";

/**
 * @typedef {object} ParsedCatalogEntry
 * @property {string} id
 * @property {string} folder
 * @property {string} npmPackage
 * @property {string} readmePath
 * @property {boolean} hasDemo
 * @property {boolean} hasDocs
 */

/**
 * @param {string} contents
 * @returns {ParsedCatalogEntry[]}
 */
export function parseCatalogEntries(contents) {
  const blocks = contents.split(/entry\(\{/).slice(1);
  /** @type {ParsedCatalogEntry[]} */
  const entries = [];

  for (const block of blocks) {
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    const folder = block.match(/folder:\s*"([^"]+)"/)?.[1];
    const npmPackage = block.match(/npmPackage:\s*"([^"]+)"/)?.[1];
    const readmePath = block.match(/readmePath:\s*"([^"]+)"/)?.[1];
    const hasDemo = /demo:\s*\{\s*available:\s*true/.test(block);
    const hasDocs = !/docs:\s*\{\s*available:\s*false/.test(block);

    if (!(id && folder && npmPackage && readmePath)) {
      continue;
    }

    entries.push({ id, folder, npmPackage, readmePath, hasDemo, hasDocs });
  }

  return entries;
}

/**
 * @param {string} contents
 * @returns {Set<string>}
 */
export function parsePlaygroundDemoIds(contents) {
  const ids = new Set();
  const pattern = /^\s{2}["']?([\w-]+)["']?:\s*\w+Demo/gm;
  for (const match of contents.matchAll(pattern)) {
    ids.add(match[1]);
  }
  return ids;
}

/**
 * @param {ParsedCatalogEntry} entry
 * @param {Set<string>} packageFolders
 * @param {Set<string>} demoIds
 * @param {string} root
 * @returns {string[]}
 */
function validateCatalogEntry(entry, packageFolders, demoIds, root) {
  const errors = [];

  if (!packageFolders.has(entry.folder)) {
    errors.push(`package catalog: unknown folder "${entry.folder}" for id "${entry.id}"`);
  }

  if (entry.npmPackage !== `@ailuracode/alpine-${entry.folder}`) {
    errors.push(`package catalog: npm package mismatch for "${entry.id}" (${entry.npmPackage})`);
  }

  if (!existsSync(path.join(root, entry.readmePath))) {
    errors.push(`package catalog: missing README for "${entry.id}" at ${entry.readmePath}`);
  }

  if (entry.hasDemo && !demoIds.has(entry.id)) {
    errors.push(
      `package catalog: demo declared for "${entry.id}" but missing in playground-demos.ts`
    );
  }

  if (!entry.hasDemo && demoIds.has(entry.id)) {
    errors.push(
      `package catalog: playground demo exists for "${entry.id}" but catalog marks demo unavailable`
    );
  }

  return errors;
}

/**
 * @param {ParsedCatalogEntry[]} catalogEntries
 * @param {string} entriesSource
 * @returns {string[]}
 */
function validateCatalogOrdering(catalogEntries, entriesSource) {
  const errors = [];
  const positions = new Map();

  for (const entry of catalogEntries) {
    const categoryMatch = entriesSource.match(
      new RegExp(`id:\\s*"${entry.id}"[\\s\\S]*?category:\\s*"([^"]+)"`)
    );
    const familyMatch = entriesSource.match(
      new RegExp(`id:\\s*"${entry.id}"[\\s\\S]*?family:\\s*"([^"]+)"`)
    );
    const orderMatch = entriesSource.match(
      new RegExp(`id:\\s*"${entry.id}"[\\s\\S]*?order:\\s*(\\d+)`)
    );
    const key = `${categoryMatch?.[1] ?? "_"}:${familyMatch?.[1] ?? "_"}:${orderMatch?.[1] ?? "0"}`;
    const existing = positions.get(key);
    if (existing) {
      errors.push(
        `package catalog: duplicate order ${orderMatch?.[1] ?? "0"} for ${key} (${existing}, ${entry.id})`
      );
    }
    positions.set(key, entry.id);
  }

  return errors;
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function validatePackageCatalogSurfaces(root) {
  const errors = [];
  const entriesPath = path.join(root, CATALOG_ENTRIES_PATH);
  const demosPath = path.join(root, PLAYGROUND_DEMOS_PATH);

  if (!existsSync(entriesPath)) {
    return [`missing package catalog entries file: ${CATALOG_ENTRIES_PATH}`];
  }

  if (!existsSync(demosPath)) {
    return [`missing playground demo registry: ${PLAYGROUND_DEMOS_PATH}`];
  }

  const entriesSource = readFileSync(entriesPath, "utf8");
  const catalogEntries = parseCatalogEntries(entriesSource);
  const demoIds = parsePlaygroundDemoIds(readFileSync(demosPath, "utf8"));
  const packages = catalogPackages(discoverPackages(path.join(root, "packages")));
  const catalogIds = new Set(catalogEntries.map((entry) => entry.id));
  const packageFolders = new Set(packages.map((pkg) => pkg.folder));

  if (catalogEntries.length !== packages.length) {
    errors.push(
      `package catalog: expected ${packages.length} public entries, found ${catalogEntries.length}`
    );
  }

  for (const pkg of packages) {
    if (!catalogIds.has(pkg.folder)) {
      errors.push(`package catalog: missing entry for public package "${pkg.folder}"`);
    }
  }

  for (const entry of catalogEntries) {
    errors.push(...validateCatalogEntry(entry, packageFolders, demoIds, root));
  }

  for (const demoId of demoIds) {
    if (!catalogEntries.some((item) => item.id === demoId)) {
      errors.push(`playground demos: "${demoId}" is not present in the package catalog`);
    }
  }

  errors.push(...validateCatalogOrdering(catalogEntries, entriesSource));

  return errors;
}
