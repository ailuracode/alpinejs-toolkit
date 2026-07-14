/**
 * Store factory for `@ailuracode/alpine-accordion`.
 */

import { AccordionController } from "./controller.js";
import type { AccordionGroup, AccordionStore } from "./types.js";

/** Copies controller group snapshots into a target registry. */
export function syncGroupRegistry(
  target: Record<string, AccordionGroup>,
  snapshot: Record<string, AccordionGroup>
): void {
  for (const key of Object.keys(snapshot)) {
    target[key] = snapshot[key];
  }
  for (const key of Object.keys(target)) {
    if (!(key in snapshot)) {
      delete target[key];
    }
  }
}

/** Builds an {@link AccordionStore} backed by a new {@link AccordionController}. */
export function createAccordionStore(): AccordionStore {
  return createAccordionStoreFromController(new AccordionController());
}

/** Builds an {@link AccordionStore} that mirrors the given controller. */
export function createAccordionStoreFromController(
  controller: AccordionController
): AccordionStore {
  const groups: Record<string, AccordionGroup> = {};
  const store = { ...controller.toStore(), groups };
  controller.on("change", () => {
    syncGroupRegistry(groups, controller.snapshotGroups());
  });
  return store;
}
