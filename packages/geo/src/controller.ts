/**
 * Geo controller — the framework-agnostic core of
 * `@ailuracode/alpine-geo`. Manages geolocation state with
 * request/watch/unwatch/reset methods.
 *
 * Emits typed events on position change, error, and watch lifecycle
 * so consumers can react programmatically.
 */

import { BaseController, generateId } from "./core-deps.js";
import type { GeoErrorDetail, GeoEvents, GeoPositionDetail } from "./events";
import type { GeoPositionOptions, GeoStore } from "./types";

/**
 * Headless geolocation controller. Manages a single geolocation
 * instance with request/watch/unwatch/reset lifecycle.
 */
export class GeoController extends BaseController<GeoEvents> {
  #latitude: number | null = null;
  #longitude: number | null = null;
  #accuracy: number | null = null;
  #altitude: number | null = null;
  #altitudeAccuracy: number | null = null;
  #heading: number | null = null;
  #speed: number | null = null;
  #timestamp: number | null = null;
  #error: string | null = null;
  #errorCode: number | null = null;
  #loading = false;
  #watching = false;
  #watchId: number | null = null;
  #requestGeneration = 0;
  readonly #supported: boolean;

  constructor(id?: string) {
    super(id ?? generateId("geo"));
    this.#supported =
      typeof navigator !== "undefined" &&
      typeof navigator.geolocation?.getCurrentPosition === "function";
  }

  // --- Read-only state ----------------------------------------------------

  get latitude(): number | null {
    return this.#latitude;
  }

  get longitude(): number | null {
    return this.#longitude;
  }

  get accuracy(): number | null {
    return this.#accuracy;
  }

  get altitude(): number | null {
    return this.#altitude;
  }

  get altitudeAccuracy(): number | null {
    return this.#altitudeAccuracy;
  }

  get heading(): number | null {
    return this.#heading;
  }

  get speed(): number | null {
    return this.#speed;
  }

  get timestamp(): number | null {
    return this.#timestamp;
  }

  get error(): string | null {
    return this.#error;
  }

  get errorCode(): number | null {
    return this.#errorCode;
  }

  get loading(): boolean {
    return this.#loading;
  }

  get watching(): boolean {
    return this.#watching;
  }

  // --- Derived state ------------------------------------------------------

  get hasPosition(): boolean {
    return this.#latitude !== null && this.#longitude !== null;
  }

  get isSupported(): boolean {
    return this.#supported;
  }

  get isWatching(): boolean {
    return this.#watching;
  }

  get isLoading(): boolean {
    return this.#loading;
  }

  get hasError(): boolean {
    return this.#error !== null;
  }

  // --- Internal helpers ---------------------------------------------------

  #applyPosition(position: GeolocationPosition): void {
    this.#latitude = position.coords.latitude;
    this.#longitude = position.coords.longitude;
    this.#accuracy = position.coords.accuracy;
    this.#altitude = position.coords.altitude;
    this.#altitudeAccuracy = position.coords.altitudeAccuracy;
    this.#heading = position.coords.heading;
    this.#speed = position.coords.speed;
    this.#timestamp = position.timestamp;
    this.#error = null;
    this.#errorCode = null;

    const detail: GeoPositionDetail = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    };
    this.emit("position", detail);
  }

  #applyError(error: GeolocationPositionError): void {
    this.#error = error.message;
    this.#errorCode = error.code;

    const detail: GeoErrorDetail = { message: error.message, code: error.code };
    this.emit("error", detail);
  }

  #clearCoords(): void {
    this.#latitude = null;
    this.#longitude = null;
    this.#accuracy = null;
    this.#altitude = null;
    this.#altitudeAccuracy = null;
    this.#heading = null;
    this.#speed = null;
    this.#timestamp = null;
  }

  #clearPosition(): void {
    this.#clearCoords();
    this.#error = null;
    this.#errorCode = null;
  }

  // --- Public methods -----------------------------------------------------

  request(options?: GeoPositionOptions): Promise<boolean> {
    if (!this.#supported) {
      this.#error = "Geolocation is not supported";
      this.#errorCode = null;
      this.emit("error", { message: "Geolocation is not supported", code: 0 });
      return Promise.resolve(false);
    }

    this.#loading = true;
    this.#error = null;
    this.#errorCode = null;

    const generation = ++this.#requestGeneration;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (generation !== this.#requestGeneration) {
            resolve(false);
            return;
          }

          this.#loading = false;
          this.#applyPosition(position);
          resolve(true);
        },
        (error) => {
          if (generation !== this.#requestGeneration) {
            resolve(false);
            return;
          }

          this.#loading = false;
          this.#clearCoords();
          this.#applyError(error);
          resolve(false);
        },
        options
      );
    });
  }

  watch(options?: GeoPositionOptions): boolean {
    if (!this.#supported || this.#watching) {
      return false;
    }

    this.#error = null;
    this.#errorCode = null;

    this.#watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.#applyPosition(position);
      },
      (error) => {
        this.#clearCoords();
        this.#applyError(error);
      },
      options
    );

    this.#watching = true;

    this.registerCleanup(() => {
      if (this.#watchId !== null) {
        navigator.geolocation.clearWatch(this.#watchId);
        this.#watchId = null;
        this.#watching = false;
      }
    });

    this.emit("watchStart", undefined as undefined);
    return true;
  }

  unwatch(): boolean {
    if (this.#watchId === null) {
      return false;
    }

    navigator.geolocation.clearWatch(this.#watchId);
    this.#watchId = null;
    this.#watching = false;
    this.emit("watchStop", undefined as undefined);
    return true;
  }

  reset(): boolean {
    this.#clearPosition();
    this.emit("update", undefined as undefined);
    return true;
  }

  /**
   * Returns a store-shaped object for Alpine's `$store.geo`.
   * The store delegates to this controller.
   */
  toStore(): GeoStore {
    const self = this;
    const store: GeoStore = {
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: null,
      error: null,
      errorCode: null,
      loading: false,
      watching: false,

      get hasPosition() {
        return this.latitude !== null && this.longitude !== null;
      },
      get isSupported() {
        return self.isSupported;
      },
      get isWatching() {
        return this.watching;
      },
      get isLoading() {
        return this.loading;
      },
      get hasError() {
        return this.error !== null;
      },

      request: (options) => self.request(options),
      watch: (options) => self.watch(options),
      unwatch: () => self.unwatch(),
      reset: () => self.reset(),
    };
    return store;
  }
}

/**
 * Creates a GeoController instance.
 * Convenience for non-Alpine consumers.
 */
export function createGeoController(id?: string): GeoController {
  return new GeoController(id);
}

/**
 * Creates a GeoStore (store-shaped object) directly.
 * Backward-compatible alias.
 */
export function createGeoStore(): GeoStore {
  return new GeoController().toStore();
}
