/**
 * Headless Screen Wake Lock controller.
 *
 * Framework-agnostic class that manages the browser Wake Lock API.
 * Extends {@link BaseController} for lifecycle and event emission.
 * No Alpine dependency — consumers wire their own adapter.
 *
 * @module
 */

import { getWakeLockApi } from "./browser.js";
import { BaseController } from "./core-deps.js";
import type { WakeLockEvents } from "./events.js";
import type { WakeLockLike, WakeLockSentinelLike } from "./types.js";

/**
 * Headless wake lock controller.
 *
 * Manages acquisition, release, and auto-reacquisition of the
 * Screen Wake Lock. Lifecycle is driven by `mount()` / `destroy()`.
 *
 * ```ts
 * const wl = new WakeLockController();
 * wl.mount();
 * await wl.request();
 * // …
 * wl.destroy(); // releases active lock, cleans up listeners
 * ```
 */
export class WakeLockController extends BaseController<WakeLockEvents> {
  #sentinel: WakeLockSentinelLike | null = null;
  #wantsLock = false;
  #isActive = false;
  #isRequesting = false;
  #error: string | null = null;
  readonly #wakeLock: WakeLockLike | null;
  readonly #isSupported: boolean;

  constructor() {
    super("wakelock");
    this.#wakeLock = getWakeLockApi();
    this.#isSupported = this.#wakeLock != null && typeof this.#wakeLock.request === "function";
  }

  // ── Read-only state ──────────────────────────────────────────

  get isActive(): boolean {
    return this.#isActive;
  }

  get isRequesting(): boolean {
    return this.#isRequesting;
  }

  get error(): string | null {
    return this.#error;
  }

  get isSupported(): boolean {
    return this.#isSupported;
  }

  // ── Public commands ──────────────────────────────────────────

  /**
   * Acquires the screen wake lock.
   *
   * Returns `true` on success, `false` when unsupported or on error.
   * Emits `"wakelock:change"` after every state transition.
   */
  async request(): Promise<boolean> {
    if (this.isDestroyed) {
      return false;
    }

    if (!(this.#isSupported && this.#wakeLock)) {
      this.#error = "Wake Lock is not supported";
      this.#emitChange();
      return false;
    }

    if (this.#isActive) {
      return true;
    }

    this.#isRequesting = true;
    this.#error = null;
    this.#wantsLock = true;

    try {
      this.#sentinel = await this.#wakeLock.request("screen");
      this.#isActive = !this.#sentinel.released;

      this.registerCleanup(() => {
        this.#sentinel?.removeEventListener("release", this.#onSentinelRelease);
      });
      this.#sentinel.addEventListener("release", this.#onSentinelRelease);

      this.#emitChange();
      return true;
    } catch (error) {
      this.#wantsLock = false;
      this.#error = error instanceof Error ? error.message : "Failed to acquire wake lock";
      this.#emitChange();
      return false;
    } finally {
      this.#isRequesting = false;
    }
  }

  /**
   * Releases the active wake lock.
   *
   * Returns `true` on success. Subsequent calls while already
   * released are idempotent.
   */
  async release(): Promise<boolean> {
    if (this.isDestroyed) {
      return false;
    }

    this.#wantsLock = false;

    if (!this.#sentinel || this.#sentinel.released) {
      this.#isActive = false;
      this.#sentinel = null;
      this.#emitChange();
      return true;
    }

    try {
      await this.#sentinel.release();
      this.#isActive = false;
      this.#sentinel = null;
      this.#emitChange();
      return true;
    } catch (error) {
      this.#error = error instanceof Error ? error.message : "Failed to release wake lock";
      this.#emitChange();
      return false;
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /**
   * Starts the controller. Registers the `visibilitychange`
   * listener so the wake lock re-acquires when the tab becomes
   * visible again after a browser-initiated release.
   */
  override mount(): void {
    if (this.isDestroyed || this.isMounted) {
      return;
    }
    super.mount();
    this.#initVisibilityListener();
  }

  /**
   * Releases the active wake lock and tears down all listeners.
   * Idempotent — safe to call multiple times.
   */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.#isActive) {
      void this.#sentinel?.release();
      this.#isActive = false;
      this.#sentinel = null;
    }
    this.#wantsLock = false;
    super.destroy();
  }

  // ── Private ──────────────────────────────────────────────────

  #onSentinelRelease = (): void => {
    this.#isActive = false;
    this.#sentinel = null;
    this.#emitChange();
  };

  #initVisibilityListener(): void {
    if (typeof document === "undefined") {
      return;
    }

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible" && this.#wantsLock && !this.#isActive) {
        void this.request();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    this.registerCleanup(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    });
  }

  #emitChange(): void {
    this.emit("wakelock:change", {
      isActive: this.#isActive,
      isRequesting: this.#isRequesting,
      error: this.#error,
    });
  }
}

/**
 * Creates a {@link WakeLockController} instance.
 * Convenience for non-Alpine consumers.
 */
export function createWakeLockController(): WakeLockController {
  return new WakeLockController();
}
