/**
 * Composed attention controller — bundles {@link WakeLockController}
 * and {@link IdleController} for non-Alpine consumers who want a
 * single entry point.
 *
 * @module
 */

import { IdleController } from "./idle-controller";
import type { IdleDetectorConstructor } from "./types";
import { WakeLockController } from "./wakelock-controller";

/**
 * Composed controller that owns a {@link WakeLockController} and
 * an {@link IdleController}. Call `mount()` to start both, and
 * `destroy()` to tear both down.
 *
 * ```ts
 * const attention = createAttentionController();
 * attention.mount();
 * await attention.wakeLock.request();
 * await attention.idle.start();
 * attention.destroy();
 * ```
 */
export class AttentionController {
  readonly #wakeLock: WakeLockController;
  readonly #idle: IdleController;

  constructor(idleDetectorCtor?: IdleDetectorConstructor | null) {
    this.#wakeLock = new WakeLockController();
    this.#idle = new IdleController(idleDetectorCtor);
  }

  get wakeLock(): WakeLockController {
    return this.#wakeLock;
  }

  get idle(): IdleController {
    return this.#idle;
  }

  /** Mounts both sub-controllers. */
  mount(): void {
    this.#wakeLock.mount();
    this.#idle.mount();
  }

  /** Destroys both sub-controllers. Idempotent. */
  destroy(): void {
    this.#wakeLock.destroy();
    this.#idle.destroy();
  }
}

/**
 * Creates an {@link AttentionController} instance.
 * Convenience for non-Alpine consumers.
 */
export function createAttentionController(
  idleDetectorCtor?: IdleDetectorConstructor | null
): AttentionController {
  return new AttentionController(idleDetectorCtor);
}
