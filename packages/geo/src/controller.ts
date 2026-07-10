export interface GeoPositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

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

function applyPosition(store: GeoStore, position: GeolocationPosition): void {
  store.latitude = position.coords.latitude;
  store.longitude = position.coords.longitude;
  store.accuracy = position.coords.accuracy;
  store.altitude = position.coords.altitude;
  store.altitudeAccuracy = position.coords.altitudeAccuracy;
  store.heading = position.coords.heading;
  store.speed = position.coords.speed;
  store.timestamp = position.timestamp;
  store.error = null;
  store.errorCode = null;
}

function applyError(store: GeoStore, error: GeolocationPositionError): void {
  store.error = error.message;
  store.errorCode = error.code;
}

function clearCoords(store: GeoStore): void {
  store.latitude = null;
  store.longitude = null;
  store.accuracy = null;
  store.altitude = null;
  store.altitudeAccuracy = null;
  store.heading = null;
  store.speed = null;
  store.timestamp = null;
}

function clearPosition(store: GeoStore): void {
  clearCoords(store);
  store.error = null;
  store.errorCode = null;
}

/** Creates headless geolocation controller/store. */
export function createGeoStore(): GeoStore {
  const supported = typeof navigator.geolocation?.getCurrentPosition === "function";
  let watchId: number | null = null;
  let requestGeneration = 0;

  return {
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
      return supported;
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

    request(options?: GeoPositionOptions) {
      if (!supported) {
        this.error = "Geolocation is not supported";
        this.errorCode = null;
        return Promise.resolve(false);
      }

      this.loading = true;
      this.error = null;
      this.errorCode = null;

      const generation = ++requestGeneration;

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (generation !== requestGeneration) {
              resolve(false);
              return;
            }

            applyPosition(this, position);
            this.loading = false;
            resolve(true);
          },
          (error) => {
            if (generation !== requestGeneration) {
              resolve(false);
              return;
            }

            clearCoords(this);
            applyError(this, error);
            this.loading = false;
            resolve(false);
          },
          options
        );
      });
    },

    watch(options?: GeoPositionOptions) {
      if (!supported || this.watching) {
        return false;
      }

      this.error = null;
      this.errorCode = null;

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          applyPosition(this, position);
        },
        (error) => {
          clearCoords(this);
          applyError(this, error);
        },
        options
      );

      this.watching = true;
      return true;
    },

    unwatch() {
      if (watchId === null) {
        return false;
      }

      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      this.watching = false;
      return true;
    },

    reset() {
      clearPosition(this);
      return true;
    },
  };
}

export type GeoController = GeoStore;

/** Alias matching controller-based architecture naming. */
export function createGeoController(): GeoController {
  return createGeoStore();
}
