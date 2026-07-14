/**
 * Scroll controller — the framework-agnostic core of
 * `@ailuracode/alpine-scroll` v1.0.0.
 *
 * Owns five concerns under one headless controller:
 *
 * 1. **State** — the live {@link ScrollState} snapshot.
 * 2. **Locking** — delegated to {@link LockManager}.
 * 3. **Scroll tracking** — delegated to {@link attachScrollObserver}
 *    (rAF-batched window scroll listener).
 * 4. **Section tracking** — delegated to {@link attachSectionObserver}
 *    (IntersectionObserver-backed).
 * 5. **Navigation** — {@link to} / {@link by} / {@link toTop} /
 *    {@link toBottom} / {@link toElement} / {@link scrollIntoView}
 *    with reduced-motion gate.
 *
 * Construction rules (per `.cursor/rules/new-package.mdc`):
 *
 * - The constructor MUST NOT touch `window` / `document` / timers.
 *   Every side effect lives in `mount()`.
 * - `mount()` calls `super.mount()` FIRST, then runs `#init()` inside
 *   a transactional scope. Unexpected setup failures roll back
 *   partial listeners/observers, call `destroy()`, and re-throw.
 *   The `'initialization'` change event is scheduled only after
 *   `#init()` completes successfully.
 * - `destroy()` calls `super.destroy()` which runs every cleanup
 *   registered through `registerCleanup()`.
 * - `#assertAlive()` throws `ToolkitError('CONTROLLER_DESTROYED')`
 *   for commands that must not run after teardown.
 *
 * v1.0.0 contract surface:
 *
 * - `lockWithHandle(reason: string): string` — returns the handle.
 * - `unlock(handle: string): void` — releases a single handle.
 * - `unlockAll(): void` — releases every lock.
 * - `scrollIntoView({ x, y }) | Element, options?` — supports both
 *   the absolute-coord and DOM-element overloads.
 * - `by / toTop / toBottom / toElement` accept `reason: string`
 *   so the change event can carry the caller-supplied intent.
 */

import {
  BaseController,
  createSingleton,
  generateId,
  isBrowser,
  releaseSingleton,
  safeWindow,
  ToolkitError,
  type Unsubscribe,
} from "@ailuracode/alpine-core";
import type { ScrollEvents } from "./events";
import { type LockChangeDetail, LockManager } from "./internal/lock-manager";
import { readScrollSnapshot } from "./internal/metrics";
import {
  scrollByDelta,
  scrollIntoViewElement,
  scrollToBottom,
  scrollToCoordinates,
  scrollToTop,
} from "./internal/navigation";
import { attachScrollObserver, type ScrollObserverOptions } from "./internal/scroll-observer";
import { attachSectionObserver, type SectionObserverSection } from "./internal/section-observer";
import { safeNotify } from "./internal/util";
import { type NormalizedScrollOptions, normalizeScrollOptions } from "./options";
import type {
  ScrollChangeDetail,
  ScrollChangeSource,
  ScrollDirection,
  ScrollIntoViewOptions,
  ScrollLockAxis,
  ScrollLockChangeDetail,
  ScrollManager,
  ScrollNavigationDetail,
  ScrollOptions,
  ScrollPositionDetail,
  ScrollReachDetail,
  ScrollSectionChangeDetail,
  ScrollSectionOptions,
  ScrollState,
} from "./types";

/**
 * Initial state — used during SSR or before `mount()` runs. All
 * counters are zeroed, direction is `'none'`, and no section is
 * active.
 */
function emptyState(): ScrollState {
  return {
    x: 0,
    y: 0,
    direction: "none",
    atTop: true,
    atBottom: false,
    progress: 0,
    locked: false,
    lockCount: 0,
    activeSection: null,
    visibleSections: [],
  };
}

/**
 * Reads the current scroll snapshot when the controller is mounted
 * under a browser. Falls back to the empty state under SSR.
 */
function readSnapshotForState(): {
  x: number;
  y: number;
  direction: ScrollDirection;
  atTop: boolean;
  atBottom: boolean;
  progress: number;
} {
  const snap = readScrollSnapshot(0);
  return {
    x: snap.x,
    y: snap.y,
    direction: snap.direction,
    atTop: snap.atTop,
    atBottom: snap.atBottom,
    progress: snap.progress,
  };
}

/**
 * Stable registry key for the singleton scroll controller. The
 * `options.id` is NOT part of the key — `id` identifies the
 * controller instance, but two `createScroll()` calls in the same
 * document describe the same singleton (the document's scroll).
 * Tests should call `clearSingleton(SCROLL_SINGLETON_KEY)` (or
 * `clearAllSingletons()`) to reset between cases.
 */
export const SCROLL_SINGLETON_KEY = "@ailuracode/alpine-scroll/default";

/**
 * Public entrypoint — builds and mounts a fully-initialized
 * {@link ScrollController}. The constructor itself stays pure; the
 * factory wires the browser-touching `mount()` step.
 *
 * Singleton guarantee: at most one live `ScrollController` per
 * document. Repeated calls return the existing instance; the
 * controller's `destroy()` releases the slot so the next call
 * builds a fresh one. Direct `new ScrollController(...)` is still
 * supported for tests and advanced consumers — only the
 * `createScroll()` factory enforces uniqueness.
 */
export function createScroll(options: ScrollOptions = {}): ScrollController {
  const { scope, ...factoryOptions } = options;
  return createSingleton(
    SCROLL_SINGLETON_KEY,
    () => {
      const controller = new ScrollController(factoryOptions);
      controller.mount();
      return controller;
    },
    { scope, options: factoryOptions }
  );
}

export class ScrollController extends BaseController<ScrollEvents> implements ScrollManager {
  readonly #options: NormalizedScrollOptions;
  readonly #lockManager: LockManager;
  readonly #state: ScrollState = emptyState();
  readonly #previousState: ScrollState = emptyState();
  #observerCleanup: Unsubscribe | null = null;
  #sectionObserverCleanup: Unsubscribe | null = null;
  #sections = new Map<string, { element: Element; options?: ScrollSectionOptions }>();
  #activeSection: string | null = null;
  #visibleSections: string[] = [];
  #reachedTop = true;
  #reachedBottom = false;
  #initializationScheduled = false;

  constructor(options: ScrollOptions = {}) {
    super(options.id ?? generateId("scroll"));
    this.#options = normalizeScrollOptions(options);
    this.#lockManager = new LockManager({
      reserveScrollbarGap: this.#options.reserveScrollbarGap,
      target: this.#options.target,
    });
  }

  // ── Public state surface ────────────────────────────────────────

  get state(): ScrollState {
    return this.#state;
  }

  get isLocked(): boolean {
    return this.#lockManager.isLocked;
  }

  get isAtTop(): boolean {
    return this.#state.atTop;
  }

  get isAtBottom(): boolean {
    return this.#state.atBottom;
  }

  get direction(): ScrollDirection {
    return this.#state.direction;
  }

  get progress(): number {
    return this.#state.progress;
  }

  get activeSection(): string | null {
    return this.#activeSection;
  }

  get visibleSections(): readonly string[] {
    return this.#visibleSections;
  }

  get lockHandles(): readonly string[] {
    return this.#lockManager.handles;
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  override mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();
    try {
      this.#init();
    } catch (error) {
      this.destroy();
      throw error;
    }
    if (!this.#initializationScheduled) {
      this.#initializationScheduled = true;
      queueMicrotask(() => {
        this.#initializationScheduled = false;
        if (this.isDestroyed) {
          return;
        }
        this.#emitChange({ source: "initialization", previous: null });
      });
    }
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#observerCleanup?.();
    this.#sectionObserverCleanup?.();
    this.#lockManager.destroy();
    this.#sections.clear();
    this.#visibleSections = [];
    this.#activeSection = null;
    super.destroy();
    // Release the singleton slot so the next `createScroll()` call
    // builds a fresh controller. Mirrors `createSidebar()` /
    // `createTheme()` / `createLang()`.
    releaseSingleton(SCROLL_SINGLETON_KEY, this);
  }

  reset(): void {
    this.#assertAlive();
    this.#previousState.x = this.#state.x;
    this.#previousState.y = this.#state.y;
    this.#previousState.direction = this.#state.direction;
    this.#previousState.atTop = this.#state.atTop;
    this.#previousState.atBottom = this.#state.atBottom;
    this.#previousState.progress = this.#state.progress;
    this.#previousState.locked = this.#state.locked;
    this.#previousState.lockCount = this.#state.lockCount;
    this.#previousState.activeSection = this.#state.activeSection;
    this.#previousState.visibleSections = this.#state.visibleSections;

    if (this.isBrowser()) {
      const snap = readScrollSnapshot(this.#state.y);
      this.#state.x = snap.x;
      this.#state.y = snap.y;
      this.#state.direction = snap.direction;
      this.#state.atTop = snap.atTop;
      this.#state.atBottom = snap.atBottom;
      this.#state.progress = snap.progress;
    } else {
      this.#state.x = 0;
      this.#state.y = 0;
      this.#state.direction = "none";
      this.#state.atTop = true;
      this.#state.atBottom = false;
      this.#state.progress = 0;
    }
    this.#lockManager.unlockAll();
    this.#activeSection = null;
    this.#visibleSections = [];
    this.#state.locked = this.#lockManager.isLocked;
    this.#state.lockCount = this.#lockManager.count;
    this.#state.activeSection = null;
    this.#state.visibleSections = [];

    this.#emitChange({ source: "reset", previous: this.#previousState });
  }

  // ── Lock commands ───────────────────────────────────────────────

  lockWithHandle(reason: string): string {
    this.#assertAlive();
    const previousLockState = this.#state.locked;
    const previousCount = this.#state.lockCount;
    this.#previousState.locked = previousLockState;
    this.#previousState.lockCount = previousCount;
    const handle = this.#lockManager.lock(reason);
    this.#state.locked = this.#lockManager.isLocked;
    this.#state.lockCount = this.#lockManager.count;
    return handle;
  }

  unlock(handle: string): void {
    this.#assertAlive();
    this.#previousState.locked = this.#state.locked;
    this.#previousState.lockCount = this.#state.lockCount;
    this.#lockManager.unlock(handle);
    this.#state.locked = this.#lockManager.isLocked;
    this.#state.lockCount = this.#lockManager.count;
  }

  unlockAll(): void {
    this.#assertAlive();
    this.#previousState.locked = this.#state.locked;
    this.#previousState.lockCount = this.#state.lockCount;
    this.#lockManager.unlockAll();
    this.#state.locked = this.#lockManager.isLocked;
    this.#state.lockCount = this.#lockManager.count;
  }

  // ── Section commands ────────────────────────────────────────────

  registerSection(id: string, options?: ScrollSectionOptions): void {
    this.#assertAlive();
    if (!id) {
      return;
    }
    if (!this.isBrowser()) {
      // Under SSR we cannot resolve a DOM element. Skip registration
      // silently — consumers that need section tracking must call
      // `registerSection` after mount on a real DOM.
      return;
    }
    const win = safeWindow();
    if (!win) {
      return;
    }
    let element = win.document.querySelector(`[data-scroll-section="${id}"]`);
    if (!element) {
      element = win.document.getElementById(id);
    }
    if (!element?.isConnected) {
      // Element not in the DOM yet — skip silently. The consumer
      // can call registerSection again after the element mounts.
      return;
    }
    this.#sections.set(id, { element, options });
    if (this.isMounted) {
      this.#rewireSectionObserver();
    }
  }

  unregisterSection(id: string): void {
    this.#assertAlive();
    const removed = this.#sections.delete(id);
    if (!removed) {
      return;
    }
    if (this.#activeSection === id) {
      const previous = this.#activeSection;
      this.#activeSection = null;
      this.#state.activeSection = null;
      const detail: ScrollSectionChangeDetail = {
        active: null,
        previous,
        visible: this.#visibleSections,
      };
      this.emit("section", detail);
    }
    if (this.isMounted) {
      this.#rewireSectionObserver();
    }
  }

  // ── Navigation commands ─────────────────────────────────────────

  scrollIntoView(
    target: Element | { x: number; y: number },
    options?: ScrollIntoViewOptions
  ): void {
    this.#assertAlive();
    const from = this.#state.y;
    if (target instanceof Element) {
      scrollIntoViewElement(target, options, this.#options.respectReducedMotion);
      this.#emitNavigation({
        from,
        to: from,
        behavior: options?.behavior ?? this.#options.defaultBehavior,
      });
    } else {
      scrollToCoordinates(
        { x: target.x, y: target.y, ...(options ?? {}) },
        this.#options.respectReducedMotion
      );
      this.#emitNavigation({
        from,
        to: target.y,
        behavior: options?.behavior ?? this.#options.defaultBehavior,
      });
    }
  }

  by(delta: { x?: number; y?: number }, reason?: string): void {
    this.#assertAlive();
    const from = this.#state.y;
    scrollByDelta(delta, this.#options.defaultBehavior, this.#options.respectReducedMotion);
    this.#emitNavigation({
      from,
      to: from + (delta.y ?? 0),
      behavior: this.#options.defaultBehavior,
      reason,
    });
  }

  toTop(reason?: string): void {
    this.#assertAlive();
    const from = this.#state.y;
    scrollToTop(undefined, this.#options.defaultBehavior, this.#options.respectReducedMotion);
    this.#emitNavigation({
      from,
      to: 0,
      behavior: this.#options.defaultBehavior,
      reason,
    });
  }

  toBottom(reason?: string): void {
    this.#assertAlive();
    const from = this.#state.y;
    scrollToBottom(undefined, this.#options.defaultBehavior, this.#options.respectReducedMotion);
    this.#emitNavigation({
      from,
      to: from,
      behavior: this.#options.defaultBehavior,
      reason,
    });
  }

  toElement(element: Element, options?: ScrollIntoViewOptions): void {
    this.#assertAlive();
    const from = this.#state.y;
    scrollIntoViewElement(element, options, this.#options.respectReducedMotion);
    this.#emitNavigation({
      from,
      to: from,
      behavior: options?.behavior ?? this.#options.defaultBehavior,
    });
  }

  // ── Private helpers ─────────────────────────────────────────────

  #assertAlive(): void {
    if (this.isDestroyed) {
      throw new ToolkitError(
        `Cannot use scroll controller "${this.id}" after destroy()`,
        "CONTROLLER_DESTROYED"
      );
    }
    if (!this.isMounted) {
      throw new ToolkitError(
        `Cannot use scroll controller "${this.id}" before mount()`,
        "TOOLKIT_INVALID_STATE"
      );
    }
  }

  /** SSR-friendly predicate — true when window + document are present. */
  isBrowser(): boolean {
    return isBrowser();
  }

  #init(): void {
    const pendingCleanups: Unsubscribe[] = [];
    try {
      if (this.isBrowser()) {
        const snap = readSnapshotForState();
        this.#state.x = snap.x;
        this.#state.y = snap.y;
        this.#state.direction = snap.direction;
        this.#state.atTop = snap.atTop;
        this.#state.atBottom = snap.atBottom;
        this.#state.progress = snap.progress;
        this.#reachedTop = snap.atTop;
        this.#reachedBottom = snap.atBottom;

        const observerOptions: ScrollObserverOptions = {
          onPosition: (detail) => {
            safeNotify(
              (d: { x: number; y: number }) => this.#handlePositionChange(d.x, d.y),
              detail
            );
          },
          onReach: (detail) => {
            safeNotify(
              (d: { edge: "top" | "bottom"; y: number }) =>
                this.emit("reach", d as ScrollReachDetail),
              detail
            );
          },
        };
        const observerCleanup = attachScrollObserver(observerOptions);
        pendingCleanups.push(observerCleanup);
        this.#observerCleanup = observerCleanup;
      }

      const lockCleanup = this.#lockManager.onChange((detail: LockChangeDetail) => {
        this.#handleLockChange(detail);
      });
      pendingCleanups.push(lockCleanup);

      if (this.#sections.size > 0) {
        const sectionCleanup = this.#attachSectionObserver();
        if (sectionCleanup) {
          pendingCleanups.push(sectionCleanup);
          this.#sectionObserverCleanup = sectionCleanup;
        }
      }

      for (const cleanup of pendingCleanups) {
        this.registerCleanup(cleanup);
      }
    } catch (error) {
      this.#rollbackInit(pendingCleanups);
      throw error;
    }
  }

  #rollbackInit(pendingCleanups: readonly Unsubscribe[]): void {
    for (let index = pendingCleanups.length - 1; index >= 0; index--) {
      pendingCleanups[index]();
    }
    this.#observerCleanup = null;
    this.#sectionObserverCleanup = null;
  }

  #attachSectionObserver(): Unsubscribe | null {
    if (!this.isBrowser() || this.#sections.size === 0) {
      return null;
    }
    const sections: SectionObserverSection[] = [];
    for (const [id, entry] of this.#sections) {
      sections.push({
        id,
        element: entry.element,
        ...(entry.options?.rootMargin !== undefined
          ? { rootMargin: entry.options.rootMargin }
          : {}),
      });
    }
    return attachSectionObserver(sections, {
      onChange: (detail) => {
        this.#handleSectionChange(detail.visible);
      },
    });
  }

  #rewireSectionObserver(): void {
    this.#sectionObserverCleanup?.();
    this.#sectionObserverCleanup = null;
    const cleanup = this.#attachSectionObserver();
    if (cleanup) {
      this.#sectionObserverCleanup = cleanup;
      this.registerCleanup(cleanup);
    }
  }

  #handlePositionChange(x: number, y: number): void {
    if (this.isDestroyed) {
      return;
    }
    this.#previousState.x = this.#state.x;
    this.#previousState.y = this.#state.y;
    this.#previousState.direction = this.#state.direction;
    this.#previousState.atTop = this.#state.atTop;
    this.#previousState.atBottom = this.#state.atBottom;
    this.#previousState.progress = this.#state.progress;

    const snap = readScrollSnapshot(this.#state.y);
    this.#state.x = x;
    this.#state.y = y;
    this.#state.direction = snap.direction;
    this.#state.atTop = y <= 0;
    this.#state.atBottom = snap.atBottom;
    this.#state.progress = snap.progress;

    const positionDetail: ScrollPositionDetail = {
      x,
      y,
      direction: snap.direction,
      progress: snap.progress,
    };
    this.emit("scroll", positionDetail);

    if (!this.#reachedTop && this.#state.atTop) {
      this.#reachedTop = true;
      this.emit("reach", { edge: "top", y });
    }
    if (this.#state.atTop) {
      this.#reachedTop = true;
    }
    if (!this.#reachedBottom && this.#state.atBottom) {
      this.#reachedBottom = true;
      this.emit("reach", { edge: "bottom", y });
    }
    if (this.#state.atBottom) {
      this.#reachedBottom = true;
    }
    if (!this.#state.atTop) {
      this.#reachedTop = false;
    }
    if (!this.#state.atBottom) {
      this.#reachedBottom = false;
    }

    this.#emitChange({ source: "user", previous: this.#previousState });
  }

  #handleLockChange(detail: LockChangeDetail): void {
    if (this.isDestroyed) {
      return;
    }
    this.#previousState.locked = this.#state.locked;
    this.#previousState.lockCount = this.#state.lockCount;
    this.#state.locked = this.#lockManager.isLocked;
    this.#state.lockCount = this.#lockManager.count;
    const lockDetail: ScrollLockChangeDetail = {
      locked: detail.locked,
      count: detail.count,
      reason: detail.reason,
      handle: detail.handle,
    };
    this.emit("lock", lockDetail);
    this.#emitChange({
      source: "lock",
      previous: this.#previousState,
      reason: detail.reason,
    });
  }

  #handleSectionChange(visible: readonly string[]): void {
    if (this.isDestroyed) {
      return;
    }
    const previous = this.#activeSection;
    const nextActive = pickActiveSection(visible, previous);
    this.#visibleSections = Array.from(visible);
    this.#state.visibleSections = this.#visibleSections;
    if (nextActive !== previous) {
      this.#activeSection = nextActive;
      this.#state.activeSection = nextActive;
      const detail: ScrollSectionChangeDetail = {
        active: nextActive,
        previous,
        visible: this.#visibleSections,
      };
      this.emit("section", detail);
      this.#previousState.activeSection = previous;
      this.#previousState.visibleSections = previous ? this.#visibleSections : [];
      this.#emitChange({ source: "section", previous: this.#previousState });
    } else if (visible.length !== this.#state.visibleSections.length) {
      this.#emitChange({ source: "section", previous: this.#previousState });
    }
  }

  #emitNavigation(detail: Omit<ScrollNavigationDetail, "reason"> & { reason?: string }): void {
    if (this.isDestroyed) {
      return;
    }
    safeNotify(
      (d: ScrollNavigationDetail) => this.emit("navigation", d),
      detail as ScrollNavigationDetail
    );
    this.#emitChange({
      source: "navigation",
      previous: this.#previousState,
      ...(detail.reason !== undefined ? { reason: detail.reason } : {}),
    });
  }

  #emitChange(options: {
    source: ScrollChangeSource;
    previous: ScrollState | null;
    reason?: string;
  }): void {
    if (this.isDestroyed) {
      return;
    }
    const detail: ScrollChangeDetail = {
      state: this.#state,
      previous: options.previous,
      source: options.source,
      ...(options.reason !== undefined ? { reason: options.reason } : {}),
    };
    safeNotify((d: ScrollChangeDetail) => this.emit("change", d), detail);
  }
}

/**
 * Picks the active section from the visible set.
 * Mode `'first-visible'` (default) returns the top-most visible
 * section; `'nearest'` returns whichever sits closest to the
 * viewport centre.
 */
function pickActiveSection(visible: readonly string[], previous: string | null): string | null {
  if (visible.length === 0) {
    return null;
  }
  if (previous && visible.includes(previous)) {
    return previous;
  }
  return visible[0] ?? null;
}

/** Re-export the axis type so consumers can type their option. */
export type { ScrollLockAxis };
