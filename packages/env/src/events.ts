/**
 * Strongly-typed event maps for `@ailuracode/alpine-env` controllers.
 *
 * Each controller owns its own event map so subscribing via
 * `controller.on(event, listener)` is type-checked end-to-end. The
 * payload types are intentional snapshots — not the controller
 * itself — so subscribers never couple to internal state.
 */

import type { PlatformName } from "./internal/platform.js";
import type { VisibilityState } from "./internal/visibility.js";

/** Snapshot emitted by `NetworkController.on('change', ...)`. */
export interface NetworkChange {
  readonly isOnline: boolean;
  readonly isOffline: boolean;
}

/** Event map consumed by `BaseController<NetworkEvents>`. */
export interface NetworkEvents extends Record<string, unknown> {
  change: NetworkChange;
}

/** Snapshot emitted by `VisibilityController.on('change', ...)`. */
export interface VisibilityChange {
  readonly isVisible: boolean;
  readonly isHidden: boolean;
  readonly state: VisibilityState;
}

/** Event map consumed by `BaseController<VisibilityEvents>`. */
export interface VisibilityEvents extends Record<string, unknown> {
  change: VisibilityChange;
}

/** Snapshot emitted by `BatteryController.on('change', ...)`. */
export interface BatteryChange {
  readonly isAvailable: boolean;
  readonly level: number | null;
  readonly isCharging: boolean;
  readonly chargingTime: number | null;
  readonly dischargingTime: number | null;
}

/** Event map consumed by `BaseController<BatteryEvents>`. */
export interface BatteryEvents extends Record<string, unknown> {
  change: BatteryChange;
}

/** Snapshot emitted by `PlatformController.on('change', ...)`. */
export interface PlatformChange {
  readonly name: PlatformName;
}

/** Event map consumed by `BaseController<PlatformEvents>`. */
export interface PlatformEvents extends Record<string, unknown> {
  change: PlatformChange;
}
