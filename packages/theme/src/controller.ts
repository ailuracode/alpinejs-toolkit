/**
 * Theme controller — the framework-agnostic core of
 * `@ailuracode/alpine-theme`. Extends {@link BaseController} so the
 * typed event bus, cleanup stack, and lifecycle phase tracking are
 * shared with every other controller in the toolkit.
 *
 * Responsibilities:
 *
 * 1. State — owns `current`, `system`, `resolved`.
 * 2. Persistence — delegates to a {@link ThemeStorage} adapter.
 * 3. DOM sync — delegates to a {@link DomStrategy}.
 * 4. System theme — observes `prefers-color-scheme` and updates
 *    `resolved` only when `current === 'system'`.
 * 5. Cross-tab — subscribes to the storage adapter's `subscribe`
 *    hook when available (internal API; consumers subscribe via
 *    `controller.on('change', ...)`).
 * 6. Subscriptions — typed `on('change', listener)` from the
 *    inherited bus.
 *
 * Construction rules:
 *
 * - The constructor MUST NOT access `window` / `document` /
 *   `localStorage` directly. Browser reads go through
 *   {@link isBrowser} and the storage adapter.
 * - The controller auto-mounts: `createTheme()` returns a fully
 *   initialized controller whose effects are already running. The
 *   factory is the public way to build a singleton service.
 * - `destroy()` MUST be idempotent.
 */

import { BaseController } from '@ailuracode/alpine-core';
import type { ThemeChangeDetail, ThemeChangeSource } from './types';
import type { ThemeEvents } from './events';
import { createDomStrategy } from './internal/dom-strategy';
import { buildDomOptions } from './internal/dom-strategy/options';
import { createLocalStorageThemeStorage } from './internal/storage/local-storage';
import { createSystemObserver, readSystemTheme } from './internal/system-observer';
import { coerceThemePreference, defaultThemePreference, resolveTheme } from './internal/validation';
import type {
    CreateThemeOptions,
    ResolvedTheme,
    ThemePreference,
    ThemeState,
    ThemeStorage,
} from './types';

/**
 * Subset of {@link ThemeChangeSource} that {@link ThemeController.applySet}
 * accepts as the `source` parameter. The constraint is enforced at the
 * type level so callers cannot pass `'initialization'` or `'system'`
 * by mistake — those sources own their own emit paths.
 *
 * Named (instead of inline `Extract`) so the rule shows up in IDE
 * hover and `go to definition` jumps land here.
 */
type ApplySetSource = Extract<ThemeChangeSource, 'user' | 'storage' | 'reset'>;

/**
 * Public entrypoint — builds and mounts a fully-initialized
 * {@link ThemeController}. The constructor itself stays pure (no
 * `window`, `document`, `localStorage`, or listener registration —
 * see `.agents/instructions/controllers.instructions.md`); this
 * factory wires the browser-touching `mount()` step so callers
 * keep the one-liner convenience.
 */
export function createTheme(options: CreateThemeOptions = {}): ThemeController {
    const controller = new ThemeController(options);
    controller.mount();
    return controller;
}

/**
 * Headless controller for `@ailuracode/alpine-theme`. Owns every
 * piece of theme state, persistence, DOM sync, system observation,
 * and cross-tab synchronization. Mounts automatically inside the
 * constructor so the factory is the public entrypoint.
 */
export class ThemeController extends BaseController<ThemeEvents> {
    readonly #defaultTheme: ThemePreference;
    readonly #storage: ThemeStorage;
    readonly #dom: ReturnType<typeof createDomStrategy>;
    readonly #watchSystem: boolean;
    readonly #crossTab: boolean;

    #current: ThemePreference;
    #system: ResolvedTheme;
    #resolved: ResolvedTheme;
    /**
     * Tracks the last value we wrote to storage so the cross-tab
     * `storage` event echoes do not generate feedback loops.
     *
     * `undefined` is the "no pending echo" sentinel: it is the
     * initial value, the value after the echo detector consumed a
     * match, and the value after `reset()` (which clears storage but
     * does NOT touch this marker — the marker keeps reflecting the
     * last value we wrote via `set`, so a subsequent legitimate
     * `null` from a cross-tab remove is correctly classified as
     * "external clear" rather than as an echo).
     */
    #lastWritten: ThemePreference | undefined = undefined;

    constructor(options: CreateThemeOptions) {
        super(options.id);

        this.#defaultTheme = coerceThemePreference(options.defaultTheme, defaultThemePreference());
        this.#storage = options.storage ?? createLocalStorageThemeStorage();
        this.#watchSystem = options.watchSystem !== false;
        this.#crossTab = options.crossTab !== false;

        // `target` stays as configured in the constructor — if the consumer
        // did not supply one, we leave it `null` and let the DOM strategy
        // resolve the default lazily on first apply (which only runs
        // after `mount()`). This keeps the constructor pure per
        // `.agents/instructions/controllers.instructions.md`.
        const target = options.target ?? null;
        this.#dom = createDomStrategy(buildDomOptions(options, target));

        // Seed deterministic state — replaced during `mount()` once the
        // runtime confirms `window` is present. Per
        // `.agents/instructions/controllers.instructions.md`, the
        // constructor MUST NOT touch `window`, `document`, `localStorage`,
        // or register listeners. Side effects start in `mount()`.
        this.#current = this.#defaultTheme;
        this.#system = 'light';
        this.#resolved = resolveTheme(this.#current, this.#system);
    }

    // ── Public state surface ────────────────────────────────────────

    get current(): ThemePreference {
        return this.#current;
    }

    get system(): ResolvedTheme {
        return this.#system;
    }

    get resolved(): ResolvedTheme {
        return this.#resolved;
    }

    get(): ThemeState {
        return {
            current: this.#current,
            system: this.#system,
            resolved: this.#resolved,
        };
    }

    // ── Public commands ─────────────────────────────────────────────

    set(value: ThemePreference): void {
        if (this.isDestroyed) {
            return;
        }
        // Coerce invalid input to the configured default. The type system
        // already blocks garbage, but runtime consumers (JSON from a
        // server, query strings) can sneak through.
        const safe = coerceThemePreference(value, this.#defaultTheme);
        this.applySet(safe, 'user');
    }

    toggle(): void {
        if (this.isDestroyed) {
            return;
        }
        // Toggle on the RESOLVED theme. After a toggle the manager holds
        // an explicit user preference — it does not return to `'system'`.
        const next: ThemePreference = this.#resolved === 'dark' ? 'light' : 'dark';
        this.applySet(next, 'user');
    }

    reset(): void {
        if (this.isDestroyed) {
            return;
        }
        this.#storage.remove();
        // Note: `#lastWritten` is NOT cleared here. Keeping the marker
        // pinned to the last value we wrote via `set` lets the echo
        // detector classify a subsequent `null` cross-tab event as
        // "external clear" rather than as our own echo.
        this.applySet(this.#defaultTheme, 'reset');
    }

    /**
     * Tears down every side effect. Idempotent. `super.destroy()` runs
     * first so the registered cleanups (system observer, cross-tab
     * listener) execute against a live lifecycle; the DOM strategy's
     * own teardown runs second.
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
     * defaults; `mount()` runs the actual init sequence (storage read,
     * system observer, cross-tab listener, init event).
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
     * Predictable init order per the spec:
     *
     * 1. Read the persisted preference.
     * 2. Fall back to the configured default.
     * 3. Detect the system theme.
     * 4. Resolve the effective theme.
     * 5. Apply it to the DOM.
     * 6. Register system preference listeners.
     * 7. Notify subscribers (with `source: 'initialization'`).
     *
     * Steps 1–6 run synchronously. Step 7 is scheduled on a microtask
     * so consumers can `createTheme()` and then `on('change', ...)`
     * from the same synchronous block and still receive the init event.
     */
    #init(): void {
        const persisted = this.#storage.get();
        const current = persisted ?? this.#defaultTheme;
        this.#current = current;
        this.#system = readSystemTheme();
        this.#resolved = resolveTheme(current, this.#system);
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

        // Schedule the init notification on a microtask so consumers can
        // attach subscribers synchronously after `createTheme()` returns.
        queueMicrotask(() => {
            if (this.isDestroyed) {
                return;
            }
            this.#emitChange({
                current: this.#current,
                system: this.#system,
                resolved: this.#resolved,
                source: 'initialization',
                previous: null,
            });
        });
    }

    // ── Private transitions ─────────────────────────────────────────

    /**
     * Applies a new preference. Updates the manager state, persists
     * when the source is `'user'` (so external clears via `'reset'`
     * or cross-tab changes via `'storage'` never write back), and
     * emits the `change` event with the previous snapshot.
     */
    applySet(value: ThemePreference, source: ApplySetSource): void {
        if (this.#current === value && source !== 'reset') {
            return;
        }
        const previous = this.#current;
        const previousResolved = this.#resolved;
        this.#current = value;
        const nextResolved = resolveTheme(value, this.#system);
        const resolvedChanged = nextResolved !== previousResolved;
        this.#resolved = nextResolved;
        if (resolvedChanged) {
            this.#dom.apply(nextResolved);
        }
        if (source === 'user') {
            this.#storage.set(value);
            this.#lastWritten = value;
        }
        this.#emitChange({
            current: this.#current,
            system: this.#system,
            resolved: this.#resolved,
            source,
            previous: {
                current: previous,
                system: this.#system,
                resolved: previousResolved,
            },
        });
    }

    #handleSystemChange(next: ResolvedTheme): void {
        if (this.isDestroyed) {
            return;
        }
        if (this.#current !== 'system') {
            // Explicit user choice — do NOT change `resolved` when the OS flips.
            this.#system = next;
            return;
        }
        if (next === this.#resolved) {
            // The system already matches; just record the value and exit.
            this.#system = next;
            return;
        }
        const previousResolved = this.#resolved;
        this.#system = next;
        this.#resolved = next;
        this.#dom.apply(next);
        this.#emitChange({
            current: this.#current,
            system: this.#system,
            resolved: this.#resolved,
            source: 'system',
            previous: {
                current: this.#current,
                system: next,
                resolved: previousResolved,
            },
        });
    }

    #handleCrossTabUpdate(next: ThemePreference | null): void {
        if (this.isDestroyed) {
            return;
        }
        // Echo detection: the only way `#lastWritten` equals the incoming
        // value is when we wrote the same value via `set` and the storage
        // adapter echoed it back. We consume the marker (back to
        // `undefined`) so a follow-up identical event is processed normally.
        if (this.#lastWritten !== undefined && this.#lastWritten === next) {
            this.#lastWritten = undefined;
            return;
        }
        if (next === null) {
            // External clear (another tab removed the key, or a non-user
            // path cleared it). Apply the configured default with a
            // `'storage'` source so observers can react.
            this.applySet(this.#defaultTheme, 'storage');
            return;
        }
        if (this.#current === next) {
            return;
        }
        const previous = this.#current;
        const previousResolved = this.#resolved;
        this.#current = next;
        const nextResolved = resolveTheme(next, this.#system);
        this.#resolved = nextResolved;
        if (nextResolved !== previousResolved) {
            this.#dom.apply(nextResolved);
        }
        this.#emitChange({
            current: this.#current,
            system: this.#system,
            resolved: this.#resolved,
            source: 'storage',
            previous: {
                current: previous,
                system: this.#system,
                resolved: previousResolved,
            },
        });
    }

    /**
     * Emits a `change` event through the inherited typed bus.
     */
    #emitChange(detail: ThemeChangeDetail): void {
        this.emit('change', detail);
    }
}