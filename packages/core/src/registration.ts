/**
 * Registration guards for stores, magics, and directives.
 *
 * Alpine 3 silently overwrites existing `Alpine.store(name, ...)`,
 * `Alpine.magic(name, ...)` and `Alpine.directive(name, ...)` calls.
 * When a feature plugin ships with a default name (e.g. `theme`) the
 * toolkit can clobber a store the host app registered first — with
 * no warning and no error.
 *
 * These helpers centralise the single-source-of-truth check so every
 * plugin surfaces collisions the same way:
 *
 * - {@link guardStore} — wraps `Alpine.store` and throws
 *   `RegistrationError("REGISTRATION_COLLISION")` if the key already
 *   holds a value.
 * - {@link guardMagic} — wraps `Alpine.magic`. Alpine does not expose
 *   a public "has this magic been registered" hook, so the guard
 *   tracks registrations in a process-local `Set` seeded by every
 *   package that uses the helper.
 * - {@link guardDirective} — wraps `Alpine.directive`. Same approach
 *   as magics.
 *
 * Collision behaviour:
 *
 * - Default — throw `RegistrationError` with the package name, kind,
 *   and key. The message tells the host how to override or rename.
 * - `{ override: true }` — overwrite silently and emit `console.warn`
 *   so the override is visible in dev. Per the toolkit's deprecation
 *   policy this is the only sanctioned way to bypass the guard.
 *
 * Escape hatch: every guard accepts a `name` argument. Feature plugins
 * MUST expose that name through their options (e.g. `storeKey`,
 * `magicKey`, `directiveName`) so the host can pick a unique key and
 * avoid the collision entirely.
 */

import type Base from "alpinejs";
import { ToolkitError, type ToolkitErrorCode } from "./core/error";
import type { Alpine } from "./core/type";

/** Kind of Alpine registration guarded by these helpers. */
export type RegistrationKind = "store" | "magic" | "directive";

/** Options shared by every guard. */
export interface RegistrationGuardOptions {
  /**
   * Allow overwriting an existing registration of the same `name`.
   * Default: `false` — collisions throw `RegistrationError`.
   */
  readonly override?: boolean;
  /**
   * Suppress the `console.warn` emitted when an override replaces an
   * existing registration. Set when the caller has already
   * acknowledged the override (e.g. a bridge defaulting to
   * HMR-friendly re-registration) so dev output stays clean.
   * Default: `false`.
   */
  readonly silent?: boolean;
}

/** Returned by {@link guardStore} — the reactive proxy Alpine hands back. */
export interface GuardedStoreResult<TStore> {
  readonly reactiveStore: TStore;
}

/** Stable error code attached to every registration collision. */
export type RegistrationErrorCode = Extract<ToolkitErrorCode, "REGISTRATION_COLLISION">;

/**
 * Thrown when a guard refuses a registration because `name` is already
 * taken and `override` is not set.
 *
 * The message lists the package that owns the guard and how to fix the
 * collision, so the host can decide between renaming (`storeKey: "..."`)
 * or explicitly opting into the override (`{ override: true }`).
 */
export class RegistrationError extends ToolkitError {
  readonly kind: RegistrationKind;
  /** The store / magic / directive name that collided. */
  readonly registrationName: string;
  /** The package that owns the failing guard (e.g. `"alpine-theme"`). */
  readonly packageName: string;

  constructor(kind: RegistrationKind, name: string, packageName: string) {
    const factory = `${packageName}Plugin`;
    super(
      `${kind} "${name}" is already registered. ` +
        `If you registered this ${kind} yourself, rename it or pass ` +
        `{ override: true } to ${factory}() to replace it. ` +
        `If another plugin registered it, configure ${factory}() ` +
        `with a unique key (e.g. storeKey / magicKey / directiveName).`,
      "REGISTRATION_COLLISION"
    );
    this.kind = kind;
    this.registrationName = name;
    this.packageName = packageName;
  }
}

const warnedOverrides = new Set<string>();
function warnOverride(packageName: string, kind: RegistrationKind, name: string): void {
  const key = `${packageName}|${kind}|${name}`;
  if (warnedOverrides.has(key)) {
    return;
  }
  warnedOverrides.add(key);
  console.warn(
    `[alpine-toolkit:${packageName}] Overriding existing ${kind} "${name}". ` +
      `Pass a unique key instead to keep both registrations.`
  );
}

const registeredMagics = new Set<string>();
const registeredDirectives = new Set<string>();

/** Test-only: reset the in-memory sets between specs. */
export function resetRegistrationTracking(): void {
  warnedOverrides.clear();
  registeredMagics.clear();
  registeredDirectives.clear();
}

/**
 * Removes `name` from the tracking set used by {@link guardMagic}.
 *
 * Bridges call this from their `Alpine.cleanup` so a plugin that
 * mounts, destroys, and re-mounts in the same process (HMR, repeated
 * integration tests, hot reloads) does not collide with itself.
 * {@link guardStore} does not need a counterpart — `Alpine.store`
 * overwrites cleanly and the guard's check uses `Alpine.store`
 * itself, so no process-local state is held for stores.
 */
export function untrackMagic(name: string): void {
  registeredMagics.delete(name);
}

/**
 * Counterpart of {@link guardDirective}'s tracking. Bridges call
 * this from their `Alpine.cleanup` for the same reason as
 * {@link untrackMagic}.
 */
export function untrackDirective(name: string): void {
  registeredDirectives.delete(name);
}

/**
 * Registers a store under `name`, refusing to overwrite an existing one.
 *
 * The check uses `Alpine.store(name)`. Alpine returns `undefined` for a
 * missing key and the previously stored value otherwise — exactly the
 * distinction we need.
 */
export function guardStore<TStore>(
  alpine: Alpine,
  name: string,
  value: TStore,
  packageName: string,
  options: RegistrationGuardOptions = {}
): GuardedStoreResult<TStore> {
  const existing = alpine.store(name as never) as unknown;
  if (existing !== undefined && !options.override) {
    throw new RegistrationError("store", name, packageName);
  }
  if (existing !== undefined && !options.silent) {
    warnOverride(packageName, "store", name);
  }
  alpine.store(name as never, value as never);
  return { reactiveStore: alpine.store(name as never) as TStore };
}

/**
 * Registers a magic accessor under `name`, refusing to overwrite.
 *
 * Alpine has no public "has magic" hook, so the guard maintains a
 * process-local `Set` of every magic registered through this helper.
 * Collisions between toolkit plugins are caught with 100% accuracy.
 * Collisions with magics the host registered directly (without the
 * guard) are not detected — the host owns those names.
 */
export function guardMagic(
  alpine: Alpine,
  name: string,
  accessor: () => unknown,
  packageName: string,
  options: RegistrationGuardOptions = {}
): void {
  const tracked = registeredMagics.has(name);
  if (tracked && !options.override) {
    throw new RegistrationError("magic", name, packageName);
  }
  if (tracked && !options.silent) {
    warnOverride(packageName, "magic", name);
  }
  registeredMagics.add(name);
  alpine.magic(name, accessor as never);
}

/**
 * Registers a directive under `name`, refusing to overwrite.
 *
 * Same tracking strategy as {@link guardMagic}. The Alpine runtime
 * does not expose directives for inspection, so a process-local
 * `Set` is the only safe way to detect re-registration.
 */
export function guardDirective(
  alpine: Alpine,
  name: string,
  handler: Base.DirectiveCallback,
  packageName: string,
  options: RegistrationGuardOptions = {}
): unknown {
  const tracked = registeredDirectives.has(name);
  if (tracked && !options.override) {
    throw new RegistrationError("directive", name, packageName);
  }
  if (tracked && !options.silent) {
    warnOverride(packageName, "directive", name);
  }
  registeredDirectives.add(name);
  // Return the chain Alpine builds (`.before(...)` / `.after(...)`)
  // so callers can attach priority modifiers without re-registering.
  return alpine.directive(name, handler);
}
