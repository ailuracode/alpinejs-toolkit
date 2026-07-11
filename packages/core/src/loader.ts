/**
 * Plugin loader resolution — converts a {@link PluginLoader} into an
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
import type { PluginLoader } from "./types";

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

/**
 * A "lazy factory" is a function with arity 0 that returns either an
 * {@link PluginCallback} or a `Promise<PluginCallback>`. Higher-arity
 * loaders are rejected because they would force consumers to think in terms
 * of sync vs. async inference rules.
 */
function isLazyFactory(
  loader: PluginLoader
): loader is (() => PluginCallback) | (() => Promise<PluginCallback>) {
  return typeof loader === "function" && loader.length === 0;
}

/** Resolves a lazy plugin loader to an Alpine plugin callback. */
export async function resolvePluginLoader(
  loader: PluginLoader,
  pluginName?: string
): Promise<PluginCallback> {
  if (!isLazyFactory(loader)) {
    return loader;
  }

  let resolved: unknown;
  try {
    const candidate = loader();
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
 * Resolves a lazy plugin loader synchronously. Throws when the loader is
 * async, because there is no way to defer `Alpine.start()` without a separate
 * code path — and that path is exactly what `initPlugins()` exists for.
 */
export function resolvePluginLoaderSync(loader: PluginLoader, pluginName?: string): PluginCallback {
  if (!isLazyFactory(loader)) {
    return loader;
  }

  let candidate: unknown;
  try {
    candidate = loader();
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
