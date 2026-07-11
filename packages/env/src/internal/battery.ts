/**
 * Pure projection of a `BatteryManager` instance into the immutable
 * `BatterySnapshot` shape the controller uses.
 *
 * The manager reference can be `undefined` (when `navigator.getBattery`
 * is missing or rejects). The result is the canonical "unavailable"
 * snapshot with `isAvailable: false` and every numeric field as `null`.
 *
 * Exposed publicly so plugin upgrades can still ship a separate
 * `readBatteryState` helper if downstream tests need it; the controller's
 * internal logic uses `readBatteryState` directly.
 */

export interface BatterySnapshot {
  readonly isAvailable: boolean;
  readonly level: number | null;
  readonly isCharging: boolean;
  readonly chargingTime: number | null;
  readonly dischargingTime: number | null;
}

/**
 * Structural subset of `BatteryManager` the helper reads. Mirrors the
 * spec so a custom manager can be injected in tests.
 */
export interface BatteryManagerLike {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: Event): boolean;
}

/** `Infinity` is not a valid duration — collapse to `null`. */
function normalizeTime(seconds: number): number | null {
  return Number.isFinite(seconds) ? seconds : null;
}

/**
 * Projects a `BatteryManager` into a `BatterySnapshot`. Returns the
 * unavailable defaults when the manager is `undefined`.
 *
 * @param manager - Optional `BatteryManager`-like object.
 */
export function readBatteryState(manager?: BatteryManagerLike): BatterySnapshot {
  if (!manager) {
    return {
      isAvailable: false,
      level: null,
      isCharging: false,
      chargingTime: null,
      dischargingTime: null,
    };
  }

  return {
    isAvailable: true,
    level: manager.level,
    isCharging: manager.charging,
    chargingTime: normalizeTime(manager.chargingTime),
    dischargingTime: normalizeTime(manager.dischargingTime),
  };
}
