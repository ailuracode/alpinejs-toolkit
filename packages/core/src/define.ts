import { resolvePluginLoader } from "./loader.js";
import type {
  DirectivePluginDefinition,
  HybridPluginDefinition,
  MagicPluginDefinition,
  PluginLoader,
  StorePluginDefinition,
} from "./types.js";

/** Creates a magic plugin definition. */
export function defineMagicPlugin(
  magics: readonly string[],
  plugin: PluginLoader
): MagicPluginDefinition {
  return {
    kind: "magic",
    magics,
    plugin,
  };
}

/** Creates a store plugin definition. */
export function defineStorePlugin(
  stores: readonly string[],
  plugin: PluginLoader
): StorePluginDefinition {
  return {
    kind: "store",
    stores,
    plugin,
  };
}

/** Creates a directive plugin definition. */
export function defineDirectivePlugin(
  directives: readonly string[],
  plugin: PluginLoader
): DirectivePluginDefinition {
  return {
    kind: "directive",
    directives,
    plugin,
  };
}

/** Creates a hybrid plugin definition for magics and stores together. */
export function defineHybridPlugin(options: {
  magics?: readonly string[];
  stores?: readonly string[];
  plugin: PluginLoader;
}): HybridPluginDefinition {
  return {
    kind: "both",
    magics: options.magics,
    stores: options.stores,
    plugin: options.plugin,
  };
}

type LazyPluginModule = {
  default: PluginLoader;
};

/** Creates a plugin definition backed by a dynamic `import()`. */
export function lazyPlugin(
  definition: Omit<MagicPluginDefinition, "plugin"> & {
    import: () => Promise<LazyPluginModule>;
  }
): MagicPluginDefinition;
export function lazyPlugin(
  definition: Omit<StorePluginDefinition, "plugin"> & {
    import: () => Promise<LazyPluginModule>;
  }
): StorePluginDefinition;
export function lazyPlugin(
  definition: Omit<HybridPluginDefinition, "plugin"> & {
    import: () => Promise<LazyPluginModule>;
  }
): HybridPluginDefinition;
export function lazyPlugin(
  definition: Omit<DirectivePluginDefinition, "plugin"> & {
    import: () => Promise<LazyPluginModule>;
  }
): DirectivePluginDefinition;
export function lazyPlugin(definition: {
  kind: "magic" | "store" | "both" | "directive";
  magics?: readonly string[];
  stores?: readonly string[];
  directives?: readonly string[];
  import: () => Promise<LazyPluginModule>;
}):
  | MagicPluginDefinition
  | StorePluginDefinition
  | HybridPluginDefinition
  | DirectivePluginDefinition {
  const { import: importModule, ...rest } = definition;
  const plugin = async () => {
    const module = await importModule();
    return resolvePluginLoader(module.default);
  };

  switch (rest.kind) {
    case "magic":
      return defineMagicPlugin(rest.magics ?? [], plugin);
    case "store":
      return defineStorePlugin(rest.stores ?? [], plugin);
    case "both":
      return defineHybridPlugin({
        magics: rest.magics,
        stores: rest.stores,
        plugin,
      });
    case "directive":
      return defineDirectivePlugin(rest.directives ?? [], plugin);
  }
}
