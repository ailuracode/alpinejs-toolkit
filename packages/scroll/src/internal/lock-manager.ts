/**
 * Handle-based scroll lock manager.
 *
 * Maintains an ordered stack of lock handles so multiple call sites
 * can lock and unlock the page without races. Each lock acquisition
 * increments a counter; release decrements it. The lock is fully
 * released only when the count reaches zero.
 *
 * Lock reasons flow through unchanged from the caller so downstream
 * listeners (the controller's `change` event, the plugin's
 * `$store.scroll.locked` mirror) can debug "who locked the page?"
 * without subscribing to every acquisition.
 *
 * Listener invocations go through `safeNotify()` so a misbehaving
 * subscriber cannot crash the lock pipeline.
 *
 * v1.0.0 SSR contract: under SSR, the manager's `applyStyles` /
 * `restoreStyles` paths are no-ops (the controller's `mount()` is
 * the SSR boundary).
 */

import { isBrowser, safeDocument, ToolkitError } from "@ailuracode/alpine-core";
import { ScrollError } from "../error";
import type { ScrollLockAxis, ScrollLockChangeDetail } from "../types";
import { applyScrollbarGap, clearScrollbarGap, measureScrollbarWidth } from "./scrollbar-gap";
import { generateLockHandle, safeNotify } from "./util";

/** Detail payload of the internal lock listener. */
export type LockChangeDetail = ScrollLockChangeDetail;

export interface LockManagerOptions {
  /** Reserve `--ailura-scrollbar-gap` on lock. Default: `true`. */
  readonly reserveScrollbarGap?: boolean;
  /**
   * Element to apply the scrollbar-gap compensation to. When set,
   * the element's `padding-right` is set to the measured scrollbar
   * width on lock so the layout does not jump when the body's
   * scrollbar disappears. The original padding is restored on
   * unlock. Accepts an `Element` reference or a CSS selector string
   * (resolved once via `document.querySelector`).
   */
  readonly target?: Element | string | null;
}

/**
 * Resolves the `target` option to a live `HTMLElement` reference, or
 * `null` when the consumer opted out. Selector strings are resolved
 * synchronously at construction — the controller does not track the
 * element across mutations; consumers are responsible for keeping the
 * target alive.
 */
function resolveTarget(target: Element | string | null | undefined): HTMLElement | null {
  if (!target) {
    return null;
  }
  if (typeof target === "string") {
    if (!isBrowser()) {
      return null;
    }
    return (document.querySelector(target) as HTMLElement | null) ?? null;
  }
  return target as HTMLElement;
}

/**
 * Snapshot of the body's pre-lock inline styles. Used to restore the
 * original layout when the lock is fully released.
 */
interface BodyLockStylesSnapshot {
  readonly overflow: string;
  readonly overflowX: string;
  readonly overflowY: string;
  readonly overscrollBehavior: string;
  readonly position: string;
  readonly top: string;
  readonly left: string;
  readonly right: string;
  readonly width: string;
  readonly paddingRight: string;
}

/** Single entry in the lock stack. */
interface LockHandleEntry {
  readonly handle: string;
  readonly reason: string;
  readonly axis: ScrollLockAxis;
}

export class LockManager {
  readonly #reserveScrollbarGap: boolean;
  readonly #target: HTMLElement | null;
  readonly #stack: LockHandleEntry[] = [];
  readonly #listeners = new Set<(detail: LockChangeDetail) => void>();
  #snapshot: BodyLockStylesSnapshot | null = null;
  #appliedAxis: ScrollLockAxis | null = null;
  #destroyed = false;

  constructor(options: LockManagerOptions = {}) {
    this.#reserveScrollbarGap = options.reserveScrollbarGap ?? true;
    this.#target = resolveTarget(options.target);
  }

  /** Current number of active locks. */
  get count(): number {
    return this.#stack.length;
  }

  /** `true` when at least one lock is active. */
  get isLocked(): boolean {
    return this.#stack.length > 0;
  }

  /** Returns a snapshot of the active lock handles (top-most first). */
  get handles(): readonly string[] {
    return this.#stack.map((entry) => entry.handle);
  }

  /** Subscribe to lock-change notifications. */
  onChange(listener: (detail: LockChangeDetail) => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * Acquires a lock and returns the new handle. `reason` is the
   * caller-supplied string that flows through to the `lock` event.
   *
   * Throws `SCROLL_CONTROLLER_DESTROYED` when invoked on a
   * destroyed manager; throws `SCROLL_LOCK_INVALID_REASON` when
   * `reason` is not a non-empty string.
   */
  lock(reason: string): string {
    if (this.#destroyed) {
      throw new ToolkitError(
        "Cannot acquire a lock after the lock manager has been destroyed",
        "CONTROLLER_DESTROYED"
      );
    }
    if (typeof reason !== "string" || reason.length === 0) {
      throw new ScrollError(
        "lock(reason) requires a non-empty string reason",
        "SCROLL_LOCK_INVALID_REASON"
      );
    }
    const axis: ScrollLockAxis = "y";
    const handle = generateLockHandle();
    this.#stack.push({ handle, reason, axis });
    if (this.#stack.length === 1) {
      this.#applyLockStyles(axis);
    } else if (this.#appliedAxis !== axis) {
      this.#syncLockStyles();
    }
    this.#emit({ locked: true, count: this.#stack.length, reason, handle });
    return handle;
  }

  /**
   * Releases a previously acquired lock. No-op when the handle is
   * not found (we want unlocked callers to be idempotent). Returns
   * the count after the release; useful for tests.
   */
  unlock(handle: string): void {
    if (this.#destroyed) {
      return;
    }
    const idx = this.#stack.findIndex((entry) => entry.handle === handle);
    if (idx === -1) {
      throw new ScrollError(`lock handle "${handle}" not found`, "SCROLL_LOCK_HANDLE_NOT_FOUND");
    }
    const removed = this.#stack[idx];
    this.#stack.splice(idx, 1);
    if (this.#stack.length === 0) {
      this.#restoreLockStyles();
      this.#emit({
        locked: false,
        count: 0,
        reason: removed?.reason ?? "",
        handle: null,
      });
    } else {
      // Re-sync styles if the top-of-stack axis differs.
      const topAxis = this.#stack[this.#stack.length - 1]?.axis;
      if (topAxis && topAxis !== this.#appliedAxis) {
        this.#syncLockStyles();
        this.#emit({
          locked: true,
          count: this.#stack.length,
          reason: this.#stack[this.#stack.length - 1]?.reason ?? "",
          handle: this.#stack[this.#stack.length - 1]?.handle ?? null,
        });
      }
    }
  }

  /** Releases every active lock. */
  unlockAll(): void {
    if (this.#destroyed) {
      return;
    }
    if (this.#stack.length === 0) {
      return;
    }
    this.#stack.length = 0;
    this.#restoreLockStyles();
    this.#emit({ locked: false, count: 0, reason: "unlock-all", handle: null });
  }

  /**
   * Tears down the manager. Idempotent. Subsequent `lock()` calls
   * throw `CONTROLLER_DESTROYED`; subsequent `unlock()` calls are
   * silent no-ops.
   */
  destroy(): void {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    this.#stack.length = 0;
    this.#restoreLockStyles();
    if (this.#reserveScrollbarGap) {
      clearScrollbarGap();
    }
    this.#listeners.clear();
  }

  // ── Private style management ───────────────────────────────────

  #snapshotBodyStyles(): BodyLockStylesSnapshot {
    if (!isBrowser()) {
      return {
        overflow: "",
        overflowX: "",
        overflowY: "",
        overscrollBehavior: "",
        position: "",
        top: "",
        left: "",
        right: "",
        width: "",
        paddingRight: "",
      };
    }
    const doc = safeDocument();
    if (!doc) {
      return {
        overflow: "",
        overflowX: "",
        overflowY: "",
        overscrollBehavior: "",
        position: "",
        top: "",
        left: "",
        right: "",
        width: "",
        paddingRight: "",
      };
    }
    const body = doc.body;
    const target = this.#target;
    return {
      overflow: body.style.overflow,
      overflowX: body.style.overflowX,
      overflowY: body.style.overflowY,
      overscrollBehavior: body.style.overscrollBehavior,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: target?.style.paddingRight ?? "",
    };
  }

  #applyLockStyles(axis: ScrollLockAxis): void {
    if (!isBrowser()) {
      return;
    }
    const doc = safeDocument();
    if (!doc) {
      return;
    }
    this.#snapshot = this.#snapshotBodyStyles();
    if (this.#reserveScrollbarGap) {
      applyScrollbarGap();
    }
    // Apply the scrollbar-gap compensation to the target element so
    // its content does not jump when the body's scrollbar
    // disappears. Original padding is captured in the snapshot above
    // and restored in `#restoreLockStyles`.
    if (this.#target && this.#reserveScrollbarGap) {
      const width = measureScrollbarWidth();
      this.#target.style.paddingRight = `${width}px`;
    }
    const html = doc.documentElement;
    const body = doc.body;
    if (axis === "both") {
      html.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${typeof window !== "undefined" ? window.scrollY : 0}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    } else {
      html.style.overflowY = "hidden";
    }
    body.style.overflowY = "hidden";
    body.style.overscrollBehavior = "none";
    this.#appliedAxis = axis;
    // Suppress unused-variable warning for the axis parameter — kept
    // in the signature so the controller can pass it without a cast.
    void axis;
  }

  #restoreLockStyles(): void {
    if (!isBrowser()) {
      this.#appliedAxis = null;
      return;
    }
    const doc = safeDocument();
    if (!(doc && this.#snapshot)) {
      this.#appliedAxis = null;
      return;
    }
    const html = doc.documentElement;
    const body = doc.body;
    html.style.overflow = this.#snapshot.overflow;
    body.style.overflow = this.#snapshot.overflow;
    body.style.overflowX = this.#snapshot.overflowX;
    body.style.overflowY = this.#snapshot.overflowY;
    body.style.overscrollBehavior = this.#snapshot.overscrollBehavior;
    body.style.position = this.#snapshot.position;
    body.style.top = this.#snapshot.top;
    body.style.left = this.#snapshot.left;
    body.style.right = this.#snapshot.right;
    body.style.width = this.#snapshot.width;
    // Restore the target's pre-lock padding-right. Captured at the
    // top of `#applyLockStyles` so the snapshot reflects the value
    // before compensation was applied.
    const target = this.#target;
    if (target && this.#snapshot.paddingRight) {
      target.style.paddingRight = this.#snapshot.paddingRight;
    } else if (target) {
      target.style.removeProperty("padding-right");
    }
    this.#snapshot = null;
    this.#appliedAxis = null;
  }

  #syncLockStyles(): void {
    this.#restoreLockStyles();
    const topAxis = this.#stack[this.#stack.length - 1]?.axis;
    if (topAxis) {
      this.#applyLockStyles(topAxis);
    }
  }

  #emit(detail: LockChangeDetail): void {
    for (const listener of this.#listeners) {
      safeNotify(listener, detail);
    }
  }
}
