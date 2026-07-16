import { ToolkitError } from "./error.js";

/** Options forwarded to the underlying `CustomEvent` constructor. */
export interface DispatchPluginEventOptions {
  readonly bubbles?: boolean;
  readonly composed?: boolean;
  readonly cancelable?: boolean;
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

const DEFAULT_DISPATCH_OPTIONS: Required<DispatchPluginEventOptions> = {
  bubbles: true,
  composed: true,
  cancelable: false,
};

function assertKebabCaseSegment(value: string, label: "namespace" | "event"): void {
  if (!KEBAB_CASE_SEGMENT.test(value)) {
    throw new ToolkitError(
      `Plugin event ${label} must be lowercase kebab-case — got "${value}"`,
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }
}

function cloneEventDetail<TDetail>(detail: TDetail): TDetail {
  if (typeof structuredClone === "function") {
    return structuredClone(detail);
  }

  if (detail !== null && typeof detail === "object") {
    return { ...(detail as Record<string, unknown>) } as TDetail;
  }

  return detail;
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
  assertKebabCaseSegment(namespace, "namespace");
  assertKebabCaseSegment(event, "event");

  const resolved = { ...DEFAULT_DISPATCH_OPTIONS, ...options };
  const type = `${namespace}:${event}`;
  const immutableDetail = cloneEventDetail(detail);

  const customEvent = new CustomEvent<TDetail>(type, {
    bubbles: resolved.bubbles,
    composed: resolved.composed,
    cancelable: resolved.cancelable,
    detail: immutableDetail,
  });

  target.dispatchEvent(customEvent);
  return customEvent;
}
