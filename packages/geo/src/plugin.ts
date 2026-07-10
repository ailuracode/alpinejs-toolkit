/**
 * Alpine.js integration for `@ailuracode/alpine-geo`.
 *
 * Thin adapter that wires {@link GeoController} into
 * `$store.geo` and the `$geo` magic.
 */

import type { Alpine } from "alpinejs";
import { GeoController } from "./controller";
import type { GeoAlpine, GeoPluginCallback, GeoStore } from "./types";

/** Key under which the geo store is registered on `$store`. */
const GEO_STORE_KEY = "geo";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback.
 * Registers `$store.geo` and the `$geo` magic, syncing controller
 * state into the reactive store on every event.
 */
export function geoPlugin(): GeoPluginCallback {
  return function registerGeo(alpine: Alpine): void {
    const Alpine = alpine as unknown as GeoAlpine;
    const controller = new GeoController();

    // Build a mutable store object that delegates to the controller.
    const store: GeoStore = controller.toStore();
    Alpine.store(GEO_STORE_KEY, store);
    const reactiveStore = Alpine.store(GEO_STORE_KEY) as unknown as GeoStore;

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

    controller.on("position", sync);
    controller.on("error", sync);
    controller.on("watchStart", sync);
    controller.on("watchStop", sync);
    controller.on("update", sync);

    Alpine.magic(GEO_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed geo plugin options. */
export function geoOptions<const T extends Record<string, unknown>>(options: T): T {
  return options;
}
