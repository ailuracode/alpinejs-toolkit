/**
 * Generates a stable, monotonic id suffixed with the given `prefix`.
 *
 * Use this when a package needs a default id for a controller, store,
 * or any other runtime entity. Pure function — no instance required.
 *
 * The counter is shared per-process across all callers, so different
 * prefixes never collide and ids remain unique even when used
 * concurrently.
 *
 * @example
 *   generateId("toggle");   // "toggle-1", "toggle-2", …
 *   generateId("dialog");   // "dialog-3", "dialog-4", …
 */
let counter = 0;
export const generateId = (prefix: string): string => {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
};
