/**
 * Controlled and uncontrolled selection adapters.
 */

import type { SelectionController } from "./controller.js";
import type { SelectionChangeDetail } from "./events.js";
import type {
  ControlledSelectionOptions,
  SelectionAdapter,
  SelectionValue,
  UncontrolledSelectionOptions,
} from "./types.js";

/** Wires an external value/onChange pair for controlled usage. */
export function createControlledAdapter(options: ControlledSelectionOptions): SelectionAdapter {
  const listeners = new Set<() => void>();
  let value = options.value;

  return {
    isControlled: true,
    getValue() {
      return value;
    },
    setValue(next: SelectionValue) {
      value = next;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Wires a controller instance for uncontrolled usage. */
export function createUncontrolledAdapter(
  controller: SelectionController,
  instanceId: string,
  options: UncontrolledSelectionOptions = {}
): SelectionAdapter {
  let initialized = false;

  const ensureInstance = () => {
    if (!initialized) {
      controller.create(instanceId, options);
      initialized = true;
    }
  };

  return {
    isControlled: false,
    getValue() {
      ensureInstance();
      return controller.getSnapshot(instanceId).value;
    },
    setValue(next: SelectionValue) {
      ensureInstance();
      controller.setValue(instanceId, next);
    },
    subscribe(listener: () => void) {
      ensureInstance();
      return controller.on("change", (detail: SelectionChangeDetail) => {
        if (detail.id === instanceId) {
          listener();
        }
      });
    },
  };
}
