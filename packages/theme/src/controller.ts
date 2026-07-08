/**
 * Theme controller — the framework-agnostic core of
 * `@ailuracode/alpine-theme`. Composes a
 * {@link ToggleController} from `@ailuracode/alpine-toggle` to
 * model the three-value `current` state machine (`light` /
 * `dark` / `system`) and layers persistence, DOM application,
 * system observation, and cross-tab synchronization on top.
 *
 * Responsibilities:
 *
 * 1. **State** — owns `current` (via the inner toggle),
 *    `system`, and the derived `resolved`.
 * 2. **Persistence** — delegates to a {@link ThemeStorage} adapter.
 * 3. **DOM sync** — delegates to a {@link DomStrategy}.
 * 4. **System theme** — observes `prefers-color-scheme` and updates
 *    `resolved` only when `current === 'system'`.
 * 5. **Cross-tab** — subscribes to the storage adapter's
 *    `subscribe` hook when available.
 * 6. **Subscriptions** — typed `on('change', listener)` from the
 *    inherited bus, with the theme-level detail shape
 *    (`current` / `system` / `resolved` / `source` / `previous`).
 *
 * Composition with `ToggleController`:
 *
 * - The inner toggle owns the **state machine of `current`** —
 *   validation, transitions, and the basic `change` event.
 * - `set` / `toggle` / `reset` delegate to the toggle. `toggle()`
 *   flips based on `resolved` (not `current`), so it diverges
 *   from the toggle's own `toggle()` (which always lands on the
 *   `'on'` state from `'indeterminate'`).
 * - Hydration from storage uses `setSilently(value)` so the
 *   toggle's queued init microtask preserves the hydrated value
 *   instead of resetting to `defaultTheme`.
 * - The toggle's `change` event is intercepted and re-emitted as a
 *   theme-level event with `system` / `resolved` / `source`
 *   enriched. Cross-tab and system changes **bypass** the toggle
 *   because they don't model `current` transitions in the same
 *   way (`system` flip changes `resolved` without changing
 *   `current`; cross-tab propagates with `source: 'storage'`
 *   instead of `source: 'user'`).
 *
 * Construction rules:
 *
 * - The constructor MUST NOT access `window` / `document` /
 *   `localStorage`. The toggle's own constructor is pure; theme
 *   reads storage in `mount()`.
 * - The controller auto-mounts so `createTheme()` returns a
 *   fully-initialized instance.
 * - `destroy()` MUST be idempotent.
 */

import { BaseController } from "@ailuracode/alpine-core";
import { type ToggleChangeDetail, ToggleController } from "@ailuracode/alpine-toggle";
import type { ThemeEvents } from "./events";
import { createDomStrategy } from "./internal/dom-strategy";
import { buildDomOptions } from "./internal/dom-strategy/options";
import { createLocalStorageThemeStorage } from "./internal/storage/local-storage";
import { createSystemObserver, readSystemTheme } from "./internal/system-observer";
import { coerceThemePreference, defaultThemePreference, resolveTheme } from "./internal/validation";
import type {
  CreateThemeOptions,
  ResolvedTheme,
  ThemeChangeDetail,
  ThemeChangeSource,
  ThemePreference,
  ThemeState,
  ThemeStorage,
} from "./types";

/**
 * Subset of {@link ThemeChangeSource} that {@link ThemeController.applySet}
 * accepts as the `source` parameter. The constraint is enforced at the
 * type level so callers cannot pass `'initialization'` or `'system'`
 * by mistake — those sources own their own emit paths.
 */
type ApplySetSource = Extract<ThemeChangeSource, "user" | "storage" | "reset">;

/**
 * Public entrypoint — builds and mounts a fully-initialized
 * {@link ThemeController}. The constructor itself stays pure; the
 * factory wires the browser-touching `mount()` step.
 */
export function createTheme(options: CreateThemeOptions = {}): ThemeController {
  const controller = new ThemeController(options);
  controller.mount();
  return controller;
}

/**
 * Headless controller for `@ailuracode/alpine-theme`. Owns every
 * piece of theme state via composition with {@link ToggleController},
 * plus persistence, DOM sync, system observation, and cross-tab
 * synchronization. Mounts automatically inside the constructor so
 * the factory is the public entrypoint.
 */
export class ThemeController extends BaseController<ThemeEvents> {
  readonly #defaultTheme: ThemePreference;
  readonly #storage: ThemeStorage;
  readonly #dom: ReturnType<typeof createDomStrategy>;
  readonly #watchSystem: boolean;
  readonly #crossTab: boolean;

  /**
   * Inner toggle models the `current` state machine. `set` /
   * `toggle` / `reset` route through it (with `toggle()`
   * overriding the flip target to use `resolved`).
   */
  readonly #toggle: ToggleController<"light", "dark", "system">;

  /**
   * Tracks the last value we wrote to storage so the cross-tab
   * `storage` event echoes do not generate feedback loops. See
   * `#handleCrossTabUpdate` for the consumption logic.
   */
  #lastWritten: ThemePreference | undefined = undefined;

  /**
   * When non-null, the next `change` event from the inner toggle
   * is re-emitted with this `source` instead of the toggle's own
   * `'user'`. Used by `#handleCrossTabUpdate` so cross-tab updates
   * translate to `source: 'storage'` rather than `source: 'user'`.
   * Cleared after each event.
   */
  #pendingSource: ThemeChangeSource | null = null;

  #system: ResolvedTheme;
  #resolved: ResolvedTheme;

  constructor(options: CreateThemeOptions) {
    super(options.id);

    this.#defaultTheme = coerceThemePreference(options.defaultTheme, defaultThemePreference());
    this.#storage = options.storage ?? createLocalStorageThemeStorage();
    this.#watchSystem = options.watchSystem !== false;
    this.#crossTab = options.crossTab !== false;

    const target = options.target ?? null;
    this.#dom = createDomStrategy(buildDomOptions(options, target));

    // Seed deterministic SSR-safe defaults. `mount()` re-reads
    // the system preference, hydrates the inner toggle from
    // storage, and recomputes `resolved` once the browser is
    // known to be present.
    this.#system = "light";
    this.#resolved = resolveTheme(this.#defaultTheme, this.#system);

    this.#toggle = new ToggleController<"light", "dark", "system">({
      states: { on: "light", off: "dark", indeterminate: "system" },
      initial: this.#defaultTheme,
      id: options.id ? `${options.id}-current` : undefined,
    });

    // Forward every toggle `change` to the theme-level emit so
    // listeners receive the full `system` / `resolved` /
    // `source` shape. Theme emits its own `initialization` event
    // in `#init()` after hydration; the toggle's queued init
    // microtask is intentionally NOT consumed here.
    this.#toggle.on("change", this.#onToggleChange);

    this.registerCleanup(this.#toggle.destroy.bind(this.#toggle));
  }

  // ── Public state surface ────────────────────────────────────────

  get current(): ThemePreference {
    return this.#toggle.value;
  }

  get system(): ResolvedTheme {
    return this.#system;
  }

  get resolved(): ResolvedTheme {
    return resolveTheme(this.#toggle.value, this.#system);
  }

  get(): ThemeState {
    return {
      current: this.#toggle.value,
      system: this.#system,
      resolved: this.#resolved,
    };
  }

  // ── Public commands ─────────────────────────────────────────────

  set(value: ThemePreference): void {
    if (this.isDestroyed) {
      return;
    }
    const safe = coerceThemePreference(value, this.#defaultTheme);
    this.#toggle.set(safe);
  }

  toggle(): void {
    if (this.isDestroyed) {
      return;
    }
    // Flip based on `resolved`, not `current` — diverges from the
    // toggle's own `toggle()` (which moves `'indeterminate' →
    // 'on'`). Theme's behavior: pick the explicit opposite of
    // whatever the user is currently seeing.
    const next: ThemePreference = this.#resolved === "dark" ? "light" : "dark";
    this.#toggle.set(next);
  }

  reset(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#storage.remove();
    this.#toggle.reset();
  }

  /**
   * Tears down every side effect. Idempotent. `super.destroy()` runs
   * first so the registered cleanups (toggle, system observer,
   * cross-tab listener) execute against a live lifecycle; the DOM
   * strategy's own teardown runs second.
   */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    super.destroy();
    this.#dom.destroy();
  }

  /**
   * Starts the controller's side effects. The constructor leaves
   * `#current` / `#system` / `#resolved` at deterministic SSR-safe
   * defaults; `mount()` runs the actual init sequence (storage
   * read, system observer, cross-tab listener, init event).
   *
   * Calling `mount()` more than once is a no-op — `BaseController`
   * guards the phase. Calling it after `destroy()` throws.
   */
  override mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();
    this.#init();
  }

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Predictable init order:
   *
   * 1. Read the persisted preference (if any).
   * 2. Hydrate the inner toggle via `setSilently` so the queued
   *    init microtask preserves the hydrated value instead of
   *    resetting to `defaultTheme`.
   * 3. Read the OS preference.
   * 4. Resolve `resolved` and apply to the DOM.
   * 5. Register the system-preference listener (if `watchSystem`).
   * 6. Register the cross-tab listener (if `crossTab` and the
   *    storage adapter supports `subscribe`).
   * 7. Schedule the theme `initialization` event on a microtask.
   *    The toggle's own init microtask runs too, but its
   *    `change` listener is attached from the constructor so it
   *    gets ignored — the theme emits one init event with the
   *    correct shape.
   */
  #init(): void {
    const persisted = this.#storage.get();
    const initial = persisted ?? this.#defaultTheme;

    if (initial !== this.#toggle.value) {
      this.#toggle.setSilently(initial);
    }

    this.#system = readSystemTheme();
    this.#resolved = resolveTheme(this.#toggle.value, this.#system);
    this.#dom.apply(this.#resolved);

    if (this.#watchSystem) {
      const cleanup = createSystemObserver((next) => {
        this.#handleSystemChange(next);
      });
      this.registerCleanup(cleanup);
    }

    if (this.#crossTab && this.#storage.subscribe) {
      const subscribe = this.#storage.subscribe.bind(this.#storage);
      const cleanup = subscribe((next) => {
        this.#handleCrossTabUpdate(next);
      });
      if (cleanup) {
        this.registerCleanup(cleanup);
      }
    }

    queueMicrotask(() => {
      if (this.isDestroyed) {
        return;
      }
      this.#emitChange({
        current: this.#toggle.value,
        system: this.#system,
        resolved: this.#resolved,
        source: "initialization",
        previous: null,
      });
    });
  }

  // ── Toggle → theme event bridge ────────────────────────────────

  /**
   * Receives every `change` event from the inner toggle. The
   * toggle's queued init microtask fires immediately after
   * construction with `source: 'initialization'` and
   * `previous: null`; we drop that one and let the theme emit
   * its own init event with the full shape.
   *
   * `pendingSource` overrides the source for cross-tab updates so
   * they surface as `source: 'storage'` rather than
   * `source: 'user'`.
   */
  #onToggleChange = (detail: ToggleChangeDetail<"light", "dark", "system">): void => {
    if (detail.source === "initialization") {
      // Skip the toggle's own init event — theme emits its
      // own from `#init()` with the correct shape.
      return;
    }
    const source = this.#pendingSource ?? this.#mapToggleSource(detail.source);
    this.#pendingSource = null;
    this.#handleCurrentChange(detail.previous, source);
  };

  /**
   * Applies the side effects that follow a `current` transition:
   * persist when the user picked the value, refresh `resolved`,
   * apply the DOM, and emit the theme-level event.
   */
  #handleCurrentChange(
    previousCurrent: "light" | "dark" | "system" | null,
    source: ThemeChangeSource
  ): void {
    if (this.isDestroyed) {
      return;
    }

    const newCurrent = this.#toggle.value;
    const previousResolved =
      previousCurrent === null ? null : resolveTheme(previousCurrent, this.#system);

    // Re-read the OS preference to keep `system` fresh alongside
    // every `current` change.
    const nextSystem = readSystemTheme();
    this.#system = nextSystem;
    const newResolved = resolveTheme(newCurrent, nextSystem);
    const resolvedChanged = previousResolved === null || newResolved !== previousResolved;
    this.#resolved = newResolved;

    if (resolvedChanged) {
      this.#dom.apply(newResolved);
    }

    if (source === "user") {
      this.#storage.set(newCurrent);
      this.#lastWritten = newCurrent;
    }

    this.#emitChange({
      current: newCurrent,
      system: nextSystem,
      resolved: newResolved,
      source,
      previous:
        previousCurrent === null
          ? null
          : {
              current: previousCurrent,
              system: nextSystem,
              resolved: previousResolved as ResolvedTheme,
            },
    });
  }

  /**
   * Maps a `ToggleChangeSource` to the equivalent
   * `ThemeChangeSource`. The toggle's vocabulary is a subset of
   * the theme's, so this is mostly an identity function — kept
   * explicit so adding a new source to either side becomes a
   * deliberate decision (the compiler will flag the omission).
   */
  #mapToggleSource(toggleSource: "user" | "reset"): ThemeChangeSource {
    return toggleSource;
  }

  // ── System observer path ───────────────────────────────────────

  /**
   * Reacts to an OS preference flip. Updates `system` and (when
   * `current === 'system'`) the derived `resolved`. Bypasses the
   * inner toggle because `current` does not change here — only
   * `system` and possibly `resolved`.
   */
  #handleSystemChange(next: ResolvedTheme): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.#toggle.value !== "system") {
      // Explicit user choice — do NOT change `resolved` when
      // the OS flips, but keep `system` observable.
      this.#system = next;
      return;
    }
    if (next === this.#resolved) {
      // The system already matches; just record the value.
      this.#system = next;
      return;
    }
    const previousResolved = this.#resolved;
    this.#system = next;
    this.#resolved = next;
    this.#dom.apply(next);
    this.#emitChange({
      current: "system",
      system: next,
      resolved: next,
      source: "system",
      previous: {
        current: "system",
        system: next,
        resolved: previousResolved,
      },
    });
  }

  // ── Cross-tab path ─────────────────────────────────────────────

  /**
   * Reacts to a `storage` event from another tab. Echo detection:
   * if the incoming value matches the last value we wrote, we
   * suppress the event (consume the marker) and bail. When the
   * incoming value is `null` (another tab removed the key), we
   * apply the configured default with `source: 'storage'`.
   */
  #handleCrossTabUpdate(next: ThemePreference | null): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.#lastWritten !== undefined && this.#lastWritten === next) {
      this.#lastWritten = undefined;
      return;
    }
    if (next === null) {
      this.applySet(this.#defaultTheme, "storage");
      return;
    }
    if (this.#toggle.value === next) {
      return;
    }
    // Translate the upcoming toggle `'user'` emit into
    // `source: 'storage'` via the pending-source flag.
    this.#pendingSource = "storage";
    this.#toggle.set(next);
    this.#pendingSource = null;
  }

  /**
   * Public escape hatch for callers (mainly the storage adapter)
   * that need to push a value through the manager without going
   * through the user-facing `set()`. Equivalent to `set(value)`
   * semantically — kept as a separate entry point so the storage
   * path can stay isolated.
   */
  applySet(value: ThemePreference, source: ApplySetSource): void {
    if (this.isDestroyed) {
      return;
    }
    if (source === "reset") {
      this.reset();
      return;
    }
    const safe = coerceThemePreference(value, this.#defaultTheme);
    this.#pendingSource = source === "storage" ? "storage" : null;
    this.#toggle.set(safe);
    this.#pendingSource = null;
  }

  // ── Emitter ────────────────────────────────────────────────────

  #emitChange(detail: ThemeChangeDetail): void {
    this.emit("change", detail);
  }
}
