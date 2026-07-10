import type AlpineType from "alpinejs";
import { createGeoController, type GeoController, type GeoStore } from "./controller.js";

export {
  createGeoController,
  createGeoStore,
  type GeoController,
  type GeoPositionOptions,
  type GeoStore,
} from "./controller.js";

/** Alpine.js geolocation plugin. Registers `$store.geo`. */
export default function geoPlugin(Alpine: AlpineType.Alpine): void {
  const controller: GeoController = createGeoController();
  const store: GeoStore = controller;
  Alpine.store("geo", store);
  Alpine.magic("geo", () => Alpine.store("geo"));
}

declare global {
  namespace Alpine {
    interface Stores {
      geo: GeoStore;
    }
  }
}
