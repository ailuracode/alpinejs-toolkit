/**
 * Internal merge helpers for `@ailuracode/alpine-child`.
 *
 * Pure DOM utilities used by `controller.ts` to apply the wrapper → child
 * attribute transfer. Lives under `internal/` so the public surface stays
 * small — every helper here is consumed by the controller facade.
 *
 * Construction rules (per
 * `.agents/instructions/controllers.instructions.md`):
 *
 * - No `window` / `document` access — these run on whatever `Element`
 *   instances the controller hands them.
 * - No Alpine APIs, no scope reads, no event subscriptions.
 *
 * The merge rules are documented in the package README under
 * "Attribute rules" — keep this file in sync when the public rules
 * change.
 */

import type { ChildDirectiveConfig, ChildMergeMode } from "../types.js";

/** Attribute name that opts an element into the unwrap pass. */
const CHILD_DIRECTIVE_PREFIX = "x-child";

/**
 * Attribute names that must never be transferred from the wrapper to
 * the child. Covers Alpine internals that would double-initialize or
 * pull in conflicting scopes.
 */
const NEVER_TRANSFER: ReadonlySet<string> = new Set([
  CHILD_DIRECTIVE_PREFIX,
  "x-ignore",
  "x-ignore.self",
  "x-teleport",
  "x-cloak",
]);

/**
 * Prefixes that should never be transferred. Matched against the full
 * attribute name; covers namespace-scoped directives like
 * `x-teleport.to` or transition hooks.
 */
const NEVER_TRANSFER_PREFIXES: readonly string[] = [
  "x-child.",
  "x-teleport.",
  "x-transition",
  "x-effect",
];

/**
 * Scope-defining attributes the controller moves to the child only
 * when the child does not already define them. The wrapper's scope
 * survives when the child carries its own data context, so transferring
 * would shadow the child.
 */
const SCOPE_ATTRS: ReadonlySet<string> = new Set(["x-data", "x-init", "x-ref"]);

/** True when the attribute name must never be transferred to the child. */
function shouldNeverTransfer(name: string): boolean {
  if (NEVER_TRANSFER.has(name)) {
    return true;
  }

  return NEVER_TRANSFER_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function shouldCopyAttribute(
  name: string,
  wrapper: Element,
  child: Element,
  mode: ChildMergeMode
): boolean {
  if (shouldNeverTransfer(name)) {
    return false;
  }

  if (name === "id" && child.hasAttribute("id")) {
    return false;
  }

  if (SCOPE_ATTRS.has(name) && child.hasAttribute(name)) {
    return false;
  }

  if (mode === "replace") {
    return wrapper.hasAttribute(name);
  }

  if (mode === "default" || mode === "merge") {
    if (name === "class" || name === "style") {
      return wrapper.hasAttribute(name);
    }

    return wrapper.hasAttribute(name) && !child.hasAttribute(name);
  }

  return false;
}

/** Returns the first element child, skipping text and comment nodes. */
export function findFirstElementChild(parent: Element): Element | null {
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return node as Element;
    }
  }

  return null;
}

/** Counts element children (excluding text/comment nodes). */
export function countElementChildren(parent: Element): number {
  let count = 0;

  for (const node of parent.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      count += 1;
    }
  }

  return count;
}

/**
 * Parses `x-child` directive modifiers from element attributes.
 *
 * Returns `null` when the directive is absent, so the plugin can skip
 * elements without `x-child` quickly without extra branching. Returns a
 * config with `mode: 'default'` when the attribute is present without
 * any modifier.
 */
export function parseChildDirective(el: Element): ChildDirectiveConfig | null {
  for (const { name } of el.attributes) {
    if (name === CHILD_DIRECTIVE_PREFIX) {
      return { mode: "default" };
    }

    if (!name.startsWith(`${CHILD_DIRECTIVE_PREFIX}.`)) {
      continue;
    }

    const modifiers = name.slice(CHILD_DIRECTIVE_PREFIX.length + 1).split(".");

    if (modifiers.includes("replace")) {
      return { mode: "replace" };
    }

    if (modifiers.includes("merge")) {
      return { mode: "merge" };
    }

    return { mode: "default" };
  }

  return null;
}

/**
 * Applies the wrapper attributes onto the child following the active
 * {@link ChildMergeMode}.
 *
 * Public from the controller's perspective — `internal/` re-export
 * is internal-by-convention, not strict.
 */
export function transferAttributes(wrapper: Element, child: Element, mode: ChildMergeMode): void {
  // `NamedNodeMap` is unique by name — iterate directly without
  // building an intermediate Set.
  for (const { name } of wrapper.attributes) {
    if (!shouldCopyAttribute(name, wrapper, child, mode)) {
      continue;
    }

    applyAttribute(wrapper, child, name, mode);
  }
}

/**
 * Removes every attribute from the wrapper.
 *
 * After `Alpine.morph()` swaps the wrapper out of the document, this
 * is mostly defensive — the wrapper is already detached. Kept exported
 * so tests can verify the scrub step in isolation, and so consumers
 * that wire `x-child` into a custom Alpine adapter can run the same
 * cleanup themselves.
 */
export function clearTransferredAttributes(wrapper: Element): void {
  for (const { name } of wrapper.attributes) {
    wrapper.removeAttribute(name);
  }
}

function mergeClassTokens(...values: string[]): string {
  const tokens = new Set<string>();

  for (const value of values) {
    for (const token of value.split(/\s+/)) {
      if (token) {
        tokens.add(token);
      }
    }
  }

  return [...tokens].join(" ");
}

function parseInlineStyle(style: string): Map<string, string> {
  const map = new Map<string, string>();

  for (const part of style.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const colon = trimmed.indexOf(":");
    if (colon === -1) {
      continue;
    }

    const property = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    map.set(property, value);
  }

  return map;
}

function serializeInlineStyle(map: Map<string, string>): string {
  return [...map.entries()].map(([property, value]) => `${property}: ${value}`).join("; ");
}

function mergeInlineStyle(wrapperStyle: string, childStyle: string, childWins: boolean): string {
  const wrapperMap = parseInlineStyle(wrapperStyle);
  const childMap = parseInlineStyle(childStyle);
  const merged = childWins
    ? new Map([...wrapperMap, ...childMap])
    : new Map([...childMap, ...wrapperMap]);

  return serializeInlineStyle(merged);
}

function applyAttribute(
  wrapper: Element,
  child: Element,
  name: string,
  mode: ChildMergeMode
): void {
  const wrapperValue = wrapper.getAttribute(name) ?? "";
  const childValue = child.getAttribute(name) ?? "";

  if (name === "class") {
    if (mode === "replace") {
      child.setAttribute("class", mergeClassTokens(wrapperValue, childValue));
      return;
    }

    child.setAttribute("class", mergeClassTokens(childValue, wrapperValue));
    return;
  }

  if (name === "style") {
    const merged = mergeInlineStyle(wrapperValue, childValue, mode !== "replace");
    if (merged) {
      child.setAttribute("style", merged);
    }
    return;
  }

  if (mode === "replace" || !child.hasAttribute(name)) {
    child.setAttribute(name, wrapperValue);
  }
}
