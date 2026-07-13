/**
 * Plugin registry — module-level singleton that tracks every plugin registered
 * with `@ailuracode/alpine-core`. Validation of definition shape lives here
 * so consumers get early failures at import time rather than at
 * `initPlugins()`.
 *
 * Errors thrown from this module extend {@link ToolkitError} with stable
 * codes — see `src/core/error.ts`.
 *
 * ## Diagnostic logging
 *
 * The registry exposes a single diagnostic event: `action: 'load-error'`
 * when a plugin loader throws or returns a non-function. Consumers that
 * want to observe those failures wire a logger through
 * {@link setRegistryDebugSink}; the default is `null`, which keeps the
 * registry silent. Lifecycle events like `register` / `unregister` are
 * intentionally NOT emitted: they duplicate the call sites the consumer
 * wrote and add noise. Toolkit errors with stable codes
 * (`PLUGIN_DUPLICATE`, `PLUGIN_UNKNOWN`, …) cover the diagnostic surface
 * that actually matters.
 */
import type { Alpine } from "alpinejs";
import type { DebugLogger } from "./core/debug";
import { ToolkitError } from "./core/error";
import { assertValidDefinition } from "./internal/assert";
import {
  isRuntimePluginInitialized,
  markRuntimePluginInitialized,
  resetRuntimeInitState,
} from "./runtime-init";
import type { PluginDefinition, PluginRegistryEntry } from "./types";

/**
 * Diagnostic event emitted by the loader layer when a plugin's
 * loader factory throws or returns a non-callback.
 *
 * `timestamp` is captured at emit time by the registry, so the
 * {@link DebugLogger} receives an event that already satisfies
 * `DebugEvent<TDetail>` from `core/debug`.
 */
export type RegistryEventLike = {
  readonly source: "registry";
  readonly action: "load-error";
  readonly plugin: string;
  readonly reason: string;
  readonly timestamp: number;
};

/**
 * Diagnostic sink. Wires a logger that receives every {@link RegistryEventLike}
 * the registry emits. When `null`, the loader stays silent — the default for
 * production builds.
 */
let debugSink: DebugLogger<RegistryEventLike> | null = null;

/**
 * Wires the diagnostic sink. Calling it again replaces the previous
 * sink. Passing `null` clears the sink and returns the loader to
 * silent mode.
 */
export function setRegistryDebugSink(sink: DebugLogger<RegistryEventLike> | null): void {
  debugSink = sink;
}

/** Returns the currently wired sink. Exposed for tests + diagnostics. */
export function getRegistryDebugSink(): DebugLogger<RegistryEventLike> | null {
  return debugSink;
}

/**
 * Internal emitter. The loader layer calls this when a factory
 * fails. Public so the loader can reach it without bouncing
 * through the registry's public surface; consumers should not
 * call it directly.
 */
export function emitLoadError(plugin: string, reason: string): void {
  if (!debugSink) {
    return;
  }
  try {
    debugSink({
      source: "registry",
      action: "load-error",
      plugin,
      reason,
      timestamp: Date.now(),
    });
  } catch {
    // A throwing logger must never break the loader.
  }
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

const registry = new Map<string, PluginRegistryEntry>();

function normalizePluginName(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    throw new ToolkitError("Plugin name must be a non-empty string", "PLUGIN_NAME_REQUIRED");
  }

  return normalized;
}

/** Registers a plugin definition without initializing it. Safe at import time. */
export function registerPlugin(name: string, definition: PluginDefinition): void {
  const normalizedName = normalizePluginName(name);
  assertValidDefinition(definition);

  if (registry.has(normalizedName)) {
    throw new ToolkitError(`Plugin "${normalizedName}" is already registered`, "PLUGIN_DUPLICATE");
  }

  registry.set(normalizedName, {
    name: normalizedName,
    definition,
  });
}

/** Removes a plugin from the registry. Returns whether it existed. */
export function unregisterPlugin(name: string): boolean {
  return registry.delete(normalizePluginName(name));
}

/** Returns a registered plugin entry, if present. */
export function getRegisteredPlugin(name: string): PluginRegistryEntry | undefined {
  return registry.get(normalizePluginName(name));
}

/** Returns all registered plugins in registration order. */
export function getRegisteredPlugins(): readonly PluginRegistryEntry[] {
  return [...registry.values()];
}

/**
 * Returns whether a plugin has been initialized on the given Alpine runtime.
 *
 * Repeated initialization against the same runtime is a no-op once this
 * returns `true`.
 */
export function isPluginInitialized(name: string, Alpine: Alpine): boolean {
  const normalizedName = normalizePluginName(name);

  if (!registry.has(normalizedName)) {
    return false;
  }

  return isRuntimePluginInitialized(Alpine, normalizedName);
}

/**
 * Marks a plugin as initialized on the given Alpine runtime.
 *
 * Use when registering a plugin callback outside `initPlugins()` (for example
 * in a custom Alpine adapter). Throws when the plugin name is unknown.
 */
export function markPluginInitialized(name: string, Alpine: Alpine): void {
  const normalizedName = normalizePluginName(name);

  if (!registry.has(normalizedName)) {
    throw new ToolkitError(`Cannot mark unknown plugin "${name}" as initialized`, "PLUGIN_UNKNOWN");
  }

  markRuntimePluginInitialized(Alpine, normalizedName);
}

/** Clears the registry. Intended for tests and storybook resets. */
export function resetPluginRegistry(): void {
  registry.clear();
  resetRuntimeInitState();
}

/**
 * Resolves plugin names to registry entries. When `names` is `undefined`,
 * returns every plugin in registration order. An empty array is a valid no-op.
 */
export function resolvePluginEntries(names?: string | readonly string[]): PluginRegistryEntry[] {
  if (names === undefined) {
    return [...getRegisteredPlugins()];
  }

  const requested = Array.isArray(names) ? names : [names];

  if (requested.length === 0) {
    return [];
  }

  const entries: PluginRegistryEntry[] = [];

  for (const name of requested) {
    const entry = getRegisteredPlugin(name);

    if (!entry) {
      throw new ToolkitError(`Plugin "${name}" is not registered`, "PLUGIN_UNKNOWN");
    }

    entries.push(entry);
  }

  return entries;
}
