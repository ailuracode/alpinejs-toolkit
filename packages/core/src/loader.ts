/**
 * Plugin loader resolution — converts a {@link PluginSource} into an
 * {@link PluginCallback} either synchronously or asynchronously.
 *
 * When a loader throws or returns a non-function, the failure is
 * surfaced both as a {@link PluginLoaderError} and as a `load-error`
 * event through the registry's diagnostic sink. The sink is an
 * escape hatch — production code reads the thrown error, not the
 * event stream.
 */
import type { PluginCallback } from "alpinejs";
import { ToolkitError } from "./core/error";
import { emitLoadError } from "./registry";
import type { PluginSource } from "./types";

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

function isPluginCallback(value: unknown): value is PluginCallback {
  return typeof value === "function";
}

/** Resolves a plugin source to an Alpine plugin callback. */
export async function resolvePluginLoader(
  source: PluginSource,
  pluginName?: string
): Promise<PluginCallback> {
  if (source.source === "callback") {
    return source.callback;
  }

  let resolved: unknown;
  try {
    const candidate = source.load();
    resolved = candidate instanceof Promise ? await candidate : candidate;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    emitLoadError(pluginName ?? "<anonymous>", reason);
    throw error;
  }

  if (!isPluginCallback(resolved)) {
    const reason = "Plugin loader must resolve to a function";
    emitLoadError(pluginName ?? "<anonymous>", reason);
    throw new PluginLoaderError(reason);
  }

  return resolved;
}

/**
 * Resolves a plugin source synchronously. Throws when the loader is
 * async, because there is no way to defer `Alpine.start()` without a separate
 * code path — and that path is exactly what `initPlugins()` exists for.
 */
export function resolvePluginLoaderSync(source: PluginSource, pluginName?: string): PluginCallback {
  if (source.source === "callback") {
    return source.callback;
  }

  let candidate: unknown;
  try {
    candidate = source.load();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    emitLoadError(pluginName ?? "<anonymous>", reason);
    throw error;
  }

  if (candidate instanceof Promise) {
    const reason = "Async plugin loaders require initPlugins() before Alpine.start()";
    emitLoadError(pluginName ?? "<anonymous>", reason);
    throw new PluginLoaderError(reason, { cause: candidate });
  }

  if (!isPluginCallback(candidate)) {
    const reason = "Plugin loader must resolve to a function";
    emitLoadError(pluginName ?? "<anonymous>", reason);
    throw new PluginLoaderError(reason);
  }

  return candidate;
}
