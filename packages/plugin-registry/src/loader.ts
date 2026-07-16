/**
 * Plugin loader resolution — converts a {@link PluginSource} or raw
 * {@link AlpinePluginCallback} into an {@link PluginCallback} either
 * synchronously or asynchronously.
 *
 * When a loader throws or returns a non-function, the failure is
 * surfaced both as a {@link PluginLoaderError} and as a `load-error`
 * event through the registry's diagnostic sink. The sink is an
 * escape hatch — production code reads the thrown error, not the
 * event stream.
 */

import { ToolkitError } from "@ailuracode/alpine-core/controller";
import type { PluginCallback } from "alpinejs";
import { emitLoadError } from "./registry";
import type {
  AlpinePluginCallback,
  PluginCallbackSource,
  PluginLoaderSource,
  PluginSource,
} from "./types";

const LOADER_MUST_FUNCTION = "Plugin loader must resolve to a function";
const LOADER_ASYNC_REQUIRES_INIT =
  "Async plugin loaders require initPlugins() before Alpine.start()";

/**
 * Public error thrown when a plugin loader cannot be resolved.
 *
 * Extends {@link ToolkitError} with a stable {@link ToolkitErrorCode} so
 * consumers can branch on `error.code` without parsing the message.
 */
export class PluginLoaderError extends ToolkitError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "PLUGIN_LOADER_INVALID", options?.cause);
    this.name = "PluginLoaderError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isPluginSource(value: unknown): value is PluginSource {
  if (typeof value !== "object" || value === null || !("source" in value)) {
    return false;
  }

  const source = (value as PluginSource).source;
  return source === "callback" || source === "loader";
}

/** Marks a direct Alpine plugin callback. */
export function pluginCallback(callback: AlpinePluginCallback): PluginCallbackSource {
  return { source: "callback", callback };
}

/** Marks a lazy loader that resolves to an Alpine plugin callback. */
export function pluginLoader(
  load: () => AlpinePluginCallback | Promise<AlpinePluginCallback>
): PluginLoaderSource {
  return { source: "loader", load };
}

/**
 * Normalizes plugin input for consumers that need a stored {@link PluginSource}.
 * Raw callbacks are wrapped; explicit sources pass through unchanged.
 */
export function normalizePluginInput(plugin: PluginSource | AlpinePluginCallback): PluginSource {
  return typeof plugin === "function" ? pluginCallback(plugin) : plugin;
}

function directCallback(source: PluginSource | AlpinePluginCallback): PluginCallback | null {
  if (typeof source === "function") {
    return source;
  }

  if (source.source === "callback") {
    return source.callback;
  }

  return null;
}

function loadThrown(error: unknown, pluginName?: string): never {
  const reason = error instanceof Error ? error.message : String(error);
  emitLoadError(pluginName ?? "<anonymous>", reason);
  throw error;
}

function loaderFailure(message: string, pluginName?: string, cause?: unknown): never {
  emitLoadError(pluginName ?? "<anonymous>", message);
  throw new PluginLoaderError(message, cause === undefined ? undefined : { cause });
}

async function invokeLoad(
  source: PluginLoaderSource,
  pluginName?: string
): Promise<PluginCallback> {
  let resolved: unknown;
  try {
    const candidate = source.load();
    resolved = candidate instanceof Promise ? await candidate : candidate;
  } catch (error) {
    loadThrown(error, pluginName);
  }

  if (typeof resolved !== "function") {
    loaderFailure(LOADER_MUST_FUNCTION, pluginName);
  }

  return resolved as PluginCallback;
}

function invokeLoadSync(source: PluginLoaderSource, pluginName?: string): PluginCallback {
  let candidate: unknown;
  try {
    candidate = source.load();
  } catch (error) {
    loadThrown(error, pluginName);
  }

  if (candidate instanceof Promise) {
    loaderFailure(LOADER_ASYNC_REQUIRES_INIT, pluginName, candidate);
  }

  if (typeof candidate !== "function") {
    loaderFailure(LOADER_MUST_FUNCTION, pluginName);
  }

  return candidate as PluginCallback;
}

function isLoaderSource(source: PluginSource | AlpinePluginCallback): source is PluginLoaderSource {
  return typeof source === "object" && source !== null && source.source === "loader";
}

/** Resolves a plugin source to an Alpine plugin callback. */
export async function resolvePluginLoader(
  source: PluginSource | AlpinePluginCallback,
  pluginName?: string
): Promise<PluginCallback> {
  const direct = directCallback(source);
  if (direct !== null) {
    return direct;
  }

  if (!isLoaderSource(source)) {
    loaderFailure(LOADER_MUST_FUNCTION, pluginName);
  }

  return await invokeLoad(source, pluginName);
}

/**
 * Resolves a plugin source synchronously. Throws when the loader is
 * async, because there is no way to defer `Alpine.start()` without a separate
 * code path — and that path is exactly what `initPlugins()` exists for.
 */
export function resolvePluginLoaderSync(
  source: PluginSource | AlpinePluginCallback,
  pluginName?: string
): PluginCallback {
  const direct = directCallback(source);
  if (direct !== null) {
    return direct;
  }

  if (!isLoaderSource(source)) {
    loaderFailure(LOADER_MUST_FUNCTION, pluginName);
  }

  return invokeLoadSync(source, pluginName);
}
