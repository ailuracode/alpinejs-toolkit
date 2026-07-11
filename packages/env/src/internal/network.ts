/**
 * Pure, framework-agnostic snapshot of the current connectivity.
 * Called from `NetworkController.mount()` and exposed for tests and
 * SSR adapters that need a single read without an event lifecycle.
 *
 * SSR-safe: when `navigator` is undefined the snapshot defaults to
 * "online" so consumers never crash on the server.
 */

export interface NetworkSnapshot {
  readonly isOnline: boolean;
  readonly isOffline: boolean;
}

/**
 * Reads `navigator.onLine` once and projects it into the isomorphic
 * `{ isOnline, isOffline }` pair. The default assumes "online" when
 * `navigator` is missing so SSR renders can show connectivity as
 * available without crashing.
 */
export function readNetworkState(): NetworkSnapshot {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
