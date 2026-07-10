/**
 * Public type contracts for `@ailuracode/alpine-geo`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Geolocation request/watch options. */
export interface GeoPositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/** Alpine-facing store surface. */
export interface GeoStore {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: string | null;
  errorCode: number | null;
  loading: boolean;
  watching: boolean;
  request(options?: GeoPositionOptions): Promise<boolean>;
  watch(options?: GeoPositionOptions): boolean;
  unwatch(): boolean;
  reset(): boolean;
  readonly hasPosition: boolean;
  readonly isSupported: boolean;
  readonly isWatching: boolean;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

/** Typed view of `Alpine` the geo plugin uses internally. */
export type GeoAlpine = Alpine<{ geo: GeoStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type GeoPluginCallback = PluginCallback<AlpineBase>;
