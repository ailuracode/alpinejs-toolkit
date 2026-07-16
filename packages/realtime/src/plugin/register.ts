import { bridgeControllerStore, type Destroyable } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import type { RealtimeTransportAdapter } from "../adapters/RealtimeTransportAdapter";
import { RealtimeController } from "../controller/RealtimeController";
import type { RealtimeControllerConfig } from "../controller/RealtimeControllerConfig";
import type { RealtimeControllerState } from "../controller/RealtimeControllerState";
import {
  createRealtimeMagic,
  createRealtimeStore,
  REALTIME_MAGIC_KEY,
  REALTIME_STORE_KEY,
  type RealtimeAlpine,
  type RealtimeMagic,
  type RealtimePluginCallback,
  type RealtimeStore,
} from "./surface";

export type RealtimeAdapterResolver = (
  config: RealtimeControllerConfig
) => Promise<RealtimeTransportAdapter>;

function resolveStoreKey(config: RealtimeControllerConfig): string {
  if (typeof config.id === "string" && config.id.length > 0) {
    return config.id;
  }
  return REALTIME_STORE_KEY;
}

export function createRealtimePluginWithResolver(
  resolveAdapterFn: RealtimeAdapterResolver,
  defaultConfig: RealtimeControllerConfig = {}
): RealtimePluginCallback {
  return function registerRealtime(alpine: Alpine): void {
    const typedAlpine = alpine as unknown as RealtimeAlpine;
    const storeKey = resolveStoreKey(defaultConfig);
    const magicKey = defaultConfig.magicKey ?? REALTIME_MAGIC_KEY;
    const controller = new RealtimeController({ ...defaultConfig, id: storeKey });

    const store: RealtimeStore = createRealtimeStore(controller);
    const magic: RealtimeMagic = createRealtimeMagic(controller);

    bridgeControllerStore<RealtimeStore, RealtimeController & Destroyable>({
      alpine: typedAlpine,
      storeKey,
      store,
      controller: controller as RealtimeController & Destroyable,
      magicKey,
      packageName: "realtime",
      magicAccessor: () => magic,
      subscribe: (reactiveStore) =>
        controller.on("statuschange", (state: RealtimeControllerState) => {
          reactiveStore.state = state;
        }),
    });

    void resolveAdapterFn(defaultConfig).then(
      (adapter) => {
        if (controller.isDestroyed) {
          void Promise.resolve(adapter.destroy()).catch(() => undefined);
          return;
        }
        void controller.setAdapter(adapter).catch(() => undefined);
      },
      () => undefined
    );
  };
}
