/// <reference types="@types/alpinejs" />

import type { GeoStore } from "./types";

export type { GeoPositionOptions, GeoStore } from "./types";

export function createGeoController(id?: string): import("./controller").GeoController;

export default function geoPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      geo: GeoStore;
    }
    interface Magics<T> {
      $geo: GeoStore;
    }
  }
}
