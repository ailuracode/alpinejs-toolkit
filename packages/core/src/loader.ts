import type { AlpinePluginCallback, PluginLoader } from "./types.js";

export class PluginLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PluginLoaderError";
  }
}

function isPluginCallback(value: unknown): value is AlpinePluginCallback {
  return typeof value === "function";
}

function isLazyFactory(
  loader: PluginLoader
): loader is (() => AlpinePluginCallback) | (() => Promise<AlpinePluginCallback>) {
  return typeof loader === "function" && loader.length === 0;
}

/** Resolves a lazy plugin loader to an Alpine plugin callback. */
export async function resolvePluginLoader(loader: PluginLoader): Promise<AlpinePluginCallback> {
  if (!isLazyFactory(loader)) {
    return loader;
  }

  const candidate = loader();
  const resolved = candidate instanceof Promise ? await candidate : candidate;

  if (!isPluginCallback(resolved)) {
    throw new PluginLoaderError("Plugin loader must resolve to a function");
  }

  return resolved;
}

/** Resolves a lazy plugin loader synchronously. Throws when the loader is async. */
export function resolvePluginLoaderSync(loader: PluginLoader): AlpinePluginCallback {
  if (!isLazyFactory(loader)) {
    return loader;
  }

  const candidate = loader();

  if (candidate instanceof Promise) {
    throw new PluginLoaderError("Async plugin loaders require initPlugins() before Alpine.start()");
  }

  if (!isPluginCallback(candidate)) {
    throw new PluginLoaderError("Plugin loader must resolve to a function");
  }

  return candidate;
}
