export type ChildMergeMode = "default" | "merge" | "replace";

const CHILD_DIRECTIVE_PREFIX = "x-child";

const NEVER_TRANSFER = new Set([
  CHILD_DIRECTIVE_PREFIX,
  "x-ignore",
  "x-ignore.self",
  "x-teleport",
  "x-cloak",
]);

const NEVER_TRANSFER_PREFIXES = ["x-child.", "x-teleport.", "x-transition", "x-effect"];

const SCOPE_ATTRS = new Set(["x-data", "x-init", "x-ref"]);

function isNeverTransfer(name: string): boolean {
  if (NEVER_TRANSFER.has(name)) {
    return true;
  }

  return NEVER_TRANSFER_PREFIXES.some((prefix) => name.startsWith(prefix));
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

/** Parses `x-child` directive modifiers from element attributes. */
export function parseChildDirective(el: Element): { mode: ChildMergeMode } | null {
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

function childHasAttribute(el: Element, name: string): boolean {
  return el.hasAttribute(name);
}

function shouldCopyAttribute(
  name: string,
  wrapper: Element,
  child: Element,
  mode: ChildMergeMode
): boolean {
  if (isNeverTransfer(name)) {
    return false;
  }

  if (name === "id" && childHasAttribute(child, "id")) {
    return false;
  }

  if (SCOPE_ATTRS.has(name) && childHasAttribute(child, name)) {
    return false;
  }

  if (mode === "replace") {
    return wrapper.hasAttribute(name);
  }

  if (mode === "default" || mode === "merge") {
    if (name === "class" || name === "style") {
      return wrapper.hasAttribute(name);
    }

    return wrapper.hasAttribute(name) && !childHasAttribute(child, name);
  }

  return false;
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

  if (mode === "replace" || !childHasAttribute(child, name)) {
    child.setAttribute(name, wrapperValue);
  }
}

/** Transfers wrapper attributes onto the first element child. */
export function transferAttributes(
  wrapper: Element,
  child: Element,
  mode: ChildMergeMode = "default"
): void {
  const names = new Set<string>();

  for (const { name } of wrapper.attributes) {
    names.add(name);
  }

  for (const name of names) {
    if (!shouldCopyAttribute(name, wrapper, child, mode)) {
      continue;
    }

    applyAttribute(wrapper, child, name, mode);
  }
}

/** Removes transferable attributes from the wrapper after unwrapping. */
export function clearTransferredAttributes(wrapper: Element): void {
  const toRemove: string[] = [];

  for (const { name } of wrapper.attributes) {
    if (isNeverTransfer(name)) {
      toRemove.push(name);
      continue;
    }

    toRemove.push(name);
  }

  for (const name of toRemove) {
    wrapper.removeAttribute(name);
  }
}
