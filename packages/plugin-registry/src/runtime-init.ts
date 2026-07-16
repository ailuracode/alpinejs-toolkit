/**
 * Per-Alpine runtime plugin initialization state.
 *
 * Uses a WeakMap keyed by Alpine instance so abandoned runtimes can be
 * garbage-collected. In-flight async initialization is deduplicated via a
 * shared promise per runtime/plugin pair.
 */

import type { Alpine } from "alpinejs";
import { ToolkitError } from "./core-deps.js";

/** Mutable initialization state for one plugin on one Alpine runtime. */
export interface PluginRuntimeInitState {
  initialized: boolean;
  inflight: Promise<void> | null;
}

let alpineRuntimeInitState = new WeakMap<object, Map<string, PluginRuntimeInitState>>();

function runtimeKey(Alpine: Alpine): object {
  return Alpine as object;
}

function getPluginStates(Alpine: Alpine): Map<string, PluginRuntimeInitState> {
  const key = runtimeKey(Alpine);
  let pluginStates = alpineRuntimeInitState.get(key);

  if (!pluginStates) {
    pluginStates = new Map();
    alpineRuntimeInitState.set(key, pluginStates);
  }

  return pluginStates;
}

/** Returns mutable init state for a plugin on the given Alpine runtime. */
export function getRuntimeInitState(Alpine: Alpine, pluginName: string): PluginRuntimeInitState {
  const pluginStates = getPluginStates(Alpine);
  let state = pluginStates.get(pluginName);

  if (!state) {
    state = { initialized: false, inflight: null };
    pluginStates.set(pluginName, state);
  }

  return state;
}

/** Returns whether a plugin has completed initialization on the given runtime. */
export function isRuntimePluginInitialized(Alpine: Alpine, pluginName: string): boolean {
  return getRuntimeInitState(Alpine, pluginName).initialized;
}

/**
 * Marks a plugin as initialized on the given runtime.
 *
 * Clears any in-flight promise. Intended for adapters and tests that register
 * plugins outside `initPlugins()`.
 */
export function markRuntimePluginInitialized(Alpine: Alpine, pluginName: string): void {
  const state = getRuntimeInitState(Alpine, pluginName);
  state.initialized = true;
  state.inflight = null;
}

/**
 * Throws when sync initialization is requested while the same plugin is
 * initializing asynchronously on the same runtime.
 */
export function assertNoInflightInitialization(Alpine: Alpine, pluginName: string): void {
  const state = getRuntimeInitState(Alpine, pluginName);

  if (state.inflight) {
    throw new ToolkitError(
      `Plugin "${pluginName}" is already initializing asynchronously`,
      "PLUGIN_INIT_IN_FLIGHT"
    );
  }
}

/** Clears per-runtime state. Called by `resetPluginRegistry()` for test isolation. */
export function resetRuntimeInitState(): void {
  alpineRuntimeInitState = new WeakMap();
}
