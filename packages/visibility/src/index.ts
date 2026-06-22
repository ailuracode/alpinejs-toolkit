import type AlpineType from "alpinejs";

export type VisibilityState = DocumentVisibilityState;

export interface VisibilityMagic {
  isVisible: boolean;
  state: VisibilityState;
}

/** Reads tab visibility from the Page Visibility API. */
export function readVisibilityState(
  doc: Pick<Document, "hidden" | "visibilityState"> = document
): VisibilityMagic {
  return {
    isVisible: !doc.hidden,
    state: doc.visibilityState,
  };
}

/** Alpine.js visibility plugin. Registers reactive magic `$visibility`. */
export default function visibilityPlugin(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive<VisibilityMagic>(readVisibilityState());

  Alpine.magic("visibility", () => state);

  const update = () => {
    Object.assign(state, readVisibilityState());
  };

  document.addEventListener("visibilitychange", update);
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $visibility: VisibilityMagic;
    }
  }
}
