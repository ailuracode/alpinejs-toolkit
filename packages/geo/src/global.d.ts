/// <reference types="@types/alpinejs" />

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

declare global {
  namespace Alpine {
    interface Stores {
      geo: GeoStore;
    }
  }
}
