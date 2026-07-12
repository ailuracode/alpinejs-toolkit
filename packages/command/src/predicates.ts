import type { CommandPredicate } from "./types.js";

/** Resolves a static or dynamic predicate to a boolean. */
export function resolvePredicate(value: CommandPredicate | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === "function") {
    return value();
  }
  return value;
}
