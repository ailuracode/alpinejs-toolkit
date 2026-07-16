import type Base from "alpinejs";

export interface Alpine<TStores extends Base.Stores = Base.Stores> extends Base.Alpine {
  store<T extends keyof TStores>(name: T, value: TStores[T]): void;
  store<T extends keyof TStores>(name: T): TStores[T];
}

export interface PluginCallback<T extends Base.Alpine = Base.Alpine> extends Base.PluginCallback {
  (alpine: T): void;
}
