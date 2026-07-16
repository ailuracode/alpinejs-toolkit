#!/usr/bin/env node
/**
 * Rewrites @ailuracode/alpine-core imports to granular subpaths and
 * @ailuracode/alpine-plugin-registry where appropriate.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const CONTROLLER = new Set([
  "BaseController",
  "CleanupStack",
  "EventEmitter",
  "generateId",
  "InstanceRegistry",
  "ToolkitError",
  "ToolkitErrorCode",
  "LifecyclePhase",
  "EventListener",
  "Unsubscribe",
  "RegisteredInstance",
]);

const BROWSER = new Set(["isBrowser", "safeWindow", "safeDocument", "safeMatchMedia"]);

const BRIDGE = new Set([
  "bridgeControllerStore",
  "bridgeControllerDirective",
  "syncRecordFromSnapshot",
  "wireControllerLifecycle",
  "registerReactiveStore",
  "registerStoreMagic",
  "Destroyable",
  "AlpineLifecycleHost",
  "BridgeControllerDirectiveOptions",
  "ControllerStoreBridge",
  "ControllerStoreBridgeOptions",
  "ReactiveStoreRegistration",
  "WireControllerLifecycleOptions",
]);

const REGISTRATION = new Set([
  "guardStore",
  "guardMagic",
  "guardDirective",
  "RegistrationError",
  "resetRegistrationTracking",
  "RegistrationErrorCode",
  "RegistrationGuardOptions",
  "RegistrationKind",
  "GuardedStoreResult",
]);

const SINGLETON = new Set([
  "createSingleton",
  "releaseSingleton",
  "createSingletonScope",
  "getSingleton",
  "setSingleton",
  "clearSingleton",
  "clearAllSingletons",
  "attachSingletonScope",
  "readSingletonScope",
  "resolveSingletonScope",
  "resolveInstanceSingletonScope",
  "runWithSingletonScope",
  "SingletonInitOptions",
  "SingletonScope",
]);

const EVENTS = new Set([
  "dispatchPluginEvent",
  "ChangeSource",
  "DispatchPluginEventClone",
  "DispatchPluginEventOptions",
  "PluginCustomEvent",
  "PluginEventMap",
  "PluginEventName",
]);

const REGISTRY = new Set([
  "registerPlugin",
  "unregisterPlugin",
  "getRegisteredPlugin",
  "getRegisteredPlugins",
  "isPluginInitialized",
  "markPluginInitialized",
  "resetPluginRegistry",
  "resolvePluginEntries",
  "setRegistryDebugSink",
  "getRegistryDebugSink",
  "RegistryEventLike",
  "definePlugin",
  "lazyPlugin",
  "DefinePluginOptions",
  "LazyPluginOptions",
  "initPlugins",
  "initPluginsSync",
  "createAlpinePlugin",
  "pluginLoader",
  "pluginCallback",
  "normalizePluginInput",
  "isPluginSource",
  "PluginLoaderError",
  "AlpinePluginCallback",
  "PluginCallbackSource",
  "PluginDefinition",
  "PluginKind",
  "PluginLoader",
  "PluginLoaderSource",
  "PluginNames",
  "PluginRegistryEntry",
  "PluginSource",
  "RegisteredPlugin",
]);

const TYPES = new Set(["Alpine", "PluginCallback", "DebugEvent", "DebugLogger", "DebugOption"]);

const SUBPATH_BY_SYMBOL = new Map([
  ...[...CONTROLLER].map((symbol) => [symbol, "controller"]),
  ...[...BROWSER].map((symbol) => [symbol, "browser"]),
  ...[...BRIDGE].map((symbol) => [symbol, "bridge"]),
  ...[...REGISTRATION].map((symbol) => [symbol, "registration"]),
  ...[...SINGLETON].map((symbol) => [symbol, "singleton"]),
  ...[...EVENTS].map((symbol) => [symbol, "events"]),
  ...[...REGISTRY].map((symbol) => [symbol, "registry"]),
  ...[...TYPES].map((symbol) => [symbol, "types"]),
]);

// Unsubscribe is exported from controller runtime but typed via /types.
SUBPATH_BY_SYMBOL.set("Unsubscribe", "types");

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === ".git") {
        continue;
      }
      walk(full, files);
    } else if (/\.(ts|tsx|js|mjs|md)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function parseImportSpecifiers(specifiersText) {
  const specs = [];
  const parts = specifiersText.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const typeOnly = trimmed.startsWith("type ");
    const body = typeOnly ? trimmed.slice(5).trim() : trimmed;
    const aliasMatch = body.match(/^(\w+)\s+as\s+(\w+)$/);
    const name = aliasMatch ? aliasMatch[1] : body;
    specs.push({ name, typeOnly, raw: trimmed });
  }
  return specs;
}

function groupBySubpath(specs) {
  const groups = new Map();
  for (const spec of specs) {
    const subpath = SUBPATH_BY_SYMBOL.get(spec.name);
    if (!subpath) {
      throw new Error(`Unknown symbol: ${spec.name}`);
    }
    const packageName =
      subpath === "registry" ? "@ailuracode/alpine-plugin-registry" : "@ailuracode/alpine-core";
    const key = subpath === "registry" ? packageName : `${packageName}/${subpath}`;
    const list = groups.get(key) ?? [];
    list.push(spec);
    groups.set(key, list);
  }
  return groups;
}

function rewriteFile(filePath) {
  let source = readFileSync(filePath, "utf8");
  if (!source.includes("@ailuracode/alpine-core")) {
    return false;
  }

  const importRegex = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+["']@ailuracode\/alpine-core["'];?/g;
  let changed = false;

  source = source.replace(importRegex, (_full, typeKeyword, specifiersText) => {
    changed = true;
    const specs = parseImportSpecifiers(specifiersText);
    const groups = groupBySubpath(specs);
    const lines = [];
    for (const [pkg, groupSpecs] of groups) {
      const isTypeOnly = groupSpecs.every((spec) => spec.typeOnly);
      const prefix = isTypeOnly || typeKeyword ? "import type" : "import";
      const body = groupSpecs.map((spec) => spec.raw).join(", ");
      lines.push(`${prefix} { ${body} } from "${pkg}";`);
    }
    return lines.join("\n");
  });

  if (changed) {
    writeFileSync(filePath, source);
  }
  return changed;
}

const targets = [
  path.join(ROOT, "packages"),
  path.join(ROOT, "apps"),
  path.join(ROOT, "test"),
  path.join(ROOT, "scripts"),
  path.join(ROOT, "docs"),
];

let count = 0;
for (const target of targets) {
  for (const file of walk(target)) {
    if (file.includes(`${path.sep}packages${path.sep}core${path.sep}src${path.sep}`)) {
      continue;
    }
    if (file.includes(`${path.sep}packages${path.sep}plugin-registry${path.sep}src${path.sep}`)) {
      continue;
    }
    try {
      if (rewriteFile(file)) {
        count += 1;
        console.log("updated", path.relative(ROOT, file));
      }
    } catch (error) {
      console.error("failed", path.relative(ROOT, file), error.message);
      process.exitCode = 1;
    }
  }
}

console.log(`rewrote ${count} files`);
