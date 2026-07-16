import { ToolkitError } from "./error.js";

/** How {@link dispatchPluginEvent} copies object `detail` payloads before dispatch. */
export type DispatchPluginEventClone = false | "shallow" | "deep";

/** Options forwarded to the underlying `CustomEvent` constructor. */
export interface DispatchPluginEventOptions {
  readonly bubbles?: boolean;
  readonly composed?: boolean;
  readonly cancelable?: boolean;
  /**
   * Controls defensive copying of object details.
   *
   * - `false` (default) — pass `detail` through unchanged.
   * - `"shallow"` — shallow clone plain objects.
   * - `"deep"` — `structuredClone` when available.
   */
  readonly clone?: DispatchPluginEventClone;
}

/**
 * Shared event map for toolkit DOM events. Packages augment this interface
 * via module augmentation:
 *
 * ```ts
 * declare module "@ailuracode/alpine-core" {
 *   interface PluginEventMap {
 *     "toggle:change": ToggleChangeDetail;
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: feature packages augment this map via module augmentation
export interface PluginEventMap {}

/** Builds the DOM event name from a package namespace and event segment. */
export type PluginEventName<
  TNamespace extends string,
  TEvent extends string,
> = `${TNamespace}:${TEvent}`;

/** Typed `CustomEvent` for entries declared on {@link PluginEventMap}. */
export type PluginCustomEvent<TName extends keyof PluginEventMap & string> = CustomEvent<
  PluginEventMap[TName]
>;

/**
 * Normalized change source for event detail payloads. Packages may expose
 * narrower unions when semantics differ.
 */
export type ChangeSource = "api" | "keyboard" | "pointer" | "external" | "system";

const KEBAB_CASE_SEGMENT = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function assertKebabCaseSegment(value: string): void {
  if (!KEBAB_CASE_SEGMENT.test(value)) {
    throw new ToolkitError(`Invalid plugin event segment "${value}"`, "TOOLKIT_INVALID_ARGUMENT");
  }
}

function clonePluginEventDetail<TDetail>(
  detail: TDetail,
  clone: DispatchPluginEventClone
): TDetail {
  if (clone === false || detail === null || typeof detail !== "object") {
    return detail;
  }

  if (clone === "shallow") {
    return { ...(detail as Record<string, unknown>) } as TDetail;
  }

  return structuredClone(detail);
}

/**
 * Dispatches a namespaced toolkit `CustomEvent` using the `@package:event`
 * convention (`toggle:change`, `dialog:before-close`, …).
 *
 * Defaults: `bubbles: true`, `composed: true`, `cancelable: false`.
 *
 * **Dispatch targets**
 *
 * - Element-bound directives — dispatch from the owning element.
 * - Global stores — dispatch from `window` unless a more specific target exists.
 * - Unattached controller factories — do not emit DOM events until wired through
 *   Alpine integration.
 */
export function dispatchPluginEvent<TNamespace extends string, TEvent extends string, TDetail>(
  target: EventTarget,
  namespace: TNamespace,
  event: TEvent,
  detail: TDetail,
  options: DispatchPluginEventOptions = {}
): CustomEvent<TDetail> {
  assertKebabCaseSegment(namespace);
  assertKebabCaseSegment(event);

  const immutableDetail = clonePluginEventDetail(detail, options.clone ?? false);

  const customEvent = new CustomEvent<TDetail>(`${namespace}:${event}`, {
    bubbles: options.bubbles ?? true,
    composed: options.composed ?? true,
    cancelable: options.cancelable ?? false,
    detail: immutableDetail,
  });

  target.dispatchEvent(customEvent);
  return customEvent;
}
