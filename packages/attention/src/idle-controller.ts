/**
 * Headless Idle Detection controller.
 *
 * Framework-agnostic class that manages the browser Idle Detection API.
 * Extends {@link BaseController} for lifecycle and event emission.
 * No Alpine dependency — consumers wire their own adapter.
 *
 * @module
 */

import { BaseController } from "@ailuracode/alpine-core/controller";
import { getIdleDetectorConstructor } from "./browser.js";
import type { IdleEvents } from "./events.js";
import { createIdlePermissionAdapter } from "./permission-adapter.js";
import type {
  IdleDetectorConstructor,
  IdleDetectorLike,
  IdleScreenState,
  IdleUserState,
} from "./types.js";

export const DEFAULT_IDLE_THRESHOLD = 60_000;
export const MIN_IDLE_THRESHOLD = 60_000;

function idlePermissionError(permission: Exclude<PermissionState, "granted">): string {
  return permission === "denied"
    ? "Permission blocked — reset in browser site settings"
    : "Permission denied";
}

/** Clamps idle thresholds to the browser minimum (60 s). */
export function normalizeIdleThreshold(threshold = DEFAULT_IDLE_THRESHOLD): number {
  return Math.max(threshold, MIN_IDLE_THRESHOLD);
}

/**
 * Headless idle detection controller.
 *
 * Manages permission prompts, detector lifecycle, and state tracking
 * for the Idle Detection API. Lifecycle is driven by `mount()` /
 * `destroy()`.
 *
 * ```ts
 * const idle = new IdleController();
 * idle.mount();  // queries permission, registers change listener
 * await idle.start();
 * // …
 * idle.destroy(); // stops detector, cleans up all listeners
 * ```
 */
export class IdleController extends BaseController<IdleEvents> {
  #userState: IdleUserState | null = null;
  #screenState: IdleScreenState | null = null;
  #permission: PermissionState | null = null;
  #error: string | null = null;
  #threshold = DEFAULT_IDLE_THRESHOLD;
  #isLoading = false;
  #isWatching = false;

  #detector: IdleDetectorLike | null = null;
  #detectorChangeHandler: (() => void) | null = null;
  readonly #idleDetectorCtor: IdleDetectorConstructor | null;
  readonly #isSupported: boolean;
  readonly #permissionAdapter: ReturnType<typeof createIdlePermissionAdapter>;

  constructor(idleDetectorCtor?: IdleDetectorConstructor | null) {
    super("idle");
    this.#idleDetectorCtor = idleDetectorCtor ?? getIdleDetectorConstructor();
    this.#permissionAdapter = createIdlePermissionAdapter(this.#idleDetectorCtor);
    this.#isSupported =
      this.#idleDetectorCtor != null &&
      typeof this.#idleDetectorCtor.requestPermission === "function";
  }

  // ── Read-only state ──────────────────────────────────────────

  get userState(): IdleUserState | null {
    return this.#userState;
  }

  get screenState(): IdleScreenState | null {
    return this.#screenState;
  }

  get permission(): PermissionState | null {
    return this.#permission;
  }

  get error(): string | null {
    return this.#error;
  }

  get threshold(): number {
    return this.#threshold;
  }

  get isLoading(): boolean {
    return this.#isLoading;
  }

  get isWatching(): boolean {
    return this.#isWatching;
  }

  get isSupported(): boolean {
    return this.#isSupported;
  }

  get isActive(): boolean {
    return this.#userState === "active";
  }

  get isIdle(): boolean {
    return this.#userState === "idle";
  }

  // ── Public commands ──────────────────────────────────────────

  /**
   * Requests idle detection permission from the browser.
   *
   * Queries the Permissions API first; prompts via
   * `IdleDetector.requestPermission()` only when the state is
   * `"prompt"`. Returns the resulting permission state.
   */
  async requestPermission(): Promise<PermissionState> {
    if (this.isDestroyed) {
      return "denied";
    }

    if (!(this.#isSupported && this.#idleDetectorCtor)) {
      this.#error = "Idle Detection is not supported";
      this.#permission = "denied";
      this.#emitChange();
      return "denied";
    }

    await this.#syncPermission();

    if (this.#permission === "granted") {
      this.#error = null;
      this.#emitChange();
      return "granted";
    }

    if (this.#permission === "denied") {
      this.#error = idlePermissionError("denied");
      this.#emitChange();
      return "denied";
    }

    return this.#promptPermission();
  }

  /**
   * Starts idle detection.
   *
   * Ensures permission is granted (prompting if needed), normalizes
   * the threshold, and starts the IdleDetector. If a threshold
   * change is detected while already watching, restarts the
   * detector with the new threshold.
   *
   * Returns `true` on success, `false` on unsupported / denied /
   * error.
   */
  async start(options?: { threshold?: number }): Promise<boolean> {
    if (this.isDestroyed) {
      return false;
    }

    if (!(this.#isSupported && this.#idleDetectorCtor)) {
      this.#error = "Idle Detection is not supported";
      this.#emitChange();
      return false;
    }

    // If already watching, check if threshold changed → restart.
    if (this.#isWatching && this.#detector && this.#shouldRestart(options)) {
      this.#clearDetector();
      this.#resetWatchingState();
    } else if (this.#isWatching && this.#detector) {
      return true;
    }

    if (!(await this.#ensurePermission())) {
      return false;
    }

    this.#threshold = normalizeIdleThreshold(options?.threshold ?? this.#threshold);
    this.#isLoading = true;
    this.#error = null;

    try {
      return this.#startDetector(this.#threshold);
    } catch (error) {
      this.#clearDetector();
      this.#resetWatchingState();
      this.#error = error instanceof Error ? error.message : "Failed to start idle detection";
      this.#emitChange();
      return false;
    } finally {
      this.#isLoading = false;
    }
  }

  /**
   * Stops idle detection and clears watching state.
   * Returns `true` if a detector was active, `false` otherwise.
   */
  stop(): boolean {
    if (this.isDestroyed) {
      return false;
    }

    if (!(this.#detector && this.#detectorChangeHandler)) {
      this.#isWatching = false;
      this.#emitChange();
      return false;
    }

    this.#clearDetector();
    this.#resetWatchingState();
    this.#emitChange();
    return true;
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /**
   * Starts the controller. Queries the Permissions API for the
   * initial idle-detection permission state and registers a
   * change listener that auto-stops detection when permission
   * is revoked.
   */
  override mount(): void {
    if (this.isDestroyed || this.isMounted) {
      return;
    }
    super.mount();
    void this.#syncPermission().then(() => {
      this.#initPermissionListener();
    });
  }

  /**
   * Stops the detector and tears down all listeners.
   * Idempotent — safe to call multiple times.
   */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#clearDetector();
    this.#isWatching = false;
    this.#isLoading = false;
    this.#userState = null;
    this.#screenState = null;
    super.destroy();
  }

  // ── Private: permission ──────────────────────────────────────

  async #syncPermission(): Promise<void> {
    if (this.#permission === "granted") {
      return;
    }

    const queried = await this.#permissionAdapter.query();
    this.#permission = queried === "unknown" ? null : queried;
  }

  async #promptPermission(): Promise<PermissionState> {
    if (!this.#idleDetectorCtor) {
      return "denied";
    }

    const result = await this.#permissionAdapter.request();
    const permission =
      result.permission === "unknown" ? "denied" : (result.permission as PermissionState);
    this.#permission = permission;

    if (permission === "granted") {
      this.#error = null;
    } else {
      this.#error =
        result.error?.message ?? idlePermissionError(permission === "denied" ? "denied" : "prompt");
    }

    this.#emitChange();
    return permission;
  }

  async #ensurePermission(): Promise<boolean> {
    await this.#syncPermission();

    if (this.#permission === "granted") {
      this.#error = null;
      return true;
    }

    if (this.#permission === "denied") {
      this.#error = idlePermissionError("denied");
      this.#emitChange();
      return false;
    }

    const result = await this.#promptPermission();
    return result === "granted";
  }

  // ── Private: detector ────────────────────────────────────────

  #startDetector(threshold: number): boolean {
    if (!this.#idleDetectorCtor) {
      return false;
    }

    const detector = new this.#idleDetectorCtor();
    const onChange = (): void => {
      this.#userState = detector.userState;
      this.#screenState = detector.screenState;
      this.#emitChange();
    };

    detector.addEventListener("change", onChange);
    // Note: start() is async but we fire-and-forget here to match
    // the existing API surface. Errors are caught by the caller's
    // try/catch in start().
    void detector.start({ threshold }).then(() => {
      this.#userState = detector.userState;
      this.#screenState = detector.screenState;
      this.#isWatching = true;
      this.#emitChange();
    });

    this.#detector = detector;
    this.#detectorChangeHandler = onChange;
    return true;
  }

  #clearDetector(): void {
    if (this.#detector && this.#detectorChangeHandler) {
      this.#detector.removeEventListener("change", this.#detectorChangeHandler);
    }
    this.#detector = null;
    this.#detectorChangeHandler = null;
  }

  #resetWatchingState(): void {
    this.#isWatching = false;
    this.#userState = null;
    this.#screenState = null;
  }

  #shouldRestart(options?: { threshold?: number }): boolean {
    if (options?.threshold === undefined) {
      return false;
    }
    const nextThreshold = normalizeIdleThreshold(options.threshold);
    return nextThreshold !== this.#threshold;
  }

  #initPermissionListener(): void {
    const subscribe = this.#permissionAdapter.subscribe;
    if (!subscribe) {
      return;
    }

    void Promise.resolve(
      subscribe((snapshot) => {
        if (this.isDestroyed) {
          return;
        }

        const permission =
          snapshot.permission === "unknown" ? null : (snapshot.permission as PermissionState);
        this.#permission = permission;

        if (permission !== "granted" && this.#isWatching) {
          this.stop();
        }

        this.#emitChange();
      })
    ).then((unsubscribe) => {
      if (this.isDestroyed) {
        unsubscribe();
        return;
      }

      this.registerCleanup(unsubscribe);
      this.#emitChange();
    });
  }

  #emitChange(): void {
    this.emit("idle:change", {
      userState: this.#userState,
      screenState: this.#screenState,
      permission: this.#permission,
      error: this.#error,
      threshold: this.#threshold,
      isWatching: this.#isWatching,
    });
  }
}

/**
 * Creates an {@link IdleController} instance.
 * Convenience for non-Alpine consumers.
 */
export function createIdleController(
  idleDetectorCtor?: IdleDetectorConstructor | null
): IdleController {
  return new IdleController(idleDetectorCtor);
}
