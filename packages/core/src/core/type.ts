/**
 * Generic Alpine typings shared across the toolkit.
 *
 * The base `Alpine` shape comes from `@types/alpinejs`. This module
 * adds two extensions that every feature plugin needs:
 *
 * - {@link Alpine} — a typed view of `Alpine` whose `store()` overloads
 *   are narrowed to a user-supplied `Stores` map. Use it when a plugin
 *   needs to read or write strongly-typed stores (e.g. `ThemeStore`,
 *   `ShareStore`). Every other Alpine API is inherited unchanged.
 * - {@link PluginCallback} — a generic `Alpine.plugin()` callback whose
 *   parameter is the `Alpine` flavor the plugin needs. The default
 *   `T = Base.Alpine` keeps the bare callback structurally assignable
 *   to `Base.PluginCallback`, so the factory returned by a feature
 *   plugin (e.g. `themePlugin(...)`) drops straight into
 *   `Alpine.plugin(...)` without a cast.
 */
import type Base from "alpinejs";

/**
 * Generic `Alpine` view that narrows `store()` to a typed `Stores` map.
 *
 * @typeParam TStores - Record of store name to store value. Defaults to
 *   `Base.Stores` (`{ [key: string]: unknown }`) so `Alpine` is a
 *   drop-in replacement for the base interface.
 *
 * Example: a feature package can declare `Alpine<{ theme: ThemeStore }>`
 * and `alpine.store("theme")` returns `ThemeStore` without a cast. The
 * generic adds typed `store` overloads on top of `Base.Alpine`; every
 * other Alpine API is inherited unchanged and a real `Alpine` runtime
 * is assignable to any `Alpine<TStores>` without a cast.
 */
export interface Alpine<TStores extends Base.Stores = Base.Stores> extends Base.Alpine {
  store<T extends keyof TStores>(name: T, value: TStores[T]): void;
  store<T extends keyof TStores>(name: T): TStores[T];
}

/**
 * Plugin callback typed against a specific `Alpine` flavor.
 *
 * Defaults to `Base.Alpine`, which makes the bare callback
 * structurally assignable to `Base.PluginCallback`. That is the shape
 * `Alpine.plugin(...)` expects, so feature plugins can return
 * `PluginCallback<Base.Alpine>` (or the equivalent
 * `Base.PluginCallback`) and drop the result straight into
 * `Alpine.plugin(...)` without a cast.
 *
 * When a plugin needs a typed view (e.g. narrowed `store` overloads
 * for a specific store name), declare an extension of `Base.Alpine`,
 * parameterise `PluginCallback<TView>` with it, and narrow the runtime
 * instance to that view at the entry point of the callback body.
 *
 * @typeParam T - The `Alpine` flavor the callback expects. Defaults to
 *   `Base.Alpine`.
 */
export interface PluginCallback<T extends Base.Alpine = Base.Alpine> extends Base.PluginCallback {
  (alpine: T): void;
}
