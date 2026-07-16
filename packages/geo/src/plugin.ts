/**
 * Alpine.js integration for `@ailuracode/alpine-geo`.
 *
 * Thin adapter that wires {@link GeoController} into
 * `$store.geo` and the `$geo` magic.
 */

import { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
import type { Alpine } from "alpinejs";
import { GeoController } from "./controller";
import {
  type CreateGeoOptions,
  DEFAULT_GEO_MAGIC_KEY,
  DEFAULT_GEO_STORE_KEY,
  type GeoAlpine,
  type GeoPluginCallback,
  type GeoStore,
} from "./types";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback.
 * Registers `$store.geo` and the `$geo` magic, syncing controller
 * state into the reactive store on every event.
 */
export function geoPlugin(options: CreateGeoOptions = {}): GeoPluginCallback {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_GEO_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_GEO_MAGIC_KEY;

  return function registerGeo(alpine: Alpine): void {
    const Alpine = alpine as unknown as GeoAlpine;
    const controller = new GeoController();
    const store: GeoStore = controller.toStore();

    bridgeControllerStore<GeoStore, GeoController>({
      alpine: Alpine,
      storeKey,
      magicKey,
      store,
      controller,
      packageName: "geo",
      subscribe: (reactiveStore) => {
        // Sync controller state into the reactive store on every event.
        const sync = (): void => {
          reactiveStore.latitude = controller.latitude;
          reactiveStore.longitude = controller.longitude;
          reactiveStore.accuracy = controller.accuracy;
          reactiveStore.altitude = controller.altitude;
          reactiveStore.altitudeAccuracy = controller.altitudeAccuracy;
          reactiveStore.heading = controller.heading;
          reactiveStore.speed = controller.speed;
          reactiveStore.timestamp = controller.timestamp;
          reactiveStore.error = controller.error;
          reactiveStore.errorCode = controller.errorCode;
          reactiveStore.loading = controller.loading;
          reactiveStore.watching = controller.watching;
        };

        const positionUnsub = controller.on("position", sync);
        const errorUnsub = controller.on("error", sync);
        const watchStartUnsub = controller.on("watchStart", sync);
        const watchStopUnsub = controller.on("watchStop", sync);
        const updateUnsub = controller.on("update", sync);

        return (): void => {
          positionUnsub();
          errorUnsub();
          watchStartUnsub();
          watchStopUnsub();
          updateUnsub();
        };
      },
    });
  };
}

/** Builds typed geo plugin options. */
export function geoOptions<const T extends Record<string, unknown>>(options: T): T {
  return options;
}
