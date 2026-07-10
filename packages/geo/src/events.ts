/**
 * Strongly-typed event map for the geo controller.
 */

/** Detail payload for the `position` event. */
export interface GeoPositionDetail {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
  readonly altitude: number | null;
  readonly altitudeAccuracy: number | null;
  readonly heading: number | null;
  readonly speed: number | null;
  readonly timestamp: number;
}

/** Detail payload for the `error` event. */
export interface GeoErrorDetail {
  readonly message: string;
  readonly code: number;
}

/**
 * Event map for geo state changes.
 *
 * - `position` — new position received (from request or watch)
 * - `error` — geolocation error occurred
 * - `watchStart` — watch monitoring started
 * - `watchStop` — watch monitoring stopped
 * - `update` — generic state change (e.g. reset, loading toggle)
 */
export interface GeoEvents extends Record<string, unknown> {
  position: GeoPositionDetail;
  error: GeoErrorDetail;
  watchStart: undefined;
  watchStop: undefined;
  update: undefined;
}
